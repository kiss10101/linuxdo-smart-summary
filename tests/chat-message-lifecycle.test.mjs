import assert from 'node:assert/strict';
import test from 'node:test';

import { Core } from '../src/core/index.js';
import { style1Helpers } from '../src/ui/style1/helpers.js';
import { style1Interactions } from '../src/ui/style1/interactions.js';
import { style1State } from '../src/ui/style1/state.js';

function createHarness(messages = []) {
    const classNames = new Set();
    const emptyState = {
        innerHTML: '',
        classList: {
            add(name) { classNames.add(name); },
            remove(name) { classNames.delete(name); },
            contains(name) { return classNames.has(name); }
        }
    };
    const calls = {
        renders: 0,
        toasts: [],
        requestedUsers: []
    };
    return {
        ...style1State,
        ...style1Interactions,
        uiManager: {
            Q(selector) {
                if (selector === '#chat-empty') return emptyState;
                if (selector === '#chat-list') return { innerHTML: '', querySelectorAll: () => [] };
                return null;
            }
        },
        chatSession: {
            context: null,
            baseMessages: [],
            visibleMessages: messages
        },
        chatHistory: [],
        chatRequestSeq: 0,
        activeChatRequest: null,
        currentAiAbortController: null,
        currentAiAbortScope: '',
        isGenerating: false,
        editingMessageId: null,
        _calls: calls,
        _emptyState: emptyState,
        syncLegacyChatHistory() {},
        updateMessageCount() {},
        cancelBubbleRender() {},
        getBubbleElement() { return null; },
        renderBubbleContent() {},
        renderChatMessages() { calls.renders += 1; },
        closeMessageContextMenu() {},
        showToast(messageText, type = 'info') {
            calls.toasts.push({ message: messageText, type });
        },
        startAiAbortController(scope) {
            const controller = new AbortController();
            this.currentAiAbortController = controller;
            this.currentAiAbortScope = scope;
            return controller;
        },
        clearAiAbortController(controller) {
            if (this.currentAiAbortController && this.currentAiAbortController !== controller) return;
            this.currentAiAbortController = null;
            this.currentAiAbortScope = '';
        },
        setLoading(_selector, loading) {
            this.isGenerating = loading;
        },
        updateChatInputMode() {},
        updateScrollButtons() {}
    };
}

function message(id, role, content, overrides = {}) {
    return {
        id,
        role,
        content,
        rawContent: overrides.rawContent ?? content,
        outputState: overrides.outputState || null,
        status: overrides.status || 'done',
        errorKind: overrides.errorKind || null,
        errorMessage: overrides.errorMessage || '',
        errorMeta: null,
        sourceConfig: null,
        excludeFromApi: overrides.excludeFromApi === true,
        regenerateFromUserId: overrides.regenerateFromUserId || null,
        createdAt: 1,
        updatedAt: 1
    };
}

function actionIds(context, target) {
    return context.getMessageMenuActions(target).map(action => action.id);
}

test('completed messages expose copy, regenerate, edit, and delete in the required order', () => {
    const user = message('u1', 'user', '问题');
    const assistant = message('a1', 'assistant', '回答', {
        outputState: Core.createAiOutputState({ contentText: '回答' }),
        regenerateFromUserId: 'u1'
    });
    const context = createHarness([user, assistant]);

    assert.deepEqual(actionIds(context, user), ['copy', 'regenerate', 'edit', 'delete']);
    assert.deepEqual(actionIds(context, assistant), ['copy', 'regenerate', 'edit', 'delete']);
    assert.deepEqual(
        context.getMessageMenuActions(assistant).map(action => action.label),
        ['复制消息', '重新生成', '编辑消息', '删除消息']
    );
});

