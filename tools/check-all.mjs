#!/usr/bin/env node

import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

const packageJson = JSON.parse(readFileSync('package.json', 'utf8'));

function normalizeVersion(value, fallback = packageJson.version) {
  return String(value || fallback).trim().replace(/^v/i, '');
}

const version = normalizeVersion(process.argv[2]);
const manifest = JSON.parse(readFileSync('tools/release-manifest.json', 'utf8'));
const release = manifest.releases.find((item) => item.version === version);
const userscriptVersions = [...new Set([manifest.stable, version].filter(Boolean))];
const currentFeatureChecks = release?.validationProfile === 'current' || version === packageJson.version
  ? [
      ['tools/ai-upstream-errors-local-check.mjs', version],
      ['tools/reasoning-output-local-check.mjs', 'fixtures/reasoning-output.fixture.json', version],
      ['tools/ai-control-source-sync-local-check.mjs', version],
      ['tools/range-refresh-local-check.mjs', version],
      ['tools/runtime-performance-local-check.mjs', version]
    ]
  : [];

const commands = [
  ...userscriptVersions.map((item) => ['--check', `dist/Linux.do 智能总结-${item}.user.js`]),
  ['--check', 'tools/range-mapping-local-check.mjs'],
  ['--check', 'tools/reply-relation-local-check.mjs'],
  ['--check', 'tools/fetch-posts-batch-local-check.mjs'],
  ['--check', 'tools/summary-content-cache-local-check.mjs'],
  ['--check', 'tools/chat-message-actions-local-check.mjs'],
  ['--check', 'tools/userscript-core-test-helper.mjs'],
  ['--check', 'tools/reasoning-output-local-check.mjs'],
  ['--check', 'tools/ai-upstream-errors-local-check.mjs'],
  ['--check', 'tools/ai-control-source-sync-local-check.mjs'],
  ['--check', 'tools/api-profiles-local-check.mjs'],
  ['--check', 'tools/range-refresh-local-check.mjs'],
  ['--check', 'tools/summary-selection-local-check.mjs'],
  ['--check', 'tools/runtime-performance-local-check.mjs'],
  ['--check', 'tools/html-to-text-local-check.mjs'],
  ['--check', 'tools/post-timestamps-local-check.mjs'],
  ['--check', 'tools/quote-attribution-local-check.mjs'],
  ['--check', 'tools/boosts-local-check.mjs'],
  ['--check', 'tools/topic-identity-local-check.mjs'],
  ['--check', 'tools/topic-bounds-local-check.mjs'],
  ['--check', 'tools/prepare-github-release.mjs'],
  ['--check', 'tools/verify-release.mjs'],
  ['--check', 'tools/check-all.mjs'],
  ['--check', 'tools/public-repository-local-check.mjs'],
  ['--check', 'tools/source-architecture-local-check.mjs'],
  ['--check', 'tools/source-test-helper.mjs'],
  ['--check', 'tools/migrate-userscript-source.mjs'],
  ['--check', 'tools/build-userscript.mjs'],
  ['--check', 'tools/verify-generated-dist.mjs'],
  ['--check', 'tools/bundle-runtime-smoke-local-check.mjs'],
  ['tools/range-mapping-local-check.mjs', 'fixtures/post-stream-gap.fixture.json'],
  ['tools/reply-relation-local-check.mjs', 'fixtures/reply-relation.fixture.json'],
  ['tools/fetch-posts-batch-local-check.mjs', 'fixtures/fetch-posts-batch.fixture.json'],
  ['tools/summary-content-cache-local-check.mjs', 'fixtures/summary-content-cache.fixture.json'],
  ['tools/chat-message-actions-local-check.mjs', 'fixtures/chat-message-actions.fixture.json', version],
  ['tools/api-profiles-local-check.mjs', version],
  ['tools/summary-selection-local-check.mjs', 'fixtures/summary-selection.fixture.json', version],
  ['tools/html-to-text-local-check.mjs', 'fixtures/html-to-text.fixture.json', version],
  ['tools/post-timestamps-local-check.mjs', 'fixtures/post-timestamps.fixture.json', version],
  ...currentFeatureChecks,
  ['tools/quote-attribution-local-check.mjs', 'fixtures/quote-attribution.fixture.json'],
  ['tools/boosts-local-check.mjs', 'fixtures/boosts.fixture.json'],
  ['tools/topic-identity-local-check.mjs', 'fixtures/topic-identity.fixture.json'],
  ['tools/topic-bounds-local-check.mjs', 'fixtures/topic-bounds.fixture.json'],
  ['tools/public-repository-local-check.mjs', version],
  ...(version === packageJson.version
    ? [
        ['tools/source-architecture-local-check.mjs', version],
        ['tools/verify-generated-dist.mjs'],
        ['tools/bundle-runtime-smoke-local-check.mjs', version]
      ]
    : []),
  ['tools/verify-release.mjs', version]
];

let failed = 0;

for (const args of commands) {
  console.log(`\n> node ${args.map((arg) => JSON.stringify(arg)).join(' ')}`);
  const result = spawnSync(process.execPath, args, {
    stdio: 'inherit',
    shell: false
  });
  if (result.status !== 0) {
    failed += 1;
    console.log(`Command failed with exit code ${result.status ?? 'unknown'}.`);
  }
}

if (failed > 0) {
  console.log(`\n${failed} check(s) failed.`);
  process.exitCode = 1;
} else {
  console.log('\nAll local checks passed.');
}
