import { readFile, readdir } from 'node:fs/promises';
import { resolve } from 'node:path';

async function collectFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(entries.map(async (entry) => {
    const path = resolve(directory, entry.name);
    if (entry.isDirectory()) return collectFiles(path);
    return /\.(?:js|txt)$/.test(entry.name) ? [path] : [];
  }));
  return nested.flat();
}

export async function readProjectSource(repoRoot = process.cwd()) {
  const files = (await collectFiles(resolve(repoRoot, 'src'))).sort((left, right) => left.localeCompare(right));
  const contents = await Promise.all(files.map((path) => readFile(path, 'utf8')));
  return contents.join('\n');
}

export function normalizeCodeWhitespace(value) {
  return String(value || '').replace(/\s+/g, ' ').trim();
}
