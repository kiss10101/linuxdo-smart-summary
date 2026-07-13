#!/usr/bin/env node

import { readFile, readdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

function normalizeVersion(value, fallback = '7.6.1') {
  return String(value || fallback).trim().replace(/^v/i, '');
}

const version = normalizeVersion(process.argv[2]);
const root = process.cwd();
const failures = [];

function fail(message) {
  failures.push(message);
}

async function readText(path) {
  return readFile(resolve(root, path), 'utf8');
}

for (const path of [
  'audits',
  'tools/cdp-linuxdo-range-audit.mjs',
  'tools/linuxdo-range-audit.user.js'
]) {
  if (existsSync(resolve(root, path))) fail(`public snapshot must not contain ${path}`);
}

const quoteFixture = JSON.parse(await readText('fixtures/quote-attribution.fixture.json'));
if (quoteFixture.post?.topic_id !== 987654322) fail('quote fixture must use the synthetic current topic ID');
if (quoteFixture.post?.username !== 'example_author') fail('quote fixture must use the synthetic current author');
if (!String(quoteFixture.post?.cooked || '').includes('data-topic="987654320"')) fail('quote fixture must use the synthetic source topic ID');
if (!String(quoteFixture.post?.cooked || '').includes('https://example.invalid/avatar/')) fail('quote fixture avatar must use the reserved .invalid domain');
if (String(quoteFixture.post?.cooked || '').includes('cdn.ldstatic.com/user_avatar/')) fail('quote fixture must not contain a live user avatar URL');

const topicFixture = JSON.parse(await readText('fixtures/topic-identity.fixture.json'));
const topicIds = topicFixture.cases.map((item) => item.expectedTopicId).filter(Boolean);
if (!topicIds.includes('987654321')) fail('topic identity fixture must include the synthetic topic ID');

const userscript = await readText(`dist/Linux.do 智能总结-${version}.user.js`);
for (const fragment of [
  'marked@18.0.6/lib/marked.umd.js#sha384-',
  'dompurify@3.4.12/dist/purify.min.js#sha384-'
]) {
  if (!userscript.includes(fragment)) fail(`userscript dependency is not pinned: ${fragment}`);
}

const workflow = await readText('.github/workflows/release.yml');
for (const fragment of [
  'permissions:\n  contents: read',
  '    permissions:\n      contents: write',
  'actions/checkout@df4cb1c069e1874edd31b4311f1884172cec0e10',
  'actions/setup-node@48b55a011bda9f5d6aeb4c2d9c7362e8dae4041e',
  'INPUT_VERSION: ${{ github.event.inputs.version }}'
]) {
  if (!workflow.includes(fragment)) fail(`workflow hardening is missing: ${fragment}`);
}

const readme = await readText('README.md');
const readmeZh = await readText('README.zh-CN.md');
for (const [label, text] of [['README.md', readme], ['README.zh-CN.md', readmeZh]]) {
  if (!text.includes('example.invalid')) fail(`${label} must document synthetic fixture domains`);
  if (!text.includes('browser cookies')) fail(`${label} must document the browser-cookie boundary`);
}

const files = await readdir(resolve(root, 'tools'));
if (files.some((name) => /range-audit/i.test(name))) fail('public tools must not contain browser range-audit helpers');

if (failures.length > 0) {
  console.log(`Public repository check failed for ${version}:`);
  for (const failure of failures) console.log(`- ${failure}`);
  process.exitCode = 1;
} else {
  console.log(`Public repository check passed for ${version}.`);
}