test('during generation only the active streaming assistant gets mutation actions', () => {
    const oldUser = message('u0', 'user', '旧问题');
    const oldAssistant = message('a0', 'assistant', '旧回答', {
        outputState: Core.createAiOutputState({ contentText: '旧回答' }),
        regenerateFromUserId: 'u0'
    });
    const user = message('u1', 'user', '当前问题', { excludeFromApi: true });
    const outputState = Core.createAiOutputState({ reasoningText: '推理中' });
    const assistant = message('a1', 'assistant', '', {
        status: 'streaming',
        outputState,
        regenerateFromUserId: 'u1',
        excludeFromApi: true
    });
    const context = createHarness([oldUser, oldAssistant, user, assistant]);
    context.isGenerating = true;
    context.activeChatRequest = {
        token: 3,
        assistantMessageId: 'a1',
        userMessageId: 'u1',
        outputState
    };

    assert.deepEqual(actionIds(context, assistant), ['copy', 'regenerate', 'stop', 'delete']);
    assert.deepEqual(
        context.getMessageMenuActions(assistant).map(action => action.label),
        ['复制消息', '重新生成', '停止更新', '删除消息']
    );
    assert.deepEqual(actionIds(context, user), ['copy']);
    assert.deepEqual(actionIds(context, oldUser), ['copy']);
    assert.deepEqual(actionIds(context, oldAssistant), ['copy']);

    const copy = context.getMessageMenuAction(assistant, 'copy');
    assert.equal(copy.disabled, true);
    assert.equal(copy.disabledReason, '尚无可复制正文');
});

test('stopped and failed assistant messages remain safely regenerable and deletable', () => {
    const user = message('u1', 'user', '问题', { excludeFromApi: true });
    const stopped = message('a1', 'assistant', '部分回答', {
        status: 'stopped',
        outputState: Core.createAiOutputState({ reasoningText: '内部推理', contentText: '部分回答', partial: true }),
        regenerateFromUserId: 'u1',
        excludeFromApi: true
    });
    const failed = message('a2', 'assistant', '', {
        status: 'error',
        errorKind: 'empty_response',
        regenerateFromUserId: 'u1',
        excludeFromApi: true
    });
    const context = createHarness([user, stopped, failed]);

    assert.deepEqual(actionIds(context, stopped), ['copy', 'regenerate', 'delete']);
    assert.equal(context.getMessageMenuAction(stopped, 'copy').disabled, false);
    assert.deepEqual(actionIds(context, failed), ['copy', 'regenerate', 'delete']);
    assert.equal(context.getMessageMenuAction(failed, 'copy').disabled, true);
});

test('message action descriptors cover the complete approved state matrix', () => {
    const oldUser = message('u0', 'user', '旧问题');
    const oldAssistant = message('a0', 'assistant', '旧回答', {
        outputState: Core.createAiOutputState({ contentText: '旧回答' }),
        regenerateFromUserId: 'u0'
    });
    const user = message('u1', 'user', '当前问题', { excludeFromApi: true });
    const outputState = Core.createAiOutputState({ contentText: '部分正文' });
    const assistant = message('a1', 'assistant', '部分正文', {
        status: 'streaming',
        outputState,
        regenerateFromUserId: 'u1',
        excludeFromApi: true
    });
    const context = createHarness([oldUser, oldAssistant, user, assistant]);
    context.isGenerating = true;
    context.activeChatRequest = {
        token: 5,
        controller: new AbortController(),
        assistantMessageId: 'a1',
        userMessageId: 'u1',
        outputState,
        phase: 'preparing',
        abortReason: ''
    };

    const matrix = [
        [oldUser, ['copy']],
        [oldAssistant, ['copy']],
        [user, ['copy']],
        [assistant, ['copy', 'regenerate', 'stop', 'delete']]
    ];
    for (const [target, expected] of matrix) {
        assert.deepEqual(actionIds(context, target), expected, `${target.id} actions`);
    }

    const actions = context.getMessageMenuActions(assistant);
    assert.equal(actions[0].disabled, false);
    assert.equal(actions.at(-1).danger, true);
    for (const action of actions) {
        assert.equal(action.visible, true);
        assert.equal(typeof action.disabled, 'boolean');
        assert.equal(typeof action.disabledReason, 'string');
        assert.equal(typeof action.danger, 'boolean');
    }
});

