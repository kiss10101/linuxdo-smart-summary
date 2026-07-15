#!/usr/bin/env node

import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { Core } from '../src/core/index.js';
import { readProjectSource } from './source-test-helper.mjs';

function assertEqual(actual, expected, label) {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    throw new Error(`${label}\nexpected: ${JSON.stringify(expected)}\nactual:   ${JSON.stringify(actual)}`);
  }
}

function assertContains(text, fragment, label) {
  if (!String(text).includes(fragment)) {
    throw new Error(`${label}: missing ${JSON.stringify(fragment)}`);
  }
}

const fixturePath = process.argv[2] || 'fixtures/summary-selection.fixture.json';
const version = process.argv[3] || '7.7-alpha.9';
const fixture = JSON.parse(await readFile(resolve(process.cwd(), fixturePath), 'utf8'));
const maxChars = fixture.maxChars || 2000;

console.log(`Fixture: ${fixture.name || fixturePath}`);

for (const testCase of fixture.textCases || []) {
  const normalized = Core.normalizeSummarySelectionText(testCase.text, { maxChars });
  const useful = Core.isSummarySelectionTextUseful(testCase.text);
  console.log(`textCase: ${testCase.name} -> ${JSON.stringify({ text: normalized.text, useful, truncated: normalized.truncated })}`);
  if ('expectedText' in testCase) assertEqual(normalized.text, testCase.expectedText, `${testCase.name}: normalized text`);
  if ('expectedUseful' in testCase) assertEqual(useful, testCase.expectedUseful, `${testCase.name}: useful`);
  if ('expectedTruncated' in testCase) assertEqual(normalized.truncated, testCase.expectedTruncated, `${testCase.name}: truncated`);
}

for (const testCase of fixture.promptCases || []) {
  const promptSpec = Core.buildSummarySelectionPrompt(testCase.action, testCase.text);
  console.log(`promptCase: ${testCase.name} -> ${promptSpec.action}/${promptSpec.autoSend ? 'auto' : 'draft'}`);
  if ('expectedAction' in testCase) assertEqual(promptSpec.action, testCase.expectedAction, `${testCase.name}: action`);
  if ('expectedAutoSend' in testCase) assertEqual(promptSpec.autoSend, testCase.expectedAutoSend, `${testCase.name}: autoSend`);
  for (const fragment of testCase.expectedContains || []) {
    assertContains(promptSpec.prompt, fragment, `${testCase.name}: prompt`);
  }
}

const distPath = resolve(process.cwd(), `dist/Linux.do 智能总结-${version}.user.js`);
const distArtifact = await readFile(distPath, 'utf8');
const sourceText = await readProjectSource();
assertContains(distArtifact, `// @version      ${version}`, 'userscript version');

for (const fragment of fixture.distShape?.requiredContains || []) {
  assertContains(sourceText, fragment, `source contains ${fragment}`);
}
for (const pattern of fixture.distShape?.requiredRegex || []) {
  const regex = new RegExp(pattern);
  if (!regex.test(sourceText)) throw new Error(`source regex missing: ${pattern}`);
}

const summaryStateMatch = sourceText.match(/getSummarySelectionState\(\)\s*\{([\s\S]*?)\n\s*}\s*,\n\s*isSummarySelectionRangeAllowed/);
if (!summaryStateMatch) throw new Error('source shape: getSummarySelectionState block not found');
if (summaryStateMatch[1].includes('this.isGenerating')) {
  throw new Error('source shape: getSummarySelectionState should not hide the selected-summary menu while chat/export is generating');
}

const usefulMatch = sourceText.match(/isSummarySelectionTextUseful\([^)]*\)\s*\{([\s\S]*?)\n\s*}\s*,\n\s*buildSummarySelectionPrompt/);
if (!usefulMatch) throw new Error('source shape: isSummarySelectionTextUseful block not found');
if (/>=\s*(4|8|10)\b/.test(usefulMatch[1])) {
  throw new Error('source shape: selected-summary usefulness should not enforce a minimum selected character count');
}
assertContains(usefulMatch[1], 'meaningful.length > 0', 'source usefulness permits short meaningful selections');

const chatRequestMatch = sourceText.match(/async requestAssistantForUser\([^)]*\)\s*\{([\s\S]*?)\n\s*}\s*,\n\s*getMessageCopyText/);
if (!chatRequestMatch) throw new Error('source shape: requestAssistantForUser block not found');
if (!/finally\s*\{[\s\S]*?this\.setLoading\('#btn-send', false\)/.test(chatRequestMatch[1])) {
  throw new Error('source shape: requestAssistantForUser must reset chat loading in finally');
}

console.log('All summary selection cases passed.');
