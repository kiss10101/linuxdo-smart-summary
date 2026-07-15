import assert from 'node:assert/strict';
import test from 'node:test';

import { Core } from '../src/core/index.js';
import { style1Interactions } from '../src/ui/style1/interactions.js';

function createHarness({ draft = '', isGenerating = false, selectionText = '选中的总结片段' } = {}) {
    const input = {
        value: draft,
        scrollHeight: 48,
        style: { height: '' },
        focused: false,
        focus() {
            this.focused = true;
        }
    };
    const calls = {
        clearedSelection: 0,
        closedMenu: 0,
        sent: 0,
        switchedTabs: [],
        toasts: []
    };

    const context = {
        ...style1Interactions,
        uiManager: {
            Q(selector) {
                return selector === '#chat-input' ? input : null;
            }
        },
        chatSession: {
            context: { topicId: 'fixture-topic' },
            baseMessages: [{ role: 'system', content: 'fixture' }],
            visibleMessages: []
        },
        currentSummarySelection: {
            text: selectionText,
            truncated: selectionText.length > 2000,
            rect: { left: 0, right: 10, top: 0, bottom: 10, width: 10, height: 10 }
        },
        editingMessageId: null,
        isGenerating,
        closeSummarySelectionMenu() {
            calls.closedMenu += 1;
            this.currentSummarySelection = null;
        },
        clearCurrentSelection() {
            calls.clearedSelection += 1;
        },
        switchTab(tabName) {
            calls.switchedTabs.push(tabName);
        },
        showToast(message, type = 'info') {
            calls.toasts.push({ message, type });
        },
        async doChat() {
            calls.sent += 1;
        }
    };

    return { context, input, calls };
}

test('selection actions expose the exact explain, simplify, and quote contracts', () => {
    const explain = Core.buildSummarySelectionPrompt('explain', '概念片段');
    const simplify = Core.buildSummarySelectionPrompt('simplify', '冗长片段');
    const quote = Core.buildSummarySelectionPrompt('quote', '引用片段');

    assert.equal(explain.action, 'explain');
    assert.equal(explain.autoSend, true);
    assert.match(explain.prompt, /原帖讨论/);

    assert.equal(simplify.action, 'simplify');
    assert.equal(simplify.autoSend, true);
    assert.match(simplify.prompt, /更短、更清晰/);
    assert.doesNotMatch(simplify.prompt, /整篇主题进行总结/);

    assert.equal(quote.action, 'quote');
    assert.equal(quote.autoSend, false);
    assert.equal(quote.prompt, '> 引用片段\n\n');
});

for (const action of ['explain', 'simplify']) {
    test(`${action} auto-sends only when idle and the chat draft is empty`, async () => {
        const { context, input, calls } = createHarness();

        await context.handleSummarySelectionAction(action);

        assert.equal(calls.sent, 1);
        assert.deepEqual(calls.switchedTabs, ['chat']);
        assert.equal(calls.closedMenu, 1);
        assert.equal(calls.clearedSelection, 1);
        assert.equal(input.focused, true);
        assert.match(input.value, /选中的总结片段/);
    });
}

test('an existing draft is preserved and prevents selection auto-send', async () => {
    const { context, input, calls } = createHarness({ draft: '我原来的问题' });

    await context.handleSummarySelectionAction('explain');

    assert.equal(calls.sent, 0);
    assert.match(input.value, /^我原来的问题\n\n---\n请解释/);
    assert.ok(calls.toasts.some(({ message }) => message === '已有输入草稿，已追加选区内容'));
});

test('an active generation preserves the pending action as a draft instead of starting a parallel request', async () => {
    const { context, input, calls } = createHarness({ isGenerating: true });

    await context.handleSummarySelectionAction('simplify');

    assert.equal(calls.sent, 0);
    assert.match(input.value, /^请只针对下面这段总结内容进行精简/);
    assert.ok(calls.toasts.some(({ message }) => message === '当前正在生成，已先填入输入框'));
});

test('quote inserts a multiline blockquote, leaves a writing gap, and never auto-sends', async () => {
    const { context, input, calls } = createHarness({ selectionText: '第一行\n第二行' });

    await context.handleSummarySelectionAction('quote');

    assert.equal(calls.sent, 0);
    assert.equal(input.value, '> 第一行\n> 第二行\n\n');
    assert.equal(input.focused, true);
});

test('long selections are capped at 2000 characters and surface a visible truncation notice', async () => {
    const selectionText = '长'.repeat(2100);
    const { context, input, calls } = createHarness({ selectionText });

    await context.handleSummarySelectionAction('quote');

    assert.equal(calls.sent, 0);
    assert.ok(input.value.includes('已截取前 2000 字'));
    assert.ok(!input.value.includes('长'.repeat(2001)));
    assert.ok(calls.toasts.some(({ message }) => message === '选区较长，已截取前 2000 字'));
});
