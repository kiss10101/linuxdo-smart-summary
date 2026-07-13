#!/usr/bin/env node

import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

function getDialogueCacheKeys(topicId, start, end, userKey = 'test-user') {
  return {
    topicKey: String(topicId),
    rangeKey: `${Number(start)}:${Number(end)}:${userKey || 'unknown'}`
  };
}

function estimateCacheTextBytes(text) {
  return new TextEncoder().encode(String(text || '')).length;
}

function isExpired(entry, policy, now) {
  return !entry
    || now - entry.createdAt > policy.maxAgeMs
    || now - entry.lastAccessAt > policy.ttlMs;
}

function createDialogueCache(policy) {
  const topics = new Map();
  let now = 1000;

  return {
    advance(ms) {
      now += ms;
    },
    get(topicId, start, end) {
      const { topicKey, rangeKey } = getDialogueCacheKeys(topicId, start, end);
      const rangeMap = topics.get(topicKey);
      const entry = rangeMap?.get(rangeKey);
      if (!entry) return null;
      if (isExpired(entry, policy, now)) {
        rangeMap.delete(rangeKey);
        if (rangeMap.size === 0) topics.delete(topicKey);
        return null;
      }
      entry.lastAccessAt = now;
      return { ...entry, cacheHit: true };
    },
    set(topicId, start, end, text, meta = {}) {
      const approxSize = estimateCacheTextBytes(text);
      const { topicKey, rangeKey } = getDialogueCacheKeys(topicId, start, end);
      if (!topics.has(topicKey)) topics.set(topicKey, new Map());
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
      topics.get(topicKey).set(rangeKey, entry);
      return entry;
    }
  };
}

async function fetchDialoguesCached({ topicId, start, end, cache, fetchDialogues, forceRefresh = false }) {
  if (!forceRefresh) {
    const cached = cache.get(topicId, start, end);
    if (cached) {
      return {
        text: cached.text,
        cacheHit: true,
        cacheEntry: cached,
        rangeMapping: cached.rangeMapping || null
      };
    }
  }

  const { text, rangeMapping } = await fetchDialogues(topicId, start, end);
  const cacheEntry = cache.set(topicId, start, end, text, {
    postCount: rangeMapping?.visiblePostCount || 0,
    rangeMapping
  });
  return { text, cacheHit: false, cacheEntry, rangeMapping };
}

async function runSummaryOnce({ fixture, cache, stats }) {
  const [start, end] = fixture.range;
  const result = await fetchDialoguesCached({
    topicId: fixture.topicId,
    start,
    end,
    cache,
    async fetchDialogues() {
      stats.fetchDialoguesCalls += 1;
      return {
        text: fixture.dialogueText,
        rangeMapping: fixture.rangeMapping
      };
    }
  });

  stats.cacheHits.push(result.cacheHit);
  stats.visiblePostCounts.push(result.rangeMapping?.visiblePostCount ?? result.cacheEntry?.postCount ?? null);
  stats.fallbackUsed.push(Boolean(result.rangeMapping?.fallbackUsed ?? result.cacheEntry?.rangeMapping?.fallbackUsed));
  stats.aiCalls += 1;
  const messages = [
    { role: 'system', content: 'summary prompt' },
    { role: 'user', content: `帖子内容:\n${result.text}` }
  ];

  if (!messages[1].content.includes(fixture.dialogueText)) {
    throw new Error('AI messages did not include dialogue text');
  }
  return messages;
}

const fixturePath = process.argv[2] || 'fixtures/summary-content-cache.fixture.json';
const absoluteFixturePath = resolve(process.cwd(), fixturePath);
const fixture = JSON.parse(await readFile(absoluteFixturePath, 'utf8'));
const cache = createDialogueCache({
  ttlMs: fixture.ttlMs,
  maxAgeMs: fixture.maxAgeMs
});
const stats = {
  fetchDialoguesCalls: 0,
  aiCalls: 0,
  cacheHits: [],
  visiblePostCounts: [],
  fallbackUsed: []
};

console.log(`Fixture: ${fixture.name || fixturePath}`);

const firstMessages = await runSummaryOnce({ fixture, cache, stats });
const secondMessages = await runSummaryOnce({ fixture, cache, stats });

console.log(`fetchDialoguesCalls: ${stats.fetchDialoguesCalls}`);
console.log(`aiCalls:             ${stats.aiCalls}`);
console.log(`cacheHits:           ${JSON.stringify(stats.cacheHits)}`);
console.log(`visiblePostCounts:   ${JSON.stringify(stats.visiblePostCounts)}`);
console.log(`fallbackUsed:        ${JSON.stringify(stats.fallbackUsed)}`);

const failed = stats.fetchDialoguesCalls !== fixture.expectedFetchDialoguesCalls
  || stats.aiCalls !== fixture.expectedAiCalls
  || JSON.stringify(stats.cacheHits) !== JSON.stringify(fixture.expectedCacheHits)
  || stats.visiblePostCounts.some((count) => count !== fixture.expectedVisiblePostCount)
  || stats.fallbackUsed.some((value) => value !== fixture.expectedCacheFallbackUsed)
  || firstMessages[1].content !== secondMessages[1].content;

if (failed) {
  console.log('result: FAIL');
  process.exitCode = 1;
} else {
  console.log('All summary content cache cases passed.');
}
