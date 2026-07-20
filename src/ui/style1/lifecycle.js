import { CONFIG } from '../../config.js';
import { Core } from '../../core/index.js';
import { UIRegistry } from '../registry.js';

export const style1Lifecycle = {
    name: '橘色现代风格',
    styleKey: 'style1',

    //
    // 1. 初始化与销毁
    //
    init(uiManager) {
        this.uiManager = uiManager; // 保存UI管理器的引用

        // 初始化内部状态
        this.isOpen = false;
        this._cleanupFns = [];
        this._timerIds = new Set();
        this._frameIds = new Set();
        this.streamingRenderDelayMs = 80;
        this.summaryRenderTask = null;
        this.bubbleRenderTasks = new Map();
        this.chatInputResizeFrameId = null;
        this.chatInputResizeTarget = null;
        this.chatInputMaxHeights = new WeakMap();
        this.chatScrollFrameId = null;
        this.chatScrollResetTimerId = null;
        this.chatScrollForce = false;
        this.summaryScrollFrameId = null;
        this.summaryScrollResetTimerId = null;
        this.summaryScrollForce = false;
        this.btnPos = GM_getValue(this.getStyleStorageKey('btnPos'), { side: 'right', top: '50%' });
        this.side = this.btnPos.side;
        this.sidebarWidth = GM_getValue(this.getStyleStorageKey('sidebarWidth'), 420);
        this.isDarkTheme = GM_getValue(this.getStyleStorageKey('isDarkTheme'), false);
        this.chatHistory = [];
        this.chatSession = this.createEmptyChatSession();
        this.editingMessageId = null;
        this.editingDraftBefore = '';
        this.currentMessageMenuId = null;
        this.currentMessageMenuReturnFocus = null;
        this.currentContentSelection = null;
        this.currentSummarySelection = null;
        this.currentSummarySelectionReturnFocus = null;
        this.summarySelectionOpenTimerId = null;
        this.summarySelectionRequestSeq = 0;
        this.lifecycleEpoch = Symbol('ui-lifecycle');
        this.summaryRequestSeq = 0;
        this.activeSummaryRequest = null;
        this.chatRequestSeq = 0;
        this.modelListRequestSeq = 0;
        this.modelListAbortController = null;
        this.modelListTimeoutId = null;
        this.modelListLoading = false;
        this.modelListTimeoutMs = 15_000;
        this.modelPickerReturnFocus = null;
        this.currentAiAbortController = null;
        this.currentAiAbortScope = '';
        this.activeChatRequest = null;
        this.settingsStorageSyncTimerId = null;
        this.settingsStorageSyncRetryTimerId = null;
        this.pendingSettingsStorageSyncKeys = new Set();
        this.dirtySettingsKeys = new Set();
        this.applyingRemoteSettingsSnapshot = false;
        this.remoteSettingsConflictNotified = false;
        this.postContent = '';
        this.lastSummary = '';
        this.workspaceTopicId = '';
        this.workspaceReplacementResolve = null;
        this.workspaceReplacementReturnFocus = null;
        this.forceRefreshDialogueCache = false;
        this.isGenerating = false;
        this.currentTab = 'summary';
        this.userMessageCount = 0;
        this.userScrolledUp = false;
        this.isProgrammaticScroll = false;
        this.summaryUserScrolledUp = false;
        this.isSummaryProgrammaticScroll = false;
        this.apiProfiles = [];
        this.activeApiProfileId = '';
        this.apiProfilePersistTimerId = null;
        this.rangeRequestSeq = 0;
        this.exportRangeRequestSeq = 0;
        this.exportRequestSeq = 0;
        this.activeExportRequest = null;
        this.rangeMode = 'manual';
        this.exportRangeMode = 'manual';
        this.rangeBoundsTopicId = '';
        this.exportRangeBoundsTopicId = '';
        this.rangeBoundsLastRefreshAt = 0;
        this.rangeConfirmationPromise = null;
        this.exportRangeConfirmationPromise = null;

        this.render();
        this.restoreState();
        this.bindEvents();
        this.bindKeyboardShortcuts();
    },

    destroy() {
        this.closeWorkspaceReplacementConfirm?.(false, { restoreFocus: false });
        this.closeModelPicker?.({ restoreFocus: false });
        if (this.activeSummaryRequest) this.abortActiveSummaryRequest?.('destroy');
        if (this.activeChatRequest) this.abortActiveChatRequest?.('close');
        this.abortActiveExportRequest?.('destroy');
        this.cancelModelListRequest?.();
        this._cleanupFns?.forEach((cleanup) => cleanup());
        this._cleanupFns = [];
        this._timerIds?.forEach((timerId) => clearTimeout(timerId));
        this._timerIds?.clear();
        this._frameIds?.forEach((frameId) => {
            if (typeof cancelAnimationFrame === 'function') {
                cancelAnimationFrame(frameId);
            } else {
                clearTimeout(frameId);
            }
        });
        this._frameIds?.clear();
        this.summaryRenderTask = null;
        this.bubbleRenderTasks?.clear();
        this.chatInputResizeFrameId = null;
        this.chatInputResizeTarget = null;
        this.chatInputMaxHeights = new WeakMap();
        this.chatScrollFrameId = null;
        this.chatScrollResetTimerId = null;
        this.chatScrollForce = false;
        this.summaryScrollFrameId = null;
        this.summaryScrollResetTimerId = null;
        this.summaryScrollForce = false;
        this.summarySelectionOpenTimerId = null;
        this.summarySelectionRequestSeq = (this.summarySelectionRequestSeq || 0) + 1;
        this.currentContentSelection = null;
        this.currentSummarySelection = null;
        this.currentSummarySelectionReturnFocus = null;
        this.currentMessageMenuId = null;
        this.currentMessageMenuReturnFocus = null;
        this.modelPickerReturnFocus = null;
        this.workspaceReplacementReturnFocus = null;
        this.activeSummaryRequest = null;
        this.activeChatRequest = null;
        this.activeExportRequest = null;
        this.currentAiAbortController = null;
        this.currentAiAbortScope = '';
        this.pendingSettingsStorageSyncKeys?.clear();
        this.dirtySettingsKeys?.clear();
        this.apiProfiles = [];
        this.clearChatContext?.();
        this.lifecycleEpoch = null;
        this.resetGlobalUiState();
        this.isOpen = false;
        this.uiManager = null;
    },

    getStyleStorageKey(key) {
        return `${this.styleKey}_${key}`;
    },

    addManagedListener(target, eventName, handler, options) {
        target.addEventListener(eventName, handler, options);
        this._cleanupFns.push(() => target.removeEventListener(eventName, handler, options));
    },

    addManagedValueChangeListener(key, handler) {
        if (typeof GM_addValueChangeListener !== 'function') return null;
        const listenerId = GM_addValueChangeListener(key, handler);
        if (listenerId !== null && listenerId !== undefined && typeof GM_removeValueChangeListener === 'function') {
            this._cleanupFns.push(() => GM_removeValueChangeListener(listenerId));
        }
        return listenerId;
    },

    setManagedTimeout(handler, delay = 0) {
        const timerId = setTimeout(() => {
            this._timerIds?.delete(timerId);
            handler();
        }, delay);
        this._timerIds?.add(timerId);
        return timerId;
    },

    clearManagedTimeout(timerId) {
        if (!timerId) return;
        clearTimeout(timerId);
        this._timerIds?.delete(timerId);
    },

    requestManagedFrame(handler) {
        if (typeof requestAnimationFrame !== 'function') {
            return this.setManagedTimeout(() => handler(Date.now()), 0);
        }
        const frameId = requestAnimationFrame((timestamp) => {
            this._frameIds?.delete(frameId);
            handler(timestamp);
        });
        this._frameIds?.add(frameId);
        return frameId;
    },

    cancelManagedFrame(frameId) {
        if (!frameId) return;
        if (typeof cancelAnimationFrame === 'function') {
            cancelAnimationFrame(frameId);
            this._frameIds?.delete(frameId);
        } else {
            this.clearManagedTimeout(frameId);
        }
    },

    createFrameThrottledHandler(handler) {
        let frameId = null;
        let lastArgs = null;
        return (...args) => {
            lastArgs = args;
            if (frameId) return;
            frameId = this.requestManagedFrame(() => {
                frameId = null;
                const argsToUse = lastArgs;
                lastArgs = null;
                handler(...argsToUse);
            });
        };
    },

    getStreamingRenderDelay(output) {
        const content = output && typeof output === 'object'
            ? `${output.reasoningText || ''}${output.contentText || output.content || ''}`
            : `${output ?? ''}`;
        if (content.length > 32_768) return 220;
        if (content.length > 8_192) return 140;
        return this.streamingRenderDelayMs;
    },

    syncVisualViewport() {
        if (!this.uiManager?.host || typeof window === 'undefined') return;
        const viewport = window.visualViewport;
        const height = Math.max(1, Number(viewport?.height) || window.innerHeight || 1);
        const width = Math.max(1, Number(viewport?.width) || window.innerWidth || 1);
        this.uiManager.host.style.setProperty('--ui-viewport-height', `${Math.round(height)}px`);
        this.uiManager.host.style.setProperty('--ui-viewport-width', `${Math.round(width)}px`);
    },

    resizeChatInput(input) {
        if (!input) return;
        let maxHeight = this.chatInputMaxHeights?.get(input);
        if (!Number.isFinite(maxHeight)) {
            const computedMaxHeight = typeof getComputedStyle === 'function'
                ? Number.parseFloat(getComputedStyle(input).maxHeight)
                : Number.NaN;
            maxHeight = Number.isFinite(computedMaxHeight) ? computedMaxHeight : 140;
            this.chatInputMaxHeights?.set(input, maxHeight);
        }
        input.style.height = 'auto';
        input.style.height = `${Math.min(input.scrollHeight, maxHeight)}px`;
    },

    scheduleChatInputResize(input) {
        this.chatInputResizeTarget = input;
        if (this.chatInputResizeFrameId) return;
        this.chatInputResizeFrameId = this.requestManagedFrame(() => {
            this.chatInputResizeFrameId = null;
            const target = this.chatInputResizeTarget;
            this.chatInputResizeTarget = null;
            this.resizeChatInput(target);
        });
    },

    scheduleSummaryRender(resultBox, getText) {
        const task = this.summaryRenderTask || {};
        task.resultBox = resultBox;
        task.getText = getText;
        this.summaryRenderTask = task;
        if (task.timerId || task.frameId) return;

        const delay = this.getStreamingRenderDelay(task.getText());
        task.timerId = this.setManagedTimeout(() => {
            task.timerId = null;
            task.frameId = this.requestManagedFrame(() => {
                task.frameId = null;
                if (this.summaryRenderTask !== task) return;
                this.updateResultBox(task.resultBox, task.getText(), true);
            });
        }, delay);
    },

    cancelSummaryRender() {
        const task = this.summaryRenderTask;
        if (!task) return;
        this.clearManagedTimeout(task.timerId);
        this.cancelManagedFrame(task.frameId);
        this.summaryRenderTask = null;
    },

    scheduleBubbleRender(messageId, bubbleDiv, getText) {
        const key = messageId || bubbleDiv?.dataset?.messageId || '__active_bubble__';
        let task = this.bubbleRenderTasks?.get(key);
        if (!task) {
            task = {};
            this.bubbleRenderTasks?.set(key, task);
        }
        task.bubbleDiv = bubbleDiv;
        task.getText = getText;
        if (task.timerId || task.frameId) return;

        const delay = this.getStreamingRenderDelay(task.getText());
        task.timerId = this.setManagedTimeout(() => {
            task.timerId = null;
            task.frameId = this.requestManagedFrame(() => {
                task.frameId = null;
                if (this.bubbleRenderTasks?.get(key) !== task) return;
                try {
                    this.updateBubble(task.bubbleDiv, task.getText(), true);
                    this.scrollToBottom();
                } finally {
                    if (this.bubbleRenderTasks?.get(key) === task) {
                        this.bubbleRenderTasks.delete(key);
                    }
                }
            });
        }, delay);
    },

    cancelBubbleRender(messageId) {
        const key = messageId || '__active_bubble__';
        const task = this.bubbleRenderTasks?.get(key);
        if (!task) return;
        this.clearManagedTimeout(task.timerId);
        this.cancelManagedFrame(task.frameId);
        this.bubbleRenderTasks?.delete(key);
    },

    resetGlobalUiState() {
        const body = document.body;
        body.style.marginLeft = '';
        body.style.marginRight = '';
        if (body.style.cursor === 'col-resize') body.style.cursor = '';
        if (body.style.transition === 'margin 0.35s cubic-bezier(0.4, 0, 0.2, 1)' || body.style.transition === 'none') {
            body.style.transition = '';
        }
    },

    getMessageContextMenuHtml() {
        return `
            <div class="message-context-menu" id="message-context-menu" role="menu" aria-label="消息操作" aria-hidden="true">
                <button type="button" class="message-menu-item" data-message-menu-action="copy" role="menuitem">复制消息</button>
                <button type="button" class="message-menu-item" data-message-menu-action="regenerate" role="menuitem">重新生成</button>
                <button type="button" class="message-menu-item" data-message-menu-action="stop" role="menuitem">停止更新</button>
                <button type="button" class="message-menu-item" data-message-menu-action="edit" role="menuitem">编辑消息</button>
                <button type="button" class="message-menu-item danger" data-message-menu-action="delete" role="menuitem">删除消息</button>
            </div>
        `;
    },

    getSummarySelectionMenuHtml() {
        return `
            <div class="summary-selection-menu" id="summary-selection-menu" role="toolbar" aria-label="总结选区操作" aria-hidden="true">
                <button type="button" class="summary-selection-item" data-summary-selection-action="explain" tabindex="0">解释</button>
                <button type="button" class="summary-selection-item" data-summary-selection-action="simplify" tabindex="-1">精简</button>
                <button type="button" class="summary-selection-item" data-summary-selection-action="quote" tabindex="-1">引用到对话</button>
            </div>
        `;
    },

    //
    // 2. 样式与渲染
    //
};
