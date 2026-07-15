export const postContentCore = {
    createPostsByPostNumber(posts) {
        const map = new Map();
        (posts || []).forEach((post) => {
            const postNumber = Number(post?.post_number);
            if (Number.isFinite(postNumber) && !map.has(postNumber)) {
                map.set(postNumber, post);
            }
        });
        return map;
    },

    getReplyRelation(post, postsByPostNumber = null) {
        const replyToPostNumber = Number(post?.reply_to_post_number);
        if (!Number.isFinite(replyToPostNumber) || replyToPostNumber <= 0) {
            return null;
        }

        const replyToUser = post?.reply_to_user;
        const localReplyPost = postsByPostNumber?.get(replyToPostNumber);
        const hasReplyToUser = Boolean(replyToUser?.name || replyToUser?.username);
        const replyUser = hasReplyToUser ? replyToUser : (localReplyPost || null);

        if (replyUser) {
            return {
                postNumber: replyToPostNumber,
                available: true,
                inCurrentRange: Boolean(localReplyPost),
                name: replyUser.name || replyUser.username || '',
                username: replyUser.username || ''
            };
        }

        return {
            postNumber: replyToPostNumber,
            available: false,
            inCurrentRange: false,
            name: '',
            username: ''
        };
    },

    formatReplyRelationInline(post, postsByPostNumber = null) {
        const relation = this.getReplyRelation(post, postsByPostNumber);
        if (!relation) return '';

        if (!relation.available) {
            return `-回复[${relation.postNumber}楼]（原帖已删除或不可见）`;
        }

        const userPart = relation.name || relation.username
            ? ` ${relation.name || relation.username}${relation.username ? `（${relation.username}）` : ''}`
            : '';
        return `-回复[${relation.postNumber}楼]${userPart}`;
    },

    formatReplyRelationLine(post, postsByPostNumber = null) {
        const relation = this.getReplyRelation(post, postsByPostNumber);
        if (!relation) return '';

        if (!relation.available) {
            return `回复: [${relation.postNumber}楼]（原帖已删除或不可见）`;
        }

        const userPart = relation.name || relation.username
            ? ` ${relation.name || relation.username}${relation.username ? `（@${relation.username}）` : ''}`
            : '';
        return `回复: [${relation.postNumber}楼]${userPart}`;
    },

    formatReplyRelationHtml(post, postsByPostNumber = null) {
        const relation = this.getReplyRelation(post, postsByPostNumber);
        if (!relation) return '';

        const target = `回复 #${relation.postNumber}`;
        if (!relation.available) {
            return `<span class="reply-relation reply-relation-missing">${this.escapeHtml(`${target}（原帖已删除或不可见）`)}</span>`;
        }

        const userPart = relation.name || relation.username
            ? ` ${relation.name || relation.username}${relation.username ? `（@${relation.username}）` : ''}`
            : '';
        const text = this.escapeHtml(`${target}${userPart}`);
        if (relation.inCurrentRange) {
            return `<a class="reply-relation" href="#post-${relation.postNumber}">${text}</a>`;
        }
        return `<span class="reply-relation">${text}</span>`;
    },

    getHtmlParser() {
        if (typeof DOMParser === 'undefined') return null;
        if (!this.htmlParser) this.htmlParser = new DOMParser();
        return this.htmlParser;
    },

    plainTextFromHtml(html) {
        const source = `${html ?? ''}`;
        if (!source) return '';

        const parser = this.getHtmlParser();
        if (!parser) return this.normalizePlainText(source);

        const doc = parser.parseFromString(source, 'text/html');
        doc.querySelectorAll('script, style, iframe, object, embed').forEach((el) => el.remove());
        return this.normalizePlainText(doc.body?.textContent || '');
    },

    normalizePlainText(text) {
        return `${text ?? ''}`
            .replace(/\r\n/g, '\n')
            .replace(/[ \t]+\n/g, '\n')
            .replace(/\n{3,}/g, '\n\n')
            .replace(/[ \t]{2,}/g, ' ')
            .replace(/\s+([,.!?;:，。！？；：])/g, '$1')
            .trim();
    },

    truncatePlainText(text, maxLength = 160) {
        const value = this.normalizePlainText(text);
        if (value.length <= maxLength) return value;
        return `${value.slice(0, maxLength).trim()}...`;
    },

    getHtmlAttribute(html, attrName) {
        const escapedName = `${attrName}`.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const match = `${html ?? ''}`.match(new RegExp(`\\s${escapedName}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s>]+))`, 'i'));
        return this.decodeEntities(match?.[1] || match?.[2] || match?.[3] || '').trim();
    },

    extractFirstLinkInfo(html) {
        const match = `${html ?? ''}`.match(/<a\b[^>]*href\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))[^>]*>([\s\S]*?)<\/a>/i);
        if (!match) return { href: '', text: '' };
        const href = this.decodeEntities(match[1] || match[2] || match[3] || '').trim();
        return {
            href: href ? this.absoluteUrl(href) : '',
            text: this.plainTextFromHtml(match[4] || '')
        };
    },

    formatDiscourseQuoteForAiText(asideHtml, quoteInner, sourcePost = null) {
        const username = this.getHtmlAttribute(asideHtml, 'data-username');
        const quotedTopic = this.getHtmlAttribute(asideHtml, 'data-topic');
        const quotedPost = this.getHtmlAttribute(asideHtml, 'data-post');
        const link = this.extractFirstLinkInfo(asideHtml);
        const quoteText = this.plainTextFromHtml(quoteInner);
        const sourceTopic = sourcePost?.topic_id ?? sourcePost?.topicId ?? '';
        const hasTopicContext = quotedTopic && sourceTopic;
        const quoteLabel = hasTopicContext && String(quotedTopic) !== String(sourceTopic)
            ? '跨主题引用/转发'
            : quotedTopic && !sourceTopic
                ? '引用/转发'
                : '引用';

        const sourceParts = [];
        if (username) sourceParts.push(`@${username}`);
        if (link.text) sourceParts.push(`《${link.text}》`);
        if (quotedTopic || quotedPost) {
            const location = [
                quotedTopic ? `topic ${quotedTopic}` : '',
                quotedPost ? `#${quotedPost}` : ''
            ].filter(Boolean).join(' ');
            if (location) sourceParts.push(location);
        }
        if (link.href) sourceParts.push(`链接 ${link.href}`);

        const header = sourceParts.length ? `${quoteLabel}: ${sourceParts.join('，')}` : quoteLabel;
        return `\n[${header}]\n${quoteText}\n[/${quoteLabel}]\n`;
    },

    getBoosts(post) {
        const boosts = Array.isArray(post?.boosts) ? post.boosts : [];
        return boosts.map((boost) => {
            const user = boost?.user || {};
            const username = user.username || boost?.username || '';
            const name = user.name || boost?.name || username;
            return {
                id: boost?.id ?? null,
                name,
                username,
                text: this.truncatePlainText(this.plainTextFromHtml(boost?.cooked || boost?.text || boost?.raw || ''))
            };
        });
    },

    formatBoostAuthor(boost, atPrefix = false) {
        const name = boost?.name || boost?.username || '未知用户';
        const username = boost?.username || '';
        if (username && username !== name) {
            return `${name}（${atPrefix ? '@' : ''}${username}）`;
        }
        return atPrefix && username ? `@${username}` : name;
    },

    formatBoostsText(post, options = {}) {
        const boosts = this.getBoosts(post);
        if (boosts.length === 0) return '';

        const maxItems = options.maxItems || 5;
        const lines = boosts.slice(0, maxItems).map((boost) => {
            const author = this.formatBoostAuthor(boost, options.atPrefix === true);
            return boost.text ? `- ${author}: ${boost.text}` : `- ${author}`;
        });
        if (boosts.length > maxItems) {
            lines.push(`- 另有 ${boosts.length - maxItems} 条 boost 未展开`);
        }

        return `Boosts: ${boosts.length} 条\n${lines.join('\n')}`;
    },

    formatBoostsHtml(post) {
        const boosts = this.getBoosts(post);
        if (boosts.length === 0) return '';

        const maxItems = 10;
        const items = boosts.slice(0, maxItems).map((boost) => {
            const author = this.escapeHtml(this.formatBoostAuthor(boost, true));
            const text = boost.text ? `<span class="boost-text">${this.escapeHtml(boost.text)}</span>` : '';
            return `<li><span class="boost-author">${author}</span>${text}</li>`;
        }).join('');
        const overflow = boosts.length > maxItems
            ? `<li class="boost-more">另有 ${boosts.length - maxItems} 条 boost 未展开</li>`
            : '';

        return `
            <div class="post-boosts">
                <div class="boosts-title">Boosts · ${boosts.length}</div>
                <ul>${items}${overflow}</ul>
            </div>
        `;
    },

    formatPostCreatedAt(post) {
        const rawValue = post?.created_at;
        if (!rawValue) return '';
        const timestamp = new Date(rawValue);
        return Number.isNaN(timestamp.getTime()) ? '' : timestamp.toISOString();
    },

    getFetchProgressText(progress, subject = '帖子内容') {
        if (progress.stage === 'cache-hit') {
            return `使用刚获取的${subject}缓存，正在重新请求 AI...`;
        }
        const stage = progress.stage === 'range-lookbehind'
            ? `正在校准楼层范围（回看 ${progress.lookBehindIds} 个索引）`
            : `正在分批获取${subject}`;
        return `${stage} ${progress.doneIds}/${progress.totalIds}（${progress.doneBatches}/${progress.totalBatches} 批，每批 ${progress.batchSize}，并发 ${progress.concurrency}，间隔 ${progress.batchDelayMs}ms）...`;
    },

    buildSummaryCoverageReport({ topicId, start, end, cacheHit, cacheEntry, rangeMapping }) {
        const mapping = rangeMapping || cacheEntry?.rangeMapping || null;
        const visiblePostCount = Number.isFinite(Number(mapping?.visiblePostCount))
            ? Number(mapping.visiblePostCount)
            : Number.isFinite(Number(cacheEntry?.postCount))
                ? Number(cacheEntry.postCount)
                : null;
        const candidateIdCount = Number.isFinite(Number(mapping?.candidateIdCount))
            ? Number(mapping.candidateIdCount)
            : null;
        const fetchedPostCount = Number.isFinite(Number(mapping?.fetchedPostCount))
            ? Number(mapping.fetchedPostCount)
            : null;
        const missingCandidateIdCount = Number.isFinite(Number(mapping?.missingCandidateIdCount))
            ? Number(mapping.missingCandidateIdCount)
            : null;
        const lookBehindIds = Number.isFinite(Number(mapping?.lookBehindIds))
            ? Number(mapping.lookBehindIds)
            : 0;
        const highestPostNumber = Number.isFinite(Number(mapping?.highestPostNumber))
            ? Number(mapping.highestPostNumber)
            : null;
        const requestedEnd = Number(end);

        return {
            topicId: topicId ? String(topicId) : '',
            requestedStart: Number(start),
            requestedEnd,
            highestPostNumber,
            postsCount: Number.isFinite(Number(mapping?.postsCount)) ? Number(mapping.postsCount) : null,
            replyCount: Number.isFinite(Number(mapping?.replyCount)) ? Number(mapping.replyCount) : null,
            streamLength: Number.isFinite(Number(mapping?.streamLength)) ? Number(mapping.streamLength) : null,
            rangeBoundSource: mapping?.rangeBoundSource || null,
            requestedEndBelowHighest: Boolean(highestPostNumber && requestedEnd < highestPostNumber),
            visiblePostCount,
            candidateIdCount,
            fetchedPostCount,
            missingCandidateIdCount,
            cacheHit: cacheHit === true,
            fallbackUsed: mapping?.fallbackUsed === true,
            lookBehindIds,
            complete: mapping?.complete !== false,
            metadata: {
                replyRelation: true,
                boosts: true,
                createdAt: true
            }
        };
    },

    renderSummaryCoverageReport(report) {
        if (!report) return '';
        const rows = [];
        const addRow = (label, value, className = '') => {
            if (value === null || value === undefined || value === '') return;
            const safeLabel = this.escapeHtml(label);
            const safeValue = this.escapeHtml(value);
            const valueClass = className ? ` class="${className}"` : '';
            rows.push(`<dt>${safeLabel}</dt><dd${valueClass}>${safeValue}</dd>`);
        };

        addRow('Topic', report.topicId);
        addRow('请求范围', `${report.requestedStart}-${report.requestedEnd} 楼`);
        addRow('主题最高楼层', report.highestPostNumber === null ? '未知' : `${report.highestPostNumber} 楼`);
        addRow('楼层上限来源', report.rangeBoundSource);
        addRow('实际可见楼层', report.visiblePostCount === null ? '未知' : `${report.visiblePostCount} 条`);
        addRow('候选 stream 项', report.candidateIdCount === null ? null : `${report.candidateIdCount} 个`);
        addRow('已取得候选帖', report.fetchedPostCount === null ? null : `${report.fetchedPostCount} 条`);
        addRow('缓存', report.cacheHit ? '命中当前标签页短时缓存' : '本次重新获取楼层内容');
        addRow('原始拉取回看', report.fallbackUsed ? `是，回看 ${report.lookBehindIds} 个 stream 项` : '否');
        addRow('请求范围完整性', report.complete ? '已在安全请求上限内确认' : '未完全确认', report.complete ? '' : 'coverage-warning');
        if (report.requestedEndBelowHighest) {
            addRow('范围提示', '结束楼层小于主题最高楼层，当前不是全帖范围', 'coverage-warning');
        }
        if (report.missingCandidateIdCount) {
            addRow('缺失候选帖', `${report.missingCandidateIdCount} 条`, 'coverage-warning');
        }
        addRow('元数据', '回复关系、boosts 与发帖时间已纳入 AI 上下文');

        return `
            <details class="summary-coverage">
                <summary>本次总结覆盖报告</summary>
                <dl>${rows.join('')}</dl>
            </details>
        `;
    },
};
