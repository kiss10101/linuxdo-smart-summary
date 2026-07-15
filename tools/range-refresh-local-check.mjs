#!/usr/bin/env node

import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { normalizeCodeWhitespace, readProjectSource } from './source-test-helper.mjs';

function normalizeVersion(value, fallback = '7.7-alpha.9') {
  return String(value || fallback).trim().replace(/^v/i, '');
}

const version = normalizeVersion(process.argv[2]);
const repoRoot = process.cwd();
const distPath = resolve(repoRoot, `dist/Linux.do 智能总结-${version}.user.js`);
const distArtifact = await readFile(distPath, 'utf8');
const text = await readProjectSource(repoRoot);
const normalizedText = normalizeCodeWhitespace(text);
const failures = [];

function expectIncludes(needle, label) {
  if (!normalizedText.includes(normalizeCodeWhitespace(needle))) failures.push(`${label}: missing ${needle}`);
}

function expectNotIncludes(needle, label) {
  if (normalizedText.includes(normalizeCodeWhitespace(needle))) failures.push(`${label}: unexpected ${needle}`);
}

function expectMatch(pattern, label) {
  if (!pattern.test(text)) failures.push(`${label}: pattern not found ${pattern}`);
}

function extractFunction(name) {
  const start = text.indexOf(name);
  if (start < 0) return '';
  const nextMarker = text.indexOf('\n        getTopicBoundsFromTopicData', start);
  return text.slice(start, nextMarker > start ? nextMarker : start + 2500);
}

if (!distArtifact.includes(`// @version      ${version}`)) failures.push('userscript version: missing metadata version');

expectIncludes('topicDataInflight: new Map()', 'topic metadata in-flight registry');
expectIncludes('topicDataPrewarmPolicy', 'topic metadata prewarm policy');
expectIncludes('topicDataPrewarmState: new Map()', 'topic metadata prewarm state');
expectIncludes('getLinuxDoFetchOptions(options = {})', 'fetch options accepts no-store flag');
expectIncludes("if (options.noStore) fetchOptions.cache = 'no-store';", 'fetch options no-store cache mode');
expectIncludes("const forceRefresh = options.forceRefresh === true;", 'topic data force refresh option');
expectIncludes("const inflightKey = `${key}:${forceRefresh ? 'force' : 'normal'}`;", 'separate normal/force in-flight keys');
expectIncludes('const forceInflightKey = `${key}:force`;', 'normal topic fetch joins force in-flight prewarm');
expectIncludes('return this.topicDataInflight.get(forceInflightKey);', 'normal topic fetch reuses force in-flight');
expectIncludes('this.topicDataInflight.has(inflightKey)', 'topic data in-flight reuse');
expectIncludes("const fetchOptions = forceRefresh\n                ? { ...opts, cache: 'no-store' }\n                : opts;", 'forced topic fetch bypasses browser cache');
expectIncludes('this.topicDataInflight.set(inflightKey, request)', 'topic data in-flight registration');
expectIncludes('this.topicDataInflight.delete(inflightKey)', 'topic data in-flight cleanup');
expectIncludes('peekTopicData(topicId, options = {})', 'stale topic data can be peeked for optimistic UI');
expectIncludes('getRecentConfirmedTopicData(topicId, maxAgeMs = this.topicDataPrewarmPolicy.recentConfirmedMs)', 'recent confirmed topic data helper');
expectIncludes('async prewarmTopicData(topicId, options = {})', 'topic data prewarm helper');
expectIncludes("this.fetchTopicData(key, this.getLinuxDoFetchOptions({ noStore: true }), {\n                    forceRefresh: true", 'prewarm uses no-store topic metadata');

const prewarmBlock = extractFunction('async prewarmTopicData(topicId, options = {})');
if (!prewarmBlock) {
  failures.push('prewarm block: missing async prewarmTopicData');
} else {
  if (prewarmBlock.includes('/posts.json')) failures.push('prewarm block: must not request posts.json');
  if (!prewarmBlock.includes("return { skipped: 'hidden' };")) failures.push('prewarm block: missing hidden-page guard');
  if (!prewarmBlock.includes("return { skipped: 'throttled', lastAttemptAt: state.lastAttemptAt };")) failures.push('prewarm block: missing throttle guard');
}

expectIncludes('forceRefresh: options.forceRefresh === true', 'topic bounds force refresh passthrough');
expectIncludes('this.getLinuxDoFetchOptions({ noStore: forceRefresh })', 'topic bounds uses no-store fetch options');
expectIncludes('if (options.allowDomFallback === false) return bounds;', 'topic bounds can disable DOM fallback');
expectIncludes('allowDomFallback: options.allowDomFallback !== false', 'range upper bound controls fallback');
expectIncludes('allowRecentConfirmedCache: options.allowRecentConfirmedCache === true', 'range upper bound can use recent confirmed metadata');

