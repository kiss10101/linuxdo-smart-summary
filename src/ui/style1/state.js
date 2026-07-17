import { CONFIG } from '../../config.js';
import { Core } from '../../core/index.js';
import { UIRegistry } from '../registry.js';

export const style1State = {
    restoreState() {
        const Q = this.uiManager.Q.bind(this.uiManager);
        this.uiManager.host.style.setProperty('--sidebar-width', `${this.sidebarWidth}px`);
        const btn = Q('#toggle-btn');
        btn.style.top = this.btnPos.top;
        this.applySideState();
        if (this.isDarkTheme) {
            this.uiManager.host.classList.add('dark-theme');
            Q('#btn-theme').textContent = '☀️';
        }

        this.loadApiProfileStateToUi();
        Q('#cfg-prompt-sum').value = GM_getValue('prompt_sum', '请总结以下论坛帖子内容。使用 Markdown 格式，条理清晰，重点突出主要观点、争议点和结论。适当使用标题、列表和引用来组织内容。');
        Q('#cfg-prompt-chat').value = GM_getValue('prompt_chat', '你是一个帖子阅读助手。基于上文中的帖子内容，回答用户的问题。回答要准确、简洁，必要时引用原文。');
        const recentFloors = GM_getValue('recentFloors', 50);
        Q('#cfg-recent-floors').value = recentFloors;
        Q('#recent-count').textContent = recentFloors;
        Q('#export-recent-count').textContent = recentFloors;
        Q('#cfg-stream').checked = GM_getValue('useStream', true);
        Q('#cfg-autoscroll').checked = GM_getValue('autoScroll', true);
        this.applyFloatingMenuOpacity(GM_getValue(
            CONFIG.floatingMenuOpacityKey,
            CONFIG.floatingMenuOpacityDefault
        ));
        this.switchTab(this.currentTab || 'summary');
    },

    normalizeFloatingMenuOpacity(value) {
        const numericValue = Number(value);
        if (!Number.isFinite(numericValue)) return CONFIG.floatingMenuOpacityDefault;
        return Math.max(
            CONFIG.floatingMenuOpacityMin,
            Math.min(CONFIG.floatingMenuOpacityMax, Math.round(numericValue))
        );
    },

    applyFloatingMenuOpacity(value) {
        const opacity = this.normalizeFloatingMenuOpacity(value);
        this.uiManager.host.style.setProperty('--floating-menu-opacity', `${opacity}%`);
        const input = this.uiManager.Q('#cfg-floating-menu-opacity');
        const output = this.uiManager.Q('#cfg-floating-menu-opacity-output');
        if (input) {
            input.value = `${opacity}`;
            input.setAttribute('aria-valuetext', `${opacity}%`);
        }
        if (output) output.textContent = `${opacity}%`;
        return opacity;
    },

    applySideState() {
        const Q = this.uiManager.Q.bind(this.uiManager);
        const btn = Q('#toggle-btn');
        const sidebar = Q('#sidebar');
        const resizer = Q('#resizer');
        const arrowLeft = `<svg viewBox="0 0 24 24"><path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"/></svg>`;
        const arrowRight = `<svg viewBox="0 0 24 24"><path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6z"/></svg>`;

        btn.style.left = ''; btn.style.right = '';

        if (this.side === 'left') {
            sidebar.className = 'sidebar-panel panel-left' + (this.isOpen ? ' open' : '');
            resizer.className = 'resize-handle handle-left';
            btn.className = 'btn-snap-left' + (this.isOpen ? ' arrow-flip' : '');
            btn.innerHTML = arrowRight;
        } else {
            sidebar.className = 'sidebar-panel panel-right' + (this.isOpen ? ' open' : '');
            resizer.className = 'resize-handle handle-right';
            btn.className = 'btn-snap-right' + (this.isOpen ? ' arrow-flip' : '');
            btn.innerHTML = arrowLeft;
        }
        btn.setAttribute('aria-expanded', `${this.isOpen}`);
        btn.setAttribute('aria-label', this.isOpen ? '关闭智能总结侧栏' : '打开智能总结侧栏');
        this.updateButtonPosition();
    },

    isNarrowViewport(maxWidth = 700) {
        return typeof window !== 'undefined' && window.innerWidth <= maxWidth;
    },

    updateButtonPosition(useTransition = true) {
        const Q = this.uiManager.Q.bind(this.uiManager);
        const btn = Q('#toggle-btn');
        if (!useTransition) btn.style.transition = 'none'; else btn.style.transition = '';
        const openOffset = this.isOpen && !this.isNarrowViewport() ? `${this.sidebarWidth}px` : '0';
        if (this.side === 'left') {
            btn.style.right = 'auto';
            btn.style.left = openOffset;
        } else {
            btn.style.left = 'auto';
            btn.style.right = openOffset;
        }
        if (!useTransition) {
            btn.offsetHeight;
            this.requestManagedFrame(() => { btn.style.transition = ''; });
        }
    },

    toggleSidebar() {
        this.isOpen = !this.isOpen;
        const Q = this.uiManager.Q.bind(this.uiManager);
        Q('#sidebar').classList.toggle('open', this.isOpen);
        Q('#toggle-btn').classList.toggle('arrow-flip', this.isOpen);
        Q('#toggle-btn').setAttribute('aria-expanded', `${this.isOpen}`);
        Q('#toggle-btn').setAttribute('aria-label', this.isOpen ? '关闭智能总结侧栏' : '打开智能总结侧栏');
        this.squeezeBody(this.isOpen);
        if (this.isOpen) this.initRangeInputs();
        this.updateButtonPosition();
    },

    squeezeBody(active) {
        const body = document.body;
        body.style.transition = 'margin 0.35s cubic-bezier(0.4, 0, 0.2, 1)';
        if (!active || this.isNarrowViewport()) {
            body.style.marginLeft = ''; body.style.marginRight = '';
        } else {
            if (this.side === 'left') {
                body.style.marginLeft = `${this.sidebarWidth}px`; body.style.marginRight = '';
            } else {
                body.style.marginRight = `${this.sidebarWidth}px`; body.style.marginLeft = '';
            }
        }
    },

    switchTab(tabName) {
        const Q = this.uiManager.Q.bind(this.uiManager);
        this.closeMessageContextMenu?.();
        this.closeSummarySelectionMenu?.();
        Q('.tab-bar').querySelectorAll('.tab-item').forEach((tab) => {
            const active = tab.dataset.tab === tabName;
            tab.classList.toggle('active', active);
            tab.setAttribute('aria-selected', `${active}`);
            tab.tabIndex = active ? 0 : -1;
        });
        const contentArea = Q('.content-area');
        contentArea.querySelectorAll('.view-page').forEach((panel) => {
            const active = panel.id === `page-${tabName}`;
            panel.classList.toggle('active', active);
            panel.hidden = !active;
            panel.setAttribute('aria-hidden', `${!active}`);
        });
        contentArea.classList.toggle('chat-active', tabName === 'chat');
        contentArea.classList.toggle('summary-active', tabName === 'summary');
        this.currentTab = tabName;
        if (tabName === 'chat') this.setManagedTimeout(() => this.updateScrollButtons(), 100);
        if (tabName === 'summary') this.setManagedTimeout(() => this.updateSummaryScrollButton(), 100);
    },

    toggleTheme() {
        const Q = this.uiManager.Q.bind(this.uiManager);
        this.isDarkTheme = !this.isDarkTheme;
        GM_setValue(this.getStyleStorageKey('isDarkTheme'), this.isDarkTheme);
        this.uiManager.host.classList.toggle('dark-theme', this.isDarkTheme);
        Q('#btn-theme').textContent = this.isDarkTheme ? '☀️' : '🌙';
    },

    setLoading(btnId, isLoading) {
        const Q = this.uiManager.Q.bind(this.uiManager);
        const btn = Q(btnId);
        this.isGenerating = isLoading;
        btn.disabled = isLoading;
        btn.classList.toggle('loading', isLoading);
        if (btnId === '#btn-send') {
            const input = Q('#chat-input');
            if (input) {
                input.disabled = isLoading;
                input.placeholder = isLoading ? '正在生成回复...' : '输入你的问题... (Enter 发送)';
            }
        }
    },

    isAiAbortButton(btnId) {
        return (btnId === '#btn-summary' && this.currentAiAbortScope === 'summary')
            || (btnId === '#btn-send' && this.currentAiAbortScope === 'chat');
    },

    setAiAbortButtonState(btnId, isActive) {
        const btn = this.uiManager.Q(btnId);
        if (!btn) return;
        if (isActive) {
            if (!btn.dataset.aiStopOriginalHtml) btn.dataset.aiStopOriginalHtml = btn.innerHTML;
            if (!btn.dataset.aiStopOriginalTitle) btn.dataset.aiStopOriginalTitle = btn.getAttribute('title') || '';
            btn.disabled = false;
            btn.classList.add('ai-stop-active');
            btn.innerHTML = btnId === '#btn-send' ? '停止' : '停止生成';
            btn.setAttribute('title', '停止本次 AI 生成');
            return;
        }

        if (btn.dataset.aiStopOriginalHtml) {
            btn.innerHTML = btn.dataset.aiStopOriginalHtml;
            delete btn.dataset.aiStopOriginalHtml;
        }
        if ('aiStopOriginalTitle' in btn.dataset) {
            const originalTitle = btn.dataset.aiStopOriginalTitle;
            if (originalTitle) {
                btn.setAttribute('title', originalTitle);
            } else {
                btn.removeAttribute('title');
            }
            delete btn.dataset.aiStopOriginalTitle;
        }
        btn.classList.remove('ai-stop-active');
    },

    getAiAbortButtonSelector(scope) {
        return scope === 'summary' ? '#btn-summary' : '#btn-send';
    },

    startAiAbortController(scope) {
        const controller = new AbortController();
        this.currentAiAbortController = controller;
        this.currentAiAbortScope = scope;
        this.setAiAbortButtonState(this.getAiAbortButtonSelector(scope), true);
        return controller;
    },

    beginChatRequestLifecycle({ userMessageId, assistantMessageId, outputState, controller }) {
        const requestController = controller || this.startAiAbortController('chat');
        const request = {
            token: (this.chatRequestSeq || 0) + 1,
            controller: requestController,
            userMessageId,
            assistantMessageId,
            outputState,
            phase: 'preparing',
            abortReason: '',
            startedAt: Date.now()
        };
        this.chatRequestSeq = request.token;
        this.activeChatRequest = request;
        return request;
    },

    isCurrentChatRequest(request) {
        return Boolean(request
            && this.activeChatRequest === request
            && request.token === this.chatRequestSeq
            && !request.abortReason);
    },

    setChatRequestPhase(request, phase) {
        if (!this.isCurrentChatRequest(request)) return false;
        request.phase = phase;
        return true;
    },

    abortActiveChatRequest(reason = 'stop') {
        const request = this.activeChatRequest;
        if (!request) return null;

        request.abortReason = reason;
        request.phase = reason === 'regenerate'
            ? 'regenerating'
            : reason === 'delete'
                ? 'deleting'
                : 'stopping';
        this.chatRequestSeq = Math.max(this.chatRequestSeq || 0, request.token) + 1;
        this.activeChatRequest = null;
        this.cancelBubbleRender?.(request.assistantMessageId);

        if (!request.controller.signal.aborted) {
            request.controller.abort(reason);
        }

        const userMessage = this.findVisibleMessage?.(request.userMessageId);
        if (userMessage) this.setVisibleMessage(request.userMessageId, { excludeFromApi: true });

        if (reason === 'stop') {
            const assistantMessage = this.findVisibleMessage?.(request.assistantMessageId);
            if (assistantMessage) {
                const outputState = Core.createAiOutputState(request.outputState || assistantMessage.outputState || {});
                Core.markAiOutputFailure(outputState, { ok: false, kind: 'request_aborted' });
                this.setVisibleMessage(request.assistantMessageId, {
                    content: outputState.contentText,
                    rawContent: outputState.contentText,
                    outputState,
                    status: 'stopped',
                    errorKind: 'request_aborted',
                    errorMessage: '生成已停止，以上内容可能不完整。',
                    excludeFromApi: true,
                    regenerateFromUserId: request.userMessageId
                });
                const bubble = this.getBubbleElement?.(request.assistantMessageId);
                if (bubble) this.renderBubbleContent?.(bubble, this.findVisibleMessage(request.assistantMessageId));
            }
        }

        this.clearAiAbortController(request.controller);
        this.setLoading('#btn-send', false);
        this.updateChatInputMode?.();
        this.userScrolledUp = false;
        this.updateScrollButtons?.();
        return request;
    },

    finalizeChatRequest(request, phase = 'completed') {
        if (!this.isCurrentChatRequest(request)) return false;
        request.phase = phase;
        this.activeChatRequest = null;
        return true;
    },

    clearAiAbortController(controller = null) {
        if (controller && this.currentAiAbortController !== controller) return;
        const scope = this.currentAiAbortScope;
        if (scope) this.setAiAbortButtonState(this.getAiAbortButtonSelector(scope), false);
        this.currentAiAbortController = null;
        this.currentAiAbortScope = '';
    },

    stopCurrentAiGeneration() {
        if (this.activeChatRequest) {
            this.abortActiveChatRequest('stop');
            this.showToast('已停止本次 AI 生成', 'success');
            return true;
        }
        const controller = this.currentAiAbortController;
        if (controller) {
            controller.abort();
            this.showToast('已停止本次 AI 生成', 'success');
            return true;
        }
        if (this.isGenerating) {
            this.showToast('正在获取楼层内容，AI 请求开始后可停止', 'info');
            return true;
        }
        return false;
    },

    handleSummaryButtonClick() {
        if (this.stopCurrentAiGeneration()) return;
        this.doSummary();
    },

    handleSendButtonClick() {
        if (this.stopCurrentAiGeneration()) return;
        this.doChat();
    },

    updateChatInputMode() {
        const input = this.uiManager.Q('#chat-input');
        const sendBtn = this.uiManager.Q('#btn-send');
        if (!input) return;
        if (this.editingMessageId) {
            input.placeholder = '正在编辑消息，Enter 保存，Esc 取消';
            sendBtn?.classList.add('editing');
            return;
        }
        input.placeholder = this.isGenerating ? '正在生成回复...' : '输入你的问题... (Enter 发送)';
        sendBtn?.classList.remove('editing');
    },

    //
};
