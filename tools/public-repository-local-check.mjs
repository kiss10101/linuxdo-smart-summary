#!/usr/bin/env node

import { readFile, readdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

function normalizeVersion(value, fallback = '7.7-alpha.8') {
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

const reservedFixtureHost = 'example.invalid';
const linuxDoHost = 'linux.do';
const genericFixtureIds = new Set(['123', '12345']);

function extractHtmlUrlAttributes(source) {
  const attributes = [];
  const text = String(source ?? '');
  let cursor = 0;

  while (cursor < text.length) {
    const start = text.indexOf('<', cursor);
    if (start < 0) break;

    let quote = '';
    let end = start + 1;
    for (; end < text.length; end += 1) {
      const char = text[end];
      if (quote) {
        if (char === quote) quote = '';
        continue;
      }
      if (char === '"' || char === "'") {
        quote = char;
        continue;
      }
      if (char === '>') break;
    }
    if (end >= text.length) break;

    const tag = text.slice(start, end + 1);
    const pattern = /\b(src|href)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/gi;
    for (const match of tag.matchAll(pattern)) {
      attributes.push({ name: match[1].toLowerCase(), value: match[2] || match[3] || match[4] || '' });
    }
    cursor = end + 1;
  }
  return attributes;
}

function collectUrlReferences(source) {
  const references = new Set(
    extractHtmlUrlAttributes(source)
      .map((item) => item.value)
      .filter((value) => /^(?:#|\/|\.{1,2}\/|[a-z][a-z0-9+.-]*:)/i.test(value) || /[/.?]/.test(value))
  );
  const pattern = /\bhttps?:\/\/[^\s"'<>\\\]]+|\/\/[a-z0-9.-]+(?:\/[^\s"'<>\\\]]*)?/gi;
  for (const match of String(source ?? '').matchAll(pattern)) references.add(match[0]);
  return [...references].filter(Boolean);
}

function collectFixtureStrings(value, path = '$', output = []) {
  if (typeof value === 'string') {
    output.push({ path, value });
    return output;
  }
  if (Array.isArray(value)) {
    value.forEach((item, index) => collectFixtureStrings(item, `${path}[${index}]`, output));
    return output;
  }
  if (value && typeof value === 'object') {
    for (const [key, item] of Object.entries(value)) collectFixtureStrings(item, `${path}.${key}`, output);
  }
  return output;
}

function isReservedFixtureHost(hostname) {
  return hostname === reservedFixtureHost || hostname.endsWith(`.${reservedFixtureHost}`);
}

function isSyntheticLinuxDoId(token) {
  if (genericFixtureIds.has(token)) return true;
  const value = Number(token);
  return Number.isSafeInteger(value) && value >= 987654000 && value <= 987654999;
}

function inspectFixtureUrl(rawValue) {
  const issues = [];
  const candidate = String(rawValue ?? '').trim();
  if (!candidate || candidate.startsWith('#')) return issues;
  if (!/^(?:https?:)?\/\//i.test(candidate)) {
    issues.push(`fixture URL references must be absolute: ${candidate}`);
    return issues;
  }

  let url;
  try {
    url = new URL(candidate.startsWith('//') ? `https:${candidate}` : candidate);
  } catch {
    issues.push(`invalid fixture URL: ${candidate}`);
    return issues;
  }

  if (url.protocol !== 'https:') issues.push(`fixture URL must use HTTPS: ${candidate}`);
  if (url.username || url.password) issues.push(`fixture URL must not contain credentials: ${candidate}`);
  if (url.port) issues.push(`fixture URL must not use an explicit port: ${candidate}`);

  const isLinuxDo = url.hostname === linuxDoHost;
  if (!isReservedFixtureHost(url.hostname) && !isLinuxDo) issues.push(`fixture URL host is not allowed: ${url.hostname}`);

  if (isLinuxDo) {
    if (/(?:^|\/)(?:uploads|user_avatar)(?:\/|$)/i.test(url.pathname)) {
      issues.push(`Linux.do fixture URL must not reference live uploads or avatars: ${candidate}`);
    }

    const userMatch = url.pathname.match(/^\/u\/([^/]+)/i);
    let userSegment = '';
    try {
      userSegment = userMatch ? decodeURIComponent(userMatch[1]) : '';
    } catch {
      issues.push(`Linux.do user route contains invalid encoding: ${candidate}`);
    }
    if (userSegment && !/^(?:example|example_|synthetic)/i.test(userSegment)) {
      issues.push(`Linux.do user route must use a synthetic identity: ${candidate}`);
    }

    const numericTokens = `${url.pathname}${url.search}`.match(/\d{3,}/g) || [];
    for (const token of numericTokens) {
      if (!isSyntheticLinuxDoId(token)) issues.push(`Linux.do fixture URL contains a non-synthetic ID: ${token}`);
    }
  }

  for (const key of url.searchParams.keys()) {
    if (/(?:api.?key|auth|clearance|cookie|password|secret|session|token)/i.test(key)) {
      issues.push(`fixture URL contains a sensitive query parameter: ${key}`);
    }
  }
  return issues;
}

function validateFixtureUrl(rawValue, label) {
  for (const issue of inspectFixtureUrl(rawValue)) fail(`${label}: ${issue}`);
}

for (const testCase of [
  { value: 'https://example.invalid/avatar/example.png', valid: true },
  { value: '//example.invalid/avatar/example.png', valid: true },
  { value: 'https://linux.do/t/synthetic-topic/987654320/1', valid: true },
  { value: '#post-23', valid: true },
  { value: 'http://example.invalid/avatar/example.png', valid: false },
  { value: 'https://user:pass@example.invalid/avatar/example.png', valid: false },
  { value: 'https://example.invalid:8443/avatar/example.png', valid: false },
  { value: 'https://not-reserved.test/avatar/example.png', valid: false },
  { value: 'https://linux.do/uploads/default/synthetic.png', valid: false },
  { value: 'https://linux.do/u/not_synthetic', valid: false },
  { value: 'https://linux.do/t/not-synthetic/000000', valid: false },
  { value: 'https://example.invalid/topic?api_key=synthetic-secret', valid: false },
  { value: '/uploads/default/synthetic.png', valid: false }
]) {
  const actual = inspectFixtureUrl(testCase.value).length === 0;
  if (actual !== testCase.valid) fail(`fixture URL policy self-check failed for ${testCase.value}`);
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
const quoteAttributes = extractHtmlUrlAttributes(quoteFixture.post?.cooked || '');
const quoteImageSources = quoteAttributes.filter((item) => item.name === 'src').map((item) => item.value);
if (quoteImageSources.length === 0) fail('quote fixture must contain a synthetic avatar source');
for (const source of quoteImageSources) {
  let avatarUrl;
  try {
    avatarUrl = new URL(source);
  } catch {
    fail(`quote fixture avatar URL is invalid: ${source}`);
    continue;
  }
  if (!isReservedFixtureHost(avatarUrl.hostname)) fail(`quote fixture avatar must use ${reservedFixtureHost}`);
}

const topicFixture = JSON.parse(await readText('fixtures/topic-identity.fixture.json'));
const topicIds = topicFixture.cases.map((item) => item.expectedTopicId).filter(Boolean);
if (!topicIds.includes('987654321')) fail('topic identity fixture must include the synthetic topic ID');

const fixtureFiles = (await readdir(resolve(root, 'fixtures'))).filter((name) => name.endsWith('.json'));
for (const fixtureFile of fixtureFiles) {
  const fixture = JSON.parse(await readText(`fixtures/${fixtureFile}`));
  for (const entry of collectFixtureStrings(fixture)) {
    for (const reference of collectUrlReferences(entry.value)) {
      validateFixtureUrl(reference, `${fixtureFile}:${entry.path}`);
    }
  }
}

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
