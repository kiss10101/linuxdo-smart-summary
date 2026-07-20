import assert from 'node:assert/strict';
import test from 'node:test';

import { style1Helpers } from '../src/ui/style1/helpers.js';
import { style1Lifecycle } from '../src/ui/style1/lifecycle.js';

function createClassList() {
    const values = new Set();
    return {
        add(name) { values.add(name); },
        remove(name) { values.delete(name); },
        contains(name) { return values.has(name); }
    };
}

test('visual viewport updates stable height and width variables only', (t) => {
    const originalWindow = globalThis.window;
    t.after(() => {
        globalThis.window = originalWindow;
    });
    globalThis.window = {
        innerHeight: 700,
        innerWidth: 400,
        visualViewport: { height: 500.4, width: 320.6, offsetTop: 12.4 }
    };

    const values = new Map();
    style1Lifecycle.syncVisualViewport.call({
        uiManager: {
            host: {
                style: {
                    setProperty(name, value) {
                        values.set(name, value);
                    }
                }
            }
        }
    });

    assert.deepEqual([...values], [
        ['--ui-viewport-height', '500px'],
        ['--ui-viewport-width', '321px']
    ]);
});

test('chat input height follows the active theme CSS limit', (t) => {
    const originalGetComputedStyle = globalThis.getComputedStyle;
    t.after(() => {
        globalThis.getComputedStyle = originalGetComputedStyle;
    });
    globalThis.getComputedStyle = () => ({ maxHeight: '120px' });
    const input = { scrollHeight: 220, style: {} };
    const context = { chatInputMaxHeights: new WeakMap() };

    style1Lifecycle.resizeChatInput.call(context, input);

    assert.equal(input.style.height, '120px');
    input.scrollHeight = 80;
    style1Lifecycle.resizeChatInput.call(context, input);
    assert.equal(input.style.height, '80px');
});

test('model picker moves focus inside and restores the opener on close', () => {
    let openerFocusCount = 0;
    let firstControlFocusCount = 0;
    const opener = { isConnected: true, focus() { openerFocusCount += 1; } };
    const firstControl = { focus() { firstControlFocusCount += 1; } };
    const modal = {
        classList: createClassList(),
        setAttribute() {},
        getRootNode() { return { activeElement: opener }; },
        querySelector() { return firstControl; }
    };
    const frames = [];
    const context = {
        ...style1Helpers,
        uiManager: {
            Q(selector) {
                if (selector === '#model-picker-modal') return modal;
                if (selector === '#btn-fetch-models') return opener;
                return null;
            }
        },
        closeMessageContextMenu() {},
        closeSummarySelectionMenu() {},
        requestManagedFrame(callback) { frames.push(callback); },
        loadModelList() {},
        cancelModelListRequest() {}
    };

    context.openModelPicker();
    assert.equal(context.modelPickerReturnFocus, opener);
    assert.equal(modal.classList.contains('show'), true);
    frames.shift()();
    assert.equal(firstControlFocusCount, 1);

    context.closeModelPicker();
    assert.equal(openerFocusCount, 1);
    assert.equal(context.modelPickerReturnFocus, null);
    assert.equal(modal.classList.contains('show'), false);
});

test('completed bubble render tasks release their DOM references', () => {
    let timerCallback = null;
    let frameCallback = null;
    let renders = 0;
    const context = {
        bubbleRenderTasks: new Map(),
        streamingRenderDelayMs: 80,
        getStreamingRenderDelay: style1Lifecycle.getStreamingRenderDelay,
        setManagedTimeout(callback) {
            timerCallback = callback;
            return 1;
        },
        requestManagedFrame(callback) {
            frameCallback = callback;
            return 2;
        },
        updateBubble() { renders += 1; },
        scrollToBottom() {}
    };

    style1Lifecycle.scheduleBubbleRender.call(context, 'a1', { dataset: { messageId: 'a1' } }, () => 'text');
    timerCallback();
    frameCallback();

    assert.equal(renders, 1);
    assert.equal(context.bubbleRenderTasks.size, 0);
});

test('destroy aborts active work and releases retained runtime state', (t) => {
    const originalCancelAnimationFrame = globalThis.cancelAnimationFrame;
    t.after(() => {
        globalThis.cancelAnimationFrame = originalCancelAnimationFrame;
    });
    const cancelledFrames = [];
    globalThis.cancelAnimationFrame = (frameId) => cancelledFrames.push(frameId);

    const calls = [];
    const context = {
        closeWorkspaceReplacementConfirm() {},
        closeModelPicker(options) { calls.push(['model', options]); },
        abortActiveExportRequest(reason) { calls.push(['export', reason]); },
        cancelModelListRequest() {},
        clearChatContext() { calls.push(['chat']); },
        resetGlobalUiState() {},
        activeSummaryRequest: null,
        activeChatRequest: null,
        activeExportRequest: {},
        _cleanupFns: [() => calls.push(['cleanup'])],
        _timerIds: new Set(),
        _frameIds: new Set([9]),
        bubbleRenderTasks: new Map([['a1', {}]]),
        pendingSettingsStorageSyncKeys: new Set(['x']),
        dirtySettingsKeys: new Set(['y']),
        apiProfiles: [{ id: 'one' }],
        summarySelectionRequestSeq: 0,
        uiManager: {}
    };

    style1Lifecycle.destroy.call(context);

    assert.deepEqual(calls, [
        ['model', { restoreFocus: false }],
        ['export', 'destroy'],
        ['cleanup'],
        ['chat']
    ]);
    assert.deepEqual(cancelledFrames, [9]);
    assert.equal(context.bubbleRenderTasks.size, 0);
    assert.equal(context.pendingSettingsStorageSyncKeys.size, 0);
    assert.equal(context.dirtySettingsKeys.size, 0);
    assert.deepEqual(context.apiProfiles, []);
    assert.equal(context.activeExportRequest, null);
    assert.equal(context.uiManager, null);
});