test('partial failed assistants remain copyable while empty failures explain why copy is unavailable', () => {
    const user = message('u1', 'user', '问题', { excludeFromApi: true });
    const partialFailure = message('a1', 'assistant', '保留下来的部分回答', {
        status: 'error',
        outputState: Core.createAiOutputState({
            reasoningText: '内部推理',
            contentText: '保留下来的部分回答',
            partial: true
        }),
        regenerateFromUserId: 'u1',
        excludeFromApi: true
    });
    const emptyFailure = message('a2', 'assistant', '', {
        status: 'error',
        outputState: Core.createAiOutputState({ reasoningText: '只有推理' }),
        regenerateFromUserId: 'u1',
        excludeFromApi: true
    });
    const context = createHarness([user, partialFailure, emptyFailure]);

    assert.equal(context.getMessageMenuAction(partialFailure, 'copy').disabled, false);
    assert.equal(context.getMessageCopyText(partialFailure), '保留下来的部分回答');
    assert.equal(context.getMessageMenuAction(emptyFailure, 'copy').disabled, true);
    assert.equal(context.getMessageMenuAction(emptyFailure, 'copy').disabledReason, '尚无可复制正文');
});

test('assistant copy text contains answer only and never reasoning', () => {
    const outputState = Core.createAiOutputState({
        reasoningText: '不应复制的推理',
        contentText: '只复制最终回答'
    });
    const assistant = message('a1', 'assistant', '只复制最终回答', {
        rawContent: '<think>不应复制的推理</think>只复制最终回答',
        outputState
    });
    const context = createHarness([assistant]);

    assert.equal(context.getMessageCopyText(assistant), '只复制最终回答');
    assert.equal(context.getMessageCopyText({
        ...assistant,
        outputState: null
    }), '只复制最终回答');
});

test('stopping invalidates the request token before abort and preserves partial output', () => {
    const user = message('u1', 'user', '问题', { excludeFromApi: true });
    const outputState = Core.createAiOutputState({
        reasoningText: '已生成推理',
        contentText: '已生成正文'
    });
    const assistant = message('a1', 'assistant', '', {
        status: 'streaming',
        outputState,
        regenerateFromUserId: 'u1',
        excludeFromApi: true
    });
    const context = createHarness([user, assistant]);
    const controller = new AbortController();
    const request = {
        token: 7,
        controller,
        userMessageId: 'u1',
        assistantMessageId: 'a1',
        outputState,
        phase: 'streaming',
        abortReason: ''
    };
    context.chatRequestSeq = 7;
    context.activeChatRequest = request;
    context.currentAiAbortController = controller;
    context.currentAiAbortScope = 'chat';
    context.isGenerating = true;

    assert.equal(context.isCurrentChatRequest(request), true);
    const aborted = context.abortActiveChatRequest('stop');

    assert.equal(aborted, request);
    assert.equal(request.abortReason, 'stop');
    assert.equal(controller.signal.aborted, true);
    assert.equal(context.activeChatRequest, null);
    assert.equal(context.chatRequestSeq, 8);
    assert.equal(context.isCurrentChatRequest(request), false);
    assert.equal(context.isGenerating, false);

    const stopped = context.findVisibleMessage('a1');
    assert.equal(stopped.status, 'stopped');
    assert.equal(stopped.content, '已生成正文');
    assert.equal(stopped.outputState.reasoningText, '已生成推理');
    assert.equal(stopped.outputState.contentText, '已生成正文');
    assert.equal(stopped.outputState.phase, 'stopped');
    assert.equal(stopped.outputState.partial, true);
    assert.equal(stopped.excludeFromApi, true);
    assert.equal(context.findVisibleMessage('u1').excludeFromApi, true);
});

