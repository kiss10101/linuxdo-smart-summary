#!/usr/bin/env node

import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

function sameArray(a, b) {
  return Array.isArray(a)
    && Array.isArray(b)
    && a.length === b.length
    && a.every((item, index) => item === b[index]);
}

function oldSlice(posts, start, end) {
  return posts
    .slice(Math.max(0, start - 1), end)
    .map((post) => post.post_number);
}

function filterByPostNumber(posts, start, end) {
  return posts
    .filter((post) => post.post_number >= start && post.post_number <= end)
    .map((post) => post.post_number);
}

function getLookBehindRounds(start, step, max) {
  const startIndex = Math.max(0, start - 1);
  const maxLookBehind = Math.min(startIndex, max);
  const rounds = [0];

  for (let value = step; value < maxLookBehind; value += step) {
    rounds.push(value);
  }
  if (maxLookBehind > 0 && rounds[rounds.length - 1] !== maxLookBehind) {
    rounds.push(maxLookBehind);
  }

  return rounds;
}

function mapRangeWithLookBehind(posts, start, end, options = {}) {
  const ids = posts.map((post) => post.id);
  const postById = new Map(posts.map((post) => [post.id, post]));
  const step = options.step ?? 40;
  const max = options.max ?? 240;

  for (const lookBehindIds of getLookBehindRounds(start, step, max)) {
    const upperIndex = Math.min(ids.length, Math.max(0, end + lookBehindIds));
    const lowerIndex = Math.min(upperIndex, Math.max(0, start - 1 - lookBehindIds));
    const candidatePosts = ids
      .slice(lowerIndex, upperIndex)
      .map((id) => postById.get(id))
      .filter(Boolean);
    const postNumbers = candidatePosts.map((post) => post.post_number);
    const firstPostNumber = Math.min(...postNumbers);
    const lastPostNumber = Math.max(...postNumbers);
    const complete = candidatePosts.length > 0
      && Number.isFinite(firstPostNumber)
      && Number.isFinite(lastPostNumber)
      && (lowerIndex === 0 || firstPostNumber <= start)
      && (upperIndex >= ids.length || lastPostNumber >= end);

    if (complete) {
      return filterByPostNumber(candidatePosts, start, end);
    }
  }

  throw new Error(`range ${start}-${end} was not completed within look-behind policy`);
}

const fixturePath = process.argv[2] || 'fixtures/post-stream-gap.fixture.json';
const absoluteFixturePath = resolve(process.cwd(), fixturePath);
const fixture = JSON.parse(await readFile(absoluteFixturePath, 'utf8'));

let failed = 0;
let oldMismatchCount = 0;

console.log(`Fixture: ${fixture.name || fixturePath}`);

for (const testCase of fixture.cases) {
  const [start, end] = testCase.range;
  const oldResult = oldSlice(fixture.posts, start, end);
  const newResult = filterByPostNumber(fixture.posts, start, end);
  const mappedResult = mapRangeWithLookBehind(fixture.posts, start, end, fixture.policy);
  const expected = testCase.expectedPostNumbers;
  const expectedOld = testCase.oldSlicePostNumbers;
  const oldMatchesExpectedOld = sameArray(oldResult, expectedOld);
  const newMatchesExpected = sameArray(newResult, expected);
  const mappedMatchesExpected = sameArray(mappedResult, expected);
  const oldMatchesCorrect = sameArray(oldResult, expected);

  if (!oldMatchesCorrect) oldMismatchCount += 1;

  console.log(`range ${start}-${end}`);
  console.log(`  oldSlice:           ${JSON.stringify(oldResult)}`);
  console.log(`  filterByPostNumber: ${JSON.stringify(newResult)}`);
  console.log(`  mapWithLookBehind:  ${JSON.stringify(mappedResult)}`);
  console.log(`  expected:           ${JSON.stringify(expected)}`);

  if (!oldMatchesExpectedOld || !newMatchesExpected || !mappedMatchesExpected) {
    failed += 1;
    console.log('  result: FAIL');
  } else {
    console.log('  result: PASS');
  }
}

if (oldMismatchCount === 0) {
  failed += 1;
  console.error('Fixture did not demonstrate any old slice mismatch.');
}

if (failed > 0) {
  process.exitCode = 1;
} else {
  console.log(`All cases passed. Old slice mismatches demonstrated: ${oldMismatchCount}`);
}
