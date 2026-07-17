#!/usr/bin/env node

import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { readProjectSource } from './source-test-helper.mjs';

function normalizeVersion(value, fallback = '7.7-alpha.9') {
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

function getBlock(text, startPattern, endPattern, label) {
  const start = text.search(startPattern);
  if (start < 0) throw new Error(`${label}: start not found`);
  const rest = text.slice(start);
  const end = rest.search(endPattern);
  if (end < 0) throw new Error(`${label}: end not found`);
  return rest.slice(0, end);
}

function assertForbidden(block, forbidden, label) {
  for (const token of forbidden) {
    assertNotContains(block, token, label);
  }
}

const version = normalizeVersion(process.argv[2]);
const distPath = resolve(process.cwd(), `dist/Linux.do 智能总结-${version}.user.js`);
const distArtifact = await readFile(distPath, 'utf8');
const distText = await readProjectSource();

assertContains(distArtifact, `// @version      ${version}`, 'userscript version');
assertContains(distArtifact, '@grant        GM_addValueChangeListener', 'value listener grant');
assertContains(distArtifact, '@grant        GM_removeValueChangeListener', 'value listener cleanup grant');
assertNotContains(distArtifact, '@grant        GM_xmlhttpRequest', 'no GM network helper');
if (version === '7.7-alpha.3') {
  assertContains(distArtifact, `${version}: 增加 AI-only 停止生成`, 'update summary');
} else if (version === '7.7-alpha.4') {
  assertContains(distArtifact, `${version}: 修复 UI 重建后跨标签设置监听未重绑`, 'update summary');
} else if (version === '7.7-alpha.5') {
  assertContains(distArtifact, `${version}: 修正对话/总结阅读区的跳转按钮定位`, 'update summary');
} else if (version === '7.7-alpha.6') {
  assertContains(distArtifact, `${version}: 修复对话页实际由外层内容区滚动`, 'update summary');
} else if (version === '7.7-alpha.7') {
  assertContains(distArtifact, `${version}: 公开仓库隐私与供应链加固`, 'update summary');
} else {
  assertContains(distArtifact, `* ${version}:`, 'update summary');
}

const streamBlock = getBlock(
  distText,
  /async streamChat\(messages, onOutputEvent, onDone, onError, options = \{\}\)\s*\{/,
  /\n\s*buildModelsUrl\(apiUrl\)\s*\{/,
  'streamChat block'
);
assertContains(streamBlock, 'const sourceConfig = this.getActiveApiProfileSnapshot(activeProfile);', 'request source snapshot');
assertContains(streamBlock, 'const failureDefaults = { operation, apiUrl: url, model, sourceConfig };', 'source in failure defaults');
assertContains(streamBlock, 'signal: options.signal', 'provider fetch signal');
assertContains(streamBlock, 'const responseMeta = { finishReason: null, sourceConfig };', 'source in success meta');

for (const [start, end, label] of [
  [/async fetchLinuxDoJson\(url, opts = \{\}\)\s*\{/, /\n\s*normalizeTopicId\(topicId\)\s*\{/, 'fetchLinuxDoJson block'],
  [/async fetchTopicData\(topicId, opts = this\.getLinuxDoFetchOptions\(\), options = \{\}\)\s*\{/, /\n\s*async prewarmTopicData\(topicId, options = \{\}\)\s*\{/, 'fetchTopicData block'],
  [/async fetchPostsByIds\(topicId, postIds, opts, onProgress, policyOverride = \{\}, progressMeta = \{\}\)\s*\{/, /\n\s*assertLinuxDoRequestBudget\(/, 'fetchPostsByIds block'],
  [/async fetchTopicPosts\(topicId, start, end, onProgress, options = \{\}\)\s*\{/, /\n\s*formatPostForAiContext\(/, 'fetchTopicPosts block']
]) {
  const block = getBlock(distText, start, end, label);
  assertNotContains(block, 'signal:', `${label}: no abort signal in Linux.do fetch chain`);
  assertNotContains(block, 'AbortController', `${label}: no abort controller in Linux.do fetch chain`);
}

const chatBlock = getBlock(
  distText,
  /async requestAssistantForUser\(userMessage, \{ assistantMessage = null \} = \{\}\)\s*\{/,
  /\n\s*getMessageCopyText\(message\)\s*\{/,
  'requestAssistantForUser block'
);
assertContains(chatBlock, "this.startAiAbortController('chat')", 'chat starts AI-only abort controller');
assertContains(chatBlock, '{ operation: \'chat\', signal: abortController.signal }', 'chat passes signal only to streamChat');
assertContains(chatBlock, 'sourceConfig: meta.sourceConfig', 'chat model-output errors use source snapshot');
assertContains(chatBlock, 'sourceConfig: failure.sourceConfig', 'chat request errors keep source snapshot');
assertContains(chatBlock, 'this.clearAiAbortController(abortController);', 'chat clears abort controller');
assertNotContains(chatBlock, 'Core.getActiveApiProfile()', 'chat result attribution must not read current active profile');

const summaryBlock = getBlock(
  distText,
  /async doSummary\(\)\s*\{/,
  /\n\s*async doChat\(\)\s*\{/,
  'doSummary block'
);
assertContains(summaryBlock, "this.startAiAbortController('summary')", 'summary starts AI-only abort controller');
assertContains(summaryBlock, '{ operation: \'summary\', signal: abortController.signal }', 'summary passes signal only to streamChat');
assertContains(summaryBlock, 'sourceConfig: meta.sourceConfig', 'summary model-output errors use source snapshot');
assertContains(summaryBlock, 'this.updateResultBox(resultBox, outputState, false, coverageReport, sourceConfig)', 'summary success renders source snapshot');
assertContains(summaryBlock, 'sourceConfig', 'summary stores source snapshot');
assertNotContains(summaryBlock, 'Core.getActiveApiProfile()', 'summary result attribution must not read current active profile');

assertContains(distText, 'normalizeAiSourceConfig(sourceConfig = null)', 'source config normalizer');
assertContains(distText, 'renderAiSourceMeta(sourceConfig = null', 'source config renderer');
assertContains(distText, 'sourceConfig: Core.normalizeAiSourceConfig(overrides.sourceConfig)', 'visible message source field');
assertContains(distText, 'kind: \'request_aborted\'', 'abort failure kind');
assertContains(distText, 'category: \'cancelled\'', 'abort failure category');
assertContains(distText, '已停止 AI 输出；不会因此重新请求 Linux.do。', 'abort UX text');

const syncBlock = getBlock(
  distText,
  /bindSettingsStorageSync\(\)\s*\{/,
  /\n\s*handleApiProfileSelect\(nextId\)\s*\{/,
  'settings sync block'
);
assertContains(distText, 'addManagedValueChangeListener(key, handler)', 'managed value listener wrapper');
assertContains(distText, 'GM_addValueChangeListener(key, handler)', 'managed value listener');
assertContains(distText, 'GM_removeValueChangeListener(listenerId)', 'managed value listener cleanup');
assertContains(syncBlock, 'this.addManagedValueChangeListener(key', 'settings sync uses managed value listener');
assertContains(syncBlock, 'if (!remote) return;', 'remote guard');
assertContains(syncBlock, 'pendingSettingsStorageSyncKeys', 'coalesced sync keys');
assertContains(syncBlock, 'applySettingsStorageSnapshot', 'settings-only apply');
assertContains(syncBlock, 'syncChatPromptMemory(promptChat)', 'chat prompt memory sync');
assertNotContains(syncBlock, 'settingsStorageSyncBound', 'settings sync must rebind after UI rebuild');
assertContains(distText, 'this.dirtySettingsKeys = new Set();', 'explicit dirty settings state');
assertContains(distText, 'markSettingsDirty', 'settings dirty marker helper');
assertContains(distText, 'clearSettingsDirty', 'settings dirty clear helper');
assertContains(distText, 'this.dirtySettingsKeys.has(key)', 'dirty check uses explicit dirty keys');
assertNotContains(syncBlock, 'document.activeElement', 'dirty check must not rely on activeElement focus');
assertNotContains(syncBlock, 'shadow?.activeElement', 'dirty check must not rely on shadow activeElement');
assertContains(distText, "this.showToast('其他标签页有设置更新，完成当前编辑后将处理同步')", 'dirty remote conflict toast');
assertContains(distText, 'btn-summary-scroll-bottom', 'summary jump-to-latest control');
assertContains(distText, 'forceScrollSummaryToBottom', 'summary forced jump helper');
assertContains(distText, 'updateSummaryScrollButton', 'summary scroll button state helper');
assertContains(distText, 'summaryUserScrolledUp', 'summary scroll-up tracking');
assertContains(distText, 'direction: rtl', 'left-side scrollbar layout');
assertContains(distText, 'this.bindSettingsStorageSync();', 'settings sync rebound from bindEvents');
assertContains(distText, '.content-area.chat-active { overflow: hidden; }', 'chat disables outer content scrolling');
assertContains(distText, '#page-chat.view-page.active { display: flex; height: 100%; min-height: 0;', 'chat page owns available height');
assertContains(distText, '.chat-messages-wrapper { flex: 1; min-height: 0;', 'chat message wrapper can shrink');
if (!/\.chat-messages\s*\{[^}]*height:\s*100%;[^}]*min-height:\s*0;[^}]*overflow-y:\s*auto;/s.test(distText)) {
  throw new Error('chat messages own vertical scrolling: expected height, min-height, and overflow-y in the same rule');
}
assertContains(distText, "contentArea.classList.toggle('chat-active', tabName === 'chat');", 'tab switch assigns chat scroll ownership');
assertContains(distText, '.scroll-buttons { position: absolute; right: 10px;', 'floating scroll controls remain separate on right');
assertForbidden(syncBlock, [
  'fetch(',
  'fetchLinuxDoJson',
  'fetchTopicData',
  'prewarmTopicData',
  'fetchTopicPosts',
  'fetchDialoguesCached',
  'getRangeUpperBound',
  'initRangeInputs',
  'setRange(',
  'setExportRange(',
  'doSummary(',
  'doExport(',
  'loadModelList(',
  'openModelPicker(',
  'streamChat(',
  'https://linux.do',
  '/posts.json'
], 'settings sync block');

const applyProfileBlock = getBlock(
  distText,
  /applyApiProfileStorageSnapshot\(\)\s*\{/,
  /\n\s*applyPromptStorageSnapshot\(\)\s*\{/,
  'applyApiProfileStorageSnapshot block'
);
assertForbidden(applyProfileBlock, [
  'GM_setValue',
  'Core.saveApiProfileState',
  'persistApiProfileState',
  'queueApiProfilePersist',
  'flushApiProfilePersist',
  'syncCurrentApiFormToActiveProfile'
], 'applyApiProfileStorageSnapshot block');
assertContains(applyProfileBlock, 'this.loadApiProfileStateToUi();', 'profile sync reads final storage snapshot');

const recentBlock = getBlock(
  distText,
  /applyRecentFloorsStorageSnapshot\(\)\s*\{/,
  /\n\s*applyStreamAndAutoscrollStorageSnapshot\(\)\s*\{/,
  'applyRecentFloorsStorageSnapshot block'
);
assertForbidden(recentBlock, [
  'setRange(',
  'setExportRange(',
  'getRangeUpperBound',
  'prewarmTopicData'
], 'recent floors sync block');

console.log(`AI control/source/settings sync check passed for ${version}.`);