test('regenerate abort invalidates stale callbacks without converting the soon-to-be-removed bubble', () => {
    const user = message('u1', 'user', '问题', { excludeFromApi: true });
    const outputState = Core.createAiOutputState({ contentText: '旧流式正文' });
    const assistant = message('a1', 'assistant', '', {
        status: 'streaming',
        outputState,
        regenerateFromUserId: 'u1',
        excludeFromApi: true
    });
    const context = createHarness([user, assistant]);
    const controller = new AbortController();
    const request = {
        token: 2,
        controller,
        userMessageId: 'u1',
        assistantMessageId: 'a1',
        outputState,
        phase: 'streaming',
        abortReason: ''
    };
    context.chatRequestSeq = 2;
    context.activeChatRequest = request;
    context.currentAiAbortController = controller;
    context.currentAiAbortScope = 'chat';
    context.isGenerating = true;

    context.abortActiveChatRequest('regenerate');

    assert.equal(request.abortReason, 'regenerate');
    assert.equal(context.isCurrentChatRequest(request), false);
    assert.equal(context.findVisibleMessage('a1').status, 'streaming');
});

test('every throttled and final AI bubble render restores exactly one menu trigger', () => {
    class FakeElement {
        constructor(tagName = 'div') {
            this.tagName = tagName;
            this.dataset = {};
            this.attributes = new Map();
            this.children = [];
            this.className = '';
            this.classList = { toggle() {} };
            this._innerHTML = '';
        }

        set innerHTML(value) {
            this._innerHTML = value;
            this.children = [];
        }

        get innerHTML() {
            return this._innerHTML;
        }

        setAttribute(name, value) {
            this.attributes.set(name, String(value));
        }

        appendChild(child) {
            this.children.push(child);
            return child;
        }

        querySelector(selector) {
            if (selector === '[data-message-menu-trigger]') {
                return this.children.find(child => Object.hasOwn(child.dataset, 'messageMenuTrigger')) || null;
            }
            return null;
        }
    }

    const previousDocument = globalThis.document;
    const previousGetValue = globalThis.GM_getValue;
    globalThis.document = { createElement: tagName => new FakeElement(tagName) };
    globalThis.GM_getValue = () => false;

    try {
        const user = message('u1', 'user', '问题');
        const assistant = message('a1', 'assistant', '', {
            status: 'streaming',
            outputState: Core.createAiOutputState({ contentText: '第一段' }),
            regenerateFromUserId: 'u1'
        });
        const context = {
            ...createHarness([user, assistant]),
            ...style1Helpers,
            ensureMessageMenuTrigger: style1Interactions.ensureMessageMenuTrigger,
            getMessageCopyText: style1Interactions.getMessageCopyText,
            currentMessageMenuId: null,
            getReasoningPanelViewState() { return { expansion: 'auto' }; },
            renderWithThinking(output) { return `<p>${output.contentText}</p>`; },
            setManagedTimeout() {}
        };
        const bubble = new FakeElement();
        bubble.dataset.messageId = 'a1';

        context.updateBubble(bubble, Core.createAiOutputState({ contentText: '第一段' }), true);
        assert.equal(bubble.children.length, 1);
        assert.equal(bubble.children[0].dataset.messageId, 'a1');

        context.updateBubble(bubble, Core.createAiOutputState({ contentText: '最终回答' }), false);
        assert.equal(bubble.children.length, 1);
        assert.equal(bubble.children[0].dataset.messageId, 'a1');
        assert.equal(context.getMessageCopyText(assistant), '最终回答');
        assert.equal(context.getMessageCopyText(assistant).includes('⋯'), false);
    } finally {
        if (previousDocument === undefined) delete globalThis.document;
        else globalThis.document = previousDocument;
        if (previousGetValue === undefined) delete globalThis.GM_getValue;
        else globalThis.GM_getValue = previousGetValue;
    }
});

