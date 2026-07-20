import assert from 'node:assert/strict';
import test from 'node:test';

import { Core } from '../src/core/index.js';

test('abortable topic requests do not poison shared inflight requests', async (t) => {
    const originalFetchLinuxDoJson = Core.fetchLinuxDoJson;
    t.after(() => {
        Core.fetchLinuxDoJson = originalFetchLinuxDoJson;
        Core.clearTopicDataCache();
    });
    Core.clearTopicDataCache();

    let requestCount = 0;
    Core.fetchLinuxDoJson = async (_url, options = {}) => {
        requestCount += 1;
        if (!options.signal) return { id: 42, post_stream: { stream: [] } };
        return new Promise((_resolve, reject) => {
            options.signal.addEventListener('abort', () => {
                const error = new Error('aborted');
                error.name = 'AbortError';
                reject(error);
            }, { once: true });
        });
    };

    const controller = new AbortController();
    const abortable = Core.fetchTopicData('42', { signal: controller.signal });
    const shared = Core.fetchTopicData('42', {});
    controller.abort();

    await assert.rejects(abortable, (error) => error.name === 'AbortError');
    const result = await shared;
    assert.equal(result.topicData.id, 42);
    assert.equal(requestCount, 2);
    assert.equal(Core.topicDataInflight.size, 0);
});

test('topic cache and prewarm state obey count and byte budgets', (t) => {
    const originalCachePolicy = Core.topicDataCachePolicy;
    const originalPrewarmPolicy = Core.topicDataPrewarmPolicy;
    t.after(() => {
        Core.topicDataCachePolicy = originalCachePolicy;
        Core.topicDataPrewarmPolicy = originalPrewarmPolicy;
        Core.clearTopicDataCache();
    });

    Core.clearTopicDataCache();
    Core.topicDataCachePolicy = {
        ...originalCachePolicy,
        maxTopics: 2,
        maxEntryBytes: 1024,
        maxTotalBytes: 1024
    };
    Core.setCachedTopicData('1', { value: 'one' });
    Core.setCachedTopicData('2', { value: 'two' });
    Core.setCachedTopicData('3', { value: 'three' });
    assert.deepEqual([...Core.topicDataCache.keys()], ['2', '3']);

    const first = { value: 'a'.repeat(120) };
    const second = { value: 'b'.repeat(120) };
    const oneEntrySize = Core.estimateJsonSize(first);
    Core.clearTopicDataCache();
    Core.topicDataCachePolicy = {
        ...Core.topicDataCachePolicy,
        maxTopics: 5,
        maxEntryBytes: oneEntrySize + 16,
        maxTotalBytes: oneEntrySize + 32
    };
    Core.setCachedTopicData('a', first);
    Core.setCachedTopicData('b', second);
    assert.deepEqual([...Core.topicDataCache.keys()], ['b']);

    Core.topicDataPrewarmPolicy = { ...originalPrewarmPolicy, maxEntries: 2 };
    Core.topicDataPrewarmState.set('1', {});
    Core.topicDataPrewarmState.set('2', {});
    Core.topicDataPrewarmState.set('3', {});
    Core.trimTopicDataPrewarmState();
    assert.deepEqual([...Core.topicDataPrewarmState.keys()], ['2', '3']);
});

test('post batch fetching stops before starting another batch after abort', async (t) => {
    const originalFetchLinuxDoJson = Core.fetchLinuxDoJson;
    t.after(() => {
        Core.fetchLinuxDoJson = originalFetchLinuxDoJson;
    });

    const controller = new AbortController();
    let requestCount = 0;
    Core.fetchLinuxDoJson = async () => {
        requestCount += 1;
        controller.abort();
        return { post_stream: { posts: [{ id: requestCount }] } };
    };

    await assert.rejects(
        Core.fetchPostsByIds(
            '42',
            [1, 2, 3],
            { signal: controller.signal },
            null,
            { batchSize: 1, concurrency: 1, batchDelayMs: 0 }
        ),
        (error) => error.name === 'AbortError'
    );
  assert.equal(requestCount, 1);
});

test('clearing a topic cache prevents a stale in-flight response from repopulating it', async (t) => {
    const originalFetchLinuxDoJson = Core.fetchLinuxDoJson;
    t.after(() => {
        Core.fetchLinuxDoJson = originalFetchLinuxDoJson;
        Core.clearTopicDataCache();
    });
    Core.clearTopicDataCache();

    const resolvers = [];
    Core.fetchLinuxDoJson = async () => new Promise(resolve => resolvers.push(resolve));

    const stale = Core.fetchTopicData('77', {});
    Core.clearTopicDataCache('77');
    const fresh = Core.fetchTopicData('77', {});
    assert.equal(resolvers.length, 2);

    resolvers[0]({ id: 'stale', post_stream: { stream: [] } });
    const staleResult = await stale;
    assert.equal(staleResult.topicData.id, 'stale');
    assert.equal(Core.topicDataCache.has('77'), false);

    resolvers[1]({ id: 'fresh', post_stream: { stream: [] } });
    const freshResult = await fresh;
    assert.equal(freshResult.topicData.id, 'fresh');
    assert.equal(Core.getCachedTopicData('77').id, 'fresh');
});
