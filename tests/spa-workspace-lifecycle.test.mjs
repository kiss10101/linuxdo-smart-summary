import assert from 'node:assert/strict';
import test from 'node:test';

import { startUserscript } from '../src/app/bootstrap.js';
import { uiRuntime } from '../src/app/runtime.js';
import { UIRegistry } from '../src/ui/registry.js';
import { UIManager } from '../src/ui/ui-manager.js';
import { Core } from '../src/core/index.js';
import { style1Helpers } from '../src/ui/style1/helpers.js';
import { style1Interactions } from '../src/ui/style1/interactions.js';
import { style1State } from '../src/ui/style1/state.js';

function createEventTarget() {
    const listeners = new Map();
    return {
        addEventListener(type, listener) {
            if (!listeners.has(type)) listeners.set(type, new Set());
            listeners.get(type).add(listener);
        },
        removeEventListener(type, listener) {
            listeners.get(type)?.delete(listener);
        },
        dispatchEvent(event) {
            for (const listener of listeners.get(event.type) || []) listener.call(this, event);
        }
    };
}

class FakeElement {
    constructor(tagName = 'div') {
        this.tagName = tagName.toUpperCase();
        this.children = [];
        this.parentNode = null;
        this.style = { setProperty() {} };
        this.textContent = '';
        this.id = '';
    }

    appendChild(child) {
        child.parentNode = this;
        this.children.push(child);
        return child;
    }

    removeChild(child) {
        const index = this.children.indexOf(child);
        if (index >= 0) this.children.splice(index, 1);
        child.parentNode = null;
        return child;
    }

    attachShadow() {
        this.shadowRoot = new FakeElement('shadow-root');
        return this.shadowRoot;
    }

    querySelector() {
        return null;
    }
}

function installBrowserGlobals(t, initialHref) {
    const originals = new Map();
    const setGlobal = (key, value) => {
        originals.set(key, globalThis[key]);
        globalThis[key] = value;
    };

    const windowEvents = createEventTarget();
    const documentEvents = createEventTarget();
    const location = { href: initialHref, origin: new URL(initialHref).origin };
    const windowObject = { ...windowEvents, location };
    const documentObject = {
        ...documentEvents,
        body: new FakeElement('body'),
        visibilityState: 'visible',
        createElement(tagName) {
            return new FakeElement(tagName);
        }
    };
    const historyObject = {
        pushState(_state, _unused, url) {
            location.href = new URL(url, location.href).href;
        },
        replaceState(_state, _unused, url) {
            location.href = new URL(url, location.href).href;
        }
    };

    windowObject.window = windowObject;
    windowObject.document = documentObject;
    windowObject.history = historyObject;
    setGlobal('window', windowObject);
    setGlobal('document', documentObject);
    setGlobal('history', historyObject);
    setGlobal('GM_getValue', () => 'route-test-style');
    setGlobal('GM_setValue', () => {});
    setGlobal('GM_registerMenuCommand', () => {});

    t.after(() => {
        uiRuntime.routeBootstrapCleanup?.();
        uiRuntime.activeUIManager?.destroy();
        if (uiRuntime.activeTopicPrewarmTimer) clearTimeout(uiRuntime.activeTopicPrewarmTimer);
        uiRuntime.activeUIManager = null;
        uiRuntime.activeTopicId = null;
        uiRuntime.activeTopicPrewarmTimer = null;
        uiRuntime.routeBootstrapCleanup = null;
        UIManager.menuCommandsRegistered = false;
        for (const [key, value] of originals) globalThis[key] = value;
    });

    return { windowObject, historyObject };
}

async function flushRouteChange() {
    await new Promise(resolve => setTimeout(resolve, 5));
}

function replaceGlobal(t, key, value) {
    const original = globalThis[key];
    globalThis[key] = value;
    t.after(() => { globalThis[key] = original; });
}

function createClassList(initial = []) {
    const values = new Set(initial);
    return {
        add(...names) { names.forEach(name => values.add(name)); },
        remove(...names) { names.forEach(name => values.delete(name)); },
        contains(name) { return values.has(name); }
    };
}

