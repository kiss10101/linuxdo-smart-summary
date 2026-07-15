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
        this.scrollButtonsFrame = null;
        this.btnPos = GM_getValue(this.getStyleStorageKey('btnPos'), { side: 'right', top: '50%' });
        this.side = this.btnPos.side;
        this.sidebarWidth = GM_getValue(this.getStyleStorageKey('sidebarWidth'), 420);
        this.isDarkTheme = GM_getValue(this.getStyleStorageKey('isDarkTheme'), false);
        this.chatHistory = [];
        this.chatSession = this.createEmptyChatSession();
        this.editingMessageId = null;
        this.editingDraftBefore = '';
        this.currentMessageMenuId = null;
        this.currentSummarySelection = null;
        this.summarySelectionOpenTimerId = null;
        this.summarySelectionRequestSeq = 0;
        this.chatRequestSeq = 0;
        this.modelListRequestSeq = 0;
        this.modelListAbortController = null;
        this.modelListTimeoutId = null;
        this.modelListLoading = false;
        this.modelListTimeoutMs = 15_000;
        this.currentAiAbortController = null;
        this.currentAiAbortScope = '';
        this.settingsStorageSyncTimerId = null;
        this.settingsStorageSyncRetryTimerId = null;
        this.pendingSettingsStorageSyncKeys = new Set();
        this.dirtySettingsKeys = new Set();
        this.applyingRemoteSettingsSnapshot = false;
        this.remoteSettingsConflictNotified = false;
        this.postContent = '';
        this.lastSummary = '';
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
        this.rangeMode = 'manual';
        this.exportRangeMode = 'manual';
        this.rangeBoundsTopicId = '';
        this.rangeBoundsLastRefreshAt = 0;
        this.rangeConfirmationPromise = null;
        this.exportRangeConfirmationPromise = null;

        this.render();
        this.restoreState();
        this.bindEvents();
        this.bindKeyboardShortcuts();
    },

    destroy() {
        this.cancelModelListRequest();
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
        this.scrollButtonsFrame = null;
        this.summarySelectionOpenTimerId = null;
        this.summarySelectionRequestSeq = (this.summarySelectionRequestSeq || 0) + 1;
        this.currentSummarySelection = null;
        this.resetGlobalUiState();
        this.isOpen = false;
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

    scheduleSummaryRender(resultBox, getText) {
        const task = this.summaryRenderTask || {};
        task.resultBox = resultBox;
        task.getText = getText;
        this.summaryRenderTask = task;
        if (task.timerId || task.frameId) return;

        task.timerId = this.setManagedTimeout(() => {
            task.timerId = null;
            task.frameId = this.requestManagedFrame(() => {
                task.frameId = null;
                if (this.summaryRenderTask !== task) return;
                this.updateResultBox(task.resultBox, task.getText(), true);
            });
        }, this.streamingRenderDelayMs);
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

        task.timerId = this.setManagedTimeout(() => {
            task.timerId = null;
            task.frameId = this.requestManagedFrame(() => {
                task.frameId = null;
                if (this.bubbleRenderTasks?.get(key) !== task) return;
                this.updateBubble(task.bubbleDiv, task.getText(), true);
                this.scrollToBottom();
            });
        }, this.streamingRenderDelayMs);
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
            <div class="message-context-menu" id="message-context-menu" role="menu" aria-hidden="true">
                <button type="button" class="message-menu-item" data-message-menu-action="copy" role="menuitem">复制</button>
                <button type="button" class="message-menu-item" data-message-menu-action="edit" role="menuitem">编辑</button>
                <button type="button" class="message-menu-item" data-message-menu-action="regenerate" role="menuitem">重新生成</button>
                <button type="button" class="message-menu-item danger" data-message-menu-action="delete" role="menuitem">删除</button>
            </div>
        `;
    },

    getSummarySelectionMenuHtml() {
        return `
            <div class="summary-selection-menu" id="summary-selection-menu" role="menu" aria-hidden="true">
                <button type="button" class="summary-selection-item" data-summary-selection-action="explain" role="menuitem">解释</button>
                <button type="button" class="summary-selection-item" data-summary-selection-action="ask" role="menuitem">追问</button>
                <button type="button" class="summary-selection-item" data-summary-selection-action="summarize" role="menuitem">总结</button>
                <button type="button" class="summary-selection-item" data-summary-selection-action="insert" role="menuitem">带入</button>
            </div>
        `;
    },

    //
    // 2. 样式与渲染
    //
};
