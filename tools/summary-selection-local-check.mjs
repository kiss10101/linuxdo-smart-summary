#!/usr/bin/env node

import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

function normalizeSummarySelectionText(rawText, options = {}) {
  const maxChars = Math.max(200, Math.min(8000, options.maxChars || 2000));
  const text = String(rawText ?? '').replace(/\s+/g, ' ').trim();
  if (!text) return { text: '', truncated: false, originalLength: 0, maxChars };
  return {
    text: text.length > maxChars ? text.slice(0, maxChars).trim() : text,
    truncated: text.length > maxChars,
    originalLength: text.length,
    maxChars
  };
}

function isSummarySelectionTextUseful(rawText, options = {}) {
  const { text } = normalizeSummarySelectionText(rawText, options);
  if (!text) return false;
  const compact = text.replace(/\s+/g, '');
  const meaningful = compact.replace(/[^0-9A-Za-z\u3400-\u9fff]/g, '');
  return meaningful.length > 0;
}

function buildSummarySelectionPrompt(action, rawText, options = {}) {
  const normalized = normalizeSummarySelectionText(rawText, options);
  const selectedText = normalized.text;
  if (!selectedText) return { prompt: '', autoSend: false, action, truncated: false };
  const quote = `\u300c${selectedText}\u300d`;
  const truncatedNote = normalized.truncated
    ? `\n\n注：原选区较长，已截取前 ${normalized.maxChars} 字。`
    : '';

  if (action === 'explain') {
    return {
      action,
      autoSend: true,
      truncated: normalized.truncated,
      prompt: `请解释下面这段总结内容。要求：\n1. 说明它在原帖讨论中的含义；\n2. 如果涉及人物、楼层、争议点，请结合已有帖子上下文解释；\n3. 不要编造原文没有的信息。\n\n选中文本：\n${quote}${truncatedNote}`
    };
  }

  if (action === 'summarize') {
    return {
      action,
      autoSend: true,
      truncated: normalized.truncated,
      prompt: `请只针对下面这段总结内容做进一步压缩总结。要求：\n1. 提炼核心观点；\n2. 保留关键实体、原因和结论；\n3. 如有不确定处，请说明不确定。\n\n选中文本：\n${quote}${truncatedNote}`
    };
  }

  if (action === 'ask') {
    return {
      action,
      autoSend: false,
      truncated: normalized.truncated,
      prompt: `我想基于下面这段内容继续提问：\n\n${quote}${truncatedNote}\n\n我的问题是：`
    };
  }

  return {
    action: 'insert',
    autoSend: false,
    truncated: normalized.truncated,
    prompt: `选中的总结片段：\n\n${quote}${truncatedNote}\n\n请基于这段内容回答：`
  };
}

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
const version = process.argv[3] || '7.6.1';
const fixture = JSON.parse(await readFile(resolve(process.cwd(), fixturePath), 'utf8'));
const maxChars = fixture.maxChars || 2000;

console.log(`Fixture: ${fixture.name || fixturePath}`);

for (const testCase of fixture.textCases || []) {
  const normalized = normalizeSummarySelectionText(testCase.text, { maxChars });
  const useful = isSummarySelectionTextUseful(testCase.text, { maxChars });
  console.log(`textCase: ${testCase.name} -> ${JSON.stringify({ text: normalized.text, useful, truncated: normalized.truncated })}`);
  if ('expectedText' in testCase) assertEqual(normalized.text, testCase.expectedText, `${testCase.name}: normalized text`);
  if ('expectedUseful' in testCase) assertEqual(useful, testCase.expectedUseful, `${testCase.name}: useful`);
  if ('expectedTruncated' in testCase) assertEqual(normalized.truncated, testCase.expectedTruncated, `${testCase.name}: truncated`);
}

for (const testCase of fixture.promptCases || []) {
  const promptSpec = buildSummarySelectionPrompt(testCase.action, testCase.text, { maxChars });
  console.log(`promptCase: ${testCase.name} -> ${promptSpec.action}/${promptSpec.autoSend ? 'auto' : 'draft'}`);
  if ('expectedAction' in testCase) assertEqual(promptSpec.action, testCase.expectedAction, `${testCase.name}: action`);
  if ('expectedAutoSend' in testCase) assertEqual(promptSpec.autoSend, testCase.expectedAutoSend, `${testCase.name}: autoSend`);
  for (const fragment of testCase.expectedContains || []) {
    assertContains(promptSpec.prompt, fragment, `${testCase.name}: prompt`);
  }
}

const distPath = resolve(process.cwd(), `dist/Linux.do 智能总结-${version}.user.js`);
const distText = await readFile(distPath, 'utf8');

for (const fragment of fixture.distShape?.requiredContains || []) {
  assertContains(distText, fragment, `dist contains ${fragment}`);
}
for (const pattern of fixture.distShape?.requiredRegex || []) {
  const regex = new RegExp(pattern);
  if (!regex.test(distText)) throw new Error(`dist regex missing: ${pattern}`);
}

const summaryStateMatch = distText.match(/getSummarySelectionState\(\)\s*\{([\s\S]*?)\n\s*}\s*,\n\s*isSummarySelectionRangeAllowed/);
if (!summaryStateMatch) throw new Error('dist shape: getSummarySelectionState block not found');
if (summaryStateMatch[1].includes('this.isGenerating')) {
  throw new Error('dist shape: getSummarySelectionState should not hide the selected-summary menu while chat/export is generating');
}

const usefulMatch = distText.match(/isSummarySelectionTextUseful\([^)]*\)\s*\{([\s\S]*?)\n\s*}\s*,\n\s*buildSummarySelectionPrompt/);
if (!usefulMatch) throw new Error('dist shape: isSummarySelectionTextUseful block not found');
if (/>=\s*(4|8|10)\b/.test(usefulMatch[1])) {
  throw new Error('dist shape: selected-summary usefulness should not enforce a minimum selected character count');
}
assertContains(usefulMatch[1], 'meaningful.length > 0', 'dist usefulness permits short meaningful selections');

const chatRequestMatch = distText.match(/async requestAssistantForUser\([^)]*\)\s*\{([\s\S]*?)\n\s*}\s*,\n\s*getMessageCopyText/);
if (!chatRequestMatch) throw new Error('dist shape: requestAssistantForUser block not found');
if (!/finally\s*\{[\s\S]*?this\.setLoading\('#btn-send', false\)/.test(chatRequestMatch[1])) {
  throw new Error('dist shape: requestAssistantForUser must reset chat loading in finally');
}

console.log('All summary selection cases passed.');