function createSummaryHarness(overrides = {}) {
    const resultBox = {
        innerHTML: '',
        scrollTop: 0,
        classList: createClassList(['empty'])
    };
    const elements = new Map([
        ['#inp-start', { value: '1' }],
        ['#inp-end', { value: '5' }],
        ['#chat-list', { innerHTML: '' }],
        ['#chat-empty', { innerHTML: '', classList: createClassList() }],
        ['#summary-result', resultBox],
        ['#workspace-source-status-summary', { hidden: true, textContent: '' }],
        ['#workspace-source-status-chat', { hidden: true, textContent: '' }]
    ]);
    const calls = {
        replacement: [],
        rangeModes: [],
        loading: [],
        renders: 0,
        toasts: []
    };
    const context = {
        ...style1Helpers,
        ...style1Interactions,
        ...style1State,
        lifecycleEpoch: {},
        summaryRequestSeq: 0,
        activeSummaryRequest: null,
        currentAiAbortController: null,
        currentAiAbortScope: '',
        rangeRequestSeq: 0,
        exportRangeRequestSeq: 0,
        rangeMode: 'manual',
        exportRangeMode: 'manual',
        rangeBoundsTopicId: '',
        exportRangeBoundsTopicId: '',
        rangeBoundsLastRefreshAt: 0,
        rangeConfirmationPromise: null,
        exportRangeConfirmationPromise: null,
        workspaceTopicId: '',
        chatSession: { context: null, baseMessages: [], visibleMessages: [] },
        chatHistory: [],
        postContent: '',
        lastSummary: '',
        forceRefreshDialogueCache: false,
        summaryUserScrolledUp: false,
        isSummaryProgrammaticScroll: false,
        uiManager: { Q(selector) { return elements.get(selector) || null; } },
        waitForRangeConfirmation: async () => true,
        requestWorkspaceReplacementConfirm: async (replacement) => {
            calls.replacement.push(replacement);
            return overrides.confirmReplacement !== false;
        },
        setRange: async (mode) => {
            calls.rangeModes.push(mode);
            elements.get('#inp-start').value = '11';
            elements.get('#inp-end').value = '20';
            context.rangeBoundsTopicId = Core.getTopicId();
            return true;
        },
        setLoading(selector, loading) { calls.loading.push([selector, loading]); },
        setAiAbortButtonState() {},
        closeMessageContextMenu() {},
        closeSummarySelectionMenu() {},
        updateMessageCount() {},
        updateSummaryScrollButton() {},
        cancelSummaryRender() {},
        scheduleSummaryRender() {},
        updateResultBox() {},
        renderChatMessages() { calls.renders += 1; },
        showToast(message, type) { calls.toasts.push([message, type]); },
        ...overrides.context
    };
    return { context, calls, elements, resultBox };
}

test('SPA topic changes preserve one UI manager and notify the active workspace', { concurrency: false }, async (t) => {
    const originalStyles = UIRegistry._styles;
    UIRegistry._styles = {};
    t.after(() => { UIRegistry._styles = originalStyles; });

    const calls = { init: 0, destroy: 0, routes: [] };
    const style = {
        name: 'Route test style',
        workspaceMarker: 'topic-101-workspace',
        getStyles() { return ''; },
        init() { calls.init += 1; },
        destroy() { calls.destroy += 1; },
        onTopicRouteChange(change) { calls.routes.push(change); }
    };
    UIRegistry.register('route-test-style', style);
    const { historyObject } = installBrowserGlobals(t, 'https://linux.do/t/topic-a/101');

    startUserscript();
    const manager = uiRuntime.activeUIManager;
    assert.ok(manager);
    assert.equal(uiRuntime.activeTopicId, '101');

    historyObject.pushState({}, '', '/t/topic-b/202');
    await flushRouteChange();

    assert.equal(uiRuntime.activeUIManager, manager);
    assert.equal(uiRuntime.activeTopicId, '202');
    assert.equal(style.workspaceMarker, 'topic-101-workspace');
    assert.equal(calls.init, 1);
    assert.equal(calls.destroy, 0);
    assert.deepEqual(calls.routes, [{ previousTopicId: '101', topicId: '202' }]);

    historyObject.pushState({}, '', '/t/topic-a/101');
    await flushRouteChange();
    assert.equal(uiRuntime.activeUIManager, manager);
    assert.equal(uiRuntime.activeTopicId, '101');
    assert.equal(style.workspaceMarker, 'topic-101-workspace');
    assert.equal(calls.destroy, 0);
    assert.deepEqual(calls.routes, [
        { previousTopicId: '101', topicId: '202' },
        { previousTopicId: '202', topicId: '101' }
    ]);

    historyObject.pushState({}, '', '/latest');
    await flushRouteChange();
    assert.equal(uiRuntime.activeUIManager, null);
    assert.equal(uiRuntime.activeTopicId, null);
    assert.equal(calls.destroy, 1);
});

