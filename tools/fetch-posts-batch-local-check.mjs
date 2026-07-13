#!/usr/bin/env node

import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

function sameArray(a, b) {
  return Array.isArray(a)
    && Array.isArray(b)
    && a.length === b.length
    && a.every((item, index) => item === b[index]);
}

function expandIds(testCase) {
  const [start, end] = testCase.idRange;
  const ids = [];
  for (let id = start; id <= end; id += 1) ids.push(id);
  ids.push(...(testCase.extraIds || []));
  return ids;
}

function chunkArray(items, size) {
  const chunks = [];
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size));
  }
  return chunks;
}

function extractPostIdsFromUrl(url) {
  const parsed = new URL(url);
  return parsed.searchParams.getAll('post_ids[]').map((id) => Number(id));
}

async function fetchPostsByIds(topicId, postIds, opts, onProgress, policyOverride = {}, progressMeta = {}) {
  const ids = [...new Set(postIds.filter(Boolean))];
  if (ids.length === 0) return [];

  const policy = {
    batchSize: 200,
    concurrency: 1,
    batchDelayMs: 0,
    ...policyOverride
  };
  const chunks = chunkArray(ids, policy.batchSize);
  const results = new Array(chunks.length);
  const workerCount = Math.min(policy.concurrency, chunks.length);
  let cursor = 0;
  let doneBatches = 0;
  let doneIds = 0;

  const runWorker = async () => {
    while (cursor < chunks.length) {
      const index = cursor++;
      const chunk = chunks[index];
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
}

const fixturePath = process.argv[2] || 'fixtures/fetch-posts-batch.fixture.json';
const absoluteFixturePath = resolve(process.cwd(), fixturePath);
const fixture = JSON.parse(await readFile(absoluteFixturePath, 'utf8'));

let failed = 0;
console.log(`Fixture: ${fixture.name || fixturePath}`);

for (const testCase of fixture.cases) {
  const calls = [];
  const progressEvents = [];
  const coreLike = {
    fetchPostsByIds,
    async fetchLinuxDoJson(url) {
      const ids = extractPostIdsFromUrl(url);
      calls.push({ url, ids });
      return {
        post_stream: {
          posts: ids.map((id) => ({ id, post_number: id }))
        }
      };
    }
  };

  const posts = await coreLike.fetchPostsByIds(
    testCase.topicId,
    expandIds(testCase),
    {},
    (event) => progressEvents.push(event),
    testCase.policy
  );

  const batchSizes = calls.map((call) => call.ids.length);
  const doneIds = progressEvents.map((event) => event.doneIds);
  const totalBatches = progressEvents.at(-1)?.totalBatches;
  const totalIds = progressEvents.at(-1)?.totalIds;
  const uniqueTruthyIds = [...new Set(expandIds(testCase).filter(Boolean))];

  console.log(testCase.name);
  console.log(`  batchSizes: ${JSON.stringify(batchSizes)}`);
  console.log(`  doneIds:    ${JSON.stringify(doneIds)}`);
  console.log(`  totalIds:   ${totalIds}`);
  console.log(`  posts:      ${posts.length}`);

  if (!sameArray(batchSizes, testCase.expectedBatchSizes)
    || !sameArray(doneIds, testCase.expectedDoneIds)
    || totalBatches !== testCase.expectedTotalBatches
    || totalIds !== uniqueTruthyIds.length
    || posts.length !== uniqueTruthyIds.length) {
    failed += 1;
    console.log('  result: FAIL');
  } else {
    console.log('  result: PASS');
  }
}

if (failed > 0) {
  process.exitCode = 1;
} else {
  console.log('All fetch batch cases passed.');
}
