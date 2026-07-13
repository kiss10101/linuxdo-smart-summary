#!/usr/bin/env node

import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

function parseThinkingContent(text) {
  const raw = String(text || '');
  const patterns = [
    { open: '<think>', close: '</think>' },
    { open: '<thinking>', close: '</thinking>' }
  ];
  let mainContent = raw;
  const thinkingParts = [];

  for (const { open, close } of patterns) {
    let searchFrom = 0;
    while (searchFrom < mainContent.length) {
      const start = mainContent.indexOf(open, searchFrom);
      if (start === -1) break;
      const end = mainContent.indexOf(close, start + open.length);
      if (end === -1) {
        thinkingParts.push(mainContent.slice(start + open.length).trim());
        mainContent = mainContent.slice(0, start);
        break;
      }
      thinkingParts.push(mainContent.slice(start + open.length, end).trim());
      mainContent = mainContent.slice(0, start) + mainContent.slice(end + close.length);
      searchFrom = start;
    }
  }

  return {
    thinking: thinkingParts.filter(Boolean).join('\n\n'),
    content: mainContent.trim()
  };
}

function classifyAiOutput(rawText) {
  const raw = String(rawText ?? '');
  const parsed = parseThinkingContent(raw);
  const thinking = parsed.thinking.trim();
  const content = parsed.content.trim();
  if (content) return { kind: 'success', rawText: raw, thinking, content };
  if (thinking) return { kind: 'thinking_only', rawText: raw, thinking, content: '' };
  return { kind: 'empty_response', rawText: raw, thinking: '', content: '' };
}

function toOpenAiMessage(message) {
  const role = message?.role === 'ai' ? 'assistant' : message?.role;
  if (!['system', 'user', 'assistant'].includes(role)) return null;
  const content = String(message?.content ?? '');
  if (!content.trim()) return null;
  return { role, content };
}

function sanitizeMessagesForApi(messages) {
  return (Array.isArray(messages) ? messages : [])
    .map(toOpenAiMessage)
    .filter(Boolean);
}

function createVisibleMessage(message) {
  return {
    id: message.id,
    role: message.role,
    content: String(message.content ?? ''),
    rawContent: String(message.rawContent ?? message.content ?? ''),
    status: message.status || 'done',
    errorKind: message.errorKind || null,
    errorMessage: message.errorMessage || '',
    excludeFromApi: message.excludeFromApi === true,
    regenerateFromUserId: message.regenerateFromUserId || null
  };
}

function createState(baseMessages, initialVisible = []) {
  return {
    baseMessages,
    visibleMessages: initialVisible.map(createVisibleMessage),
    lastRequestContents: null,
    removedIds: []
  };
}

function findIndex(state, messageId) {
  return state.visibleMessages.findIndex((message) => message.id === messageId);
}

function findMessage(state, messageId) {
  return state.visibleMessages.find((message) => message.id === messageId) || null;
}

function removeFrom(state, index) {
  if (index < 0) return [];
  const removed = state.visibleMessages.splice(index);
  state.removedIds.push(...removed.map((message) => message.id));
  return removed;
}

function getUserForAssistant(state, assistantId) {
  const index = findIndex(state, assistantId);
  for (let i = index - 1; i >= 0; i -= 1) {
    if (state.visibleMessages[i]?.role === 'user') return state.visibleMessages[i];
  }
  return null;
}

function getRegenerateUserMessage(state, message) {
  if (!message) return null;
  if (message.role === 'user') return message;
  if (message.regenerateFromUserId) {
    const source = findMessage(state, message.regenerateFromUserId);
    if (source?.role === 'user') return source;
  }
  return getUserForAssistant(state, message.id);
}

function getVisibleMessagesForApi(state, options = {}) {
  const { throughMessageId = null, beforeMessageId = null, includeExcludedMessageId = null } = options;
  let messages = state.visibleMessages
    .filter((message) => message.status === 'done' || message.id === includeExcludedMessageId);

  if (beforeMessageId) {
    const index = messages.findIndex((message) => message.id === beforeMessageId);
    if (index >= 0) messages = messages.slice(0, index);
  } else if (throughMessageId) {
    const index = messages.findIndex((message) => message.id === throughMessageId);
    if (index >= 0) messages = messages.slice(0, index + 1);
  }

  return messages
    .filter((message) => !message.excludeFromApi || message.id === includeExcludedMessageId)
    .map(toOpenAiMessage)
    .filter(Boolean);
}

