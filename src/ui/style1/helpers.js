import { CONFIG } from '../../config.js';
import { Core } from '../../core/index.js';
import { UIRegistry } from '../registry.js';

export const style1Helpers = {
    async getRangeUpperBound(options = {}) {
        const tid = Core.getTopicId();
        const lifecycleEpoch = this.lifecycleEpoch;
        if (!tid) return Core.getReplyCount();

        try {
            const bounds = await Core.getTopicBounds(tid, {
                forceRefresh: options.forceRefresh === true,
                allowDomFallback: options.allowDomFallback !== false,
                allowRecentConfirmedCache: options.allowRecentConfirmedCache === true,
                recentConfirmedMs: options.recentConfirmedMs
            });
            if ((lifecycleEpoch && !this.isCurrentLifecycleEpoch(lifecycleEpoch)) || tid !== Core.getTopicId()) {
                return 0;
            }
            if (bounds.highestPostNumber > 0) {
                if (options.scope === 'export') {
                    this.exportRangeBoundsTopicId = tid;
                } else {
                    this.rangeBoundsTopicId = tid;
                    this.rangeBoundsLastRefreshAt = Date.now();
                }
                return bounds.highestPostNumber;
            }
            if (options.allowDomFallback === false) {
                throw new Error('未获取到主题最高楼层');
            }
            return Core.getReplyCount();
        } catch (e) {
            if (options.allowDomFallback === false) {
                console.warn('[Linux.do 智能总结] 获取主题最高楼层失败:', e);
                throw e;
            }
            console.warn('[Linux.do 智能总结] 获取主题最高楼层失败，使用页面时间线计数兜底:', e);
            return Core.getReplyCount();
        }
    },

    async initRangeInputs() {
        const Q = this.uiManager.Q.bind(this.uiManager);
        const start = Q('#inp-start'), end = Q('#inp-end');
        const tid = Core.getTopicId();
        const lifecycleEpoch = this.lifecycleEpoch;
        if (!start.value) start.value = 1;
        const isBoundsStale = Date.now() - this.rangeBoundsLastRefreshAt > Core.topicDataCachePolicy.ttlMs;
        const shouldRefresh = !end.value || this.rangeBoundsTopicId !== tid || (isBoundsStale && this.rangeMode !== 'manual');
        if (!shouldRefresh) return;

        const requestSeq = ++this.rangeRequestSeq;
        Core.prewarmTopicData(tid, { reason: 'range-inputs' }).catch((error) => {
            console.warn('[Linux.do 智能总结] 楼层元数据预热失败:', error);
        });
        const max = await this.getRangeUpperBound({
            scope: 'summary',
            forceRefresh: false,
            allowDomFallback: true,
            allowRecentConfirmedCache: true
        });
        if (requestSeq !== this.rangeRequestSeq
            || tid !== Core.getTopicId()
            || (lifecycleEpoch && !this.isCurrentLifecycleEpoch(lifecycleEpoch))) return;
        if (max && (!end.value || this.rangeMode !== 'manual')) end.value = max;
    },

    setRangeButtonsLoading(scope, isLoading, label = '获取中') {
        const Q = this.uiManager.Q.bind(this.uiManager);
        const selectors = scope === 'export'
            ? ['#export-range-all', '#export-range-recent']
            : ['#range-all', '#range-recent'];
        selectors.forEach((selector) => {
            const btn = Q(selector);
            if (!btn) return;
            if (isLoading) {
                if (!btn.dataset.originalHtml) btn.dataset.originalHtml = btn.innerHTML;
                btn.disabled = true;
                btn.classList.add('loading');
                btn.textContent = label;
            } else {
                btn.disabled = false;
                btn.classList.remove('loading');
                if (btn.dataset.originalHtml) {
                    btn.innerHTML = btn.dataset.originalHtml;
                    delete btn.dataset.originalHtml;
                }
            }
        });
    },

    markSummaryRangeManual() {
        this.rangeMode = 'manual';
        this.rangeRequestSeq += 1;
        this.rangeConfirmationPromise = null;
        this.setRangeButtonsLoading('summary', false);
    },

    markExportRangeManual() {
        this.exportRangeMode = 'manual';
        this.exportRangeRequestSeq += 1;
        this.exportRangeConfirmationPromise = null;
        this.setRangeButtonsLoading('export', false);
    },

    getRangeSelectors(scope) {
        return scope === 'export'
            ? { start: '#export-start', end: '#export-end' }
            : { start: '#inp-start', end: '#inp-end' };
    },

    applyOptimisticRangeFromCache(type, scope) {
        const tid = Core.getTopicId();
        const entry = Core.peekTopicData(tid, {
            maxAgeMs: Core.topicDataPrewarmPolicy.optimisticMaxAgeMs
        });
        if (!entry?.topicData) return { applied: false };

        const bounds = Core.getTopicBoundsFromTopicData(entry.topicData, tid);
        const max = bounds.highestPostNumber;
        if (!max) return { applied: false };

        const Q = this.uiManager.Q.bind(this.uiManager);
        const selectors = this.getRangeSelectors(scope);
        const startInput = Q(selectors.start);
        const endInput = Q(selectors.end);
        if (!startInput || !endInput) return { applied: false };

        const previous = {
            start: startInput.value,
            end: endInput.value
        };
        const recentFloors = GM_getValue('recentFloors', 50);
        startInput.value = type === 'all' ? 1 : Math.max(1, max - recentFloors + 1);
        endInput.value = max;
        return {
            applied: true,
            previous,
            max,
            fresh: entry.fresh,
            source: entry.fresh ? 'fresh-cache' : 'stale-cache'
        };
    },

    restoreOptimisticRange(scope, optimistic) {
        if (!optimistic?.applied) return;
        const Q = this.uiManager.Q.bind(this.uiManager);
        const selectors = this.getRangeSelectors(scope);
        const startInput = Q(selectors.start);
        const endInput = Q(selectors.end);
        if (startInput) startInput.value = optimistic.previous.start;
        if (endInput) endInput.value = optimistic.previous.end;
    },

    async waitForRangeConfirmation(scope) {
        const promise = scope === 'export'
            ? this.exportRangeConfirmationPromise
            : this.rangeConfirmationPromise;
        if (!promise) return true;

        try {
            await promise;
            return true;
        } catch (error) {
            this.showToast(`获取最新楼层失败: ${error.message || error}`, 'error');
            return false;
        }
    },

    async setRange(type) {
        const Q = this.uiManager.Q.bind(this.uiManager);
        const tid = Core.getTopicId();
        const lifecycleEpoch = this.lifecycleEpoch;
        const requestSeq = ++this.rangeRequestSeq;
        const isCurrentRequest = () => requestSeq === this.rangeRequestSeq
            && tid === Core.getTopicId()
            && (!lifecycleEpoch || this.isCurrentLifecycleEpoch(lifecycleEpoch));
        const optimistic = this.applyOptimisticRangeFromCache(type, 'summary');
        this.setRangeButtonsLoading('summary', true, optimistic.applied ? '确认中' : '获取中');
        const confirmation = this.getRangeUpperBound({
            scope: 'summary',
            forceRefresh: true,
            allowDomFallback: false,
            allowRecentConfirmedCache: true
        });
        this.rangeConfirmationPromise = confirmation;
        try {
            const max = await confirmation;
            if (!isCurrentRequest()) return false;
            if (!max) {
                this.showToast('未获取到最高楼层', 'error');
                return false;
            }
            Q('#inp-end').value = max;
            const recentFloors = GM_getValue('recentFloors', 50);
            Q('#inp-start').value = type === 'all' ? 1 : Math.max(1, max - recentFloors + 1);
            this.rangeMode = type;
            this.showToast(optimistic.applied && optimistic.max !== max ? `已校准到最新楼层 ${max}` : '已获取最新楼层范围', 'success');
            return true;
        } catch (e) {
            if (isCurrentRequest()) {
                this.restoreOptimisticRange('summary', optimistic);
                this.showToast(`获取最新楼层失败: ${e.message || e}`, 'error');
            }
            return false;
        } finally {
            if (this.rangeConfirmationPromise === confirmation) this.rangeConfirmationPromise = null;
            if (isCurrentRequest()) this.setRangeButtonsLoading('summary', false);
        }
    },

    getReasoningPanelViewState(container, output, panelId = 'output') {
        const currentBlock = container?.querySelector?.('[data-thinking-block]');
        return {
            panelId,
            expansion: currentBlock?.dataset?.expansion || 'auto'
        };
    },

    updateResultBox(resultBox, output, isStreaming, coverageReport = null, sourceConfig = null, failure = null) {
        const Q = this.uiManager.Q.bind(this.uiManager);
        if (isStreaming) this.closeSummarySelectionMenu?.();
        const state = Core.normalizeAiOutputState(output);
        const viewState = this.getReasoningPanelViewState(resultBox, state, 'summary');
        const contentHTML = this.renderWithThinking(state, isStreaming, viewState);
        const sourceHTML = !isStreaming ? Core.renderAiSourceMeta(sourceConfig) : '';
        const coverageHTML = !isStreaming ? Core.renderSummaryCoverageReport(coverageReport) : '';
        const failureHTML = failure ? `<div class="ai-output-failure">${Core.renderAiFailureBlock(failure, { operation: 'summary' })}</div>` : '';
        resultBox.innerHTML = `
            <div class="result-actions">
                <button class="result-action-btn" id="btn-copy-summary">📋 复制</button>
            </div>
        ` + contentHTML + failureHTML + sourceHTML + coverageHTML;

        const copyBtn = Q('#btn-copy-summary');
        if (copyBtn) {
            copyBtn.onclick = () => {
                this.copyToClipboard(state.contentText);
                copyBtn.classList.add('copied');
                copyBtn.textContent = '✓ 已复制';
                this.setManagedTimeout(() => {
                    copyBtn.classList.remove('copied');
                    copyBtn.textContent = '📋 复制';
                }, 2000);
            };
        }
        this.updateSummaryScrollButton();
        this.scrollSummaryToBottom();
        if (GM_getValue('autoScroll', true) && viewState.expansion === 'user-expanded') {
            this.setManagedTimeout(() => {
                const thinkingInner = resultBox.querySelector('.thinking-content-inner');
                if (thinkingInner) thinkingInner.scrollTop = thinkingInner.scrollHeight;
            }, 0);
        }
    },

    updateBubble(bubbleDiv, output, isStreaming) {
        const state = Core.normalizeAiOutputState(output);
        const messageId = bubbleDiv.dataset.messageId;
        const message = messageId ? this.findVisibleMessage(messageId) : null;
        const viewState = this.getReasoningPanelViewState(bubbleDiv, state, messageId || 'bubble');
        if (message) {
            bubbleDiv.__rawMessageText = state.contentText;
            message.rawContent = state.contentText;
            message.outputState = state;
            if (message.status !== 'error' && message.status !== 'stopped') {
                const roleClass = message.role === 'assistant' ? 'ai' : 'user';
                bubbleDiv.className = `bubble bubble-${roleClass}`;
                bubbleDiv.classList.toggle('bubble-streaming', isStreaming);
                bubbleDiv.classList.toggle('bubble-error', false);
                const source = isStreaming ? '' : Core.renderAiSourceMeta(message.sourceConfig);
                bubbleDiv.innerHTML = this.renderWithThinking(state, isStreaming, viewState) + source;
            } else {
                this.renderBubbleContent(bubbleDiv, message);
            }
        } else {
            bubbleDiv.innerHTML = this.renderWithThinking(state, isStreaming, viewState);
        }
        if (message) this.ensureMessageMenuTrigger?.(bubbleDiv, message);
        if (GM_getValue('autoScroll', true) && viewState.expansion === 'user-expanded') {
            this.setManagedTimeout(() => {
                const thinkingInner = bubbleDiv.querySelector('.thinking-content-inner');
                if (thinkingInner) thinkingInner.scrollTop = thinkingInner.scrollHeight;
            }, 0);
        }
    },

    addBubble(messageOrRole, text, { scroll = true } = {}) {
        const Q = this.uiManager.Q.bind(this.uiManager);
        const message = typeof messageOrRole === 'object'
            ? messageOrRole
            : this.createVisibleMessage(messageOrRole === 'ai' ? 'assistant' : messageOrRole, text);
        const div = document.createElement('div');
        this.renderBubbleContent(div, message);
        Q('#chat-list').appendChild(div);
        if (scroll) this.scrollToBottom();
        return div;
    },

    renderWithThinking(output, isStreaming = false, viewState = {}) {
        const state = Core.normalizeAiOutputState(output);
        const normalizedViewState = typeof viewState === 'object'
            ? viewState
            : { expansion: viewState ? 'user-expanded' : 'auto' };
        return Core.renderAiOutputHtml(state, {
            isStreaming,
            expansion: normalizedViewState.expansion || 'auto',
            panelId: normalizedViewState.panelId || 'output',
            icon: this.ICONS?.brain || '🧠',
            arrow: this.ICONS?.arrowDown || '⌄'
        });
    },

    showToast(message, type = '') {
        const Q = this.uiManager.Q.bind(this.uiManager);
        const toast = Q('#toast');
        toast.textContent = message;
        toast.className = 'toast' + (type ? ` ${type}` : '');
        this.requestManagedFrame(() => toast.classList.add('show'));
        this.setManagedTimeout(() => toast.classList.remove('show'), 2500);
    },

    copyToClipboard(text) {
        GM_setClipboard(text, 'text');
        this.showToast('已复制到剪贴板');
    },

    openModelPicker() {
        const Q = this.uiManager.Q.bind(this.uiManager);
        this.closeMessageContextMenu?.();
        this.closeSummarySelectionMenu?.();
        const modal = Q('#model-picker-modal');
        const activeElement = modal?.getRootNode?.().activeElement;
        this.modelPickerReturnFocus = activeElement?.isConnected
            ? activeElement
            : Q('#btn-fetch-models');
        modal.classList.add('show');
        modal.setAttribute('aria-hidden', 'false');
        this.requestManagedFrame(() => {
            if (!modal.classList.contains('show')) return;
            const firstControl = modal.querySelector('button:not([disabled]), [tabindex]:not([tabindex="-1"])');
            firstControl?.focus();
        });
        this.loadModelList();
    },

    closeModelPicker({ restoreFocus = true } = {}) {
        this.cancelModelListRequest();
        const modal = this.uiManager.Q('#model-picker-modal');
        if (modal) {
            modal.classList.remove('show');
            modal.setAttribute('aria-hidden', 'true');
        }
        const returnFocus = this.modelPickerReturnFocus;
        this.modelPickerReturnFocus = null;
        if (restoreFocus && returnFocus?.isConnected) returnFocus.focus();
    },

    setModelListLoading(isLoading) {
        this.modelListLoading = isLoading === true;
        const refreshButton = this.uiManager.Q('#btn-refresh-models');
        const fetchButton = this.uiManager.Q('#btn-fetch-models');
        if (refreshButton) refreshButton.disabled = this.modelListLoading;
        if (fetchButton) fetchButton.disabled = this.modelListLoading;
    },

    cancelModelListRequest() {
        this.modelListRequestSeq = (this.modelListRequestSeq || 0) + 1;
        if (this.modelListTimeoutId !== null && this.modelListTimeoutId !== undefined) {
            this.clearManagedTimeout(this.modelListTimeoutId);
            this.modelListTimeoutId = null;
        }
        if (this.modelListAbortController) {
            this.modelListAbortController.abort();
            this.modelListAbortController = null;
        }
        this.setModelListLoading(false);
    },

    setModelPickerStatus(message, type = '') {
        const status = this.uiManager.Q('#model-picker-status');
        if (!status) return;
        status.textContent = message;
        status.className = 'model-picker-status' + (type ? ` ${type}` : '');
    },

    renderModelOptions(models) {
        const list = this.uiManager.Q('#model-picker-list');
        list.innerHTML = '';
        models.forEach((model) => {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'model-option';
            btn.dataset.model = model;
            btn.textContent = model;
            list.appendChild(btn);
        });
    },

    async loadModelList() {
        const Q = this.uiManager.Q.bind(this.uiManager);
        const list = Q('#model-picker-list');
        const apiUrl = Q('#cfg-url').value.trim();
        const apiKey = Q('#cfg-key').value.trim();
        this.cancelModelListRequest();
        const requestSeq = (this.modelListRequestSeq || 0) + 1;
        this.modelListRequestSeq = requestSeq;
        const abortController = new AbortController();
        this.modelListAbortController = abortController;
        let timedOut = false;
        const timeoutId = this.setManagedTimeout(() => {
            timedOut = true;
            abortController.abort();
        }, this.modelListTimeoutMs || 15_000);
        this.modelListTimeoutId = timeoutId;

        list.innerHTML = '';
        this.setModelPickerStatus('正在获取模型列表...');
        this.setModelListLoading(true);

        try {
            const { models, url } = await Core.fetchModelList(apiUrl, apiKey, {
                signal: abortController.signal
            });
            if (requestSeq !== this.modelListRequestSeq) return;
            this.renderModelOptions(models);
            this.setModelPickerStatus(`已从 ${url} 获取 ${models.length} 个模型。`);
        } catch (e) {
            if (requestSeq !== this.modelListRequestSeq) return;
            if (timedOut) {
                this.setModelPickerStatus('获取模型列表超时：服务商在 15 秒内未响应，请稍后重试。', 'error');
                return;
            }
            const formatted = Core.formatAiFailureForUi(e, { operation: 'models', userTitle: '获取模型列表失败' });
            this.setModelPickerStatus(`${formatted.title}${formatted.detail ? `：${formatted.detail}` : ''}${formatted.hint ? `。${formatted.hint}` : ''}`, 'error');
        } finally {
            this.clearManagedTimeout(timeoutId);
            if (requestSeq === this.modelListRequestSeq) {
                if (this.modelListTimeoutId === timeoutId) {
                    this.modelListTimeoutId = null;
                }
                if (this.modelListAbortController === abortController) {
                    this.modelListAbortController = null;
                }
                this.setModelListLoading(false);
            }
        }
    },

    updateScrollButtons() {
        const Q = this.uiManager.Q.bind(this.uiManager);
        const el = Q('#chat-messages');
        const showTop = el.scrollTop > 50;
        const showBottom = (el.scrollHeight - el.scrollTop - el.clientHeight) > 50;
        this.setScrollButtonState(Q('#btn-scroll-top'), showTop);
        this.setScrollButtonState(
            Q('#btn-scroll-bottom'),
            showBottom || (this.isGenerating && this.userScrolledUp),
            this.isGenerating && this.userScrolledUp
        );
    },

    setScrollButtonState(button, visible, generating = false) {
        if (!button) return;
        button.classList.toggle('visible', visible);
        button.classList.toggle('generating', visible && generating);
        button.tabIndex = visible ? 0 : -1;
        if (visible) button.removeAttribute('aria-hidden');
        else button.setAttribute('aria-hidden', 'true');
    },

    isNearScrollBottom(element, threshold = 50) {
        if (!element) return true;
        return (element.scrollHeight - element.scrollTop - element.clientHeight) <= threshold;
    },

    updateSummaryScrollButton() {
        const Q = this.uiManager.Q.bind(this.uiManager);
        const el = Q('#summary-result');
        if (!el) return;
        const showBottom = !this.isNearScrollBottom(el, 50);
        this.setScrollButtonState(
            Q('#btn-summary-scroll-bottom'),
            showBottom || (this.isGenerating && this.summaryUserScrolledUp),
            this.isGenerating && this.summaryUserScrolledUp
        );
    },

    scrollToTop() { this.uiManager.Q('#chat-messages').scrollTo({ top: 0, behavior: 'smooth' }); },

    scrollToBottom(force = false) {
        if (!force && (!GM_getValue('autoScroll', true) || this.userScrolledUp)) return this.updateScrollButtons();
        this.chatScrollForce = this.chatScrollForce || force;
        if (this.chatScrollFrameId) return;
        this.chatScrollFrameId = this.requestManagedFrame(() => {
            this.chatScrollFrameId = null;
            const shouldForce = this.chatScrollForce;
            this.chatScrollForce = false;
            if (!shouldForce && (!GM_getValue('autoScroll', true) || this.userScrolledUp)) {
                this.updateScrollButtons();
                return;
            }
            const el = this.uiManager?.Q('#chat-messages');
            if (!el) return;
            this.isProgrammaticScroll = true;
            el.scrollTop = el.scrollHeight;
            this.clearManagedTimeout(this.chatScrollResetTimerId);
            this.chatScrollResetTimerId = this.setManagedTimeout(() => {
                this.chatScrollResetTimerId = null;
                this.isProgrammaticScroll = false;
                this.updateScrollButtons();
            }, 50);
        });
    },

    forceScrollToBottom() {
        this.userScrolledUp = false;
        this.scrollToBottom(true);
    },

    scrollSummaryToBottom(force = false) {
        if (!force && (!GM_getValue('autoScroll', true) || this.summaryUserScrolledUp)) {
            return this.updateSummaryScrollButton();
        }
        this.summaryScrollForce = this.summaryScrollForce || force;
        if (this.summaryScrollFrameId) return;
        this.summaryScrollFrameId = this.requestManagedFrame(() => {
            this.summaryScrollFrameId = null;
            const shouldForce = this.summaryScrollForce;
            this.summaryScrollForce = false;
            if (!shouldForce && (!GM_getValue('autoScroll', true) || this.summaryUserScrolledUp)) {
                this.updateSummaryScrollButton();
                return;
            }
            const el = this.uiManager?.Q('#summary-result');
            if (!el) return;
            this.isSummaryProgrammaticScroll = true;
            el.scrollTop = el.scrollHeight;
            this.clearManagedTimeout(this.summaryScrollResetTimerId);
            this.summaryScrollResetTimerId = this.setManagedTimeout(() => {
                this.summaryScrollResetTimerId = null;
                this.isSummaryProgrammaticScroll = false;
                this.updateSummaryScrollButton();
            }, 50);
        });
    },

    forceScrollSummaryToBottom() {
        this.summaryUserScrolledUp = false;
        this.scrollSummaryToBottom(true);
    },

    clearChat() {
        if (!this.hasChatContext()) return;
        if (!this.chatSession.visibleMessages.length) return;
        if (this.isGenerating) return this.showToast('生成中不能清空对话', 'error');
        if (confirm('确定要清空所有对话记录吗？\n（总结上下文将保留）')) {
            this.closeMessageContextMenu();
            this.editingMessageId = null;
            this.editingDraftBefore = '';
            this.chatSession.visibleMessages = [];
            this.syncLegacyChatHistory();
            this.renderChatMessages();
            const emptyDiv = this.uiManager.Q('#chat-empty');
            emptyDiv.classList.remove('hidden');
            emptyDiv.innerHTML = '<span class="tip-icon">💬</span>对话已清空<br>可以继续基于帖子内容提问';
            this.updateChatInputMode();
            this.showToast('对话已清空');
        }
    },

    updateMessageCount() {
        const count = this.chatSession?.visibleMessages?.filter(message => message.role === 'user').length || 0;
        this.userMessageCount = count;
        this.uiManager.Q('#msg-count').textContent = count;
    },

    beginExportRequest() {
        this.abortActiveExportRequest('replace');
        const request = {
            token: ++this.exportRequestSeq,
            lifecycleEpoch: this.lifecycleEpoch,
            controller: new AbortController(),
            abortReason: ''
        };
        this.activeExportRequest = request;
        return request;
    },

    isCurrentExportRequest(request) {
        return Boolean(request
            && this.activeExportRequest === request
            && request.token === this.exportRequestSeq
            && (!request.lifecycleEpoch || this.isCurrentLifecycleEpoch(request.lifecycleEpoch)));
    },

    abortActiveExportRequest(reason = 'cancel') {
        const request = this.activeExportRequest;
        if (!request) return false;
        request.abortReason = reason;
        if (!request.controller.signal.aborted) request.controller.abort();
        return true;
    },

    finalizeExportRequest(request) {
        if (this.activeExportRequest !== request) return false;
        this.activeExportRequest = null;
        return true;
    },

    // 导出功能相关方法
    async setExportRange(type) {
        const Q = this.uiManager.Q.bind(this.uiManager);
        const tid = Core.getTopicId();
        const lifecycleEpoch = this.lifecycleEpoch;
        const requestSeq = ++this.exportRangeRequestSeq;
        const isCurrentRequest = () => requestSeq === this.exportRangeRequestSeq
            && tid === Core.getTopicId()
            && (!lifecycleEpoch || this.isCurrentLifecycleEpoch(lifecycleEpoch));
        const optimistic = this.applyOptimisticRangeFromCache(type, 'export');
        this.setRangeButtonsLoading('export', true, optimistic.applied ? '确认中' : '获取中');
        const confirmation = this.getRangeUpperBound({
            scope: 'export',
            forceRefresh: true,
            allowDomFallback: false,
            allowRecentConfirmedCache: true
        });
        this.exportRangeConfirmationPromise = confirmation;
        try {
            const max = await confirmation;
            if (!isCurrentRequest()) return false;
            if (!max) {
                this.showToast('未获取到最高楼层', 'error');
                return false;
            }
            Q('#export-end').value = max;
            const recentFloors = GM_getValue('recentFloors', 50);
            Q('#export-start').value = type === 'all' ? 1 : Math.max(1, max - recentFloors + 1);
            this.exportRangeMode = type;
            this.showToast(optimistic.applied && optimistic.max !== max ? `已校准到最新楼层 ${max}` : '已获取最新导出范围', 'success');
            return true;
        } catch (e) {
            if (isCurrentRequest()) {
                this.restoreOptimisticRange('export', optimistic);
                this.showToast(`获取最新楼层失败: ${e.message || e}`, 'error');
            }
            return false;
        } finally {
            if (this.exportRangeConfirmationPromise === confirmation) this.exportRangeConfirmationPromise = null;
            if (isCurrentRequest()) this.setRangeButtonsLoading('export', false);
        }
    },

    async doExport() {
        const Q = this.uiManager.Q.bind(this.uiManager);
        const tid = Core.getTopicId();
        const exportType = Q('#export-type').value;

        if (!tid) return this.showToast('未检测到帖子ID', 'error');
        if (['all', 'recent'].includes(this.exportRangeMode) && this.exportRangeBoundsTopicId !== tid) {
            if (!await this.setExportRange(this.exportRangeMode)) return;
        }
        if (!await this.waitForRangeConfirmation('export')) return;
        let start = parseInt(Q('#export-start').value, 10);
        let end = parseInt(Q('#export-end').value, 10);
        if (!start) {
            start = 1;
            Q('#export-start').value = start;
        }
        if (!end) {
            try {
                end = await this.getRangeUpperBound({ scope: 'export', forceRefresh: true, allowDomFallback: false });
            } catch (e) {
                return this.showToast(`获取最新楼层失败: ${e.message || e}`, 'error');
            }
            if (end) Q('#export-end').value = end;
        }
        if (!start || !end || start > end) return this.showToast('楼层范围无效', 'error');

        const request = this.beginExportRequest();
        const signal = request.controller.signal;
        this.setLoading('#btn-export', true);
        const statusBox = Q('#export-status');
        statusBox.classList.remove('empty');
        statusBox.innerHTML = `<div style="display:flex;align-items:center;gap:10px;"><div class="thinking"><div class="thinking-dot"></div><div class="thinking-dot"></div><div class="thinking-dot"></div></div>正在获取帖子数据...</div>`;

        try {
            const { topicData, posts: allPosts, rangeMapping } = await Core.fetchTopicPosts(tid, start, end, (progress) => {
                if (!this.isCurrentExportRequest(request)) return;
                const progressText = Core.escapeHtml(Core.getFetchProgressText(progress, '帖子数据'));
                statusBox.innerHTML = `<div style="display:flex;align-items:center;gap:10px;"><div class="thinking"><div class="thinking-dot"></div><div class="thinking-dot"></div><div class="thinking-dot"></div></div>${progressText}</div>`;
            }, { signal });

            Core.throwIfAborted(signal);
            if (!this.isCurrentExportRequest(request)) return;
            if (allPosts.length === 0) throw new Error('未获取到可导出的帖子内容');
            const mappingText = rangeMapping?.fallbackUsed
                ? `，已回看 ${rangeMapping.lookBehindIds} 个索引校准范围`
                : '';
            const processingText = Core.escapeHtml(`正在处理 ${allPosts.length} 条可见回复${mappingText}...`);
            statusBox.innerHTML = `<div style="display:flex;align-items:center;gap:10px;"><div class="thinking"><div class="thinking-dot"></div><div class="thinking-dot"></div><div class="thinking-dot"></div></div>${processingText}</div>`;

            if (exportType === 'html') {
                await this.exportAsHtml(topicData, allPosts, statusBox, request);
            } else {
                await this.exportAsAiText(topicData, allPosts, statusBox, request);
            }
        } catch (e) {
            if (signal.aborted || e?.name === 'AbortError') return;
            if (!this.isCurrentExportRequest(request)) return;
            statusBox.innerHTML = `<div style="color:var(--danger)">❌ 导出失败: ${Core.escapeHtml(e?.message || e)}</div>`;
            this.showToast('导出失败: ' + (e?.message || e), 'error');
        } finally {
            if (this.finalizeExportRequest(request)) this.setLoading('#btn-export', false);
        }
    },

    async exportAsHtml(topicData, posts, statusBox, request = this.activeExportRequest) {
        const Q = this.uiManager.Q.bind(this.uiManager);
        const offlineImages = Q('#export-offline-images').checked;
        const theme = Q('#export-theme').value;
        const signal = request?.controller?.signal;
        const imagePolicy = Core.offlineImageExportPolicy || {
            maxImageBytes: 8 * 1024 * 1024,
            maxTotalDataUrlBytes: 32 * 1024 * 1024,
            dataUrlOverheadBytes: 128,
            requestTimeoutMs: 15_000
        };
        const imageCache = new Map();
        let totalDataUrlBytes = 0;
        let skippedImageResourceCount = 0;

        statusBox.innerHTML = `<div style="display:flex;align-items:center;gap:10px;"><div class="thinking"><div class="thinking-dot"></div><div class="thinking-dot"></div><div class="thinking-dot"></div></div>正在生成 HTML...</div>`;

        const title = Core.escapeHtml(topicData.title);
        const author = Core.escapeHtml(topicData.details?.created_by?.username || '未知');
        const createTime = new Date(topicData.created_at).toLocaleString('zh-CN');

        const postsHtmlParts = [];
        const postsByPostNumber = Core.createPostsByPostNumber(posts);
        for (const post of posts) {
            Core.throwIfAborted(signal);
            const userName = Core.escapeHtml(post.name || post.username);
            const username = Core.escapeHtml(post.username);
            const postNumber = Core.escapeHtml(post.post_number);
            const postTime = new Date(post.created_at).toLocaleString('zh-CN');
            const replyRelationHtml = Core.formatReplyRelationHtml(post, postsByPostNumber);
            const boostsHtml = Core.formatBoostsHtml(post);
            let content = post.cooked;

            // 处理图片
            if (offlineImages && Core.postHasImage(post)) {
                statusBox.innerHTML = `<div style="display:flex;align-items:center;gap:10px;"><div class="thinking"><div class="thinking-dot"></div><div class="thinking-dot"></div><div class="thinking-dot"></div></div>正在处理第 ${postNumber} 楼的图片...</div>`;

                const imgRegex = /(<img\b[^>]*\bsrc\s*=\s*)(["'])([^"']*)\2/gi;
                const matches = [...content.matchAll(imgRegex)];

                for (const match of matches) {
                    Core.throwIfAborted(signal);
                    const imgUrl = Core.absoluteUrl(match[3]);
                    if (!imgUrl || imgUrl.startsWith('data:')) continue;
                    if (!imageCache.has(imgUrl)) {
                        const remainingEncodedBytes = imagePolicy.maxTotalDataUrlBytes - totalDataUrlBytes;
                        const maxRawBytes = Math.min(
                            imagePolicy.maxImageBytes,
                            Math.floor(Math.max(0, remainingEncodedBytes - imagePolicy.dataUrlOverheadBytes) * 3 / 4)
                        );
                        if (maxRawBytes <= 0) {
                            imageCache.set(imgUrl, null);
                            skippedImageResourceCount += 1;
                        } else {
                            try {
                                const result = await Core.fetchImageAsDataUrl(imgUrl, {
                                    signal,
                                    maxBytes: maxRawBytes,
                                    timeoutMs: imagePolicy.requestTimeoutMs
                                });
                                const encodedByteLength = Number(result.encodedByteLength) || result.dataUrl.length;
                                if (encodedByteLength > remainingEncodedBytes) {
                                    imageCache.set(imgUrl, null);
                                    skippedImageResourceCount += 1;
                                } else {
                                    totalDataUrlBytes += encodedByteLength;
                                    imageCache.set(imgUrl, result.dataUrl);
                                }
                            } catch (e) {
                                if (signal?.aborted || e?.name === 'AbortError') throw e;
                                skippedImageResourceCount += 1;
                                imageCache.set(imgUrl, null);
                                console.warn('图片转换失败:', imgUrl, e);
                            }
                        }
                    }
                }
                content = content.replace(imgRegex, (fullMatch, prefix, quote, source) => {
                    const imgUrl = Core.absoluteUrl(source);
                    const dataUrl = imageCache.get(imgUrl);
                    return dataUrl ? `${prefix}${quote}${dataUrl}${quote}` : fullMatch;
                });
            }

            content = Core.sanitizeExportHtml(content);

            postsHtmlParts.push(`
                <div class="post" id="post-${postNumber}">
                    <div class="post-header">
                        <div class="post-author">
                            <strong>${userName}</strong>
                            <span class="username">@${username}</span>
                        </div>
                        <div class="post-meta">
                            <span class="post-number">#${postNumber}</span>
                            ${replyRelationHtml}
                            <span class="post-time">${postTime}</span>
                        </div>
                    </div>
                    <div class="post-content">${content}</div>
                    ${boostsHtml}
                </div>
            `);
        }

        const postsHtml = postsHtmlParts.join('');

        const themeColors = theme === 'dark' ? {
            bg: '#1a1a1a',
            card: '#2d2d2d',
            text: '#e0e0e0',
            textSec: '#b0b0b0',
            border: '#404040',
            primary: '#E3A043'
        } : {
            bg: '#f5f5f5',
            card: '#ffffff',
            text: '#333333',
            textSec: '#666666',
            border: '#e0e0e0',
            primary: '#E3A043'
        };

        const html = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${title} - Linux.do</title>
<style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: ${themeColors.bg}; color: ${themeColors.text}; line-height: 1.6; padding: 20px; }
    .container { max-width: 900px; margin: 0 auto; }
    .header { background: ${themeColors.card}; padding: 30px; border-radius: 8px; margin-bottom: 20px; border: 1px solid ${themeColors.border}; }
    .header h1 { font-size: 28px; margin-bottom: 15px; color: ${themeColors.text}; }
    .header-meta { color: ${themeColors.textSec}; font-size: 14px; }
    .post { background: ${themeColors.card}; padding: 20px; border-radius: 8px; margin-bottom: 15px; border: 1px solid ${themeColors.border}; }
    .post-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; padding-bottom: 10px; border-bottom: 1px solid ${themeColors.border}; }
    .post-author strong { color: ${themeColors.text}; font-size: 16px; }
    .username { color: ${themeColors.textSec}; font-size: 14px; margin-left: 8px; }
    .post-meta { color: ${themeColors.textSec}; font-size: 13px; }
    .post-number { color: ${themeColors.primary}; font-weight: 600; margin-right: 10px; }
    .reply-relation { color: ${themeColors.primary}; margin-right: 10px; text-decoration: none; }
    .reply-relation-missing { color: ${themeColors.textSec}; }
    .post-content { color: ${themeColors.text}; }
    .post-boosts { margin-top: 14px; padding-top: 12px; border-top: 1px solid ${themeColors.border}; color: ${themeColors.textSec}; font-size: 13px; }
    .boosts-title { color: ${themeColors.primary}; font-weight: 600; margin-bottom: 8px; }
    .post-boosts ul { list-style: none; padding: 0; margin: 0; }
    .post-boosts li { margin: 6px 0; }
    .boost-author { color: ${themeColors.text}; font-weight: 600; margin-right: 6px; }
    .boost-text { color: ${themeColors.textSec}; }
    .boost-more { color: ${themeColors.textSec}; font-style: italic; }
    .post-content img { max-width: 100%; height: auto; border-radius: 4px; margin: 10px 0; }
    .post-content pre { background: ${theme === 'dark' ? '#1e1e1e' : '#f5f5f5'}; padding: 15px; border-radius: 4px; overflow-x: auto; }
    .post-content code { font-family: 'Courier New', monospace; }
    .post-content blockquote { border-left: 3px solid ${themeColors.primary}; padding-left: 15px; margin: 10px 0; color: ${themeColors.textSec}; }
    .footer { text-align: center; color: ${themeColors.textSec}; margin-top: 30px; font-size: 13px; }
</style>
</head>
<body>
<div class="container">
    <div class="header">
        <h1>${title}</h1>
        <div class="header-meta">
            作者: ${author} | 创建时间: ${createTime} | 共 ${posts.length} 条回复
        </div>
    </div>
    ${postsHtml}
    <div class="footer">
        导出自 Linux.do | 导出时间: ${new Date().toLocaleString('zh-CN')}
    </div>
</div>
</body>
</html>`;

        const filename = `${Core.sanitizeFilenamePart(topicData.title)}_${posts[0].post_number}-${posts[posts.length-1].post_number}.html`;
        Core.throwIfAborted(signal);
        if (request && !this.isCurrentExportRequest(request)) return;
        Core.downloadFile(html, filename, 'text/html');

        const skippedText = skippedImageResourceCount > 0
            ? `<br><small>${skippedImageResourceCount} 个图片资源因失败或资源预算限制保留远程地址</small>`
            : '';
        statusBox.innerHTML = `<div style="color:var(--success)">✅ HTML 文件已导出！<br><small>文件名: ${Core.escapeHtml(filename)}</small>${skippedText}</div>`;
        this.showToast(skippedImageResourceCount > 0 ? 'HTML 已导出，部分图片保留远程地址' : 'HTML 导出成功');
    },

    async exportAsAiText(topicData, posts, statusBox, request = this.activeExportRequest) {
        const Q = this.uiManager.Q.bind(this.uiManager);
        const signal = request?.controller?.signal;
        const includeHeader = Q('#export-ai-header').checked;
        const includeImages = Q('#export-ai-images').checked;
        const includeQuotes = Q('#export-ai-quotes').checked;

        statusBox.innerHTML = `<div style="display:flex;align-items:center;gap:10px;"><div class="thinking"><div class="thinking-dot"></div><div class="thinking-dot"></div><div class="thinking-dot"></div></div>正在生成 AI 文本...</div>`;

        let text = '';

        if (includeHeader) {
            text += `标题: ${topicData.title}\n`;
            text += `作者: ${topicData.details?.created_by?.username || '未知'}\n`;
            text += `创建时间: ${new Date(topicData.created_at).toLocaleString('zh-CN')}\n`;
            text += `回复数: ${posts.length}\n`;
            text += `\n${'='.repeat(50)}\n\n`;
        }

        const postsByPostNumber = Core.createPostsByPostNumber(posts);
        for (const post of posts) {
            Core.throwIfAborted(signal);
            const userName = post.name || post.username;
            const username = post.username;
            const postTime = new Date(post.created_at).toLocaleString('zh-CN');
            const replyRelationInline = Core.formatReplyRelationInline(post, postsByPostNumber);

            text += `[${post.post_number}楼] ${userName}（@${username}）${replyRelationInline}\n`;
            text += `时间: ${postTime}\n\n`;

            const boostsText = Core.formatBoostsText(post, { atPrefix: true });
            if (boostsText) {
                text += boostsText + '\n\n';
            }

            const content = Core.cookedToAiText(post.cooked, { includeImages, includeQuotes });
            text += content + '\n\n';
            text += '-'.repeat(50) + '\n\n';
        }

        const filename = `${Core.sanitizeFilenamePart(topicData.title)}_${posts[0].post_number}-${posts[posts.length-1].post_number}.txt`;
        Core.throwIfAborted(signal);
        if (request && !this.isCurrentExportRequest(request)) return;
        Core.downloadFile(text, filename, 'text/plain');

        statusBox.innerHTML = `<div style="color:var(--success)">✅ AI 文本已导出！<br><small>文件名: ${Core.escapeHtml(filename)}</small></div>`;
        this.showToast('AI 文本导出成功');
    }
};
