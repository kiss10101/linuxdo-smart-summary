export const coreState = {
    linuxDoPostFetchPolicy: {
        batchSize: 200,
        concurrency: 1,
        batchDelayMs: 600
    },
    linuxDoRequestBudgetPolicy: {
        maxCandidateIds: 4000,
        maxPostBatchRequests: 20
    },
    linuxDoRangeMappingPolicy: {
        lookBehindStepIds: 40,
        maxLookBehindIds: 240,
        fallbackConcurrency: 1,
        fallbackBatchDelayMs: 600
    },
    dialogueCachePolicy: {
        ttlMs: 10 * 60 * 1000,
        maxAgeMs: 15 * 60 * 1000,
        cleanupIntervalMs: 60 * 1000,
        maxTopics: 3,
        maxRangesPerTopic: 3,
        maxTotalBytes: 8 * 1024 * 1024,
        maxEntryBytes: 4 * 1024 * 1024
    },
    dialogueCacheTopics: new Map(),
    dialogueCacheCleanupTimer: null,
    htmlParser: null,
    topicDataCachePolicy: {
        ttlMs: 60 * 1000,
        maxTopics: 5
    },
    topicDataPrewarmPolicy: {
        throttleMs: 60 * 1000,
        routeDelayMs: 900,
        resumeDelayMs: 250,
        recentConfirmedMs: 5 * 1000,
        optimisticMaxAgeMs: 10 * 60 * 1000
    },
    topicDataCache: new Map(),
    topicDataInflight: new Map(),
    topicDataPrewarmState: new Map(),
};
