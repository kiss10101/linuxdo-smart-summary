#!/usr/bin/env node

import { readFile, readdir, stat } from 'node:fs/promises';
import { resolve, relative } from 'node:path';

const repoRoot = process.cwd();
const packageJson = JSON.parse(await readFile(resolve(repoRoot, 'package.json'), 'utf8'));
const version = String(process.argv[2] || packageJson.version).replace(/^v/i, '');
const failures = [];

async function collectJavaScriptFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(entries.map(async (entry) => {
    const path = resolve(directory, entry.name);
    if (entry.isDirectory()) return collectJavaScriptFiles(path);
    return entry.name.endsWith('.js') ? [path] : [];
  }));
  return nested.flat();
}

function fail(message) {
  failures.push(message);
}

if (version !== packageJson.version) {
  fail(`package.json version is ${packageJson.version}, expected ${version}`);
}

const requiredFiles = [
  'src/index.js',
  'src/app/bootstrap.js',
  'src/core/index.js',
  'src/core/ai/client.js',
  'src/core/ai/output.js',
  'src/core/discourse/post-fetcher.js',
  'src/ui/ui-manager.js',
  'src/ui/style1/index.js',
  'src/ui/style1/lifecycle.js',
  'src/ui/style1/helpers.js',
  'src/metadata/userscript-header.txt'
];

for (const path of requiredFiles) {
  try {
    await stat(resolve(repoRoot, path));
  } catch {
    fail(`missing source boundary: ${path}`);
  }
}

const sourceFiles = await collectJavaScriptFiles(resolve(repoRoot, 'src'));
if (sourceFiles.length < 20) {
  fail(`expected at least 20 source modules, found ${sourceFiles.length}`);
}

for (const path of sourceFiles) {
  const source = await readFile(path, 'utf8');
  const displayPath = relative(repoRoot, path).replaceAll('\\', '/');
  if (/from\s+['"][^'"]*dist\//.test(source)) {
    fail(`${displayPath} imports generated dist output`);
  }
  if (Buffer.byteLength(source, 'utf8') > 120_000) {
    fail(`${displayPath} exceeds the 120 KB module boundary`);
  }
}

const entrySource = await readFile(resolve(repoRoot, 'src/index.js'), 'utf8');
if (!entrySource.includes("import './ui/style1/index.js'")) fail('entry point does not register style1');
if (!entrySource.includes("import './ui/style2.js'")) fail('entry point does not register style2');
if (!entrySource.includes("from './app/bootstrap.js'")) fail('entry point does not install app bootstrap');

const coreIndex = await readFile(resolve(repoRoot, 'src/core/index.js'), 'utf8');
if (!coreIndex.includes('export const Core = Object.assign(')) fail('Core composition root is missing');

const styleIndex = await readFile(resolve(repoRoot, 'src/ui/style1/index.js'), 'utf8');
for (const capability of ['style1Lifecycle', 'style1Presentation', 'style1Events', 'style1State', 'style1Interactions', 'style1Helpers']) {
  if (!styleIndex.includes(capability)) fail(`style1 composition is missing ${capability}`);
}

const metadata = await readFile(resolve(repoRoot, 'src/metadata/userscript-header.txt'), 'utf8');
if (!metadata.includes('// @version      __VERSION__')) fail('metadata version placeholder is missing');

const distPath = resolve(repoRoot, `dist/Linux.do 智能总结-${version}.user.js`);
let distText = '';
try {
  distText = await readFile(distPath, 'utf8');
} catch {
  fail(`generated userscript is missing: ${relative(repoRoot, distPath)}`);
}

if (distText) {
  if (!distText.includes(`// @version      ${version}`)) fail('generated userscript version does not match package.json');
  if (!distText.includes('// Generated from src/ by tools/build-userscript.mjs. Do not edit dist directly.')) {
    fail('generated userscript notice is missing');
  }
  if (/^\s*(?:import|export)\s/m.test(distText)) fail('generated userscript still contains ESM syntax');
}

if (failures.length > 0) {
  console.log(`Source architecture check failed for ${version}:`);
  for (const failure of failures) console.log(`- ${failure}`);
  process.exitCode = 1;
} else {
  console.log(`Source architecture check passed for ${version} (${sourceFiles.length} modules).`);
}
