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
  if ('expectedPrompt' in testCase) assertEqual(promptSpec.prompt, testCase.expectedPrompt, `${testCase.name}: exact prompt`);
  if ('expectedReason' in testCase) assertEqual(promptSpec.reason, testCase.expectedReason, `${testCase.name}: reason`);
  for (const fragment of testCase.expectedContains || []) {
    assertContains(promptSpec.prompt, fragment, `${testCase.name}: prompt`);
  }
}

const sourceText = await readProjectSource();

const selectionMenuMatch = sourceText.match(/getSummarySelectionMenuHtml\(\)\s*\{([\s\S]*?)\n\s*}\s*,/);
if (!selectionMenuMatch) throw new Error('source shape: getSummarySelectionMenuHtml block not found');
for (const fragment of ['role="toolbar"', '>解释<', '>精简<', '>引用到对话<']) {
  assertContains(selectionMenuMatch[1], fragment, `selection toolbar contains ${fragment}`);
}
for (const legacyAction of ['data-summary-selection-action="ask"', 'data-summary-selection-action="summarize"', 'data-summary-selection-action="insert"']) {
  if (selectionMenuMatch[1].includes(legacyAction)) throw new Error(`selection toolbar still exposes legacy action ${legacyAction}`);
}
const actionIndices = [
  'data-summary-selection-action="explain"',
  'data-summary-selection-action="simplify"',
  'data-summary-selection-action="quote"'
].map(fragment => selectionMenuMatch[1].indexOf(fragment));
if (actionIndices.some(index => index < 0) || actionIndices.some((index, position) => position > 0 && index <= actionIndices[position - 1])) {
  throw new Error(`selection toolbar action order mismatch: ${JSON.stringify(actionIndices)}`);
}

for (const fragment of fixture.distShape?.requiredContains || []) {
  assertContains(sourceText, fragment, `source contains ${fragment}`);
}
for (const pattern of fixture.distShape?.requiredRegex || []) {
  const regex = new RegExp(pattern);
  if (!regex.test(sourceText)) throw new Error(`source regex missing: ${pattern}`);
}

const contentSelectionStateMatch = sourceText.match(/getContentSelectionState\(\)\s*\{([\s\S]*?)\n\s*}\s*,\n\s*getSummarySelectionState/);
if (!contentSelectionStateMatch) throw new Error('source shape: getContentSelectionState block not found');
if (contentSelectionStateMatch[1].includes('this.isGenerating')) {
  throw new Error('source shape: getContentSelectionState should not hide the shared selection menu while chat/export is generating');
}

const usefulMatch = sourceText.match(/isSelectionTextUseful\([^)]*\)\s*\{([\s\S]*?)\n\s*}\s*,\n\s*normalizeSelectionSourceKind/);
if (!usefulMatch) throw new Error('source shape: isSelectionTextUseful block not found');
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
