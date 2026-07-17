import { CONFIG } from '../../config.js';
import { Core } from '../../core/index.js';
import { UIRegistry } from '../registry.js';

export const style1Interactions = {
    createEmptyChatSession() {
        return {
            context: null,
            baseMessages: [],
            visibleMessages: []
        };
    },

    createMessageId() {
        const random = Math.random().toString(36).slice(2, 8);
        return `msg_${Date.now().toString(36)}_${random}`;
    },

    createVisibleMessage(role, content, overrides = {}) {
        const now = Date.now();
        const outputState = overrides.outputState
            ? Core.createAiOutputState(overrides.outputState)
            : null;
        return {
            id: overrides.id || this.createMessageId(),
            role,
            content: `${content ?? ''}`,
            rawContent: `${overrides.rawContent ?? content ?? ''}`,
            outputState,
            status: overrides.status || 'done',
            errorKind: overrides.errorKind || null,
            errorMessage: overrides.errorMessage || '',
            errorMeta: overrides.errorMeta || null,
            sourceConfig: Core.normalizeAiSourceConfig(overrides.sourceConfig),
            excludeFromApi: overrides.excludeFromApi === true,
            regenerateFromUserId: overrides.regenerateFromUserId || null,
            createdAt: overrides.createdAt || now,
            updatedAt: now
        };
    },

    hasChatContext() {
        return Array.isArray(this.chatSession?.baseMessages) && this.chatSession.baseMessages.length > 0;
    },

    setChatContext({ topicId, start, end, postContent, summaryRawText, summaryContent, coverageReport, sourceConfig }) {
        const promptChat = GM_getValue('prompt_chat', '');
        this.chatSession = {
            context: {
                topicId,
                range: { start, end },
                promptChat,
                postContent,
                summary: summaryContent,
                coverageReport,
                sourceConfig: Core.normalizeAiSourceConfig(sourceConfig),
                createdAt: Date.now()
            },
            baseMessages: [
                { role: 'system', content: promptChat },
                { role: 'user', content: `以下是帖子内容供你参考:\n${postContent}` },
                { role: 'assistant', content: summaryContent }
            ],
            visibleMessages: []
        };
        this.chatHistory = [...this.chatSession.baseMessages];
        this.lastSummary = summaryRawText;
        this.postContent = postContent;
        this.closeMessageContextMenu?.();
        this.closeSummarySelectionMenu?.();
    },

    clearChatContext() {
        this.chatSession = this.createEmptyChatSession();
        this.chatHistory = [];
        this.lastSummary = '';
        this.postContent = '';
        this.editingMessageId = null;
        this.editingDraftBefore = '';
        this.closeMessageContextMenu?.();
        this.closeSummarySelectionMenu?.();
    },

    syncLegacyChatHistory() {
        const visibleMessages = this.chatSession.visibleMessages
            .filter(message => message.status === 'done')
            .map(message => Core.toOpenAiMessage(message))
            .filter(Boolean);
        this.chatHistory = [...this.chatSession.baseMessages, ...visibleMessages];
    },

    findVisibleMessage(messageId) {
        return this.chatSession.visibleMessages.find(message => message.id === messageId) || null;
    },

    findVisibleMessageIndex(messageId) {
        return this.chatSession.visibleMessages.findIndex(message => message.id === messageId);
    },

    getBubbleElement(messageId) {
        const list = this.uiManager.Q('#chat-list');
        if (!list) return null;
        return Array.from(list.querySelectorAll('[data-message-id]'))
            .find(el => el.dataset.messageId === messageId) || null;
    },

    getClosestElement(target, selector) {
        const element = target?.nodeType === 1 ? target : target?.parentElement;
        return element?.closest?.(selector) || null;
    },

    getVisibleMessagesForApi({ throughMessageId = null, beforeMessageId = null, includeExcludedMessageId = null } = {}) {
        let messages = this.chatSession.visibleMessages
            .filter(message => message.status === 'done' || message.id === includeExcludedMessageId);

        if (beforeMessageId) {
            const index = messages.findIndex(message => message.id === beforeMessageId);
            if (index >= 0) messages = messages.slice(0, index);
        } else if (throughMessageId) {
            const index = messages.findIndex(message => message.id === throughMessageId);
            if (index >= 0) messages = messages.slice(0, index + 1);
        }

        return messages
            .filter(message => !message.excludeFromApi || message.id === includeExcludedMessageId)
            .map(message => Core.toOpenAiMessage(message))
            .filter(Boolean);
    },

    buildChatApiMessages(options = {}) {
        return Core.sanitizeMessagesForApi([
            ...this.chatSession.baseMessages,
            ...this.getVisibleMessagesForApi(options)
        ]);
    },

    appendVisibleMessage(message) {
        this.chatSession.visibleMessages.push(message);
        this.syncLegacyChatHistory();
        this.updateMessageCount();
        return message;
    },

    removeVisibleMessagesFrom(index) {
        if (index < 0) return [];
        const removed = this.chatSession.visibleMessages.splice(index);
        this.syncLegacyChatHistory();
        this.updateMessageCount();
        return removed;
    },

    setVisibleMessage(messageId, patch) {
        const message = this.findVisibleMessage(messageId);
        if (!message) return null;
        Object.assign(message, patch, { updatedAt: Date.now() });
        this.syncLegacyChatHistory();
        this.updateMessageCount();
        return message;
    },

    renderChatMessages() {
        const Q = this.uiManager.Q.bind(this.uiManager);
        const list = Q('#chat-list');
        this.closeSummarySelectionMenu?.();
        list.innerHTML = '';
        this.chatSession.visibleMessages.forEach(message => this.addBubble(message));

        const empty = Q('#chat-empty');
        if (this.chatSession.visibleMessages.length > 0) {
            empty.classList.add('hidden');
        } else {
            empty.classList.remove('hidden');
        }
        this.updateMessageCount();
        this.updateScrollButtons();
    },

    getAssistantForUser(messageId) {
        const index = this.findVisibleMessageIndex(messageId);
        if (index < 0) return null;
        const next = this.chatSession.visibleMessages[index + 1];
        return next?.role === 'assistant' ? next : null;
    },

    getUserForAssistant(messageId) {
        const index = this.findVisibleMessageIndex(messageId);
        if (index <= 0) return null;
        for (let i = index - 1; i >= 0; i -= 1) {
            const message = this.chatSession.visibleMessages[i];
            if (message.role === 'user') return message;
        }
        return null;
    },

    removeVisibleMessagesAfter(messageId, { includeTarget = false } = {}) {
        const index = this.findVisibleMessageIndex(messageId);
        if (index < 0) return [];
        const start = includeTarget ? index : index + 1;
        const removed = this.chatSession.visibleMessages.splice(start);
        this.syncLegacyChatHistory();
        this.updateMessageCount();
        return removed;
    },

    async requestAssistantForUser(userMessage, { assistantMessage = null } = {}) {
        const Q = this.uiManager.Q.bind(this.uiManager);
        if (!userMessage || userMessage.role !== 'user') return;
        if (this.isGenerating) return;

        Q('#chat-empty').classList.add('hidden');
        this.userScrolledUp = false;

        const targetAssistant = assistantMessage || this.appendVisibleMessage(this.createVisibleMessage('assistant', '', {
            status: 'streaming',
            outputState: Core.createAiOutputState(),
            excludeFromApi: true,
            regenerateFromUserId: userMessage.id
        }));
        this.setVisibleMessage(targetAssistant.id, {
            content: '',
            rawContent: '',
            outputState: Core.createAiOutputState(),
            status: 'streaming',
            errorKind: null,
            errorMessage: '',
            errorMeta: null,
            excludeFromApi: true,
            regenerateFromUserId: userMessage.id
        });
        this.renderChatMessages();
        const msgDiv = this.getBubbleElement(targetAssistant.id);

        const outputState = Core.createAiOutputState();
        const abortController = this.startAiAbortController('chat');
        const request = this.beginChatRequestLifecycle({
            userMessageId: userMessage.id,
            assistantMessageId: targetAssistant.id,
            outputState,
            controller: abortController
        });
        this.setLoading('#btn-send', true);

        const messages = this.buildChatApiMessages({
            throughMessageId: userMessage.id,
            includeExcludedMessageId: userMessage.id
        });
        this.setChatRequestPhase(request, 'streaming');

        try {
            await Core.streamChat(messages,
                (event) => {
                    if (!this.isCurrentChatRequest(request)) return;
                    Core.applyAiOutputEvent(outputState, event);
                    this.setVisibleMessage(targetAssistant.id, {
                        rawContent: outputState.contentText,
                        outputState,
                        status: 'streaming'
                    });
                    const bubble = this.getBubbleElement(targetAssistant.id);
                    if (bubble) this.scheduleBubbleRender(targetAssistant.id, bubble, () => outputState);
                },
                (meta = {}) => {
                    if (!this.isCurrentChatRequest(request)) return;
                    this.cancelBubbleRender(targetAssistant.id);
                    Core.finishAiOutputState(outputState, meta);
                    const classified = Core.classifyAiOutput(outputState, meta);
                    if (classified.kind === 'success') {
                        this.setChatRequestPhase(request, 'completed');
                        const sourceConfig = Core.normalizeAiSourceConfig(meta.sourceConfig);
                        this.setVisibleMessage(userMessage.id, { excludeFromApi: false });
                        this.setVisibleMessage(targetAssistant.id, {
                            content: classified.content,
                            rawContent: outputState.contentText,
                            outputState,
                            status: 'done',
                            errorKind: null,
                            errorMessage: '',
                            errorMeta: null,
                            sourceConfig,
                            excludeFromApi: false,
                            regenerateFromUserId: userMessage.id
                        });
                        const bubble = this.getBubbleElement(targetAssistant.id);
                        if (bubble) this.updateBubble(bubble, outputState, false);
                    } else {
                        this.setChatRequestPhase(request, 'failed');
                        const failure = Core.createModelOutputFailure(classified, {
                            operation: 'chat',
                            sourceConfig: meta.sourceConfig
                        });
                        const formatted = Core.formatAiFailureForUi(failure);
                        this.setVisibleMessage(userMessage.id, { excludeFromApi: true });
                        this.setVisibleMessage(targetAssistant.id, {
                            content: classified.content,
                            rawContent: outputState.contentText,
                            outputState,
                            status: 'error',
                            errorKind: failure.kind,
                            errorMessage: formatted.detail || formatted.title,
                            errorMeta: failure,
                            sourceConfig: failure.sourceConfig,
                            excludeFromApi: true,
                            regenerateFromUserId: userMessage.id
                        });
                        const bubble = this.getBubbleElement(targetAssistant.id);
                        if (bubble) this.renderBubbleContent(bubble, this.findVisibleMessage(targetAssistant.id));
                        this.showToast('回复失败: ' + formatted.toast, 'error');
                    }
                },
                (err) => {
                    if (!this.isCurrentChatRequest(request)) return;
                    this.cancelBubbleRender(targetAssistant.id);
                    const failure = Core.normalizeAiFailure(err, { operation: 'chat' });
                    const formatted = Core.formatAiFailureForUi(failure);
                    this.setChatRequestPhase(request, Core.isAiAbortFailure(failure) ? 'stopped' : 'failed');
                    Core.markAiOutputFailure(outputState, failure);
                    this.setVisibleMessage(userMessage.id, { excludeFromApi: true });
                    this.setVisibleMessage(targetAssistant.id, {
                        content: outputState.contentText,
                        rawContent: outputState.contentText,
                        outputState,
                        status: Core.isAiAbortFailure(failure) ? 'stopped' : 'error',
                        errorKind: failure.kind || 'request_failed',
                        errorMessage: formatted.detail || formatted.title,
                        errorMeta: failure,
                        sourceConfig: failure.sourceConfig,
                        excludeFromApi: true,
                        regenerateFromUserId: userMessage.id
                    });
                    const bubble = this.getBubbleElement(targetAssistant.id);
                    if (bubble) this.renderBubbleContent(bubble, this.findVisibleMessage(targetAssistant.id));
                    if (!Core.isAiAbortFailure(failure)) {
                        this.showToast('回复失败: ' + formatted.toast, 'error');
                    }
                },
                { operation: 'chat', signal: abortController.signal }
            );
        } finally {
            if (this.isCurrentChatRequest(request)) {
                this.clearAiAbortController(abortController);
            }
            if (this.finalizeChatRequest(request, request.phase)) {
                this.setLoading('#btn-send', false);
                this.updateChatInputMode();
                this.userScrolledUp = false;
                this.updateScrollButtons();
            }
        }

        if (msgDiv) this.scrollToBottom();
    },

    getMessageCopyText(message) {
        if (!message) return '';
        if (message.role === 'assistant') {
            const outputState = message.outputState
                ? Core.createAiOutputState(message.outputState)
                : Core.normalizeAiOutputState(message.rawContent || message.content || '');
            return outputState.contentText || '';
        }
        return message.content || '';
    },

    renderChatErrorContent(message) {
        const formatted = message.errorMeta
            ? Core.formatAiFailureForUi(message.errorMeta, { operation: 'chat' })
            : null;
        const isStopped = message.status === 'stopped';
        const title = isStopped
            ? '已停止更新'
            : formatted?.title || (message.errorKind === 'thinking_only'
            ? 'AI 只返回了推理内容'
            : message.errorKind === 'empty_response'
                ? 'AI 返回了空内容'
                : 'AI 回复失败');
        const detailText = isStopped
            ? (message.errorMessage || '生成已停止，以上内容可能不完整。')
            : (formatted?.detail || message.errorMessage || '');
        const hintText = formatted?.hint || '';
        const detail = detailText ? `<div class="bubble-error-detail">${Core.escapeHtml(detailText)}</div>` : '';
        const hint = hintText ? `<div class="bubble-error-detail">${Core.escapeHtml(hintText)}</div>` : '';
        const source = Core.renderAiSourceMeta(message.sourceConfig || formatted?.failure?.sourceConfig);
        return `
            <div class="bubble-error-title">${Core.escapeHtml(title)}</div>
            ${detail}
            ${hint}
            ${source}
            <div class="bubble-error-actions">
                <button type="button" class="bubble-inline-action" data-chat-action="regenerate" data-message-id="${Core.escapeHtml(message.id)}">重新生成</button>
                <button type="button" class="bubble-inline-action" data-chat-action="delete" data-message-id="${Core.escapeHtml(message.id)}">删除</button>
            </div>
        `;
    },

    ensureMessageMenuTrigger(div, message) {
        if (!div || !message) return null;
        div.tabIndex = 0;
        div.setAttribute('aria-label', message.role === 'assistant' ? 'AI 消息' : '用户消息');

        const existing = div.querySelector?.('[data-message-menu-trigger]');
        if (existing) {
            existing.dataset.messageId = message.id;
            existing.setAttribute('aria-expanded', this.currentMessageMenuId === message.id ? 'true' : 'false');
            return existing;
        }

        const trigger = document.createElement('button');
        trigger.type = 'button';
        trigger.className = 'message-menu-trigger';
        trigger.dataset.messageMenuTrigger = '';
        trigger.dataset.messageId = message.id;
        trigger.setAttribute('aria-label', '消息操作');
        trigger.setAttribute('aria-haspopup', 'menu');
        trigger.setAttribute('aria-controls', 'message-context-menu');
        trigger.setAttribute('aria-expanded', this.currentMessageMenuId === message.id ? 'true' : 'false');
        trigger.title = '消息操作';
        trigger.textContent = '⋯';
        div.appendChild(trigger);
        return trigger;
    },

    renderBubbleContent(div, message) {
        const roleClass = message.role === 'assistant' ? 'ai' : 'user';
        div.className = `bubble bubble-${roleClass}`;
        div.classList.toggle('bubble-streaming', message.status === 'streaming');
        div.classList.toggle('bubble-error', message.status === 'error');
        div.classList.toggle('bubble-stopped', message.status === 'stopped');
        div.classList.toggle('is-editing', message.id === this.editingMessageId);
        div.dataset.messageId = message.id;
        div.dataset.role = message.role;
        const outputState = message.outputState || Core.normalizeAiOutputState(message.rawContent || message.content);
        const hasOutput = Boolean(outputState.reasoningText.trim() || outputState.contentText.trim());
        div.__rawMessageText = outputState.contentText || message.content || '';

        if (message.role === 'user') {
            div.textContent = message.content ?? '';
            this.ensureMessageMenuTrigger(div, message);
            return;
        }

        if (message.status === 'error' || message.status === 'stopped') {
            const viewState = this.getReasoningPanelViewState(div, outputState, message.id);
            const preservedOutput = hasOutput
                ? this.renderWithThinking(outputState, false, viewState)
                : '';
            div.innerHTML = preservedOutput + this.renderChatErrorContent(message);
            this.ensureMessageMenuTrigger(div, message);
            return;
        }

        if (message.status === 'streaming' && !hasOutput) {
            div.innerHTML = `<div class="thinking"><div class="thinking-dot"></div><div class="thinking-dot"></div><div class="thinking-dot"></div></div>`;
            this.ensureMessageMenuTrigger(div, message);
            return;
        }

        const source = message.status === 'streaming'
            ? ''
            : Core.renderAiSourceMeta(message.sourceConfig);
        const viewState = this.getReasoningPanelViewState(div, outputState, message.id);
        div.innerHTML = this.renderWithThinking(outputState, message.status === 'streaming', viewState) + source;
        this.ensureMessageMenuTrigger(div, message);
    },

    getMessageMenuActions(message) {
        if (!message) return [];
        const copyText = this.getMessageCopyText(message).trim();
        const regenerateUser = this.getRegenerateUserMessage(message);
        const activeRequest = this.activeChatRequest || null;
        const generationActive = Boolean(this.isGenerating || activeRequest);
        const isCurrentStreamingAssistant = Boolean(activeRequest
            && message.role === 'assistant'
            && message.status === 'streaming'
            && activeRequest.assistantMessageId === message.id);
        const action = (id, label, options = {}) => ({
            id,
            label,
            visible: true,
            disabled: options.disabled === true,
            disabledReason: options.disabledReason || '',
            danger: options.danger === true
        });
        const copyAction = action('copy', '复制消息', {
            disabled: !copyText,
            disabledReason: copyText ? '' : '尚无可复制正文'
        });

        if (generationActive) {
            if (!isCurrentStreamingAssistant) return [copyAction];
            return [
                copyAction,
                action('regenerate', '重新生成', {
                    disabled: !regenerateUser,
                    disabledReason: regenerateUser ? '' : '未找到可重新生成的问题'
                }),
                action('stop', '停止更新'),
                action('delete', '删除消息', { danger: true })
            ];
        }

        if (message.status === 'done') {
            return [
                copyAction,
                action('regenerate', '重新生成', {
                    disabled: !regenerateUser,
                    disabledReason: regenerateUser ? '' : '未找到可重新生成的问题'
                }),
                action('edit', '编辑消息'),
                action('delete', '删除消息', { danger: true })
            ];
        }

        return [
            copyAction,
            action('regenerate', '重新生成', {
                disabled: !regenerateUser,
                disabledReason: regenerateUser ? '' : '未找到可重新生成的问题'
            }),
            action('delete', '删除消息', { danger: true })
        ];
    },

    getMessageMenuAction(message, actionId) {
        return this.getMessageMenuActions(message)
            .find(action => action.id === actionId && action.visible !== false) || null;
    },

    renderMessageContextMenuActions(menu, message) {
        menu.innerHTML = '';
        this.getMessageMenuActions(message).forEach((action) => {
            if (action.visible === false) return;
            const button = document.createElement('button');
            button.type = 'button';
            button.className = `message-menu-item${action.danger ? ' danger' : ''}`;
            button.dataset.messageMenuAction = action.id;
            button.setAttribute('role', 'menuitem');
            button.textContent = action.label;
            button.disabled = action.disabled;
            if (action.disabledReason) {
                button.title = action.disabledReason;
                button.setAttribute('aria-label', `${action.label}：${action.disabledReason}`);
            }
            menu.appendChild(button);
        });
    },

    bindMessageContextMenu() {
        const Q = this.uiManager.Q.bind(this.uiManager);
        const list = Q('#chat-list');
        const menu = Q('#message-context-menu');
        if (!list || !menu) return;

        this.addManagedListener(list, 'contextmenu', (e) => {
            const bubble = this.getClosestElement(e.target, '.bubble[data-message-id]');
            if (!bubble) return;
            const selection = this.getCurrentSelection?.();
            if (selection && selection.toString().trim()) return;
            e.preventDefault();
            this.openMessageContextMenu(e, bubble.dataset.messageId);
        });

        this.addManagedListener(list, 'click', (e) => {
            const trigger = this.getClosestElement(e.target, '[data-message-menu-trigger]');
            if (!trigger) return;
            e.preventDefault();
            e.stopPropagation();
            const rect = trigger.getBoundingClientRect();
            this.openMessageContextMenu({
                clientX: rect.right,
                clientY: rect.bottom,
                keyboard: false
            }, trigger.dataset.messageId, { returnFocus: trigger, focusMenu: true });
        });

        this.addManagedListener(list, 'keydown', (e) => {
            const trigger = this.getClosestElement(e.target, '[data-message-menu-trigger]');
            const bubble = this.getClosestElement(e.target, '.bubble[data-message-id]');
            const isContextKey = e.key === 'ContextMenu' || (e.shiftKey && e.key === 'F10');
            if (!isContextKey || !bubble) return;
            e.preventDefault();
            e.stopPropagation();
            const returnFocus = trigger || bubble.querySelector('[data-message-menu-trigger]') || bubble;
            const rect = returnFocus.getBoundingClientRect();
            this.openMessageContextMenu({
                clientX: rect.right,
                clientY: rect.bottom,
                keyboard: true
            }, bubble.dataset.messageId, { returnFocus, focusMenu: true });
        });

        this.addManagedListener(menu, 'contextmenu', (e) => e.preventDefault());
        this.addManagedListener(menu, 'keydown', (e) => {
            const items = Array.from(menu.querySelectorAll('[data-message-menu-action]:not(:disabled)'));
            if (e.key === 'Escape') {
                e.preventDefault();
                this.closeMessageContextMenu({ restoreFocus: true });
                return;
            }
            if (!items.length || !['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(e.key)) return;
            e.preventDefault();
            const activeElement = this.uiManager.shadow
                ? this.uiManager.shadow.activeElement
                : menu.ownerDocument?.activeElement;
            const currentIndex = items.indexOf(activeElement);
            let nextIndex = currentIndex;
            if (e.key === 'Home') nextIndex = 0;
            if (e.key === 'End') nextIndex = items.length - 1;
            if (e.key === 'ArrowDown') nextIndex = currentIndex < 0 ? 0 : (currentIndex + 1) % items.length;
            if (e.key === 'ArrowUp') nextIndex = currentIndex < 0 ? items.length - 1 : (currentIndex - 1 + items.length) % items.length;
            items[nextIndex]?.focus();
        });
        this.addManagedListener(document, 'pointerdown', (e) => {
            if (!this.currentMessageMenuId) return;
            const path = e.composedPath?.() || [];
            if (path.includes(menu)) return;
            this.closeMessageContextMenu({ restoreFocus: false });
        }, true);
        const closeMessageMenuOnFrame = this.createFrameThrottledHandler(() => this.closeMessageContextMenu());
        this.addManagedListener(window, 'resize', closeMessageMenuOnFrame);
        this.addManagedListener(window, 'scroll', closeMessageMenuOnFrame, true);
    },

    bindSummarySelectionMenu() {
        const Q = this.uiManager.Q.bind(this.uiManager);
        const resultBox = Q('#summary-result');
        const chatList = Q('#chat-list');
        const menu = Q('#summary-selection-menu');
        if (!resultBox || !chatList || !menu) return;

        const scheduleOpen = (event, delay = 40) => {
            this.clearManagedTimeout(this.summarySelectionOpenTimerId);
            const requestSeq = (this.summarySelectionRequestSeq || 0) + 1;
            this.summarySelectionRequestSeq = requestSeq;
            this.summarySelectionOpenTimerId = this.setManagedTimeout(() => {
                this.summarySelectionOpenTimerId = null;
                if (requestSeq !== this.summarySelectionRequestSeq) return;
                const selectionState = this.getContentSelectionState();
                if (selectionState) {
                    this.openSummarySelectionMenu({
                        ...selectionState,
                        focusMenu: event?.type === 'keyup'
                    });
                } else {
                    this.closeSummarySelectionMenu();
                }
            }, delay);
        };

        this.addManagedListener(resultBox, 'mouseup', scheduleOpen);
        this.addManagedListener(resultBox, 'keyup', scheduleOpen);
        this.addManagedListener(resultBox, 'touchend', (event) => scheduleOpen(event, 100));
        this.addManagedListener(chatList, 'mouseup', scheduleOpen);
        this.addManagedListener(chatList, 'keyup', scheduleOpen);
        this.addManagedListener(chatList, 'touchend', (event) => scheduleOpen(event, 100));
        this.addManagedListener(document, 'selectionchange', (event) => {
            const selection = this.getCurrentSelection();
            if (!selection || selection.isCollapsed || !selection.toString().trim()) return;
            scheduleOpen(event, 90);
        });
        const closeSummarySelectionOnFrame = this.createFrameThrottledHandler(() => this.closeSummarySelectionMenu());
        this.addManagedListener(resultBox, 'scroll', closeSummarySelectionOnFrame, { passive: true });
        this.addManagedListener(menu, 'mousedown', (e) => e.preventDefault());
        this.addManagedListener(menu, 'pointerdown', (e) => e.preventDefault());
        this.addManagedListener(menu, 'keydown', (e) => {
            const items = Array.from(menu.querySelectorAll('.summary-selection-item:not(:disabled)'));
            if (e.key === 'Escape') {
                e.preventDefault();
                this.closeSummarySelectionMenu({ restoreFocus: true });
                return;
            }
            if (!items.length || !['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End'].includes(e.key)) return;
            e.preventDefault();
            const activeElement = this.uiManager.shadow
                ? this.uiManager.shadow.activeElement
                : menu.ownerDocument?.activeElement;
            const currentIndex = items.indexOf(activeElement);
            let nextIndex = currentIndex;
            if (e.key === 'Home') nextIndex = 0;
            if (e.key === 'End') nextIndex = items.length - 1;
            if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
                nextIndex = currentIndex < 0 ? 0 : (currentIndex + 1) % items.length;
            }
            if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
                nextIndex = currentIndex < 0 ? items.length - 1 : (currentIndex - 1 + items.length) % items.length;
            }
            items.forEach((item, index) => { item.tabIndex = index === nextIndex ? 0 : -1; });
            items[nextIndex]?.focus();
        });
        this.addManagedListener(document, 'pointerdown', (e) => {
            if (!this.currentContentSelection && !this.currentSummarySelection) return;
            const path = e.composedPath?.() || [];
            if (path.includes(menu)) return;
            this.closeSummarySelectionMenu();
        }, true);
        this.addManagedListener(window, 'resize', closeSummarySelectionOnFrame);
        this.addManagedListener(window, 'scroll', closeSummarySelectionOnFrame, true);
    },

    getCurrentSelection() {
        const candidates = [
            this.uiManager.shadow?.getSelection?.(),
            window.getSelection?.()
        ].filter(Boolean);
        return candidates.find(selection => selection.rangeCount > 0 && !selection.isCollapsed)
            || candidates.find(selection => selection.rangeCount > 0)
            || candidates[0]
            || null;
    },

    clearCurrentSelection() {
        const selections = [
            this.uiManager.shadow?.getSelection?.(),
            window.getSelection?.()
        ].filter(Boolean);
        const seen = new Set();
        selections.forEach((selection) => {
            if (seen.has(selection) || typeof selection.removeAllRanges !== 'function') return;
            seen.add(selection);
            selection.removeAllRanges();
        });
    },

    getContentSelectionState() {
        if (!this.hasChatContext() || this.editingMessageId) return null;

        const selection = this.getCurrentSelection();
        if (!selection || selection.rangeCount === 0 || selection.isCollapsed) return null;
        const isUseful = Core.isSelectionTextUseful || Core.isSummarySelectionTextUseful;
        if (!isUseful.call(Core, selection.toString())) return null;

        const range = selection.getRangeAt(0);
        const source = this.resolveContentSelectionSource(range);
        if (!source) return null;

        const rect = this.getSelectionAnchorRect(range);
        if (!rect) return null;

        const rawText = selection.toString();
        const normalize = Core.normalizeSelectionText || Core.normalizeSummarySelectionText;
        const normalized = normalize.call(Core, rawText);
        return {
            text: rawText.trim(),
            truncated: normalized.truncated,
            sourceKind: source.sourceKind,
            messageId: source.messageId || null,
            returnFocus: source.returnFocus || null,
            rect: {
                left: rect.left,
                right: rect.right,
                top: rect.top,
                bottom: rect.bottom,
                width: rect.width,
                height: rect.height
            }
        };
    },

    getSummarySelectionState() {
        return this.getContentSelectionState();
    },

    getTrustedDirectAnswer(container) {
        if (!container) return null;
        const selector = '.ai-output-answer[data-selection-scope="answer"]';
        const answer = Array.from(container.children || [])
            .find((child) => child.matches?.(selector));
        if (!answer || answer.parentElement !== container) return null;
        if (this.getClosestElement(answer, '[data-thinking-block]')) return null;
        return answer;
    },

    resolveContentSelectionSource(range) {
        if (!range) return null;
        const startNode = range.startContainer?.nodeType === 1 ? range.startContainer : range.startContainer?.parentElement;
        const endNode = range.endContainer?.nodeType === 1 ? range.endContainer : range.endContainer?.parentElement;
        const commonNode = range.commonAncestorContainer?.nodeType === 1
            ? range.commonAncestorContainer
            : range.commonAncestorContainer?.parentElement;
        if (!startNode || !endNode || !commonNode) return null;

        const selector = '.ai-output-answer[data-selection-scope="answer"]';
        const startAnswer = this.getClosestElement(startNode, selector);
        const endAnswer = this.getClosestElement(endNode, selector);
        const commonAnswer = this.getClosestElement(commonNode, selector);
        if (!startAnswer || startAnswer !== endAnswer || startAnswer !== commonAnswer) return null;
        if (this.getClosestElement(startAnswer, '[data-thinking-block]')) return null;

        const resultBox = this.uiManager.Q('#summary-result');
        if (this.currentTab === 'summary' && this.getTrustedDirectAnswer(resultBox) === startAnswer) {
            return {
                sourceKind: 'summary-answer',
                messageId: null,
                returnFocus: resultBox
            };
        }

        if (this.currentTab !== 'chat') return null;
        const bubble = this.getClosestElement(startAnswer, '.bubble-ai[data-message-id]');
        const messageId = bubble?.dataset?.messageId;
        const message = messageId ? this.findVisibleMessage(messageId) : null;
        if (!bubble || !message || message.role !== 'assistant' || message.status !== 'done') return null;
        if (this.getTrustedDirectAnswer(bubble) !== startAnswer) return null;
        if (!this.getMessageCopyText(message).trim()) return null;
        return {
            sourceKind: 'assistant-message',
            messageId,
            returnFocus: bubble
        };
    },

    isSummarySelectionRangeAllowed(range) {
        return Boolean(this.resolveContentSelectionSource(range));
    },

    getSelectionAnchorRect(range) {
        const rects = Array.from(range.getClientRects?.() || [])
            .filter((rect) => rect && rect.width > 0 && rect.height > 0);
        if (rects.length > 0) return rects[Math.floor((rects.length - 1) / 2)];
        const rect = range.getBoundingClientRect?.();
        if (rect && rect.width > 0 && rect.height > 0) return rect;
        return null;
    },

    openSummarySelectionMenu(selectionState) {
        const menu = this.uiManager.Q('#summary-selection-menu');
        if (!menu || !selectionState?.text) return;
        this.closeMessageContextMenu?.();
        this.currentContentSelection = selectionState;
        this.currentSummarySelection = selectionState;
        this.currentSummarySelectionReturnFocus = selectionState.returnFocus
            || this.uiManager.shadow?.activeElement
            || this.uiManager.Q('#summary-result');
        menu.setAttribute('aria-label', selectionState.sourceKind === 'assistant-message'
            ? 'AI 回答选区操作'
            : '总结选区操作');
        const items = Array.from(menu.querySelectorAll('.summary-selection-item:not(:disabled)'));
        items.forEach((item, index) => { item.tabIndex = index === 0 ? 0 : -1; });
        menu.classList.add('show');
        menu.setAttribute('aria-hidden', 'false');
        this.positionSummarySelectionMenu(menu, selectionState.rect);
        if (selectionState.focusMenu) {
            this.requestManagedFrame(() => items[0]?.focus());
        }
    },

    positionSummarySelectionMenu(menu, anchorRect) {
        const sidebar = this.uiManager.Q('#sidebar');
        if (!sidebar || !anchorRect) return;
        menu.style.visibility = 'hidden';
        menu.style.left = '0px';
        menu.style.top = '0px';

        const gap = 8;
        const sidebarRect = sidebar.getBoundingClientRect();
        const maxWidth = Math.max(180, sidebarRect.width - gap * 2);
        menu.style.maxWidth = `${maxWidth}px`;

        const menuW = Math.min(menu.offsetWidth || 260, maxWidth);
        const menuH = menu.offsetHeight || 46;
        const centerX = anchorRect.left + anchorRect.width / 2 - sidebarRect.left;
        const aboveY = anchorRect.top - sidebarRect.top - menuH - gap;
        const belowY = anchorRect.bottom - sidebarRect.top + gap;
        const minX = gap;
        const maxX = Math.max(minX, sidebarRect.width - menuW - gap);
        const minY = gap;
        const maxY = Math.max(minY, sidebarRect.height - menuH - gap);
        const x = Math.max(minX, Math.min(centerX - menuW / 2, maxX));
        const preferredY = aboveY >= minY ? aboveY : belowY;
        const y = Math.max(minY, Math.min(preferredY, maxY));

        menu.style.left = `${x}px`;
        menu.style.top = `${y}px`;
        menu.style.visibility = '';
    },

    closeSummarySelectionMenu({ restoreFocus = false } = {}) {
        this.summarySelectionRequestSeq = (this.summarySelectionRequestSeq || 0) + 1;
        this.clearManagedTimeout(this.summarySelectionOpenTimerId);
        this.summarySelectionOpenTimerId = null;
        const menu = this.uiManager.Q('#summary-selection-menu');
        if (menu) {
            menu.classList.remove('show');
            menu.setAttribute('aria-hidden', 'true');
        }
        const returnFocus = this.currentSummarySelectionReturnFocus;
        this.currentContentSelection = null;
        this.currentSummarySelection = null;
        this.currentSummarySelectionReturnFocus = null;
        if (restoreFocus && returnFocus?.isConnected) returnFocus.focus();
    },

    openMessageContextMenu(event, messageId, options = {}) {
        const Q = this.uiManager.Q.bind(this.uiManager);
        const menu = Q('#message-context-menu');
        const message = this.findVisibleMessage(messageId);
        if (!menu || !message) return;

        this.closeSummarySelectionMenu?.();
        this.currentMessageMenuId = messageId;
        this.currentMessageMenuReturnFocus = options.returnFocus || null;
        Q('#chat-list')?.querySelectorAll('[data-message-menu-trigger]').forEach((trigger) => {
            trigger.setAttribute('aria-expanded', trigger.dataset.messageId === messageId ? 'true' : 'false');
        });
        this.renderMessageContextMenuActions(menu, message);

        menu.classList.add('show');
        menu.setAttribute('aria-hidden', 'false');
        this.positionMessageContextMenu(menu, event);
        if (options.focusMenu) {
            this.requestManagedFrame(() => {
                menu.querySelector('[data-message-menu-action]:not(:disabled)')?.focus();
            });
        }
    },

    positionMessageContextMenu(menu, event) {
        const sidebar = this.uiManager.Q('#sidebar');
        if (!sidebar) return;
        menu.style.visibility = 'hidden';
        menu.style.left = '0px';
        menu.style.top = '0px';

        const gap = 8;
        const sidebarRect = sidebar.getBoundingClientRect();
        const maxWidth = Math.max(112, Math.min(180, sidebarRect.width - gap * 2));
        menu.style.maxWidth = `${maxWidth}px`;

        const menuW = Math.min(menu.offsetWidth || 112, maxWidth);
        const menuH = menu.offsetHeight || 150;
        const minX = gap;
        const maxX = Math.max(minX, sidebarRect.width - menuW - gap);
        const minY = gap;
        const maxY = Math.max(minY, sidebarRect.height - menuH - gap);
        const anchor = this.getBubbleElement(this.currentMessageMenuId)?.getBoundingClientRect();
        const clientX = Number.isFinite(event?.clientX) ? event.clientX : anchor?.right;
        const clientY = Number.isFinite(event?.clientY) ? event.clientY : anchor?.top;
        const localX = (Number.isFinite(clientX) ? clientX : sidebarRect.left + gap) - sidebarRect.left;
        const localY = (Number.isFinite(clientY) ? clientY : sidebarRect.top + gap) - sidebarRect.top;
        const x = Math.max(minX, Math.min(localX, maxX));
        const y = Math.max(minY, Math.min(localY, maxY));

        menu.style.left = `${x}px`;
        menu.style.top = `${y}px`;
        menu.style.visibility = '';
    },

    closeMessageContextMenu({ restoreFocus = false } = {}) {
        const menu = this.uiManager.Q('#message-context-menu');
        if (menu) {
            menu.classList.remove('show');
            menu.setAttribute('aria-hidden', 'true');
        }
        this.uiManager.Q('#chat-list')?.querySelectorAll('[data-message-menu-trigger]').forEach((trigger) => {
            trigger.setAttribute('aria-expanded', 'false');
        });
        const returnFocus = this.currentMessageMenuReturnFocus;
        this.currentMessageMenuId = null;
        this.currentMessageMenuReturnFocus = null;
        if (restoreFocus && returnFocus?.isConnected) returnFocus.focus();
    },

    handleMessageMenuAction(action, messageId) {
        if (!action || !messageId) return;
        const message = this.findVisibleMessage(messageId);
        const actionState = this.getMessageMenuAction(message, action);
        if (!actionState || actionState.disabled) {
            const reason = actionState?.disabledReason || '当前状态不能执行此操作';
            return this.showToast(reason, 'error');
        }
        if (action === 'copy') return this.copyMessage(messageId);
        if (action === 'edit') return this.startEditMessage(messageId);
        if (action === 'regenerate') return this.regenerateMessage(messageId);
        if (action === 'stop') return this.stopMessageUpdate(messageId);
        if (action === 'delete') return this.deleteMessage(messageId);
    },

    async handleSummarySelectionAction(action) {
        const selection = this.currentContentSelection || this.currentSummarySelection;
        if (!selection?.text) return;
        if (!this.hasChatContext()) {
            this.closeSummarySelectionMenu();
            return this.showToast('请先完成总结', 'error');
        }
        if (this.editingMessageId) {
            this.closeSummarySelectionMenu();
            return this.showToast('正在编辑消息，请先完成或取消编辑', 'error');
        }

        if (selection.sourceKind === 'assistant-message') {
            const message = this.findVisibleMessage(selection.messageId);
            const bubble = this.getBubbleElement(selection.messageId);
            if (!message || message.role !== 'assistant' || message.status !== 'done'
                || !this.getTrustedDirectAnswer(bubble)) {
                this.closeSummarySelectionMenu();
                return this.showToast('原 AI 回答已发生变化，请重新选择', 'error');
            }
        }

        const buildPrompt = Core.buildSelectionPrompt || Core.buildSummarySelectionPrompt;
        const promptSpec = buildPrompt.call(Core, action, selection.text, {
            sourceKind: selection.sourceKind || 'summary-answer'
        });
        if (!promptSpec?.prompt?.trim()) {
            this.closeSummarySelectionMenu();
            return this.showToast('当前选区操作不可用', 'error');
        }

        const input = this.uiManager.Q('#chat-input');
        const hasDraft = !!input?.value.trim();
        const shouldAutoSend = promptSpec.autoSend && !this.isGenerating && !hasDraft;
        this.closeSummarySelectionMenu();
        this.clearCurrentSelection();
        this.switchTab('chat');
        this.fillChatInputWithSelectionPrompt(promptSpec.prompt);
        if (selection.truncated || promptSpec.truncated) {
            this.showToast('选区较长，已截取前 2000 字');
        } else if (promptSpec.autoSend && hasDraft) {
            this.showToast('已有输入草稿，已追加选区内容');
        } else if (!shouldAutoSend) {
            this.showToast('已带入对话输入框');
        }

        if (promptSpec.autoSend && this.isGenerating) {
            this.showToast('当前正在生成，已先填入输入框');
            return;
        }
        if (shouldAutoSend) await this.doChat();
    },

    fillChatInputWithSelectionPrompt(prompt) {
        const input = this.uiManager.Q('#chat-input');
        if (!input) return;
        const current = input.value.trim();
        input.value = current
            ? `${current}\n\n---\n${prompt}`
            : prompt;
        input.style.height = 'auto';
        input.style.height = Math.min(input.scrollHeight, 140) + 'px';
        input.focus();
    },

    copyMessage(messageId) {
        const message = this.findVisibleMessage(messageId);
        const text = this.getMessageCopyText(message);
        if (!text.trim()) return this.showToast('没有可复制的内容', 'error');
        this.copyToClipboard(text);
        this.closeMessageContextMenu();
    },

    startEditMessage(messageId) {
        if (this.isGenerating) return this.showToast('生成中不能编辑消息', 'error');
        const message = this.findVisibleMessage(messageId);
        if (!message || message.status === 'streaming') return;
        if (message.role === 'assistant' && message.status !== 'done') return this.showToast('失败回复不能直接编辑，请重新生成', 'error');

        const input = this.uiManager.Q('#chat-input');
        this.closeMessageContextMenu();
        this.editingMessageId = messageId;
        this.editingDraftBefore = input.value;
        input.value = message.role === 'assistant' ? (message.content || '') : (message.content || '');
        input.style.height = 'auto';
        input.style.height = Math.min(input.scrollHeight, 140) + 'px';
        this.renderChatMessages();
        this.updateChatInputMode();
        input.focus();
        this.showToast('编辑后按 Enter 保存，Esc 取消');
    },

    async confirmEditMessage() {
        const input = this.uiManager.Q('#chat-input');
        const message = this.findVisibleMessage(this.editingMessageId);
        if (!message) return this.cancelEditMessage();

        const nextContent = input.value.trim();
        if (!nextContent) return this.showToast('编辑内容不能为空', 'error');
        if (this.isGenerating) return;

        const messageId = message.id;
        const isUser = message.role === 'user';
        this.setVisibleMessage(messageId, {
            content: nextContent,
            rawContent: nextContent,
            outputState: isUser ? null : Core.normalizeAiOutputState(nextContent),
            status: 'done',
            errorKind: null,
            errorMessage: '',
            excludeFromApi: isUser
        });
        this.removeVisibleMessagesAfter(messageId);

        this.editingMessageId = null;
        this.editingDraftBefore = '';
        input.value = '';
        input.style.height = 'auto';
        this.updateChatInputMode();
        this.renderChatMessages();

        if (isUser) {
            await this.requestAssistantForUser(this.findVisibleMessage(messageId));
        } else {
            this.showToast('已更新回复内容');
        }
    },

    cancelEditMessage() {
        const input = this.uiManager.Q('#chat-input');
        if (input) {
            input.value = this.editingDraftBefore || '';
            input.style.height = 'auto';
            input.style.height = Math.min(input.scrollHeight, 140) + 'px';
        }
        this.editingMessageId = null;
        this.editingDraftBefore = '';
        this.updateChatInputMode();
        this.renderChatMessages();
    },

    getRegenerateUserMessage(message) {
        if (!message) return null;
        if (message.role === 'user') return message;
        if (message.regenerateFromUserId) {
            const source = this.findVisibleMessage(message.regenerateFromUserId);
            if (source?.role === 'user') return source;
        }
        return this.getUserForAssistant(message.id);
    },

    async regenerateMessage(messageId) {
        const message = this.findVisibleMessage(messageId);
        const userMessage = this.getRegenerateUserMessage(message);
        if (!message || !userMessage) return this.showToast('未找到可重新生成的问题', 'error');

        const activeRequest = this.activeChatRequest;
        const isCurrentStreamingAssistant = Boolean(activeRequest
            && message.role === 'assistant'
            && message.id === activeRequest.assistantMessageId);
        if (this.isGenerating && !isCurrentStreamingAssistant) {
            return this.showToast('当前回复生成中，只能重新生成正在更新的消息', 'error');
        }

        this.closeMessageContextMenu();
        if (isCurrentStreamingAssistant) this.abortActiveChatRequest('regenerate');
        if (message.role === 'assistant') {
            this.removeVisibleMessagesAfter(message.id, { includeTarget: true });
        } else {
            this.removeVisibleMessagesAfter(message.id);
        }
        this.renderChatMessages();
        await this.requestAssistantForUser(userMessage);
    },

    stopMessageUpdate(messageId) {
        const activeRequest = this.activeChatRequest;
        if (!activeRequest || activeRequest.assistantMessageId !== messageId) {
            return this.showToast('这条消息当前没有正在进行的更新', 'error');
        }
        this.closeMessageContextMenu();
        this.abortActiveChatRequest('stop');
        this.showToast('已停止本次 AI 生成', 'success');
    },

    deleteMessage(messageId) {
        const message = this.findVisibleMessage(messageId);
        if (!message) return;

        const activeRequest = this.activeChatRequest;
        const isCurrentStreamingAssistant = Boolean(activeRequest
            && message.role === 'assistant'
            && message.id === activeRequest.assistantMessageId);
        if (this.isGenerating && !isCurrentStreamingAssistant) {
            return this.showToast('当前回复生成中，只能删除正在更新的消息', 'error');
        }

        this.closeMessageContextMenu();
        if (isCurrentStreamingAssistant) this.abortActiveChatRequest('delete');
        if (this.editingMessageId === messageId) this.cancelEditMessage();
        if (message.role === 'assistant') {
            const userMessage = this.getUserForAssistant(message.id);
            if (userMessage) this.setVisibleMessage(userMessage.id, { excludeFromApi: true });
        }
        this.removeVisibleMessagesAfter(messageId, { includeTarget: true });
        this.renderChatMessages();
        if (this.chatSession.visibleMessages.length === 0) {
            const empty = this.uiManager.Q('#chat-empty');
            empty.classList.remove('hidden');
            empty.innerHTML = '<span class="tip-icon">💬</span>对话已清空<br>可以继续基于帖子内容提问';
        }
        this.showToast('消息已删除');
    },

    refreshSummaryCache() {
        const Q = this.uiManager.Q.bind(this.uiManager);
        const tid = Core.getTopicId();
        const start = Q('#inp-start').value;
        const end = Q('#inp-end').value;

        if (!tid) return this.showToast('未检测到帖子ID', 'error');
        if (!start || !end || parseInt(start) > parseInt(end)) {
            Core.clearTopicDataCache(tid);
            this.forceRefreshDialogueCache = true;
            return this.showToast('下次总结将重新获取楼层内容', 'success');
        }

        Core.clearDialogueCache(tid, parseInt(start), parseInt(end));
        Core.clearTopicDataCache(tid);
        this.forceRefreshDialogueCache = true;
        this.showToast('下次总结将重新获取楼层内容', 'success');
    },

    async doSummary() {
        const Q = this.uiManager.Q.bind(this.uiManager);
        const tid = Core.getTopicId();
        if (!tid) return this.showToast('未检测到帖子ID', 'error');
        if (['all', 'recent'].includes(this.rangeMode) && this.rangeBoundsTopicId !== tid) {
            if (!await this.setRange(this.rangeMode)) return;
        }
        if (!await this.waitForRangeConfirmation('summary')) return;
        let start = parseInt(Q('#inp-start').value, 10);
        let end = parseInt(Q('#inp-end').value, 10);
        if (!start) {
            start = 1;
            Q('#inp-start').value = start;
        }
        if (!end) {
            try {
                end = await this.getRangeUpperBound({ scope: 'summary', forceRefresh: true, allowDomFallback: false });
            } catch (e) {
                return this.showToast(`获取最新楼层失败: ${e.message || e}`, 'error');
            }
            if (end) Q('#inp-end').value = end;
        }
        if (!start || !end || start > end) return this.showToast('楼层范围无效', 'error');

        const replacement = this.getWorkspaceReplacementContext(tid);
        if (replacement && !await this.requestWorkspaceReplacementConfirm(replacement)) return;

        const request = this.beginSummaryRequestLifecycle({ topicId: tid });
        const settleRequest = (phase) => {
            if (!this.isCurrentSummaryRequest(request)) return false;
            const controller = request.controller;
            this.finalizeSummaryRequest(request, phase);
            if (controller) this.clearAiAbortController(controller);
            this.setLoading('#btn-summary', false);
            return true;
        };

        this.clearChatContext();
        this.setWorkspaceTopicId(tid);
        Q('#chat-list').innerHTML = '';
        Q('#chat-empty').classList.remove('hidden');
        Q('#chat-empty').innerHTML = '<span class="tip-icon">💬</span>请先完成本次总结，<br>然后即可基于新上下文进行对话';
        this.updateMessageCount();
        this.setLoading('#btn-summary', true);
        const resultBox = Q('#summary-result');
        resultBox.classList.remove('empty');
        this.summaryUserScrolledUp = false;
        this.isSummaryProgrammaticScroll = false;
        resultBox.scrollTop = 0;
        resultBox.innerHTML = `<div style="display:flex;align-items:center;gap:10px;"><div class="thinking"><div class="thinking-dot"></div><div class="thinking-dot"></div><div class="thinking-dot"></div></div>正在获取帖子内容...</div>`;
        this.updateSummaryScrollButton();

        try {
            const forceRefresh = this.forceRefreshDialogueCache === true;
            this.forceRefreshDialogueCache = false;
            const { text, cacheHit, cacheEntry, rangeMapping } = await Core.fetchDialoguesCached(tid, start, end, (progress) => {
                if (!this.isCurrentSummaryRequest(request)) return;
                const progressText = Core.escapeHtml(Core.getFetchProgressText(progress, '帖子内容'));
                resultBox.innerHTML = `<div style="display:flex;align-items:center;gap:10px;"><div class="thinking"><div class="thinking-dot"></div><div class="thinking-dot"></div><div class="thinking-dot"></div></div>${progressText}</div>`;
                this.updateSummaryScrollButton();
            }, {
                forceRefresh
            });
            if (!this.isCurrentSummaryRequest(request)) return;
            if (!text) throw new Error('未获取到内容');
            this.postContent = text;
            const coverageReport = Core.buildSummaryCoverageReport({
                topicId: tid,
                start,
                end,
                cacheHit,
                cacheEntry,
                rangeMapping
            });
            resultBox.innerHTML = `<div style="display:flex;align-items:center;gap:10px;"><div class="thinking"><div class="thinking-dot"></div><div class="thinking-dot"></div><div class="thinking-dot"></div></div>${cacheHit ? '已复用楼层缓存，AI 正在重新分析中...' : 'AI 正在分析中...'}</div>`;
            this.updateSummaryScrollButton();

            const messages = [
                { role: 'system', content: GM_getValue('prompt_sum', '') },
                { role: 'user', content: `帖子内容:\n${text}` }
            ];

            const outputState = Core.createAiOutputState();
            const abortController = this.startAiAbortController('summary');
            if (!this.attachSummaryAbortController(request, abortController)) {
                abortController.abort('stale');
                return;
            }
            await Core.streamChat(messages,
                (event) => {
                    if (!this.isCurrentSummaryRequest(request)) return;
                    Core.applyAiOutputEvent(outputState, event);
                    this.scheduleSummaryRender(resultBox, () => outputState);
                },
                (meta = {}) => {
                    if (!this.isCurrentSummaryRequest(request)) return;
                    this.cancelSummaryRender();
                    Core.finishAiOutputState(outputState, meta);
                    const classified = Core.classifyAiOutput(outputState, meta);
                    if (classified.kind !== 'success') {
                        const failure = Core.createModelOutputFailure(classified, {
                            operation: 'summary',
                            sourceConfig: meta.sourceConfig
                        });
                        const formatted = Core.formatAiFailureForUi(failure);
                        const hasOutput = Boolean(outputState.reasoningText.trim() || outputState.contentText.trim());
                        if (hasOutput) {
                            this.updateResultBox(resultBox, outputState, false, coverageReport, failure.sourceConfig, failure);
                        } else {
                            resultBox.innerHTML = Core.renderAiFailureBlock(failure, { operation: 'summary' });
                        }
                        this.updateSummaryScrollButton();
                        this.showToast('总结失败: ' + formatted.toast, 'error');
                        settleRequest('failed');
                        return;
                    }
                    const sourceConfig = Core.normalizeAiSourceConfig(meta.sourceConfig);
                    this.updateResultBox(resultBox, outputState, false, coverageReport, sourceConfig);
                    this.setChatContext({
                        topicId: tid,
                        start,
                        end,
                        postContent: text,
                        summaryRawText: outputState.contentText,
                        summaryContent: classified.content,
                        coverageReport,
                        sourceConfig
                    });
                    this.renderChatMessages();
                    Q('#chat-empty').classList.remove('hidden');
                    Q('#chat-empty').innerHTML = '<span class="tip-icon">✅</span>总结已完成！<br>现在可以基于帖子内容进行对话';
                    this.updateWorkspaceSourceStatus();
                    settleRequest('completed');
                },
                (err) => {
                    if (!this.isCurrentSummaryRequest(request)) return;
                    this.cancelSummaryRender();
                    const failure = Core.normalizeAiFailure(err, { operation: 'summary' });
                    const formatted = Core.formatAiFailureForUi(failure);
                    const wasAborted = Core.isAiAbortFailure(failure);
                    Core.markAiOutputFailure(outputState, failure);
                    const hasOutput = Boolean(outputState.reasoningText.trim() || outputState.contentText.trim());
                    if (hasOutput) {
                        this.updateResultBox(resultBox, outputState, false, coverageReport, failure.sourceConfig, failure);
                    } else {
                        resultBox.innerHTML = Core.renderAiFailureBlock(failure, { operation: 'summary' });
                        this.updateSummaryScrollButton();
                    }
                    if (!wasAborted) {
                        this.showToast('总结失败: ' + formatted.toast, 'error');
                    }
                    settleRequest(wasAborted ? 'stopped' : 'failed');
                },
                { operation: 'summary', signal: abortController.signal }
            );
        } catch (e) {
            if (!this.isCurrentSummaryRequest(request)) return;
            resultBox.innerHTML = `<div style="color:var(--danger)">❌ 错误: ${Core.escapeHtml(e.message || e)}</div>`;
            this.updateSummaryScrollButton();
            settleRequest('failed');
        }
    },

    async doChat() {
        const Q = this.uiManager.Q.bind(this.uiManager);
        if (this.isGenerating) return;
        if (this.editingMessageId) return this.confirmEditMessage();
        if (!this.hasChatContext()) return this.showToast('请先生成总结', 'error');

        const input = Q('#chat-input');
        const txt = input.value.trim();
        if (!txt) return;

        input.value = '';
        input.style.height = 'auto';
        Q('#chat-empty').classList.add('hidden');
        this.userScrolledUp = false;

        const userMessage = this.appendVisibleMessage(this.createVisibleMessage('user', txt, { excludeFromApi: true }));
        this.renderChatMessages();
        await this.requestAssistantForUser(userMessage);
    },

    //
};