test('summary lifecycle invalidation aborts work and rejects stale callbacks', () => {
    const context = {
        ...style1State,
        lifecycleEpoch: {},
        summaryRequestSeq: 0,
        activeSummaryRequest: null,
        currentAiAbortController: null,
        currentAiAbortScope: '',
        cancelSummaryRender() {},
        clearAiAbortController(controller) {
            if (controller && this.currentAiAbortController !== controller) return;
            this.currentAiAbortController = null;
            this.currentAiAbortScope = '';
        }
    };
    const request = context.beginSummaryRequestLifecycle({ topicId: '101' });
    const controller = new AbortController();
    context.attachSummaryAbortController(request, controller);

    assert.equal(context.isCurrentSummaryRequest(request), true);
    context.abortActiveSummaryRequest('destroy');

    assert.equal(controller.signal.aborted, true);
    assert.equal(context.isCurrentSummaryRequest(request), false);
    assert.equal(context.activeSummaryRequest, null);
    assert.equal(request.abortReason, 'destroy');
});

test('a destroyed summary cannot apply a late post-fetch result', async (t) => {
    let resolveFetch;
    let reportProgress;
    let streamCalls = 0;
    const originalFetch = Core.fetchDialoguesCached;
    const originalStream = Core.streamChat;
    const originalGetTopicId = Core.getTopicId;
    Core.getTopicId = () => '101';
    Core.fetchDialoguesCached = (_topicId, _start, _end, onProgress) => new Promise(resolve => {
        reportProgress = onProgress;
        resolveFetch = resolve;
    });
    Core.streamChat = async () => { streamCalls += 1; };
    t.after(() => {
        Core.fetchDialoguesCached = originalFetch;
        Core.streamChat = originalStream;
        Core.getTopicId = originalGetTopicId;
    });

    const classNames = new Set(['empty']);
    const resultBox = {
        innerHTML: '',
        scrollTop: 0,
        classList: {
            add(name) { classNames.add(name); },
            remove(name) { classNames.delete(name); },
            contains(name) { return classNames.has(name); }
        }
    };
    const chatEmpty = {
        innerHTML: '',
        classList: { add() {}, remove() {} }
    };
    const elements = new Map([
        ['#inp-start', { value: '1' }],
        ['#inp-end', { value: '5' }],
        ['#chat-list', { innerHTML: '' }],
        ['#chat-empty', chatEmpty],
        ['#summary-result', resultBox]
    ]);
    const context = {
        ...style1State,
        ...style1Interactions,
        lifecycleEpoch: {},
        summaryRequestSeq: 0,
        activeSummaryRequest: null,
        currentAiAbortController: null,
        currentAiAbortScope: '',
        workspaceTopicId: '',
        chatSession: { context: null, baseMessages: [], visibleMessages: [] },
        chatHistory: [],
        postContent: '',
        lastSummary: '',
        forceRefreshDialogueCache: false,
        summaryUserScrolledUp: false,
        isSummaryProgrammaticScroll: false,
        uiManager: { Q(selector) { return elements.get(selector) || null; } },
        waitForRangeConfirmation: async () => true,
        getWorkspaceReplacementContext: () => null,
        clearChatContext() {
            this.chatSession = { context: null, baseMessages: [], visibleMessages: [] };
            this.chatHistory = [];
            this.postContent = '';
            this.lastSummary = '';
        },
        setWorkspaceTopicId(topicId) { this.workspaceTopicId = topicId; },
        updateMessageCount() {},
        updateSummaryScrollButton() {},
        setLoading() {},
        cancelSummaryRender() {},
        clearAiAbortController() {}
    };

    const summaryPromise = context.doSummary();
    await new Promise(resolve => setTimeout(resolve, 0));
    assert.ok(context.activeSummaryRequest);
    const loadingHtml = resultBox.innerHTML;

    context.abortActiveSummaryRequest('destroy');
    reportProgress({ done: 1, total: 5 });
    resolveFetch({ text: 'late topic content', cacheHit: false, cacheEntry: null, rangeMapping: null });
    await summaryPromise;

    assert.equal(resultBox.innerHTML, loadingHtml);
    assert.equal(context.postContent, '');
    assert.equal(streamCalls, 0);
});

