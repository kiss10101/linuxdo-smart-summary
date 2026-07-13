#!/usr/bin/env node

import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

function normalizeVersion(value, fallback = '7.7-alpha.8') {
  return String(value || fallback).trim().replace(/^v/i, '');
}

const version = normalizeVersion(process.argv[2]);
const repoRoot = process.cwd();
const distPath = resolve(repoRoot, `dist/Linux.do 智能总结-${version}.user.js`);
const text = await readFile(distPath, 'utf8');
const failures = [];

function expectIncludes(needle, label) {
  if (!text.includes(needle)) failures.push(`${label}: missing ${needle}`);
}

function expectNotIncludes(needle, label) {
  if (text.includes(needle)) failures.push(`${label}: unexpected ${needle}`);
}

function expectMatch(pattern, label) {
  if (!pattern.test(text)) failures.push(`${label}: pattern not found ${pattern}`);
}

expectIncludes('linuxDoRequestBudgetPolicy', 'request budget policy');
expectIncludes('assertLinuxDoRequestBudget({', 'request budget assertion');
expectIncludes('createLinuxDoRequestBudgetTracker({', 'cumulative request budget tracker');
expectIncludes('usedPostBatchRequests', 'cumulative post batch budget state');
expectIncludes('maxPostBatchRequests', 'request budget batch cap');
expectMatch(/this\.assertLinuxDoRequestBudget\(\{[\s\S]*?candidateIdCount:[\s\S]*?batchCount:/, 'request budget is applied before post batches');
expectIncludes('budgetTracker.assertNext({', 'range look-behind consumes cumulative request budget');

expectIncludes('scheduleSummaryRender(resultBox, getText)', 'summary streaming scheduler');
expectIncludes('scheduleBubbleRender(messageId, bubbleDiv, getText)', 'chat streaming scheduler');
expectIncludes('this.scheduleSummaryRender(resultBox, () => aiText)', 'summary stream uses scheduler');
expectIncludes('this.scheduleBubbleRender(targetAssistant.id, bubble, () => aiText)', 'chat stream uses scheduler');
expectNotIncludes('this.updateResultBox(resultBox, aiText, true);', 'summary stream direct render');
expectNotIncludes('this.updateBubble(bubble, aiText, true);', 'chat stream direct render');

expectIncludes('createFrameThrottledHandler(handler)', 'frame throttled helper');
expectMatch(/window,\s*'mousemove'[\s\S]*?\{ passive: true \}/, 'global mousemove listeners are passive/throttled');
expectMatch(/chatMessages,\s*'scroll'[\s\S]*?requestManagedFrame/, 'chat scroll uses requestManagedFrame');
expectIncludes('closeMessageMenuOnFrame', 'message menu scroll close is throttled');
expectIncludes('closeSummarySelectionOnFrame', 'summary menu scroll close is throttled');

expectIncludes('Core.isTopicPage()', 'topic route gate');
expectIncludes('installTopicRouteBootstrap', 'SPA route bootstrap');
expectIncludes('activeUIManager = new UIManager();', 'UIManager is created through gated boot');
expectIncludes('activeUIManager.destroy();', 'UIManager is destroyed after leaving topic routes');
expectIncludes('destroy() {\n            if (this.currentUI', 'UIManager exposes destroy lifecycle');
expectNotIncludes("window.addEventListener('load', () => {\n        new UIManager();", 'unconditional load initialization');

expectIncludes('topicDataPrewarmPolicy', 'topic metadata prewarm policy');
expectIncludes('async prewarmTopicData(topicId, options = {})', 'topic metadata prewarm helper');
expectIncludes("this.fetchTopicData(key, this.getLinuxDoFetchOptions({ noStore: true }), {\n                    forceRefresh: true", 'topic metadata prewarm uses no-store topic JSON');
expectIncludes("return { skipped: 'hidden' };", 'topic metadata prewarm skips hidden pages');
expectIncludes("return { skipped: 'throttled', lastAttemptAt: state.lastAttemptAt };", 'topic metadata prewarm is throttled');
expectIncludes('const forceInflightKey = `${key}:force`;', 'normal topic fetch reuses force prewarm');
expectIncludes('let activeTopicPrewarmTimer = null;', 'topic prewarm timer state');
expectIncludes('clearActiveTopicPrewarmTimer();', 'topic prewarm timer cleanup');
expectIncludes("document.removeEventListener('visibilitychange', scheduleResumePrewarm);", 'visibility prewarm listener cleanup');
expectIncludes("window.removeEventListener('focus', scheduleResumePrewarm);", 'focus prewarm listener cleanup');

const prewarmStart = text.indexOf('async prewarmTopicData(topicId, options = {})');
const prewarmEnd = text.indexOf('\n        getTopicBoundsFromTopicData', prewarmStart);
const prewarmBlock = prewarmStart >= 0 && prewarmEnd > prewarmStart ? text.slice(prewarmStart, prewarmEnd) : '';
if (!prewarmBlock) {
  failures.push('topic metadata prewarm block: missing');
} else if (prewarmBlock.includes('/posts.json')) {
  failures.push('topic metadata prewarm block: must not request posts.json');
}

function createBudgetTracker({ maxCandidateIds = 4000, maxPostBatchRequests = 20 } = {}) {
  let usedPostBatchRequests = 0;
  return {
    assertNext({ candidateIdCount, batchCount }) {
      const projectedBatchCount = usedPostBatchRequests + Math.max(0, Number(batchCount) || 0);
      if (candidateIdCount > maxCandidateIds || projectedBatchCount > maxPostBatchRequests) {
        throw new Error(`budget exceeded at ${projectedBatchCount} batches`);
      }
      usedPostBatchRequests = projectedBatchCount;
      return usedPostBatchRequests;
    }
  };
}

function runCumulativeBudgetRegression() {
  const tracker = createBudgetTracker();
  const rounds = [
    { candidateIdCount: 3900, batchCount: 20 },
    { candidateIdCount: 3940, batchCount: 1 }
  ];
  tracker.assertNext(rounds[0]);
  try {
    tracker.assertNext(rounds[1]);
  } catch (error) {
    return /21 batches/.test(error.message);
  }
  return false;
}

if (!runCumulativeBudgetRegression()) {
  failures.push('cumulative request budget regression: second look-behind round should fail at 21 batches');
}

if (failures.length > 0) {
  console.log(`Runtime performance check failed for ${version}:`);
  for (const failure of failures) console.log(`- ${failure}`);
  process.exitCode = 1;
} else {
  console.log(`Runtime performance check passed for ${version}.`);
}
