export const topicDataCore = {
    getReplyCount: () => {
        const el = document.querySelector('.timeline-replies');
        if (!el) return 0;
        const txt = el.textContent.trim();
        return parseInt(txt.includes('/') ? txt.split('/')[1] : txt) || 0;
    },

    getLinuxDoFetchOptions(options = {}) {
        const csrf = document.querySelector('meta[name="csrf-token"]')?.content;
        const headers = {
            'accept': 'application/json',
            'x-requested-with': 'XMLHttpRequest'
        };
        if (csrf) headers['x-csrf-token'] = csrf;
        const fetchOptions = { headers, credentials: 'same-origin' };
        if (options.noStore) fetchOptions.cache = 'no-store';
        if (options.signal) fetchOptions.signal = options.signal;
        return fetchOptions;
    },

    async fetchLinuxDoJson(url, opts = {}) {
        const resp = await fetch(url, opts);
        const contentType = resp.headers.get('content-type') || '';

        if (!resp.ok) {
            throw new Error(`Linux.do 请求失败：HTTP ${resp.status}`);
        }

        if (!contentType.toLowerCase().includes('application/json')) {
            const body = await resp.text().catch(() => '');
            if (/cloudflare|challenge|cf-/i.test(body)) {
                throw new Error('Linux.do 返回了安全校验页面，请缩小范围或稍后重试');
            }
            if (/login|csrf|authenticity/i.test(body)) {
                throw new Error('Linux.do 返回了登录或会话校验页面，请确认当前页面已登录且会话有效');
            }
            throw new Error(`Linux.do 返回非 JSON 响应：${contentType || '未知类型'}`);
        }

        return resp.json();
    },

    normalizeTopicId(topicId) {
        return String(topicId || '').trim();
    },

    estimateJsonSize(value) {
        try {
            const json = JSON.stringify(value);
            if (typeof TextEncoder !== 'undefined') return new TextEncoder().encode(json).byteLength;
            return json.length * 2;
        } catch {
            return Number.POSITIVE_INFINITY;
        }
    },

    trimTopicDataCache() {
        const policy = this.topicDataCachePolicy;
        let totalBytes = 0;
        for (const entry of this.topicDataCache.values()) totalBytes += Number(entry.approxSize) || 0;
        while (this.topicDataCache.size > policy.maxTopics || totalBytes > policy.maxTotalBytes) {
            const oldestKey = this.topicDataCache.keys().next().value;
            if (oldestKey === undefined) break;
            totalBytes -= Number(this.topicDataCache.get(oldestKey)?.approxSize) || 0;
            this.topicDataCache.delete(oldestKey);
        }
    },

    trimTopicDataPrewarmState() {
        const limit = Math.max(1, Number(this.topicDataPrewarmPolicy.maxEntries) || 1);
        while (this.topicDataPrewarmState.size > limit) {
            const oldestKey = this.topicDataPrewarmState.keys().next().value;
            if (oldestKey === undefined) break;
            this.topicDataPrewarmState.delete(oldestKey);
        }
    },

    getTopicDataCacheEntry(topicId, options = {}) {
        const key = this.normalizeTopicId(topicId);
        if (!key) return null;

        const cached = this.topicDataCache.get(key);
        if (!cached) return null;

        const ageMs = Date.now() - cached.createdAt;
        const maxAgeMs = Number(options.maxAgeMs) || this.topicDataCachePolicy.ttlMs;
        if (options.allowStale !== true && ageMs > maxAgeMs) {
            return null;
        }

        this.topicDataCache.delete(key);
        this.topicDataCache.set(key, cached);
        return {
            ...cached,
            ageMs,
            fresh: ageMs <= this.topicDataCachePolicy.ttlMs
        };
    },

    getCachedTopicData(topicId) {
        return this.getTopicDataCacheEntry(topicId)?.topicData || null;
    },

    peekTopicData(topicId, options = {}) {
        const entry = this.getTopicDataCacheEntry(topicId, {
            allowStale: true,
            maxAgeMs: options.maxAgeMs || this.topicDataPrewarmPolicy.optimisticMaxAgeMs
        });
        if (!entry) return null;
        if (entry.ageMs > (options.maxAgeMs || this.topicDataPrewarmPolicy.optimisticMaxAgeMs)) return null;
        return entry;
    },

    getRecentConfirmedTopicData(topicId, maxAgeMs = this.topicDataPrewarmPolicy.recentConfirmedMs) {
        const entry = this.getTopicDataCacheEntry(topicId, { allowStale: true, maxAgeMs });
        if (!entry?.confirmedTopicData || !entry.confirmedAt) return null;

        const confirmedAgeMs = Date.now() - entry.confirmedAt;
        if (confirmedAgeMs > maxAgeMs) return null;
        return {
            topicData: entry.confirmedTopicData,
            ageMs: confirmedAgeMs,
            cacheHit: true,
            confirmed: true
        };
    },

    setCachedTopicData(topicId, topicData, meta = {}) {
        const key = this.normalizeTopicId(topicId);
        if (!key || !topicData) return topicData;
        const previous = this.topicDataCache.get(key);
        const now = Date.now();
        const confirmed = meta.confirmed === true;

        const approxSize = this.estimateJsonSize(topicData);
        if (!Number.isFinite(approxSize) || approxSize > this.topicDataCachePolicy.maxEntryBytes) {
            return topicData;
        }

        const confirmedTopicData = confirmed ? topicData : (previous?.confirmedTopicData || null);
        const confirmedApproxSize = confirmed
            ? approxSize
            : (Number(previous?.confirmedApproxSize)
                || (previous?.confirmedTopicData === previous?.topicData ? Number(previous?.approxSize) || 0 : 0));
        const retainedSize = approxSize + (
            confirmedTopicData && confirmedTopicData !== topicData ? confirmedApproxSize : 0
        );
        if (retainedSize > this.topicDataCachePolicy.maxEntryBytes) return topicData;

        this.topicDataCache.set(key, {
            createdAt: now,
            requestStartedAt: Number(meta.requestStartedAt) || now,
            approxSize: retainedSize,
            topicData,
            confirmedAt: confirmed ? now : (previous?.confirmedAt || 0),
            confirmedTopicData,
            confirmedApproxSize
        });

        this.trimTopicDataCache();

        return topicData;
    },

    clearTopicDataCache(topicId = null) {
        this.topicDataCacheGeneration = (this.topicDataCacheGeneration || 0) + 1;
        const key = this.normalizeTopicId(topicId);
        if (key) {
            this.topicDataCache.delete(key);
            this.topicDataPrewarmState.delete(key);
            for (const inflightKey of this.topicDataInflight.keys()) {
                if (inflightKey.startsWith(`${key}:`)) this.topicDataInflight.delete(inflightKey);
            }
            return;
        }
        this.topicDataCache.clear();
        this.topicDataInflight.clear();
        this.topicDataPrewarmState.clear();
    },

    async fetchTopicData(topicId, opts = this.getLinuxDoFetchOptions(), options = {}) {
        const key = this.normalizeTopicId(topicId);
        if (!key) throw new Error('未检测到帖子ID');
        const forceRefresh = options.forceRefresh === true;
        const requestSignal = opts?.signal;
        const shareInflight = !requestSignal;
        this.throwIfAborted?.(requestSignal);

        if (!forceRefresh) {
            const cached = this.getCachedTopicData(key);
            if (cached) return { topicData: cached, cacheHit: true };

            const forceInflightKey = `${key}:force`;
            if (shareInflight && this.topicDataInflight.has(forceInflightKey)) {
                return this.topicDataInflight.get(forceInflightKey);
            }
        }

        const inflightKey = `${key}:${forceRefresh ? 'force' : 'normal'}`;
        if (shareInflight && this.topicDataInflight.has(inflightKey)) {
            return this.topicDataInflight.get(inflightKey);
        }

        const requestStartedAt = Date.now();
        const cacheGeneration = this.topicDataCacheGeneration || 0;
        const fetchOptions = forceRefresh
            ? { ...opts, cache: 'no-store' }
            : opts;
        const request = this.fetchLinuxDoJson(`https://linux.do/t/-/${key}.json`, fetchOptions)
            .then((topicData) => {
                if (cacheGeneration === (this.topicDataCacheGeneration || 0)) {
                    this.setCachedTopicData(key, topicData, {
                        confirmed: forceRefresh,
                        requestStartedAt
                    });
                }
                return { topicData, cacheHit: false, confirmed: forceRefresh };
            })
            .finally(() => {
                if (shareInflight && this.topicDataInflight.get(inflightKey) === request) {
                    this.topicDataInflight.delete(inflightKey);
                }
            });
        if (shareInflight) this.topicDataInflight.set(inflightKey, request);
        return request;
    },

    async prewarmTopicData(topicId, options = {}) {
        const key = this.normalizeTopicId(topicId);
        if (!key) return { skipped: 'missing-topic' };
        if (options.ignoreVisibility !== true && document.visibilityState === 'hidden') {
            return { skipped: 'hidden' };
        }

        const policy = this.topicDataPrewarmPolicy;
        const recent = this.getRecentConfirmedTopicData(key, policy.recentConfirmedMs);
        if (recent && options.force !== true) return { skipped: 'recent-confirmed', ...recent };

        const now = Date.now();
        const state = this.topicDataPrewarmState.get(key) || {};
        if (options.force !== true && state.lastAttemptAt && now - state.lastAttemptAt < policy.throttleMs) {
            return { skipped: 'throttled', lastAttemptAt: state.lastAttemptAt };
        }

        state.lastAttemptAt = now;
        state.reason = options.reason || 'prewarm';
        this.topicDataPrewarmState.delete(key);
        this.topicDataPrewarmState.set(key, state);
        this.trimTopicDataPrewarmState();

        try {
            const result = await this.fetchTopicData(key, this.getLinuxDoFetchOptions({ noStore: true }), {
                forceRefresh: true
            });
            state.lastSuccessAt = Date.now();
            this.topicDataPrewarmState.delete(key);
            this.topicDataPrewarmState.set(key, state);
            this.trimTopicDataPrewarmState();
            return result;
        } catch (error) {
            state.lastErrorAt = Date.now();
            this.topicDataPrewarmState.delete(key);
            this.topicDataPrewarmState.set(key, state);
            this.trimTopicDataPrewarmState();
            throw error;
        }
    },

    getTopicBoundsFromTopicData(topicData, topicId = '') {
        const initialPosts = Array.isArray(topicData?.post_stream?.posts)
            ? topicData.post_stream.posts
            : [];
        const postNumbers = initialPosts
            .map(post => Number(post?.post_number))
            .filter(Number.isFinite);
        const highestFromTopic = Number(topicData?.highest_post_number);
        const highestFromPosts = postNumbers.length > 0 ? Math.max(...postNumbers) : 0;
        const highestPostNumber = Number.isFinite(highestFromTopic) && highestFromTopic > 0
            ? highestFromTopic
            : highestFromPosts;
        const postsCount = Number(topicData?.posts_count);
        const replyCount = Number(topicData?.reply_count);
        const streamIds = this.getTopicStreamIds(topicData);

        return {
            topicId: this.normalizeTopicId(topicData?.id || topicId),
            highestPostNumber: Number.isFinite(highestPostNumber) && highestPostNumber > 0 ? highestPostNumber : 0,
            postsCount: Number.isFinite(postsCount) ? postsCount : null,
            replyCount: Number.isFinite(replyCount) ? replyCount : null,
            streamLength: streamIds.length,
            source: Number.isFinite(highestFromTopic) && highestFromTopic > 0 ? 'topic-json' : 'initial-posts',
            topicData
        };
    },

    async getTopicBounds(topicId, options = {}) {
        const key = this.normalizeTopicId(topicId);
        let topicData = options.topicData || null;

        if (!topicData && key) {
            const forceRefresh = options.forceRefresh === true;
            if (forceRefresh && options.allowRecentConfirmedCache === true) {
                const recent = this.getRecentConfirmedTopicData(key, options.recentConfirmedMs);
                if (recent?.topicData) topicData = recent.topicData;
            }
        }

        if (!topicData && key) {
            const forceRefresh = options.forceRefresh === true;
            const fetched = await this.fetchTopicData(key, this.getLinuxDoFetchOptions({ noStore: forceRefresh }), {
                forceRefresh
            });
            topicData = fetched.topicData;
        }

        const bounds = this.getTopicBoundsFromTopicData(topicData, key);
        if (bounds.highestPostNumber > 0) return bounds;
        if (options.allowDomFallback === false) return bounds;

        const fallback = this.getReplyCount();
        return {
            ...bounds,
            highestPostNumber: fallback,
            source: fallback ? 'dom-fallback' : bounds.source
        };
    },

    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    },

    chunkArray(items, size) {
        const chunks = [];
        for (let i = 0; i < items.length; i += size) {
            chunks.push(items.slice(i, i + size));
        }
        return chunks;
    },

    getTopicStreamIds(topicData) {
        const stream = topicData?.post_stream?.stream;
        if (Array.isArray(stream) && stream.length > 0) return stream;
        return (topicData?.post_stream?.posts || []).map(post => post.id).filter(Boolean);
    },

    getCurrentUserKey() {
        try {
            const discourseUser = window.Discourse?.User?.current?.();
            if (discourseUser?.username) return `user:${discourseUser.username}`;
            const metaUser = document.querySelector('meta[name="current-user"]')?.content
                || document.querySelector('meta[name="discourse-current-username"]')?.content;
            if (metaUser) return `meta:${metaUser}`;
            const dataUser = document.body?.dataset?.userId || document.body?.dataset?.username;
            if (dataUser) return `body:${dataUser}`;
        } catch (e) {
            console.warn('[Linux.do 智能总结] 获取当前用户标识失败', e);
        }
        return 'unknown';
    },

    getDialogueCacheKeys(topicId, start, end, userKey = this.getCurrentUserKey()) {
        return {
            topicKey: String(topicId),
            rangeKey: `${Number(start)}:${Number(end)}:${userKey || 'unknown'}`
        };
    },

    estimateCacheTextBytes(text) {
        const value = String(text || '');
        if (typeof TextEncoder !== 'undefined') {
            return new TextEncoder().encode(value).length;
        }
        return value.length * 2;
    },

    isDialogueCacheEntryExpired(entry, now = Date.now()) {
        const policy = this.dialogueCachePolicy;
        return !entry
            || now - entry.createdAt > policy.maxAgeMs
            || now - entry.lastAccessAt > policy.ttlMs;
    },

    scheduleDialogueCacheCleanup() {
        if (this.dialogueCacheCleanupTimer || typeof setInterval !== 'function') return;
        this.dialogueCacheCleanupTimer = setInterval(() => {
            this.pruneDialogueCache();
        }, this.dialogueCachePolicy.cleanupIntervalMs);
    },

    stopDialogueCacheCleanup() {
        if (!this.dialogueCacheCleanupTimer || typeof clearInterval !== 'function') return;
        clearInterval(this.dialogueCacheCleanupTimer);
        this.dialogueCacheCleanupTimer = null;
    },

    pruneDialogueCache(now = Date.now()) {
        const policy = this.dialogueCachePolicy;

        for (const [topicKey, rangeMap] of this.dialogueCacheTopics.entries()) {
            for (const [rangeKey, entry] of rangeMap.entries()) {
                if (this.isDialogueCacheEntryExpired(entry, now)) {
                    rangeMap.delete(rangeKey);
                }
            }

            const ranges = [...rangeMap.entries()]
                .sort((a, b) => a[1].lastAccessAt - b[1].lastAccessAt);
            while (ranges.length > policy.maxRangesPerTopic) {
                const [rangeKey] = ranges.shift();
                rangeMap.delete(rangeKey);
            }

            if (rangeMap.size === 0) {
                this.dialogueCacheTopics.delete(topicKey);
            }
        }

        const topics = [...this.dialogueCacheTopics.entries()]
            .map(([topicKey, rangeMap]) => ({
                topicKey,
                lastAccessAt: Math.max(...[...rangeMap.values()].map(entry => entry.lastAccessAt))
            }))
            .sort((a, b) => a.lastAccessAt - b.lastAccessAt);
        while (topics.length > policy.maxTopics) {
            const topic = topics.shift();
            this.dialogueCacheTopics.delete(topic.topicKey);
        }

        const entries = [];
        let totalBytes = 0;
        for (const [topicKey, rangeMap] of this.dialogueCacheTopics.entries()) {
            for (const [rangeKey, entry] of rangeMap.entries()) {
                totalBytes += entry.approxSize;
                entries.push({ topicKey, rangeKey, entry });
            }
        }
        entries.sort((a, b) => a.entry.lastAccessAt - b.entry.lastAccessAt);
        while (totalBytes > policy.maxTotalBytes && entries.length > 0) {
            const item = entries.shift();
            const rangeMap = this.dialogueCacheTopics.get(item.topicKey);
            if (rangeMap?.delete(item.rangeKey)) {
                totalBytes -= item.entry.approxSize;
                if (rangeMap.size === 0) this.dialogueCacheTopics.delete(item.topicKey);
            }
        }

        if (this.dialogueCacheTopics.size === 0) {
            this.stopDialogueCacheCleanup();
        }
    },

    getCachedDialogue(topicId, start, end) {
        const now = Date.now();
        this.pruneDialogueCache(now);

        const { topicKey, rangeKey } = this.getDialogueCacheKeys(topicId, start, end);
        const rangeMap = this.dialogueCacheTopics.get(topicKey);
        const entry = rangeMap?.get(rangeKey);
        if (!entry) return null;
        if (this.isDialogueCacheEntryExpired(entry, now)) {
            rangeMap.delete(rangeKey);
            if (rangeMap.size === 0) this.dialogueCacheTopics.delete(topicKey);
            return null;
        }

        entry.lastAccessAt = now;
        return { ...entry, cacheHit: true };
    },

    setCachedDialogue(topicId, start, end, text, meta = {}) {
        const approxSize = this.estimateCacheTextBytes(text);
        if (!text || approxSize > this.dialogueCachePolicy.maxEntryBytes) return null;

        const now = Date.now();
        const { topicKey, rangeKey } = this.getDialogueCacheKeys(topicId, start, end);
        if (!this.dialogueCacheTopics.has(topicKey)) {
            this.dialogueCacheTopics.set(topicKey, new Map());
        }

        const entry = {
            topicId: String(topicId),
            start: Number(start),
            end: Number(end),
            text,
            postCount: meta.postCount || 0,
            rangeMapping: meta.rangeMapping || null,
            createdAt: now,
            lastAccessAt: now,
            approxSize
        };
        this.dialogueCacheTopics.get(topicKey).set(rangeKey, entry);
        this.pruneDialogueCache(now);
        this.scheduleDialogueCacheCleanup();
        return entry;
    },

    clearDialogueCache(topicId = null, start = null, end = null) {
        const finish = (count) => {
            if (this.dialogueCacheTopics.size === 0) this.stopDialogueCacheCleanup();
            return count;
        };

        if (!topicId) {
            const count = this.dialogueCacheTopics.size;
            this.dialogueCacheTopics.clear();
            return finish(count);
        }

        const topicKey = String(topicId);
        const rangeMap = this.dialogueCacheTopics.get(topicKey);
        if (!rangeMap) return finish(0);

        if (!start || !end) {
            const count = rangeMap.size;
            this.dialogueCacheTopics.delete(topicKey);
            return finish(count);
        }

        const { rangeKey } = this.getDialogueCacheKeys(topicId, start, end);
        const removed = rangeMap.delete(rangeKey) ? 1 : 0;
        if (rangeMap.size === 0) this.dialogueCacheTopics.delete(topicKey);
        return finish(removed);
    },

    async fetchPostsByIds(topicId, postIds, opts, onProgress, policyOverride = {}, progressMeta = {}) {
        const signal = opts?.signal;
        this.throwIfAborted?.(signal);
        const ids = [...new Set(postIds.filter(Boolean))];
        if (ids.length === 0) return [];

        const policy = { ...this.linuxDoPostFetchPolicy, ...policyOverride };
        const chunks = this.chunkArray(ids, policy.batchSize);
        this.assertLinuxDoRequestBudget({
            idCount: ids.length,
            candidateIdCount: progressMeta.candidateIdCount || ids.length,
            batchCount: progressMeta.usedPostBatchRequests || chunks.length,
            start: progressMeta.start,
            end: progressMeta.end,
            stage: progressMeta.stage
        });
        const results = new Array(chunks.length);
        const workerCount = Math.min(policy.concurrency, chunks.length);
        let cursor = 0;
        let doneBatches = 0;
        let doneIds = 0;
        let nextBatchStartAt = 0;

        const waitForBatchSlot = async () => {
            this.throwIfAborted?.(signal);
            if (policy.batchDelayMs <= 0) return;

            const now = Date.now();
            const waitMs = Math.max(0, nextBatchStartAt - now);
            nextBatchStartAt = Math.max(now, nextBatchStartAt) + policy.batchDelayMs;
            if (waitMs > 0) {
                await this.sleep(waitMs);
                this.throwIfAborted?.(signal);
            }
        };

        const runWorker = async () => {
            while (cursor < chunks.length) {
                this.throwIfAborted?.(signal);
                const index = cursor++;
                await waitForBatchSlot();

                const chunk = chunks[index];
                this.throwIfAborted?.(signal);
                const q = chunk.map(id => `post_ids[]=${encodeURIComponent(id)}`).join('&');
                const data = await this.fetchLinuxDoJson(`https://linux.do/t/${topicId}/posts.json?${q}&include_suggested=false`, opts);
                results[index] = data.post_stream?.posts || [];
                doneBatches += 1;
                doneIds += chunk.length;

                if (typeof onProgress === 'function') {
                    onProgress({
                        ...progressMeta,
                        doneIds: Math.min(doneIds, ids.length),
                        totalIds: ids.length,
                        doneBatches,
                        totalBatches: chunks.length,
                        batchSize: policy.batchSize,
                        concurrency: policy.concurrency,
                        batchDelayMs: policy.batchDelayMs
                    });
                }
            }
        };

        await Promise.all(Array.from({ length: workerCount }, () => runWorker()));
        return results.flat();
    },

    assertLinuxDoRequestBudget({ idCount = 0, candidateIdCount = idCount, batchCount = 0, start = null, end = null, stage = '' } = {}) {
        const budget = this.linuxDoRequestBudgetPolicy;
        const normalizedIdCount = Math.max(0, Number(idCount) || 0);
        const normalizedCandidateIdCount = Math.max(0, Number(candidateIdCount) || 0);
        const normalizedBatchCount = Math.max(0, Number(batchCount) || 0);
        const overCandidateIds = normalizedCandidateIdCount > budget.maxCandidateIds;
        const overBatchRequests = normalizedBatchCount > budget.maxPostBatchRequests;

        if (!overCandidateIds && !overBatchRequests) {
            return {
                idCount: normalizedIdCount,
                candidateIdCount: normalizedCandidateIdCount,
                batchCount: normalizedBatchCount
            };
        }

        const rangeText = Number.isFinite(Number(start)) && Number.isFinite(Number(end))
            ? `${start}-${end} 楼`
            : '当前范围';
        const stageText = stage ? `（${stage}）` : '';
        throw new Error(
            `范围过大：${rangeText}${stageText}候选 ${normalizedCandidateIdCount} 条，` +
            `预计 posts 请求 ${normalizedBatchCount} 批，超过脚本安全上限（候选 ${budget.maxCandidateIds} 条，` +
            `posts 请求 ${budget.maxPostBatchRequests} 批）。请缩小楼层范围或分段总结/导出。`
        );
    },

    createLinuxDoRequestBudgetTracker({ start = null, end = null, stage = 'topic-range' } = {}) {
        const core = this;
        const budget = this.linuxDoRequestBudgetPolicy;
        let usedPostBatchRequests = 0;

        return {
            assertNext({ idCount = 0, candidateIdCount = idCount, batchCount = 0, stage: nextStage = stage } = {}) {
                const normalizedBatchCount = Math.max(0, Number(batchCount) || 0);
                const projectedBatchCount = usedPostBatchRequests + normalizedBatchCount;
                core.assertLinuxDoRequestBudget({
                    idCount,
                    candidateIdCount,
                    batchCount: projectedBatchCount,
                    start,
                    end,
                    stage: nextStage
                });
                usedPostBatchRequests = projectedBatchCount;
                return {
                    usedPostBatchRequests,
                    remainingPostBatchRequests: Math.max(0, budget.maxPostBatchRequests - usedPostBatchRequests)
                };
            }
        };
    },

    getRangeLookBehindRounds(start) {
        const policy = this.linuxDoRangeMappingPolicy;
        const startIndex = Math.max(0, start - 1);
        const maxLookBehind = Math.min(startIndex, policy.maxLookBehindIds);
        const step = Math.max(1, policy.lookBehindStepIds);
        const rounds = [0];

        for (let value = step; value < maxLookBehind; value += step) {
            rounds.push(value);
        }
        if (maxLookBehind > 0 && rounds[rounds.length - 1] !== maxLookBehind) {
            rounds.push(maxLookBehind);
        }

        return rounds;
    },

    getTopicStreamWindow(streamIds, start, end, lookBehindIds) {
        const upperIndex = Math.min(streamIds.length, Math.max(0, end + lookBehindIds));
        const lowerIndex = Math.min(upperIndex, Math.max(0, start - 1 - lookBehindIds));
        return {
            ids: streamIds.slice(lowerIndex, upperIndex),
            lowerIndex,
            upperIndex,
            lookBehindIds
        };
    },

    filterPostsByPostNumber(posts, start, end) {
        return posts
            .filter((post) => {
                const postNumber = Number(post?.post_number);
                return Number.isFinite(postNumber) && postNumber >= start && postNumber <= end;
            })
            .sort((a, b) => Number(a.post_number) - Number(b.post_number));
    },
};