test('cross-topic replacement is required only for a non-empty foreign workspace', () => {
    const context = {
        ...style1State,
        workspaceTopicId: '101',
        lastSummary: 'existing summary',
        postContent: '',
        chatSession: { context: { topicId: '101' }, visibleMessages: [] },
        uiManager: { Q() { return null; } }
    };

    assert.deepEqual(context.getWorkspaceReplacementContext('202'), {
        sourceTopicId: '101',
        targetTopicId: '202'
    });
    assert.equal(context.getWorkspaceReplacementContext('101'), null);
    context.lastSummary = '';
    context.chatSession = { context: null, visibleMessages: [] };
    assert.equal(context.getWorkspaceReplacementContext('202'), null);
});

test('rejecting cross-topic replacement preserves the existing workspace and skips fetching', { concurrency: false }, async (t) => {
    let fetchCalls = 0;
    const originalGetTopicId = Core.getTopicId;
    const originalFetch = Core.fetchDialoguesCached;
    Core.getTopicId = () => '202';
    Core.fetchDialoguesCached = async () => {
        fetchCalls += 1;
        return { text: 'unexpected' };
    };
    replaceGlobal(t, 'GM_getValue', (_key, fallback) => fallback);
    t.after(() => {
        Core.getTopicId = originalGetTopicId;
        Core.fetchDialoguesCached = originalFetch;
    });

    const { context, calls } = createSummaryHarness({ confirmReplacement: false });
    context.workspaceTopicId = '101';
    context.lastSummary = 'topic 101 summary';
    context.postContent = 'topic 101 content';
    context.chatSession = {
        context: { topicId: '101' },
        baseMessages: [{ role: 'assistant', content: 'topic 101 summary' }],
        visibleMessages: []
    };

    await context.doSummary();

    assert.deepEqual(calls.replacement, [{ sourceTopicId: '101', targetTopicId: '202' }]);
    assert.equal(fetchCalls, 0);
    assert.equal(context.workspaceTopicId, '101');
    assert.equal(context.lastSummary, 'topic 101 summary');
    assert.equal(context.postContent, 'topic 101 content');
    assert.equal(context.chatSession.context.topicId, '101');
});

test('accepting replacement binds the new summary and conversation to the current topic', { concurrency: false }, async (t) => {
    const originalGetTopicId = Core.getTopicId;
    const originalFetch = Core.fetchDialoguesCached;
    const originalStream = Core.streamChat;
    const fetchedTopics = [];
    Core.getTopicId = () => '202';
    Core.fetchDialoguesCached = async (topicId, start, end) => {
        fetchedTopics.push({ topicId, start, end });
        return { text: 'topic 202 content', cacheHit: false, cacheEntry: null, rangeMapping: null };
    };
    Core.streamChat = async (_messages, onEvent, onDone) => {
        onEvent({ type: 'content_delta', text: 'topic 202 summary' });
        onDone({ finishReason: 'stop' });
    };
    replaceGlobal(t, 'GM_getValue', (_key, fallback) => fallback);
    t.after(() => {
        Core.getTopicId = originalGetTopicId;
        Core.fetchDialoguesCached = originalFetch;
        Core.streamChat = originalStream;
    });

    const { context, calls } = createSummaryHarness();
    context.workspaceTopicId = '101';
    context.lastSummary = 'topic 101 summary';

    await context.doSummary();

    assert.deepEqual(calls.replacement, [{ sourceTopicId: '101', targetTopicId: '202' }]);
    assert.deepEqual(fetchedTopics, [{ topicId: '202', start: 1, end: 5 }]);
    assert.equal(context.workspaceTopicId, '202');
    assert.equal(context.chatSession.context.topicId, '202');
    assert.equal(context.chatSession.context.postContent, 'topic 202 content');
    assert.equal(context.lastSummary, 'topic 202 summary');
    assert.equal(context.activeSummaryRequest, null);
});

