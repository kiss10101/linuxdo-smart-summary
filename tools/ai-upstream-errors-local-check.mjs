#!/usr/bin/env node

import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

function normalizeVersion(value, fallback = '7.6.1') {
  return String(value || fallback).trim().replace(/^v/i, '');
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

function assertMatch(text, regex, label) {
  if (!regex.test(text)) {
    throw new Error(`${label}: pattern not found: ${regex}`);
  }
}

function assertCountAtLeast(text, fragment, minimum, label) {
  const count = String(text).split(fragment).length - 1;
  if (count < minimum) {
    throw new Error(`${label}: expected at least ${minimum}, found ${count}`);
  }
}

function getBlock(text, startPattern, endPattern, label) {
  const start = text.search(startPattern);
  if (start < 0) throw new Error(`${label}: start not found`);
  const rest = text.slice(start);
  const end = rest.search(endPattern);
  if (end < 0) throw new Error(`${label}: end not found`);
  return rest.slice(0, end);
}

const version = normalizeVersion(process.argv[2]);
const distPath = resolve(process.cwd(), `dist/Linux.do 智能总结-${version}.user.js`);
const distText = await readFile(distPath, 'utf8');

assertContains(distText, `// @version      ${version}`, 'userscript version');
assertContains(distText, '7.7-alpha.2: AI 和模型列表请求失败时展示上游 HTTP 状态', 'upstream error update summary');

for (const helper of [
  'sanitizeErrorText(value, maxChars = 500)',
  'parseUpstreamErrorBody(bodyText)',
  'classifyHttpFailure(status, upstreamCode = \'\', upstreamType = \'\')',
  'createAiFailure(options = {})',
  'createHttpFailure(resp, bodyText, options = {})',
  'createSseFailure(payload, options = {})',
  'createModelOutputFailure(classified, options = {})',
  'formatAiFailureForUi(error, defaults = {})',
  'renderAiFailureBlock(error, defaults = {})'
]) {
  assertContains(distText, helper, `Core helper ${helper}`);
}

assertContains(distText, "replace(/\\bBearer\\s+[A-Za-z0-9._~+/=-]{8,}/gi, 'Bearer [已隐藏]')", 'Bearer secret masking');
assertContains(distText, "replace(/\\bsk-[A-Za-z0-9_-]{8,}\\b/g, 'sk-[已隐藏]')", 'sk key masking');
assertContains(distText, "replace(/([?&](?:api[_-]?key|access[_-]?token|token|key)=)[^&\\s]+/gi, '$1[已隐藏]')", 'URL token masking');

assertMatch(distText, /if \(status === 401\)[\s\S]*?category: 'auth'[\s\S]*?invalid_api_key|if \(status === 401\)[\s\S]*?API Key 被上游拒绝/, 'HTTP 401 auth classification');
assertMatch(distText, /if \(status === 429\)[\s\S]*?quota\|balance\|insufficient\|billing[\s\S]*?category: 'quota'[\s\S]*?category: 'rate_limit'/, 'HTTP 429 quota/rate classification');
assertMatch(distText, /if \(status >= 500\)[\s\S]*?category: 'server'/, 'HTTP 5xx server classification');

const streamBlock = getBlock(
  distText,
  /async streamChat\(messages, onChunk, onDone, onError, options = \{\}\)\s*\{/,
  /\n\s*buildModelsUrl\(apiUrl\)\s*\{/,
  'streamChat block'
);
assertContains(streamBlock, 'const activeProfile = this.getActiveApiProfile();', 'streamChat active profile');
assertContains(streamBlock, 'const sourceConfig = this.getActiveApiProfileSnapshot(activeProfile);', 'streamChat source snapshot');
assertContains(streamBlock, 'const failureDefaults = { operation, apiUrl: url, model, sourceConfig };', 'streamChat failure defaults');
assertContains(streamBlock, 'this.createHttpFailure(resp, body, failureDefaults)', 'HTTP failure normalization');
assertContains(streamBlock, 'const responseMeta = { finishReason: null, sourceConfig };', 'finish_reason metadata state');
assertContains(streamBlock, 'const handleStreamFrame = (rawFrame) => {', 'SSE frame parser');
assertContains(streamBlock, "if (eventName === 'error')", 'SSE error event handling');
assertContains(streamBlock, 'if (json?.error)', 'SSE data error handling');
assertContains(streamBlock, 'responseMeta.finishReason = choice.finish_reason;', 'stream finish_reason capture');
assertContains(streamBlock, 'const bodyText = await resp.text();', 'non-stream text body parsing');
assertContains(streamBlock, 'kind: \'non_json_response\'', 'non-stream non-JSON failure');
assertContains(streamBlock, 'kind: \'invalid_schema\'', 'non-stream invalid schema failure');
assertContains(streamBlock, 'onDone(responseMeta);', 'streamChat passes response metadata');
assertContains(streamBlock, 'onError(this.normalizeAiFailure(e, failureDefaults));', 'streamChat structured onError');
assertNotContains(streamBlock, 'catch (e) {}', 'SSE errors must not be swallowed silently');
if (/GM_getValue\('api(Key|Url)'/.test(streamBlock) || /GM_getValue\('model'/.test(streamBlock)) {
  throw new Error('streamChat should not read legacy apiUrl/apiKey/model directly');
}

const modelBlock = getBlock(
  distText,
  /async fetchModelList\(apiUrl, apiKey\)\s*\{/,
  /\n\s*\/\/ ========== 导出功能相关工具函数 ==========/,
  'fetchModelList block'
);
assertContains(modelBlock, 'this.createHttpFailure(resp, bodyText', 'model list HTTP failure normalization');
assertContains(modelBlock, '模型列表响应不是有效 JSON', 'model list invalid JSON message');
assertContains(modelBlock, '未从响应中解析到模型列表', 'model list empty schema message');
assertContains(modelBlock, 'rawSnippet: this.sanitizeErrorText(bodyText, 500)', 'model list safe body snippet');

assertCountAtLeast(distText, 'this.modelListRequestSeq = 0;', 2, 'style1/style2 model picker sequence state');
assertContains(distText, 'this.modelListRequestSeq = (this.modelListRequestSeq || 0) + 1;', 'model picker close invalidates requests');
assertContains(distText, 'const requestSeq = (this.modelListRequestSeq || 0) + 1;', 'model picker request sequence allocation');
assertCountAtLeast(distText, 'if (requestSeq !== this.modelListRequestSeq) return;', 2, 'model picker stale success/error guard');
assertContains(distText, 'if (requestSeq === this.modelListRequestSeq) {', 'model picker stale finally guard');
assertContains(distText, 'status.textContent = message;', 'model picker status safe text sink');
assertContains(distText, 'btn.textContent = model;', 'model option safe text sink');

assertContains(distText, 'errorMeta: overrides.errorMeta || null', 'chat message stores structured error metadata');
assertContains(distText, 'Core.createModelOutputFailure(classified', 'model output failure conversion');
assertContains(distText, 'Core.renderAiFailureBlock(failure, { operation: \'summary\' })', 'summary structured error block');
assertContains(distText, 'Core.formatAiFailureForUi(message.errorMeta', 'chat structured error rendering');
assertContains(distText, 'excludeFromApi: true', 'failed chat messages stay excluded from API');
assertContains(distText, 'finish_content_filter', 'content_filter finish_reason handling');
assertContains(distText, 'finish_length', 'length finish_reason handling');
assertContains(distText, 'finish_unsupported', 'unsupported finish_reason handling');

console.log(`AI upstream errors check passed for ${version}.`);