function buildChatApiMessages(state, options = {}) {
  return sanitizeMessagesForApi([
    ...state.baseMessages,
    ...getVisibleMessagesForApi(state, options)
  ]);
}

function renderChatErrorContent(message) {
  const title = message.errorKind === 'thinking_only'
    ? 'AI 只返回了思考过程'
    : message.errorKind === 'empty_response'
      ? 'AI 返回了空内容'
      : 'AI 回复失败';
  return `${title}\n${message.errorMessage || ''}\n重新生成\n删除`;
}

function finishAssistantTurn(state, userMessage, assistantMessage, aiRaw) {
  state.lastRequestContents = buildChatApiMessages(state, {
    throughMessageId: userMessage.id,
    includeExcludedMessageId: userMessage.id
  }).map((message) => message.content);

  const classified = classifyAiOutput(aiRaw);
  assistantMessage.rawContent = String(aiRaw ?? '');
  assistantMessage.regenerateFromUserId = userMessage.id;

  if (classified.kind === 'success') {
    userMessage.excludeFromApi = false;
    assistantMessage.content = classified.content;
    assistantMessage.status = 'done';
    assistantMessage.errorKind = null;
    assistantMessage.errorMessage = '';
    assistantMessage.excludeFromApi = false;
    return;
  }

  userMessage.excludeFromApi = true;
  assistantMessage.content = '';
  assistantMessage.status = 'error';
  assistantMessage.errorKind = classified.kind;
  assistantMessage.errorMessage = classified.kind === 'thinking_only'
    ? 'AI 只返回了思考过程，没有生成正文。'
    : 'AI 返回了空内容。';
  assistantMessage.excludeFromApi = true;
}

function applyAction(state, action) {
  if (action.type === 'send') {
    const user = createVisibleMessage({
      id: action.userId,
      role: 'user',
      content: action.text,
      excludeFromApi: true
    });
    const assistant = createVisibleMessage({
      id: action.assistantId,
      role: 'assistant',
      content: '',
      status: 'streaming',
      excludeFromApi: true,
      regenerateFromUserId: user.id
    });
    state.visibleMessages.push(user, assistant);
    finishAssistantTurn(state, user, assistant, action.aiRaw);
    return;
  }

  if (action.type === 'regenerate') {
    const target = findMessage(state, action.messageId);
    const user = getRegenerateUserMessage(state, target);
    if (!user) throw new Error(`Cannot regenerate without user for ${action.messageId}`);
    if (target.role === 'assistant') removeFrom(state, findIndex(state, target.id));
    else removeFrom(state, findIndex(state, user.id) + 1);

    const assistant = createVisibleMessage({
      id: action.assistantId,
      role: 'assistant',
      content: '',
      status: 'streaming',
      excludeFromApi: true,
      regenerateFromUserId: user.id
    });
    state.visibleMessages.push(assistant);
    finishAssistantTurn(state, user, assistant, action.aiRaw);
    return;
  }

  if (action.type === 'edit') {
    const target = findMessage(state, action.messageId);
    if (!target) throw new Error(`Cannot edit missing message ${action.messageId}`);
    target.content = String(action.content ?? '');
    target.rawContent = target.content;
    target.status = 'done';
    target.errorKind = null;
    target.errorMessage = '';
    target.excludeFromApi = target.role === 'user';
    removeFrom(state, findIndex(state, target.id) + 1);
    return;
  }

  if (action.type === 'delete') {
    const target = findMessage(state, action.messageId);
    if (!target) throw new Error(`Cannot delete missing message ${action.messageId}`);
    if (target.role === 'assistant') {
      const user = getUserForAssistant(state, target.id);
      if (user) user.excludeFromApi = true;
    }
    removeFrom(state, findIndex(state, target.id));
    return;
  }

  throw new Error(`Unknown action type: ${action.type}`);
}

function assertEqual(actual, expected, label) {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    throw new Error(`${label}\nexpected: ${JSON.stringify(expected)}\nactual:   ${JSON.stringify(actual)}`);
  }
}

function assertContains(text, fragment, label) {
  if (!String(text).includes(fragment)) {
    throw new Error(`${label}: missing ${JSON.stringify(fragment)}`);
  }
}

function getCopyText(message) {
  if (!message) return '';
  if (message.role === 'assistant') {
    const parsed = parseThinkingContent(message.rawContent || message.content);
    return parsed.content || message.content || '';
  }
  return message.content || '';
}

const fixturePath = process.argv[2] || 'fixtures/chat-message-actions.fixture.json';
const version = process.argv[3] || '7.5-alpha.4';
const fixture = JSON.parse(await readFile(resolve(process.cwd(), fixturePath), 'utf8'));

