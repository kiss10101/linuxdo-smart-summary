#!/usr/bin/env node

import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import {
  createJsonResponse,
  createStreamingResponse,
  loadSourceCore,
  splitUtf8ByPattern
} from './userscript-core-test-helper.mjs';
import { readProjectSource } from './source-test-helper.mjs';

function normalizeVersion(value, fallback = '7.7-alpha.9') {
  return String(value || fallback).trim().replace(/^v/i, '');
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

function assertNotContains(text, fragment, label) {
  if (String(text).includes(fragment)) {
    throw new Error(`${label}: unexpected ${JSON.stringify(fragment)}`);
  }
}

function configureProvider(Core) {
  Core.getActiveApiProfile = () => ({
    id: 'fixture-profile',
    name: 'Fixture Provider',
    apiKey: 'fixture-secret',
    apiUrl: 'https://provider.example/v1/chat/completions',
    model: 'fixture-model'
  });
  Core.getActiveApiProfileSnapshot = (profile) => ({
    id: profile.id,
    name: profile.name,
    apiUrl: profile.apiUrl,
    model: profile.model
  });
}

function createSsePayload(frames) {
  const records = frames.map((frame) => `data: ${JSON.stringify(frame)}\n\n`);
  records.push('data: [DONE]\n\n');
  return records.join('');
}

async function collectProviderOutput(Core, context, response, useStream) {
  configureProvider(Core);
  context.GM_getValue = (key, fallback) => key === 'useStream' ? useStream : fallback;
  context.fetch = async () => response;

  const events = [];
  let doneMeta = null;
  let failure = null;
  await Core.streamChat(
    [{ role: 'user', content: 'fixture prompt' }],
    (event) => events.push(JSON.parse(JSON.stringify(event))),
    (meta) => { doneMeta = JSON.parse(JSON.stringify(meta)); },
    (error) => { failure = error; },
    { operation: 'chat' }
  );
  if (failure) throw new Error(`streamChat failed: ${JSON.stringify(failure)}`);
  if (!doneMeta) throw new Error('streamChat did not invoke onDone');

  const output = Core.createAiOutputState();
  events.forEach((event) => Core.applyAiOutputEvent(output, event));
  Core.finishAiOutputState(output, doneMeta);
  return { events, output, doneMeta };
}

const fixturePath = process.argv[2] || 'fixtures/reasoning-output.fixture.json';
const version = normalizeVersion(process.argv[3]);
const repoRoot = process.cwd();
const fixture = JSON.parse(await readFile(resolve(repoRoot, fixturePath), 'utf8'));
const distPath = resolve(repoRoot, `dist/Linux.do 智能总结-${version}.user.js`);
const distText = await readFile(distPath, 'utf8');
const sourceText = await readProjectSource(repoRoot);
const { Core, context } = loadSourceCore();

assertContains(distText, `// @version      ${version}`, 'userscript version');

for (const testCase of fixture.streamCases || []) {
  const sse = createSsePayload(testCase.frames || []);
  const chunks = splitUtf8ByPattern(sse, testCase.byteCuts);
  const { events, output } = await collectProviderOutput(
    Core,
    context,
    createStreamingResponse(chunks),
    true
  );

  if (testCase.expectedEvents) {
    assertEqual(events, testCase.expectedEvents, `${testCase.name}: normalized events`);
  }
  assertEqual(output.reasoningText, testCase.expectedReasoning, `${testCase.name}: reasoning`);
  assertEqual(output.contentText, testCase.expectedContent, `${testCase.name}: content`);
  assertEqual(output.phase, testCase.expectedPhase, `${testCase.name}: phase`);
  console.log(`stream: ${testCase.name} -> ${events.length} event(s), ${chunks.length} byte chunk(s)`);
}

for (const testCase of fixture.nonStreamCases || []) {
  const { events, output } = await collectProviderOutput(
    Core,
    context,
    createJsonResponse(testCase.payload),
    false
  );
  assertEqual(output.reasoningText, testCase.expectedReasoning, `${testCase.name}: reasoning`);
  assertEqual(output.contentText, testCase.expectedContent, `${testCase.name}: content`);
  if (events.some((event) => event.text === '[object Object]')) {
    throw new Error(`${testCase.name}: object value was coerced into display text`);
  }
  console.log(`non-stream: ${testCase.name} -> ${events.length} event(s)`);
}

for (const testCase of fixture.fallbackCases || []) {
  const parsed = Core.parseThinkingContent(testCase.raw);
  assertEqual(parsed.thinking, testCase.expectedReasoning, `${testCase.name}: reasoning`);
  assertEqual(parsed.content, testCase.expectedContent, `${testCase.name}: content`);
  console.log(`fallback: ${testCase.name}`);
}

for (const testCase of fixture.finishCases || []) {
  const output = Core.createAiOutputState({
    reasoningText: testCase.reasoning || '',
    contentText: testCase.content || ''
  });
  Core.finishAiOutputState(output, { finishReason: testCase.finishReason });
  const classified = Core.classifyAiOutput(output, { finishReason: testCase.finishReason });
  assertEqual(classified.kind, testCase.expectedKind, `${testCase.finishReason}: classification`);
  assertEqual(classified.partial, testCase.expectedPartial, `${testCase.finishReason}: partial`);
  if (testCase.content) assertEqual(classified.content, testCase.content, `${testCase.finishReason}: preserved content`);
  console.log(`finish: ${testCase.finishReason} -> ${classified.kind}`);
}

for (const fragment of fixture.uiShape?.requiredContains || []) {
  assertContains(sourceText, fragment, `UI/security source shape ${fragment}`);
}
for (const fragment of fixture.uiShape?.forbiddenContains || []) {
  assertNotContains(sourceText, fragment, `UI/security source shape ${fragment}`);
}

const streamingPreview = Core.renderReasoningPreview('<img src="https://tracker.example/pixel">\n<script>alert(1)</script>');
assertContains(streamingPreview, '&lt;img', 'streaming reasoning escapes HTML');
assertContains(streamingPreview, '&lt;script&gt;', 'streaming reasoning escapes scripts');
assertNotContains(streamingPreview, '<img ', 'streaming reasoning does not create image elements');

const sanitizerCalls = [];
context.marked = {
  parse(text) {
    return `<p>${text}</p><img src="https://tracker.example/pixel"><iframe src="https://tracker.example/frame"></iframe>`;
  }
};
context.DOMPurify = {
  sanitize(html, options = {}) {
    sanitizerCalls.push(options);
    const forbidden = new Set(options.FORBID_TAGS || []);
    let result = String(html);
    if (forbidden.has('img')) result = result.replace(/<img\b[^>]*>/gi, '');
    if (forbidden.has('iframe')) result = result.replace(/<iframe\b[^>]*>[\s\S]*?<\/iframe>/gi, '');
    return result;
  }
};
const sanitizedReasoning = Core.renderReasoningMarkdown('provider reasoning');
assertNotContains(sanitizedReasoning, 'tracker.example', 'final reasoning blocks remote media');
const strictOptions = sanitizerCalls.find((options) => Array.isArray(options.FORBID_TAGS));
if (!strictOptions) throw new Error('final reasoning did not use strict sanitizer options');
for (const tag of ['img', 'iframe', 'form', 'input']) {
  if (!strictOptions.FORBID_TAGS.includes(tag)) throw new Error(`reasoning sanitizer must forbid ${tag}`);
}
for (const attr of ['src', 'srcset', 'poster', 'srcdoc']) {
  if (!strictOptions.FORBID_ATTR.includes(attr)) throw new Error(`reasoning sanitizer must forbid ${attr}`);
}

const reasoningOnly = Core.createAiOutputState({ reasoningText: '逐步检查', phase: 'reasoning' });
const autoExpandedHtml = Core.renderAiOutputHtml(reasoningOnly, {
  isStreaming: true,
  panelId: 'fixture'
});
assertContains(autoExpandedHtml, '<button type="button" class="thinking-header"', 'reasoning control is a button');
assertContains(autoExpandedHtml, 'aria-expanded="true"', 'reasoning auto-expands while reasoning');
assertContains(autoExpandedHtml, 'aria-controls="reasoning-panel-fixture"', 'reasoning control has aria-controls');
assertContains(autoExpandedHtml, 'aria-hidden="false"', 'expanded reasoning stays in the accessibility tree');
assertContains(autoExpandedHtml, '服务返回的推理内容', 'reasoning is described as provider output');

Core.applyAiOutputEvent(reasoningOnly, { type: 'content_delta', text: '最终回答', source: 'stream' });
const autoCollapsedHtml = Core.renderAiOutputHtml(reasoningOnly, { panelId: 'fixture' });
assertContains(autoCollapsedHtml, 'aria-expanded="false"', 'reasoning auto-collapses after answer starts');
assertContains(autoCollapsedHtml, 'aria-hidden="true" hidden', 'collapsed reasoning leaves the accessibility tree');
const userExpandedHtml = Core.renderAiOutputHtml(reasoningOnly, {
  expansion: 'user-expanded',
  panelId: 'fixture'
});
assertContains(userExpandedHtml, 'aria-expanded="true"', 'explicit expansion survives answer rendering');

const partialOutput = Core.createAiOutputState({
  reasoningText: '已有推理',
  contentText: '已有正文',
  phase: 'partial',
  partial: true
});
assertContains(Core.renderAiOutputHtml(partialOutput), '已保留服务商返回的部分内容', 'partial UI warning');
const partialAnswerOnly = Core.createAiOutputState({
  contentText: '只有截断后的正文',
  phase: 'partial',
  partial: true
});
assertContains(Core.renderAiOutputHtml(partialAnswerOnly), '已保留服务商返回的部分内容', 'answer-only partial UI warning');

const apiMessage = Core.toOpenAiMessage({
  role: 'assistant',
  content: '仅发送最终回答',
  outputState: Core.createAiOutputState({
    reasoningText: '不得进入后续上下文',
    contentText: '仅发送最终回答'
  })
});
assertEqual(apiMessage, { role: 'assistant', content: '仅发送最终回答' }, 'reasoning excluded from API context');

console.log(`Reasoning output check passed for ${version}.`);
