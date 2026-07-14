#!/usr/bin/env node

import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

function normalizeVersion(value, fallback = '7.7-alpha.9') {
  return String(value || fallback).trim().replace(/^v/i, '');
}

function assertEqual(actual, expected, label) {
  if (actual !== expected) {
    throw new Error(`${label}\nexpected: ${JSON.stringify(expected)}\nactual:   ${JSON.stringify(actual)}`);
  }
}

function assertContains(text, fragment, label) {
  if (!String(text).includes(fragment)) throw new Error(`${label}: missing ${JSON.stringify(fragment)}`);
}

function assertNotContains(text, fragment, label) {
  if (String(text).includes(fragment)) throw new Error(`${label}: forbidden ${JSON.stringify(fragment)}`);
}

function formatPostCreatedAt(post) {
  const rawValue = post?.created_at;
  if (!rawValue) return '';
  const timestamp = new Date(rawValue);
  return Number.isNaN(timestamp.getTime()) ? '' : timestamp.toISOString();
}

function formatPostForAiContextReference(post) {
  const createdAt = formatPostCreatedAt(post);
  const timePart = createdAt ? `发帖时间: ${createdAt}\n` : '';
  return `[${post.post_number}楼] ${post.name || post.username}（${post.username}）:\n${timePart}${post.cooked}`;
}

function extractBlock(text, startMarker, endMarker, label) {
  const start = text.indexOf(startMarker);
  if (start < 0) throw new Error(`${label}: start marker not found`);
  const end = text.indexOf(endMarker, start);
  if (end < 0) throw new Error(`${label}: end marker not found`);
  return text.slice(start, end);
}

const fixturePath = process.argv[2] || 'fixtures/post-timestamps.fixture.json';
const version = normalizeVersion(process.argv[3]);
const fixture = JSON.parse(await readFile(resolve(process.cwd(), fixturePath), 'utf8'));
const distText = await readFile(resolve(process.cwd(), `dist/Linux.do 智能总结-${version}.user.js`), 'utf8');

const timestampBlock = extractBlock(
  distText,
  '        formatPostCreatedAt(post) {',
  '        getFetchProgressText(',
  'formatPostCreatedAt'
);
assertContains(timestampBlock, 'post?.created_at', 'Discourse created_at source');
assertContains(timestampBlock, 'timestamp.toISOString()', 'stable UTC timestamp output');
assertContains(timestampBlock, 'Number.isNaN(timestamp.getTime())', 'invalid timestamp guard');

const contextBlock = extractBlock(
  distText,
  '        formatPostForAiContext(',
  '        formatPostsForAiContext(',
  'formatPostForAiContext'
);
assertContains(contextBlock, 'this.formatPostCreatedAt(post)', 'AI context timestamp formatting');
assertContains(contextBlock, '发帖时间: ${createdAt}', 'AI context timestamp label');
assertContains(contextBlock, '${replyPart}:\\n${timePart}${boostPart}${content}', 'AI context timestamp line placement');
assertNotContains(contextBlock, 'toLocaleString(', 'locale-dependent AI timestamp');

assertContains(distText, '回复关系、boosts 与发帖时间已纳入 AI 上下文', 'coverage report timestamp metadata');

for (const testCase of fixture.cases) {
  const actual = formatPostCreatedAt(testCase.post);
  console.log(`${testCase.name}: ${actual || '(empty)'}`);
  assertEqual(actual, testCase.expectedTimestamp, testCase.name);

  const context = formatPostForAiContextReference(testCase.post);
  if (testCase.expectedTimestamp) {
    assertContains(context, `:\n发帖时间: ${testCase.expectedTimestamp}\n`, `${testCase.name}: context timestamp line`);
    assertNotContains(context, `${testCase.expectedTimestamp}:`, `${testCase.name}: timestamp trailing colon`);
  } else {
    assertNotContains(context, '发帖时间:', `${testCase.name}: absent timestamp label`);
  }
}

console.log(`Post timestamps check passed for ${version}.`);