console.log(`Fixture: ${fixture.name || fixturePath}`);

for (const testCase of fixture.aiOutputs || []) {
  const classified = classifyAiOutput(testCase.raw);
  console.log(`aiOutput: ${testCase.name} -> ${classified.kind}`);
  assertEqual(classified.kind, testCase.expectedKind, `${testCase.name}: kind`);
  if ('expectedContent' in testCase) assertEqual(classified.content, testCase.expectedContent, `${testCase.name}: content`);
  if ('expectedThinking' in testCase) assertEqual(classified.thinking, testCase.expectedThinking, `${testCase.name}: thinking`);
  if (testCase.expectedThinkingContains) assertContains(classified.thinking, testCase.expectedThinkingContains, `${testCase.name}: thinking`);
  if (testCase.expectedCopyText) {
    const copyText = getCopyText({
      role: 'assistant',
      content: classified.content,
      rawContent: testCase.raw
    });
    assertEqual(copyText, testCase.expectedCopyText, `${testCase.name}: copy text`);
  }
}

for (const flow of fixture.messageFlows || []) {
  const state = createState(fixture.baseMessages, flow.initialVisible);
  for (const action of flow.actions || []) applyAction(state, action);

  const visibleIds = state.visibleMessages.map((message) => message.id);
  console.log(`messageFlow: ${flow.name} -> ${JSON.stringify(visibleIds)}`);
  if (flow.expectedVisibleIds) assertEqual(visibleIds, flow.expectedVisibleIds, `${flow.name}: visible ids`);
  if (flow.expectedRemovedIds) assertEqual(state.removedIds, flow.expectedRemovedIds, `${flow.name}: removed ids`);
  if (flow.expectedExcludedIds) {
    const excludedIds = state.visibleMessages.filter((message) => message.excludeFromApi).map((message) => message.id);
    assertEqual(excludedIds, flow.expectedExcludedIds, `${flow.name}: excluded ids`);
  }
  if (flow.expectedIncludedIds) {
    const includedIds = state.visibleMessages.filter((message) => !message.excludeFromApi).map((message) => message.id);
    assertEqual(includedIds, flow.expectedIncludedIds, `${flow.name}: included ids`);
  }
  if (flow.expectedAssistantStatus) {
    for (const [id, expected] of Object.entries(flow.expectedAssistantStatus)) {
      assertEqual(findMessage(state, id)?.status, expected, `${flow.name}: status ${id}`);
    }
  }
  if (flow.expectedAssistantErrorKind) {
    for (const [id, expected] of Object.entries(flow.expectedAssistantErrorKind)) {
      assertEqual(findMessage(state, id)?.errorKind, expected, `${flow.name}: error kind ${id}`);
    }
  }
  if (flow.expectedAssistantContent) {
    for (const [id, expected] of Object.entries(flow.expectedAssistantContent)) {
      assertEqual(findMessage(state, id)?.content, expected, `${flow.name}: assistant content ${id}`);
    }
  }
  if (flow.expectedDefaultApiContents) {
    assertEqual(buildChatApiMessages(state).map((message) => message.content), flow.expectedDefaultApiContents, `${flow.name}: default api contents`);
  }
  if (flow.expectedLastRequestContents) {
    assertEqual(state.lastRequestContents, flow.expectedLastRequestContents, `${flow.name}: last request contents`);
  }
  if (flow.expectedApiContents) {
    assertEqual(buildChatApiMessages(state, flow.requestOptions || {}).map((message) => message.content), flow.expectedApiContents, `${flow.name}: api contents`);
  }
  if (flow.expectedErrorHtmlContains) {
    const errorMessage = state.visibleMessages.find((message) => message.status === 'error');
    const html = renderChatErrorContent(errorMessage || {});
    for (const fragment of flow.expectedErrorHtmlContains) assertContains(html, fragment, `${flow.name}: error html`);
  }
}

const distPath = resolve(process.cwd(), `dist/Linux.do 智能总结-${version}.user.js`);
const distText = await readFile(distPath, 'utf8');
for (const fragment of fixture.distShape?.requiredContains || []) {
  assertContains(distText, fragment, `dist contains ${fragment}`);
}
for (const pattern of fixture.distShape?.requiredRegex || []) {
  const regex = new RegExp(pattern);
  if (!regex.test(distText)) throw new Error(`dist regex missing: ${pattern}`);
}

console.log('All chat message action cases passed.');