test('regenerating the active response aborts, removes the stale branch, and restarts from its paired user', async () => {
    const user = message('u1', 'user', '问题', { excludeFromApi: true });
    const outputState = Core.createAiOutputState({ contentText: '旧流式正文' });
    const assistant = message('a1', 'assistant', '旧流式正文', {
        status: 'streaming',
        outputState,
        regenerateFromUserId: 'u1',
        excludeFromApi: true
    });
    const context = createHarness([user, assistant]);
    const controller = new AbortController();
    const request = {
        token: 9,
        controller,
        userMessageId: 'u1',
        assistantMessageId: 'a1',
        outputState,
        phase: 'streaming',
        abortReason: ''
    };
    context.chatRequestSeq = 9;
    context.activeChatRequest = request;
    context.currentAiAbortController = controller;
    context.currentAiAbortScope = 'chat';
    context.isGenerating = true;
    context.requestAssistantForUser = async (requestedUser) => {
        context._calls.requestedUsers.push(requestedUser.id);
    };

    await context.regenerateMessage('a1');

    assert.equal(request.abortReason, 'regenerate');
    assert.equal(controller.signal.aborted, true);
    assert.equal(context.findVisibleMessage('a1'), null);
    assert.deepEqual(context.chatSession.visibleMessages.map(item => item.id), ['u1']);
    assert.deepEqual(context._calls.requestedUsers, ['u1']);
    assert.equal(context.isCurrentChatRequest(request), false);
});

test('deleting the active response aborts before removal and leaves its user excluded from API history', () => {
    const user = message('u1', 'user', '问题');
    const outputState = Core.createAiOutputState({ contentText: '部分正文' });
    const assistant = message('a1', 'assistant', '部分正文', {
        status: 'streaming',
        outputState,
        regenerateFromUserId: 'u1',
        excludeFromApi: true
    });
    const context = createHarness([user, assistant]);
    const controller = new AbortController();
    const request = {
        token: 11,
        controller,
        userMessageId: 'u1',
        assistantMessageId: 'a1',
        outputState,
        phase: 'streaming',
        abortReason: ''
    };
    context.chatRequestSeq = 11;
    context.activeChatRequest = request;
    context.currentAiAbortController = controller;
    context.currentAiAbortScope = 'chat';
    context.isGenerating = true;

    context.deleteMessage('a1');

    assert.equal(request.abortReason, 'delete');
    assert.equal(controller.signal.aborted, true);
    assert.equal(context.isCurrentChatRequest(request), false);
    assert.equal(context.findVisibleMessage('a1'), null);
    assert.equal(context.findVisibleMessage('u1').excludeFromApi, true);
    assert.deepEqual(context.chatSession.visibleMessages.map(item => item.id), ['u1']);
});

test('late stream callbacks cannot restore a response deleted during generation', async (t) => {
    const originalStreamChat = Core.streamChat;
    t.after(() => {
        Core.streamChat = originalStreamChat;
    });

    let callbacks = null;
    let resolveStream;
    const streamPending = new Promise(resolve => {
        resolveStream = resolve;
    });
    Core.streamChat = async (_messages, onEvent, onDone, onError) => {
        callbacks = { onEvent, onDone, onError };
        await streamPending;
    };

    const user = message('u1', 'user', '问题', { excludeFromApi: true });
    const context = createHarness([user]);
    context.chatSession.baseMessages = [{ role: 'system', content: 'system' }];

    const requestPromise = context.requestAssistantForUser(user);
    assert.ok(callbacks);
    const activeRequest = context.activeChatRequest;
    const assistantId = activeRequest.assistantMessageId;

    callbacks.onEvent({ type: 'content_delta', text: '删除前的部分正文' });
    assert.equal(context.findVisibleMessage(assistantId).outputState.contentText, '删除前的部分正文');

    context.deleteMessage(assistantId);
    assert.equal(context.findVisibleMessage(assistantId), null);
    assert.equal(context.isCurrentChatRequest(activeRequest), false);

    callbacks.onEvent({ type: 'content_delta', text: '迟到正文' });
    callbacks.onDone({ finishReason: 'stop' });
    callbacks.onError(new Error('迟到错误'));
    assert.equal(context.findVisibleMessage(assistantId), null);

    resolveStream();
    await requestPromise;

    assert.equal(context.findVisibleMessage(assistantId), null);
    assert.equal(context.activeChatRequest, null);
    assert.equal(context.isGenerating, false);
});

