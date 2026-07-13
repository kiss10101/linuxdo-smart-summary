#!/usr/bin/env node

import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

function parseTopicIdentity(input) {
  const raw = String(input || '');
  let pathname = raw;
  try {
    pathname = new URL(raw, 'https://linux.do').pathname;
  } catch {
    pathname = raw.split(/[?#]/)[0];
  }

  const patterns = [
    { name: 'topic-json', re: /^\/t\/-\/(\d+)(?:\.json)?\/?$/ },
    { name: 'topic-slug', re: /^\/t\/(?:[^/]+\/)?(\d+)(?:\/\d+)?\/?$/ },
    { name: 'topic-legacy', re: /^\/topic\/(\d+)\/?$/ }
  ];

  for (const pattern of patterns) {
    const match = pathname.match(pattern.re);
    if (match?.[1]) {
      return {
        topicId: match[1],
        route: pattern.name,
        pathname
      };
    }
  }

  return null;
}

const fixturePath = process.argv[2] || 'fixtures/topic-identity.fixture.json';
const absoluteFixturePath = resolve(process.cwd(), fixturePath);
const fixture = JSON.parse(await readFile(absoluteFixturePath, 'utf8'));

let failed = 0;
console.log(`Fixture: ${fixture.name || fixturePath}`);

for (const testCase of fixture.cases) {
  const result = parseTopicIdentity(testCase.url);
  const topicId = result?.topicId || null;
  const route = result?.route || null;
  const expectedRoute = testCase.expectedRoute || null;
  const ok = topicId === testCase.expectedTopicId && route === expectedRoute;
  console.log(`${testCase.url}`);
  console.log(`  parsed:   ${JSON.stringify({ topicId, route })}`);
  console.log(`  expected: ${JSON.stringify({ topicId: testCase.expectedTopicId, route: expectedRoute })}`);
  console.log(`  result:   ${ok ? 'PASS' : 'FAIL'}`);
  if (!ok) failed += 1;
}

if (failed > 0) {
  process.exitCode = 1;
} else {
  console.log('All topic identity cases passed.');
}
