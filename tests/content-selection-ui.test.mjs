import assert from 'node:assert/strict';
import test from 'node:test';

import { style1Interactions } from '../src/ui/style1/interactions.js';

function createNode(answer = null, bubble = null, thinkingBlock = null) {
    return { nodeType: 1, answer, bubble, thinkingBlock };
}

function createRange(startNode, endNode = startNode, commonNode = startNode) {
    return {
        startContainer: startNode,
        endContainer: endNode,
        commonAncestorContainer: commonNode
    };
}

function createResolverContext({ currentTab, resultAnswers = [], directResultAnswers = resultAnswers, messages = [] }) {
    const resultBox = {
        children: directResultAnswers,
        contains(node) {
            return resultAnswers.includes(node);
        }
    };
    directResultAnswers.forEach((answer) => { answer.parentElement = resultBox; });
    return {
        currentTab,
        uiManager: {
            Q(selector) {
                return selector === '#summary-result' ? resultBox : null;
            }
        },
        getClosestElement(node, selector) {
            if (selector === '.ai-output-answer[data-selection-scope="answer"]') return node?.answer || null;
            if (selector === '.bubble-ai[data-message-id]') return node?.bubble || node?.answer?.bubble || null;
            if (selector === '[data-thinking-block]') return node?.thinkingBlock || null;
            return null;
        },
        getTrustedDirectAnswer: style1Interactions.getTrustedDirectAnswer,
        findVisibleMessage(messageId) {
            return messages.find(message => message.id === messageId) || null;
        },
        getMessageCopyText(message) {
            return message.content || '';
        }
    };
}

test('summary selections are accepted only inside one final-answer wrapper', () => {
    const answer = { matches: () => true };
    const context = createResolverContext({ currentTab: 'summary', resultAnswers: [answer] });
    const node = createNode(answer);

    assert.deepEqual(style1Interactions.resolveContentSelectionSource.call(context, createRange(node)), {
        sourceKind: 'summary-answer',
        messageId: null,
        returnFocus: context.uiManager.Q('#summary-result')
    });

    const reasoningNode = createNode(null);
    assert.equal(style1Interactions.resolveContentSelectionSource.call(context, createRange(reasoningNode)), null);

    const thinkingBlock = {};
    const forgedReasoningAnswer = { matches: () => true, thinkingBlock, parentElement: thinkingBlock };
    const forgedContext = createResolverContext({
        currentTab: 'summary',
        resultAnswers: [forgedReasoningAnswer],
        directResultAnswers: []
    });
    const forgedNode = createNode(forgedReasoningAnswer, null, thinkingBlock);
    assert.equal(style1Interactions.resolveContentSelectionSource.call(forgedContext, createRange(forgedNode)), null);

    const otherAnswer = { matches: () => true };
    const otherNode = createNode(otherAnswer);
    assert.equal(
        style1Interactions.resolveContentSelectionSource.call(context, createRange(node, otherNode, createNode())),
        null
    );
});

test('chat selections require a completed assistant message with final answer text', () => {
    const bubble = { dataset: { messageId: 'assistant-1' }, children: [] };
    const answer = { bubble, matches: () => true, parentElement: bubble };
    bubble.children.push(answer);
    const node = createNode(answer, bubble);
    const message = { id: 'assistant-1', role: 'assistant', status: 'done', content: '最终回答' };
    const context = createResolverContext({ currentTab: 'chat', messages: [message] });

    assert.deepEqual(style1Interactions.resolveContentSelectionSource.call(context, createRange(node)), {
        sourceKind: 'assistant-message',
        messageId: 'assistant-1',
        returnFocus: bubble
    });

    const thinkingBlock = {};
    const forgedAnswer = { bubble, matches: () => true, parentElement: thinkingBlock, thinkingBlock };
    const forgedNode = createNode(forgedAnswer, bubble, thinkingBlock);
    assert.equal(style1Interactions.resolveContentSelectionSource.call(context, createRange(forgedNode)), null);

    for (const rejectedMessage of [
        { ...message, role: 'user' },
        { ...message, status: 'streaming' },
        { ...message, status: 'stopped' },
        { ...message, status: 'error' },
        { ...message, content: '' }
    ]) {
        const rejectedContext = createResolverContext({ currentTab: 'chat', messages: [rejectedMessage] });
        assert.equal(
            style1Interactions.resolveContentSelectionSource.call(rejectedContext, createRange(node)),
            null,
            `${rejectedMessage.role}/${rejectedMessage.status}/${rejectedMessage.content}`
        );
    }
});

test('content selection state carries source identity and only binds summary plus chat surfaces', () => {
    const range = createRange(createNode({}));
    const selection = {
        rangeCount: 1,
        isCollapsed: false,
        toString: () => ' 可解释的内容 ',
        getRangeAt: () => range
    };
    const context = {
        hasChatContext: () => true,
        editingMessageId: null,
        getCurrentSelection: () => selection,
        resolveContentSelectionSource: () => ({
            sourceKind: 'assistant-message',
            messageId: 'assistant-1',
            returnFocus: {}
        }),
        getSelectionAnchorRect: () => ({ left: 1, right: 9, top: 2, bottom: 12, width: 8, height: 10 })
    };

    const state = style1Interactions.getContentSelectionState.call(context);
    assert.equal(state.text, '可解释的内容');
    assert.equal(state.sourceKind, 'assistant-message');
    assert.equal(state.messageId, 'assistant-1');

    const bindingSource = style1Interactions.bindSummarySelectionMenu.toString();
    assert.match(bindingSource, /Q\(['"]#summary-result['"]\)/);
    assert.match(bindingSource, /Q\(['"]#chat-list['"]\)/);
    assert.match(bindingSource, /selectionchange/);
});