test('a summary that finishes after navigation remains bound to its source topic', { concurrency: false }, async (t) => {
    let currentTopicId = '101';
    let callbacks;
    let finishStream;
    const streamPending = new Promise(resolve => { finishStream = resolve; });
    const originalGetTopicId = Core.getTopicId;
    const originalFetch = Core.fetchDialoguesCached;
    const originalStream = Core.streamChat;
    Core.getTopicId = () => currentTopicId;
    Core.fetchDialoguesCached = async () => ({
        text: 'topic 101 content',
        cacheHit: false,
        cacheEntry: null,
        rangeMapping: null
    });
    Core.streamChat = async (_messages, onEvent, onDone, onError) => {
        callbacks = { onEvent, onDone, onError };
        await streamPending;
    };
    replaceGlobal(t, 'GM_getValue', (_key, fallback) => fallback);
    t.after(() => {
        Core.getTopicId = originalGetTopicId;
        Core.fetchDialoguesCached = originalFetch;
        Core.streamChat = originalStream;
    });

    const { context, elements } = createSummaryHarness();
    const summaryPromise = context.doSummary();
    await new Promise(resolve => setTimeout(resolve, 0));
    assert.ok(callbacks);
    assert.equal(context.activeSummaryRequest.topicId, '101');

    currentTopicId = '202';
    context.onTopicRouteChange();
    callbacks.onEvent({ type: 'content_delta', text: 'topic 101 summary' });
    callbacks.onDone({ finishReason: 'stop' });
    finishStream();
    await summaryPromise;

    assert.equal(context.workspaceTopicId, '101');
    assert.equal(context.chatSession.context.topicId, '101');
    assert.equal(context.chatSession.context.postContent, 'topic 101 content');
    assert.equal(elements.get('#workspace-source-status-summary').hidden, false);
    assert.match(elements.get('#workspace-source-status-summary').textContent, /#101.*#202/);
});

test('automatic summary range is recalculated for the destination topic before fetching', { concurrency: false }, async (t) => {
    const originalGetTopicId = Core.getTopicId;
    const originalFetch = Core.fetchDialoguesCached;
    const originalStream = Core.streamChat;
    const fetchedRanges = [];
    Core.getTopicId = () => '202';
    Core.fetchDialoguesCached = async (_topicId, start, end) => {
        fetchedRanges.push([start, end]);
        return { text: 'topic content', cacheHit: false, cacheEntry: null, rangeMapping: null };
    };
    Core.streamChat = async (_messages, onEvent, onDone) => {
        onEvent({ type: 'content_delta', text: 'summary' });
        onDone({ finishReason: 'stop' });
    };
    replaceGlobal(t, 'GM_getValue', (_key, fallback) => fallback);
    t.after(() => {
        Core.getTopicId = originalGetTopicId;
        Core.fetchDialoguesCached = originalFetch;
        Core.streamChat = originalStream;
    });

    const { context, calls } = createSummaryHarness();
    context.rangeMode = 'recent';
    context.rangeBoundsTopicId = '101';

    await context.doSummary();

    assert.deepEqual(calls.rangeModes, ['recent']);
    assert.deepEqual(fetchedRanges, [[11, 20]]);
    assert.equal(context.rangeBoundsTopicId, '202');
});

test('automatic export range is recalculated for the destination topic before fetching', { concurrency: false }, async (t) => {
    const originalGetTopicId = Core.getTopicId;
    const originalFetch = Core.fetchTopicPosts;
    const fetchedRanges = [];
    Core.getTopicId = () => '202';
    Core.fetchTopicPosts = async (_topicId, start, end) => {
        fetchedRanges.push([start, end]);
        return { topicData: {}, posts: [{ post_number: 11 }], rangeMapping: null };
    };
    t.after(() => {
        Core.getTopicId = originalGetTopicId;
        Core.fetchTopicPosts = originalFetch;
    });

    const elements = new Map([
        ['#export-type', { value: 'ai' }],
        ['#export-start', { value: '1' }],
        ['#export-end', { value: '5' }],
        ['#export-status', { innerHTML: '', classList: createClassList(['empty']) }]
    ]);
    const rangeModes = [];
    const context = {
        ...style1Helpers,
        exportRangeMode: 'recent',
        exportRangeBoundsTopicId: '101',
        uiManager: { Q(selector) { return elements.get(selector) || null; } },
        setExportRange: async (mode) => {
            rangeModes.push(mode);
            elements.get('#export-start').value = '11';
            elements.get('#export-end').value = '20';
            context.exportRangeBoundsTopicId = '202';
            return true;
        },
        waitForRangeConfirmation: async () => true,
        setLoading() {},
        exportAsAiText: async () => {},
        showToast() {}
    };

    await context.doExport();

    assert.deepEqual(rangeModes, ['recent']);
    assert.deepEqual(fetchedRanges, [[11, 20]]);
    assert.equal(context.exportRangeBoundsTopicId, '202');
});

test('summary and export range ownership remain independent on the same topic', { concurrency: false }, async (t) => {
    const originalGetTopicId = Core.getTopicId;
    const originalGetTopicBounds = Core.getTopicBounds;
    Core.getTopicId = () => '202';
    Core.getTopicBounds = async () => ({ highestPostNumber: 80 });
    replaceGlobal(t, 'GM_getValue', (_key, fallback) => fallback);
    t.after(() => {
        Core.getTopicId = originalGetTopicId;
        Core.getTopicBounds = originalGetTopicBounds;
    });

    const elements = new Map([
        ['#inp-start', { value: '1' }],
        ['#inp-end', { value: '5' }],
        ['#export-start', { value: '1' }],
        ['#export-end', { value: '5' }]
    ]);
    const createContext = () => ({
        ...style1Helpers,
        ...style1State,
        lifecycleEpoch: {},
        rangeRequestSeq: 0,
        exportRangeRequestSeq: 0,
        rangeConfirmationPromise: null,
        exportRangeConfirmationPromise: null,
        rangeBoundsTopicId: '',
        exportRangeBoundsTopicId: '',
        rangeBoundsLastRefreshAt: 0,
        uiManager: { Q(selector) { return elements.get(selector) || null; } },
        applyOptimisticRangeFromCache: () => ({ applied: false }),
        setRangeButtonsLoading() {},
        showToast() {}
    });

    const summaryFirst = createContext();
    assert.equal(await summaryFirst.setRange('recent'), true);
    assert.equal(summaryFirst.rangeBoundsTopicId, '202');
    assert.equal(summaryFirst.exportRangeBoundsTopicId, '');
    assert.equal(await summaryFirst.setExportRange('recent'), true);
    assert.equal(summaryFirst.exportRangeBoundsTopicId, '202');

    const exportFirst = createContext();
    assert.equal(await exportFirst.setExportRange('recent'), true);
    assert.equal(exportFirst.exportRangeBoundsTopicId, '202');
    assert.equal(exportFirst.rangeBoundsTopicId, '');
    assert.equal(await exportFirst.setRange('recent'), true);
    assert.equal(exportFirst.rangeBoundsTopicId, '202');
});

test('a stale range rejection cannot restore or unlock a new UI lifecycle', { concurrency: false }, async (t) => {
    let rejectRange;
    const rangePending = new Promise((_resolve, reject) => { rejectRange = reject; });
    const originalGetTopicId = Core.getTopicId;
    Core.getTopicId = () => '101';
    replaceGlobal(t, 'GM_getValue', (_key, fallback) => fallback);
    t.after(() => { Core.getTopicId = originalGetTopicId; });

    const lifecycleEpoch = {};
    const loadingStates = [];
    let restores = 0;
    const context = {
        ...style1Helpers,
        ...style1State,
        lifecycleEpoch,
        rangeRequestSeq: 0,
        rangeConfirmationPromise: null,
        uiManager: { Q() { return { value: '' }; } },
        applyOptimisticRangeFromCache: () => ({ applied: true, start: 1, end: 5, max: 5 }),
        getRangeUpperBound: () => rangePending,
        setRangeButtonsLoading: (_scope, loading) => { loadingStates.push(loading); },
        restoreOptimisticRange: () => { restores += 1; },
        showToast() {}
    };

    const pendingResult = context.setRange('recent');
    context.lifecycleEpoch = {};
    context.rangeRequestSeq = 1;
    rejectRange(new Error('late failure'));

    assert.equal(await pendingResult, false);
    assert.deepEqual(loadingStates, [true]);
    assert.equal(restores, 0);
});
