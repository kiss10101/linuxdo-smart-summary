#!/usr/bin/env node

import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const packageJsonPath = resolve(repoRoot, 'package.json');
const metadataPath = resolve(repoRoot, 'src/metadata/userscript-header.txt');

function normalizeText(value) {
  return String(value || '').replace(/\r\n?/g, '\n').trimEnd();
}

export async function getBuildMetadata() {
  const packageJson = JSON.parse(await readFile(packageJsonPath, 'utf8'));
  const version = String(packageJson.version || '').trim();
  if (!/^\d+\.\d+\.\d+(?:-[0-9A-Za-z]+(?:\.[0-9A-Za-z]+)*)?$/.test(version)) {
    throw new Error(`package.json contains an invalid release version: ${version || '(empty)'}`);
  }
  return {
    version,
    outputPath: resolve(repoRoot, `dist/Linux.do 智能总结-${version}.user.js`)
  };
}

export async function renderUserscript() {
  const { version } = await getBuildMetadata();
  const metadataTemplate = normalizeText(await readFile(metadataPath, 'utf8'));
  const metadata = metadataTemplate.replaceAll('__VERSION__', version);
  if (!metadata.startsWith('// ==UserScript==')) {
    throw new Error('userscript metadata must start on the first line');
  }
  if (!metadata.includes(`// @version      ${version}`)) {
    throw new Error('userscript metadata version placeholder is missing');
  }

  const result = await build({
    absWorkingDir: repoRoot,
    entryPoints: ['src/index.js'],
    bundle: true,
    write: false,
    format: 'iife',
    platform: 'browser',
    target: ['es2022'],
    charset: 'utf8',
    legalComments: 'inline',
    minify: false,
    sourcemap: false,
    treeShaking: true,
    logLevel: 'silent'
  });
  if (result.outputFiles.length !== 1) {
    throw new Error(`expected one userscript bundle, received ${result.outputFiles.length}`);
  }

  const body = normalizeText(result.outputFiles[0].text);
  const content = `${metadata}\n\n${body}\n`;
  return {
    version,
    content,
    sha256: createHash('sha256').update(content, 'utf8').digest('hex').toUpperCase()
  };
}

export async function writeUserscript() {
  const buildMetadata = await getBuildMetadata();
  const rendered = await renderUserscript();
  await mkdir(dirname(buildMetadata.outputPath), { recursive: true });
  await writeFile(buildMetadata.outputPath, rendered.content, 'utf8');
  console.log(`Built ${buildMetadata.outputPath}`);
  console.log(`SHA-256 ${rendered.sha256}`);
  return { ...rendered, outputPath: buildMetadata.outputPath };
}

const invokedPath = process.argv[1] ? resolve(process.argv[1]) : '';
if (invokedPath === fileURLToPath(import.meta.url)) {
  await writeUserscript();
}