expectIncludes('this.rangeRequestSeq = 0', 'summary range request sequence state');
expectIncludes('this.exportRangeRequestSeq = 0', 'export range request sequence state');
expectIncludes('this.rangeConfirmationPromise = null', 'summary range confirmation promise state');
expectIncludes('this.exportRangeConfirmationPromise = null', 'export range confirmation promise state');
expectIncludes("this.rangeMode = 'manual'", 'summary range mode state');
expectIncludes("this.exportRangeMode = 'manual'", 'export range mode state');
expectIncludes("this.rangeBoundsTopicId = '';", 'range bounds topic tracking');
expectIncludes('this.rangeBoundsLastRefreshAt = 0', 'range bounds freshness tracking');
expectIncludes("this.addManagedListener(input, 'input', () => this.markSummaryRangeManual());", 'manual summary range input tracking');
expectIncludes("this.addManagedListener(input, 'input', () => this.markExportRangeManual());", 'manual export range input tracking');
expectIncludes('markSummaryRangeManual()', 'manual summary range cancels stale confirmation');
expectIncludes('markExportRangeManual()', 'manual export range cancels stale confirmation');
expectIncludes("this.setRangeButtonsLoading('summary', false);", 'manual summary range clears loading');
expectIncludes("this.setRangeButtonsLoading('export', false);", 'manual export range clears loading');

expectIncludes("setRangeButtonsLoading(scope, isLoading, label = '获取中')", 'range loading accepts confirmation label');
expectIncludes("optimistic.applied ? '确认中' : '获取中'", 'optimistic ranges show confirmation label');
expectIncludes("this.setRangeButtonsLoading('summary', true", 'summary range loading starts');
expectIncludes("this.setRangeButtonsLoading('summary', false)", 'summary range loading clears');
expectIncludes("this.setRangeButtonsLoading('export', true", 'export range loading starts');
expectIncludes("this.setRangeButtonsLoading('export', false)", 'export range loading clears');
expectIncludes('applyOptimisticRangeFromCache(type, scope)', 'range buttons can optimistically fill from topic cache');
expectIncludes('restoreOptimisticRange(scope, optimistic)', 'failed confirmation restores optimistic range');
expectIncludes('waitForRangeConfirmation(scope)', 'summary/export waits for pending range confirmation');
expectIncludes("if (!await this.waitForRangeConfirmation('summary')) return;", 'summary waits for range confirmation');
expectIncludes("if (!await this.waitForRangeConfirmation('export')) return;", 'export waits for range confirmation');
expectIncludes("const confirmation = this.getRangeUpperBound({\n                forceRefresh: true,\n                allowDomFallback: false,\n                allowRecentConfirmedCache: true", 'range buttons force exact upper bound with recent confirmed cache');
expectIncludes("end = await this.getRangeUpperBound({ forceRefresh: true, allowDomFallback: false });", 'empty summary/export end forces exact upper bound');
expectIncludes('if (requestSeq !== this.rangeRequestSeq || tid !== Core.getTopicId()) return;', 'summary stale range guard');
expectIncludes('if (requestSeq !== this.exportRangeRequestSeq || tid !== Core.getTopicId()) return;', 'export stale range guard');
expectIncludes("this.restoreOptimisticRange('summary', optimistic);", 'summary range failure restores optimistic values');
expectIncludes("this.restoreOptimisticRange('export', optimistic);", 'export range failure restores optimistic values');

expectIncludes('forceRefreshTopicData: options.forceRefreshTopicData === true || options.forceRefresh === true', 'dialogue force refresh also refreshes topic metadata');
expectIncludes('forceRefresh: options.forceRefreshTopicData === true', 'post fetch can force topic metadata refresh');

expectIncludes('activeTopicId: null', 'active topic id tracking');
expectIncludes('activeTopicPrewarmTimer: null', 'active topic prewarm timer');
expectIncludes('scheduleActiveTopicPrewarm', 'route and resume topic prewarm scheduler');
expectIncludes('const topicId = Core.getTopicId();', 'route sync reads current topic id');
expectIncludes('topicId && uiRuntime.activeTopicId && topicId !== uiRuntime.activeTopicId', 'same-page topic switch detection');
expectIncludes('uiRuntime.activeUIManager.destroy();\n        uiRuntime.activeTopicId = topicId;\n        uiRuntime.activeUIManager = new UIManager();', 'topic switch rebuilds sidebar');
expectIncludes("scheduleActiveTopicPrewarm('route')", 'topic route creation schedules prewarm');
expectIncludes("scheduleActiveTopicPrewarm('route-change')", 'topic switch schedules prewarm');
expectIncludes("scheduleActiveTopicPrewarm('resume', Core.topicDataPrewarmPolicy.resumeDelayMs)", 'visible/focus resume schedules prewarm');
expectIncludes("Core.prewarmTopicData(topicId, { reason })", 'route prewarm uses topic metadata helper');
expectIncludes("document.addEventListener('visibilitychange', scheduleResumePrewarm);", 'visibility resume listener installed');
expectIncludes("window.addEventListener('focus', scheduleResumePrewarm);", 'focus resume listener installed');
expectIncludes("document.removeEventListener('visibilitychange', scheduleResumePrewarm);", 'visibility resume listener cleaned up');
expectIncludes('uiRuntime.activeTopicId = null;', 'leaving topic page clears active topic id');

expectNotIncludes('Q(\'#range-all\').onclick = () => this.setRange(\'all\');\n            Q(\'#range-recent\').onclick = () => this.setRange(\'recent\');\n            Q(\'#btn-summary\').onclick', 'range buttons should keep manual input tracking between binding and summary button');
expectMatch(/\.btn-xs:disabled,\s*\.btn-xs\.loading\s*\{[\s\S]*?cursor:\s*wait;/, 'range buttons expose loading cursor');

if (failures.length > 0) {
  console.log(`Range refresh check failed for ${version}:`);
  for (const failure of failures) console.log(`- ${failure}`);
  process.exitCode = 1;
} else {
  console.log(`Range refresh check passed for ${version}.`);
}
