export const postFetcherCore = {
    isTopicStreamWindowComplete(windowPosts, window, start, end, streamLength) {
        if (window.ids.length === 0 || windowPosts.length === 0) return false;

        const postNumbers = windowPosts
            .map(post => Number(post?.post_number))
            .filter(Number.isFinite);
        const firstPostNumber = Math.min(...postNumbers);
        const lastPostNumber = Math.max(...postNumbers);
        const startCovered = window.lowerIndex === 0 || firstPostNumber <= start;
        const endCovered = window.upperIndex >= streamLength || lastPostNumber >= end;

        return Number.isFinite(firstPostNumber)
            && Number.isFinite(lastPostNumber)
            && startCovered
            && endCovered;
    },

    async fetchTopicPosts(topicId, start, end, onProgress, options = {}) {
        const opts = this.getLinuxDoFetchOptions({ signal: options.signal });
        this.throwIfAborted?.(options.signal);
        const { topicData } = await this.fetchTopicData(topicId, opts, {
            forceRefresh: options.forceRefreshTopicData === true
        });
        this.throwIfAborted?.(options.signal);
        const topicBounds = this.getTopicBoundsFromTopicData(topicData, topicId);
        const streamIds = this.getTopicStreamIds(topicData);

        if (streamIds.length === 0) {
            throw new Error('未获取到帖子楼层索引');
        }

        const initialPosts = topicData.post_stream?.posts || [];
        const postsById = new Map(initialPosts.filter(post => post?.id).map(post => [post.id, post]));
        const lookBehindRounds = this.getRangeLookBehindRounds(start);
        const maxLookBehindIds = lookBehindRounds[lookBehindRounds.length - 1] || 0;
        const widestStreamWindow = this.getTopicStreamWindow(streamIds, start, end, maxLookBehindIds);
        const budgetTracker = this.createLinuxDoRequestBudgetTracker({ start, end, stage: 'topic-range' });
        this.assertLinuxDoRequestBudget({
            idCount: widestStreamWindow.ids.filter(id => !postsById.has(id)).length,
            candidateIdCount: widestStreamWindow.ids.length,
            batchCount: 0,
            start,
            end,
            stage: 'topic-range'
        });
        const fallbackPolicy = {
            concurrency: this.linuxDoRangeMappingPolicy.fallbackConcurrency,
            batchDelayMs: this.linuxDoRangeMappingPolicy.fallbackBatchDelayMs
        };
        let lastMapping = null;

        for (const lookBehindIds of lookBehindRounds) {
            this.throwIfAborted?.(options.signal);
            const streamWindow = this.getTopicStreamWindow(streamIds, start, end, lookBehindIds);
            const idsToFetch = streamWindow.ids.filter(id => !postsById.has(id));
            const batchCount = Math.ceil(idsToFetch.length / Math.max(1, this.linuxDoPostFetchPolicy.batchSize));
            const requestBudget = budgetTracker.assertNext({
                idCount: idsToFetch.length,
                candidateIdCount: streamWindow.ids.length,
                batchCount,
                stage: lookBehindIds > 0 ? 'range-lookbehind' : 'initial-range'
            });
            const fetchedPosts = await this.fetchPostsByIds(
                topicId,
                idsToFetch,
                opts,
                onProgress,
                lookBehindIds > 0 ? fallbackPolicy : {},
                {
                    stage: lookBehindIds > 0 ? 'range-lookbehind' : 'initial-range',
                    start,
                    end,
                    lookBehindIds,
                    candidateIdCount: streamWindow.ids.length,
                    usedPostBatchRequests: requestBudget.usedPostBatchRequests,
                    remainingPostBatchRequests: requestBudget.remainingPostBatchRequests
                }
            );

            fetchedPosts.forEach((post) => {
                if (post?.id) postsById.set(post.id, post);
            });

            const missingCandidateIds = streamWindow.ids.filter(id => !postsById.has(id));
            const windowPosts = streamWindow.ids
                .map(id => postsById.get(id))
                .filter(Boolean)
                .sort((a, b) => Number(a.post_number) - Number(b.post_number));
            const posts = this.filterPostsByPostNumber(windowPosts, start, end);
            const complete = missingCandidateIds.length === 0
                && this.isTopicStreamWindowComplete(windowPosts, streamWindow, start, end, streamIds.length);

            lastMapping = {
                start,
                end,
                complete,
                fallbackUsed: lookBehindIds > 0,
                lookBehindIds,
                candidateIdCount: streamWindow.ids.length,
                fetchedPostCount: windowPosts.length,
                visiblePostCount: posts.length,
                lowerIndex: streamWindow.lowerIndex,
                upperIndex: streamWindow.upperIndex,
                missingCandidateIdCount: missingCandidateIds.length,
                highestPostNumber: topicBounds.highestPostNumber || null,
                postsCount: topicBounds.postsCount,
                replyCount: topicBounds.replyCount,
                streamLength: topicBounds.streamLength,
                rangeBoundSource: topicBounds.source,
                requestedEndBelowHighest: Boolean(topicBounds.highestPostNumber && end < topicBounds.highestPostNumber)
            };

            if (complete) {
                return {
                    topicData,
                    posts,
                    targetIds: posts.map(post => post.id),
                    candidateIds: streamWindow.ids,
                    rangeMapping: lastMapping
                };
            }
        }

        const detail = lastMapping
            ? `已回看 ${lastMapping.lookBehindIds} 个 stream 项，候选 ${lastMapping.candidateIdCount} 条`
            : '未形成有效候选窗口';
        throw new Error(`无法在安全请求上限内确认 ${start}-${end} 楼的完整映射（${detail}）。请缩小范围，或从更靠前的楼层开始。`);
    },

    formatPostForAiContext(post, postsByPostNumber = null) {
        let content = `${post?.cooked ?? ''}`;
        content = content.replace(/<div class="lightbox-wrapper">\s*<a class="lightbox" href="([^"]+)"(?:\s+data-download-href="([^"]+)")?[^>]*title="([^"]*)"[^>]*>[\s\S]*?<\/a>\s*<\/div>/gi, (match, hrefUrl, downloadHref, title) => {
            let imgUrl = hrefUrl || `https://linux.do${downloadHref || ''}`;
            const filename = title || '图片';
            return `\n[图片: ${filename}](${imgUrl})\n`;
        });
        content = content.replace(/<a class="attachment" href="([^"]+)"[^>]*>([^<]+)<\/a>/gi, (match, url, name) => `\n[附件: ${name.trim()}](${url})\n`);
        content = content.replace(/<img[^>]+class="emoji[^>]*alt="([^"]*)"[^>]*>/gi, '$1 ');
        content = content.replace(/<aside\b(?=[^>]*\bclass=["'][^"']*\bquote(?:-modified)?\b)[^>]*>[\s\S]*?<blockquote\b[^>]*>([\s\S]*?)<\/blockquote>[\s\S]*?<\/aside>/gi, (match, quoteInner) => {
            return this.formatDiscourseQuoteForAiText(match, quoteInner, post);
        });
        content = this.plainTextFromHtml(content);
        const userName = post.name || post.username;
        const userPart = `${userName}（${post.username}）`;
        const replyPart = this.formatReplyRelationInline(post, postsByPostNumber);
        const createdAt = this.formatPostCreatedAt(post);
        const timePart = createdAt ? `发帖时间: ${createdAt}\n` : '';
        const boostsText = this.formatBoostsText(post);
        const boostPart = boostsText ? `${boostsText}\n\n` : '';
        return `[${post.post_number}楼] ${userPart}${replyPart}:\n${timePart}${boostPart}${content}`;
    },

    formatPostsForAiContext(posts) {
        const postsByPostNumber = this.createPostsByPostNumber(posts);
        return posts.map(post => this.formatPostForAiContext(post, postsByPostNumber)).join('\n\n');
    },

    async fetchDialogues(building, start, end, onProgress, options = {}) {
        const { posts } = await this.fetchTopicPosts(building, start, end, onProgress, options);
        return this.formatPostsForAiContext(posts);
    },

    async fetchDialoguesCached(building, start, end, onProgress, options = {}) {
        const normalizedStart = Number(start);
        const normalizedEnd = Number(end);

        if (!options.forceRefresh) {
            const cached = this.getCachedDialogue(building, normalizedStart, normalizedEnd);
            if (cached) {
                if (typeof onProgress === 'function') {
                    onProgress({
                        stage: 'cache-hit',
                        postCount: cached.postCount,
                        ageMs: Date.now() - cached.createdAt
                    });
                }
                return { text: cached.text, cacheHit: true, cacheEntry: cached, rangeMapping: cached.rangeMapping || null };
            }
        } else {
            this.clearDialogueCache(building, normalizedStart, normalizedEnd);
        }

        const { posts, rangeMapping } = await this.fetchTopicPosts(building, normalizedStart, normalizedEnd, onProgress, {
            forceRefreshTopicData: options.forceRefreshTopicData === true || options.forceRefresh === true
        });
        const text = this.formatPostsForAiContext(posts);
        const cacheEntry = this.setCachedDialogue(building, normalizedStart, normalizedEnd, text, {
            postCount: posts.length,
            rangeMapping
        });

        return { text, cacheHit: false, cacheEntry, rangeMapping };
    },
};
