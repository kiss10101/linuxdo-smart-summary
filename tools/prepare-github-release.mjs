#!/usr/bin/env node

import { copyFile, mkdir, readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { basename, dirname, resolve } from 'node:path';

const versionInput = process.argv[2] || '';
const githubOutputPath = process.argv[3] || process.env.GITHUB_OUTPUT || '';
const repoRoot = process.cwd();
const version = versionInput.replace(/^v/i, '').trim();

function fail(message) {
  console.error(message);
  process.exit(1);
}

function outputValue(name, value) {
  const text = String(value ?? '');
  return `${name}<<__release_${name}__\n${text}\n__release_${name}__\n`;
}

function extractChangelogSection(changelog, targetVersion) {
  const lines = String(changelog || '').split(/\r?\n/);
  const heading = `## ${targetVersion}`;
  const start = lines.findIndex((line) => line.trim() === heading);
  if (start === -1) return '';

  const body = [];
  for (let i = start + 1; i < lines.length; i += 1) {
    if (/^##\s+/.test(lines[i])) break;
    body.push(lines[i]);
  }
  return body.join('\n').trim();
}

if (!version) fail('Usage: node tools/prepare-github-release.mjs <version> [github-output-path]');

const manifest = JSON.parse(await readFile(resolve(repoRoot, 'tools/release-manifest.json'), 'utf8'));
const release = manifest.releases.find((item) => item.version === version);
if (!release) fail(`release-manifest: missing release ${version}`);

const localAsset = resolve(repoRoot, release.localAsset);
if (!existsSync(localAsset)) fail(`release asset not found: ${release.localAsset}`);

const uploadName = release.uploadAsset || `linuxdo-smart-summary-${version}.user.js`;
const uploadPath = resolve(repoRoot, 'reports', 'release-assets', uploadName);
const notesPath = resolve(repoRoot, 'reports', `release-notes-${version}.md`);
const changelog = await readFile(resolve(repoRoot, 'CHANGELOG.md'), 'utf8');
const changelogBody = extractChangelogSection(changelog, version);
const notes = [
  `## ${release.tag || `v${version}`}`,
  '',
  changelogBody || `Release ${version}.`,
  '',
  `Asset: \`${uploadName}\``
].join('\n');

await mkdir(dirname(uploadPath), { recursive: true });
await copyFile(localAsset, uploadPath);
await writeFile(notesPath, notes, 'utf8');

const outputs = {
  version,
  tag: release.tag || `v${version}`,
  local_asset: release.localAsset,
  upload_asset: uploadName,
  upload_path: uploadPath.replace(/\\/g, '/'),
  notes_path: notesPath.replace(/\\/g, '/'),
  prerelease: release.prerelease === true ? 'true' : 'false'
};

const outputText = Object.entries(outputs)
  .map(([name, value]) => outputValue(name, value))
  .join('');

if (githubOutputPath) {
  await writeFile(githubOutputPath, outputText, { encoding: 'utf8', flag: 'a' });
} else {
  process.stdout.write(JSON.stringify(outputs, null, 2));
  process.stdout.write('\n');
}

console.error(`Prepared GitHub release ${outputs.tag}: ${basename(uploadPath)}`);
