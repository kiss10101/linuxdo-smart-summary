import assert from 'node:assert/strict';
import test from 'node:test';

import { Core } from '../src/core/index.js';
import { style1Helpers } from '../src/ui/style1/helpers.js';
import { style1Interactions } from '../src/ui/style1/interactions.js';

class FakeClassList {
    constructor(owner) {
        this.owner = owner;
        this.values = new Set();
    }

    reset(value) {
        this.values = new Set(String(value || '').split(/\s+/).filter(Boolean));
    }

    add(...names) {
        names.forEach(name => this.values.add(name));
    }

    remove(...names) {
        names.forEach(name => this.values.delete(name));
    }

    toggle(name, force) {
        const enabled = force === undefined ? !this.values.has(name) : Boolean(force);
        if (enabled) this.values.add(name);
        else this.values.delete(name);
        return enabled;
    }

    contains(name) {
        return this.values.has(name);
    }
}

class FakeElement {
    constructor(tagName = 'div') {
        this.tagName = tagName.toUpperCase();
        this.children = [];
        this.dataset = {};
        this.attributes = new Map();
        this.classList = new FakeClassList(this);
        this._className = '';
        this._innerHTML = '';
        this.textContent = '';
        this.parentElement = null;
        this.isConnected = true;
        this.tabIndex = -1;
    }

    set className(value) {
        this._className = String(value || '');
        this.classList.reset(this._className);
    }

    get className() {
        return [...this.classList.values].join(' ');
    }

    set innerHTML(value) {
        this._innerHTML = String(value || '');
        // Browser innerHTML replacement removes the existing ellipsis button.
        this.children = [];
    }

    get innerHTML() {
        return this._innerHTML;
    }

    appendChild(child) {
        child.parentElement = this;
        this.children.push(child);
        return child;
    }

    setAttribute(name, value) {
        this.attributes.set(name, String(value));
    }

    getAttribute(name) {
        return this.attributes.get(name) ?? null;
    }

    querySelector(selector) {
        return this.querySelectorAll(selector)[0] || null;
    }

    querySelectorAll(selector) {
        const matches = [];
        const matchesSelector = (element) => {
            if (selector === '[data-message-menu-trigger]') {
                return Object.hasOwn(element.dataset, 'messageMenuTrigger');
            }
            if (selector === '[data-thinking-block]') {
                return Object.hasOwn(element.dataset, 'thinkingBlock');
            }
            if (selector === '.thinking-content-inner') {
                return element.classList.contains('thinking-content-inner');
            }
            return false;
        };
        const visit = (element) => {
            element.children.forEach((child) => {
                if (matchesSelector(child)) matches.push(child);
                visit(child);
            });
        };
        visit(this);
        return matches;
    }
}

function createRenderHarness(message) {
    const chatList = new FakeElement('div');
    const context = {
        ...style1Interactions,
        ...style1Helpers,
        uiManager: {
            Q(selector) {
                return selector === '#chat-list' ? chatList : null;
            }
        },
        chatSession: {
            context: null,
            baseMessages: [],
            visibleMessages: [message]
        },
        currentMessageMenuId: null,
        ICONS: { brain: 'brain', arrowDown: 'down' },
        scrollToBottom() {},
        setManagedTimeout(handler) {
            handler();
            return 1;
        }
    };
    return { context, chatList };
}

function assertSingleTrigger(bubble, label) {
    const triggers = bubble.querySelectorAll('[data-message-menu-trigger]');
    assert.equal(triggers.length, 1, `${label}: expected exactly one message action trigger`);
    assert.equal(triggers[0].tagName, 'BUTTON');
    assert.equal(triggers[0].dataset.messageId, bubble.dataset.messageId);
    assert.equal(triggers[0].getAttribute('aria-haspopup'), 'menu');
}

test('AI message trigger survives repeated streaming renders and the final render without duplication', (t) => {
    const originalDocument = globalThis.document;
    const originalGetValue = globalThis.GM_getValue;
    t.after(() => {
        globalThis.document = originalDocument;
        globalThis.GM_getValue = originalGetValue;
    });
    globalThis.document = {
        createElement(tagName) {
            return new FakeElement(tagName);
        }
    };
    globalThis.GM_getValue = () => false;

    const outputState = Core.createAiOutputState();
    const message = {
        id: 'assistant-stream-fixture',
        role: 'assistant',
        content: '',
        rawContent: '',
        outputState,
        status: 'streaming',
        errorKind: null,
        sourceConfig: null,
        regenerateFromUserId: 'user-fixture'
    };
    const { context } = createRenderHarness(message);

    const bubble = context.addBubble(message);
    assertSingleTrigger(bubble, 'initial addBubble render');

    Core.applyAiOutputEvent(outputState, {
        type: 'reasoning_delta',
        text: '第一段推理',
        source: 'reasoning_content'
    });
    context.updateBubble(bubble, outputState, true);
    assertSingleTrigger(bubble, 'first streaming render');

    Core.applyAiOutputEvent(outputState, {
        type: 'content_delta',
        text: '第一段回答',
        source: 'stream'
    });
    context.updateBubble(bubble, outputState, true);
    assertSingleTrigger(bubble, 'second streaming render');

    Core.applyAiOutputEvent(outputState, {
        type: 'content_delta',
        text: '，回答完成。',
        source: 'stream'
    });
    Core.finishAiOutputState(outputState, { finishReason: 'stop' });
    message.status = 'done';
    message.content = outputState.contentText;
    context.updateBubble(bubble, outputState, false);
    assertSingleTrigger(bubble, 'completed render');
});
