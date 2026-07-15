#!/usr/bin/env node

import { readFile } from 'node:fs/promises';
import { getBuildMetadata, renderUserscript } from './build-userscript.mjs';

const buildMetadata = await getBuildMetadata();
const first = await renderUserscript();
const second = await renderUserscript();

if (first.content !== second.content || first.sha256 !== second.sha256) {
  throw new Error('userscript build is not deterministic across consecutive renders');
}

let committed;
try {
  committed = await readFile(buildMetadata.outputPath, 'utf8');
} catch (error) {
  if (error?.code === 'ENOENT') {
    throw new Error(`generated userscript is missing: ${buildMetadata.outputPath}`);
  }
  throw error;
}

if (committed.replace(/\r\n?/g, '\n') !== first.content) {
  throw new Error('generated userscript is stale; run npm run build and commit the matching dist file');
}

console.log(`Generated userscript is deterministic and current for ${first.version}.`);
console.log(`SHA-256 ${first.sha256}`);