test('a stale request finalizer cannot clear a newer active request', () => {
    const context = createHarness();
    const oldRequest = context.beginChatRequestLifecycle({
        userMessageId: 'u1',
        assistantMessageId: 'a1',
        outputState: Core.createAiOutputState(),
        controller: new AbortController()
    });
    const newRequest = context.beginChatRequestLifecycle({
        userMessageId: 'u2',
        assistantMessageId: 'a2',
        outputState: Core.createAiOutputState(),
        controller: new AbortController()
    });

    assert.equal(context.finalizeChatRequest(oldRequest), false);
    assert.equal(context.activeChatRequest, newRequest);
    assert.equal(context.isCurrentChatRequest(newRequest), true);
});

test('stream chunks update one bubble without rebuilding history or rescanning the DOM', async (t) => {
    const originalStreamChat = Core.streamChat;
    t.after(() => {
        Core.streamChat = originalStreamChat;
    });

    const user = message('u1', 'user', '问题', { excludeFromApi: true });
    const context = createHarness([user]);
    context.chatSession.baseMessages = [{ role: 'system', content: 'system' }];
    const bubble = { isConnected: true };
    let historySyncCount = 0;
    let bubbleLookupCount = 0;
    let scheduledBubbleCount = 0;
    context.syncLegacyChatHistory = () => {
        historySyncCount += 1;
    };
    context.getBubbleElement = () => {
        bubbleLookupCount += 1;
        return bubble;
    };
    context.scheduleBubbleRender = (_messageId, targetBubble) => {
        assert.equal(targetBubble, bubble);
        scheduledBubbleCount += 1;
    };
    context.updateBubble = () => {};
    context.scrollToBottom = () => {};

    Core.streamChat = async (_messages, onEvent, onDone) => {
        const syncBeforeChunks = historySyncCount;
        const lookupsBeforeChunks = bubbleLookupCount;
        onEvent({ type: 'content_delta', text: '第一段' });
        onEvent({ type: 'content_delta', text: '第二段' });
        assert.equal(historySyncCount, syncBeforeChunks);
        assert.equal(bubbleLookupCount, lookupsBeforeChunks);
        onDone({ finishReason: 'stop' });
    };

    await context.requestAssistantForUser(user);

    assert.equal(scheduledBubbleCount, 2);
    assert.equal(bubbleLookupCount, 1);
    assert.equal(context.findVisibleMessage(user.id).excludeFromApi, false);
    const assistant = context.chatSession.visibleMessages.at(-1);
    assert.equal(assistant.status, 'done');
    assert.equal(assistant.content, '第一段第二段');
});

test('rendering chat history requests one scroll after all bubbles', () => {
    const list = { innerHTML: '' };
    const empty = { classList: { add() {}, remove() {} } };
    const calls = { bubbles: [], scrolls: 0 };
    const context = {
        ...style1Interactions,
        chatSession: {
            visibleMessages: [
                message('u1', 'user', '问题一'),
                message('a1', 'assistant', '回答一'),
                message('u2', 'user', '问题二')
            ]
        },
        uiManager: {
            Q(selector) {
                if (selector === '#chat-list') return list;
                if (selector === '#chat-empty') return empty;
                return null;
            }
        },
        closeSummarySelectionMenu() {},
        addBubble(...args) {
            calls.bubbles.push(args);
        },
        scrollToBottom() {
            calls.scrolls += 1;
        },
        updateMessageCount() {},
        updateScrollButtons() {}
    };

    context.renderChatMessages();

    assert.equal(calls.bubbles.length, 3);
    assert.ok(calls.bubbles.every(([, , options]) => options?.scroll === false));
    assert.equal(calls.scrolls, 1);

    context.chatSession.visibleMessages = [];
    context.renderChatMessages();
    assert.equal(calls.scrolls, 1);
});
