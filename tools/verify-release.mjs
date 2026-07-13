#!/usr/bin/env node

import { readFile, readdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { basename, resolve } from 'node:path';

function normalizeVersion(value, fallback = '7.6.1') {
  return String(value || fallback).trim().replace(/^v/i, '');
}

const version = normalizeVersion(process.argv[2]);
const tag = `v${version}`;
const isPrerelease = version.includes('-');
const repoRoot = process.cwd();
const manifestPath = resolve(repoRoot, 'tools/release-manifest.json');

function fail(message) {
  failures.push(message);
}

async function readText(path) {
  return readFile(resolve(repoRoot, path), 'utf8');
}

function includes(text, needle, label) {
  if (!text.includes(needle)) fail(`${label}: missing ${needle}`);
}

function buildReleaseLine(manifest, targetVersion) {
  const history = [];
  for (const item of [...manifest.releases].reverse()) {
    if (!history.includes(item.version)) history.push(item.version);
  }
  if (!history.includes(targetVersion)) history.push(targetVersion);
  return history.slice(0, history.indexOf(targetVersion) + 1).join(' -> ');
}

const failures = [];
const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
const release = manifest.releases.find((item) => item.version === version);

if (!release) {
  fail(`release-manifest: missing release ${version}`);
} else {
  if (release.tag !== tag) fail(`release-manifest: tag should be ${tag}`);
  if (release.prerelease !== true && isPrerelease) {
    fail('release-manifest: prerelease should be true for alpha/beta/rc versions');
  }
  if (release.prerelease !== false && !isPrerelease) {
    fail('release-manifest: prerelease should be false for stable versions');
  }
}

if (isPrerelease && manifest.preview !== version) fail(`release-manifest: preview should be ${version}`);
if (!isPrerelease && manifest.stable !== version) fail(`release-manifest: stable should be ${version}`);

const localAsset = release?.localAsset || `dist/Linux.do 智能总结-${version}.user.js`;
const uploadAsset = release?.uploadAsset || `linuxdo-smart-summary-${version}.user.js`;

if (!existsSync(resolve(repoRoot, localAsset))) {
  fail(`dist: missing local asset ${localAsset}`);
}

const distFiles = await readdir(resolve(repoRoot, 'dist'));
const expectedAssetName = basename(localAsset);
const versionMatches = distFiles.filter((name) => name === expectedAssetName);
if (versionMatches.length !== 1) {
  fail(`dist: expected exact userscript asset ${expectedAssetName}, got ${JSON.stringify(versionMatches)}`);
}

if (existsSync(resolve(repoRoot, localAsset))) {
  const distText = await readText(localAsset);
  const versionMatch = distText.match(/^\/\/ @version\s+(.+)$/m);
  if (!versionMatch) {
    fail('dist: missing userscript @version header');
  } else if (versionMatch[1].trim() !== version) {
    fail(`dist: @version is ${versionMatch[1].trim()}, expected ${version}`);
  }
  includes(distText, `* ${version}:`, 'dist update summary');
}

const changelog = await readText('CHANGELOG.md');
const firstHeading = changelog.match(/^##\s+(.+)$/m)?.[1]?.trim();
if (firstHeading !== version) fail(`CHANGELOG.md: first heading should be ${version}, got ${firstHeading || 'none'}`);

for (const readmePath of ['README.md', 'README.zh-CN.md']) {
  const readme = await readText(readmePath);
  const channelLabel = isPrerelease ? 'preview' : 'stable';
  const releaseLine = buildReleaseLine(manifest, version);
  includes(readme, `/releases/download/${tag}/${uploadAsset}`, `${readmePath} ${channelLabel} link`);
  includes(readme, `${channelLabel}-${version.replace(/-/g, '--')}`, `${readmePath} ${channelLabel} badge`);
  includes(readme, `\`${version}\``, `${readmePath} ${channelLabel} version token`);
  includes(readme, releaseLine, `${readmePath} release line`);
  includes(readme, `"dist/Linux.do 智能总结-${version}.user.js"`, `${readmePath} syntax check command`);
  includes(readme, 'node tools/check-all.mjs', `${readmePath} check-all command`);
  includes(readme, `node tools/verify-release.mjs ${version}`, `${readmePath} verify-release command`);
}

const releaseScript = await readText('tools/create-github-releases.ps1');
includes(releaseScript, `[string]$Version = "${version}"`, 'release script default version');
includes(releaseScript, `Tag          = "${tag}"`, 'release script tag');
includes(releaseScript, `Name         = "${tag}"`, 'release script name');
includes(releaseScript, `AssetPattern = "*${version}.user.js"`, 'release script asset pattern');
includes(releaseScript, `AssetName    = "${uploadAsset}"`, 'release script asset name');
includes(releaseScript, `Prerelease   = $${isPrerelease ? 'true' : 'false'}`, 'release script prerelease');

const workflow = await readText('.github/workflows/release.yml');
includes(workflow, 'tags:\n      - "v*"', 'release workflow tag trigger');
includes(workflow, 'workflow_dispatch:', 'release workflow manual trigger');
includes(workflow, 'permissions:\n  contents: read', 'release workflow default read permission');
includes(workflow, '    permissions:\n      contents: write', 'release job write permission');
includes(workflow, 'actions/checkout@df4cb1c069e1874edd31b4311f1884172cec0e10', 'pinned checkout action');
includes(workflow, 'actions/setup-node@48b55a011bda9f5d6aeb4c2d9c7362e8dae4041e', 'pinned setup-node action');
includes(workflow, 'INPUT_VERSION: ${{ github.event.inputs.version }}', 'workflow dispatch input environment');
if (workflow.includes('raw_version="${{ github.event.inputs.version }}"')) {
  fail('release workflow: dispatch input must not be interpolated directly into shell source');
}
if (/branches:\s*\n\s*-\s*master/.test(workflow)) {
  fail('release workflow: master branch push should not publish releases');
}

if (failures.length > 0) {
  console.log(`Release verification failed for ${version}:`);
  for (const item of failures) console.log(`- ${item}`);
  process.exitCode = 1;
} else {
  console.log(`Release verification passed for ${version}.`);
}
