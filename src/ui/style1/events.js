import { CONFIG } from '../../config.js';
import { Core } from '../../core/index.js';
import { UIRegistry } from '../registry.js';

export const style1Events = {
    bindEvents() {
        const Q = this.uiManager.Q.bind(this.uiManager);
        const btn = Q('#toggle-btn');

        this.addManagedListener(this.uiManager.shadow, 'click', (e) => {
            const inlineAction = this.getClosestElement(e.target, '[data-chat-action]');
            if (inlineAction) {
                e.preventDefault();
                const messageId = inlineAction.dataset.messageId;
                const action = inlineAction.dataset.chatAction;
                this.handleMessageMenuAction(action, messageId);
                return;
            }

            const menuAction = this.getClosestElement(e.target, '[data-message-menu-action]');
            if (menuAction) {
                e.preventDefault();
                this.handleMessageMenuAction(menuAction.dataset.messageMenuAction, this.currentMessageMenuId);
                return;
            }

            const summarySelectionAction = this.getClosestElement(e.target, '[data-summary-selection-action]');
            if (summarySelectionAction) {
                e.preventDefault();
                this.handleSummarySelectionAction(summarySelectionAction.dataset.summarySelectionAction);
                return;
            }

            const toggle = this.getClosestElement(e.target, '[data-thinking-toggle]');
            if (toggle) {
                e.preventDefault();
                const block = toggle.closest('[data-thinking-block]');
                if (block) {
                    const expanded = !block.classList.contains('expanded');
                    block.classList.toggle('expanded', expanded);
                    block.dataset.expansion = expanded ? 'user-expanded' : 'user-collapsed';
                    toggle.setAttribute('aria-expanded', `${expanded}`);
                    const content = block.querySelector('.thinking-content');
                    if (content) {
                        content.hidden = !expanded;
                        content.setAttribute('aria-hidden', `${!expanded}`);
                    }
                }
            }
        });

        let isDrag = false, hasMoved = false, startX, startY, startRect;
        let pendingDragEvent = null;
        let dragFrameId = null;
        const applyDragMove = () => {
            dragFrameId = null;
            if (!isDrag || !pendingDragEvent) return;
            const e = pendingDragEvent;
            pendingDragEvent = null;
            const dx = e.clientX - startX;
            const dy = e.clientY - startY;
            if (Math.abs(dx) > 5 || Math.abs(dy) > 5) hasMoved = true;
            if (!this.isOpen && hasMoved) {
                btn.style.left = `${startRect.left + dx}px`;
                btn.style.top = `${startRect.top + dy}px`;
                btn.style.right = 'auto';
                btn.className = 'btn-floating';
            }
        };
        this.addManagedListener(btn, 'mousedown', (e) => {
            isDrag = true; hasMoved = false;
            startX = e.clientX; startY = e.clientY;
            startRect = btn.getBoundingClientRect();
            pendingDragEvent = null;
            if (!this.isOpen) btn.style.transition = 'none';
            btn.style.cursor = 'grabbing';
            e.preventDefault();
        });
        this.addManagedListener(btn, 'click', (e) => {
            if (e.detail === 0) this.toggleSidebar();
        });

        this.addManagedListener(window, 'mousemove', (e) => {
            if (!isDrag) return;
            pendingDragEvent = e;
            if (!dragFrameId) {
                dragFrameId = this.requestManagedFrame(applyDragMove);
            }
        }, { passive: true });

        this.addManagedListener(window, 'mouseup', () => {
            if (!isDrag) return;
            if (dragFrameId) {
                this.cancelManagedFrame(dragFrameId);
                applyDragMove();
            }
            isDrag = false;
            pendingDragEvent = null;
            btn.style.cursor = 'grab';
            btn.style.transition = '';

            if (hasMoved && !this.isOpen) {
                const btnRect = btn.getBoundingClientRect();
                this.side = (btnRect.left + btnRect.width / 2) < window.innerWidth / 2 ? 'left' : 'right';
                const viewportHeight = Number(window.visualViewport?.height) || window.innerHeight;
                let newTop = Math.max(10, Math.min(btnRect.top, viewportHeight - 60));
                this.btnPos = { side: this.side, top: `${newTop}px` };
                GM_setValue(this.getStyleStorageKey('btnPos'), this.btnPos);
                btn.style.top = `${newTop}px`;
                this.applySideState();
            } else if (!hasMoved) {
                this.toggleSidebar();
            }
        });

        Q('#btn-close').onclick = () => this.toggleSidebar();
        Q('#btn-theme').onclick = () => this.toggleTheme();

        this.addManagedListener(Q('.tab-bar'), 'click', (e) => {
            const tab = this.getClosestElement(e.target, '.tab-item');
            if (tab) this.switchTab(tab.dataset.tab);
        });
        this.addManagedListener(Q('.tab-bar'), 'keydown', (e) => {
            const tab = this.getClosestElement(e.target, '.tab-item');
            if (!tab) return;
            const tabs = Array.from(Q('.tab-bar').querySelectorAll('.tab-item'));
            const currentIndex = tabs.indexOf(tab);
            let nextIndex = currentIndex;
            if (e.key === 'ArrowRight') nextIndex = (currentIndex + 1) % tabs.length;
            if (e.key === 'ArrowLeft') nextIndex = (currentIndex - 1 + tabs.length) % tabs.length;
            if (e.key === 'Home') nextIndex = 0;
            if (e.key === 'End') nextIndex = tabs.length - 1;
            if (nextIndex === currentIndex) return;
            e.preventDefault();
            const nextTab = tabs[nextIndex];
            this.switchTab(nextTab.dataset.tab);
            nextTab.focus();
        });

        let isResizing = false;
        let pendingResizeEvent = null;
        let resizeFrameId = null;
        const applyResizeMove = () => {
            resizeFrameId = null;
            if (!isResizing || !pendingResizeEvent || this.isNarrowViewport?.()) return;
            const e = pendingResizeEvent;
            pendingResizeEvent = null;
            let newW = this.side === 'right' ? (window.innerWidth - e.clientX) : e.clientX;
            if (newW > 320 && newW < 700) {
                this.sidebarWidth = newW;
                this.uiManager.host.style.setProperty('--sidebar-width', `${newW}px`);
                if (this.isOpen) {
                    this.squeezeBody(true);
                    this.updateButtonPosition(false);
                }
            }
        };
        this.addManagedListener(Q('#resizer'), 'mousedown', (e) => {
            if (this.isNarrowViewport?.()) return;
            isResizing = true;
            pendingResizeEvent = null;
            document.body.style.cursor = 'col-resize';
            Q('#sidebar').style.transition = 'none';
            document.body.style.transition = 'none';
            e.preventDefault();
        });

        this.addManagedListener(window, 'mousemove', (e) => {
            if (!isResizing) return;
            pendingResizeEvent = e;
            if (!resizeFrameId) {
                resizeFrameId = this.requestManagedFrame(applyResizeMove);
            }
        }, { passive: true });

        this.addManagedListener(window, 'mouseup', () => {
            if (isResizing) {
                if (resizeFrameId) {
                    this.cancelManagedFrame(resizeFrameId);
                    applyResizeMove();
                }
                isResizing = false;
                pendingResizeEvent = null;
                document.body.style.cursor = '';
                Q('#sidebar').style.transition = '';
                document.body.style.transition = 'margin 0.35s cubic-bezier(0.4, 0, 0.2, 1)';
                GM_setValue(this.getStyleStorageKey('sidebarWidth'), this.sidebarWidth);
            }
        });

        Q('#range-all').onclick = () => this.setRange('all');
        Q('#range-recent').onclick = () => this.setRange('recent');
        ['#inp-start', '#inp-end'].forEach((selector) => {
            const input = Q(selector);
            if (input) this.addManagedListener(input, 'input', () => this.markSummaryRangeManual());
        });
        Q('#btn-summary').onclick = () => this.handleSummaryButtonClick();
        Q('#btn-refresh-summary-cache').onclick = () => this.refreshSummaryCache();
        Q('#btn-send').onclick = () => this.handleSendButtonClick();
        const chatInput = Q('#chat-input');
        this.addManagedListener(chatInput, 'keydown', (e) => {
            const isComposing = e.isComposing || e.keyCode === 229;
            if (e.key === 'Enter' && !e.shiftKey && !isComposing) {
                e.preventDefault();
                this.doChat();
            }
        });
        this.addManagedListener(chatInput, 'input', (e) => this.scheduleChatInputResize(e.target));
        Q('#btn-clear-chat').onclick = () => this.clearChat();
        Q('#btn-scroll-top').onclick = () => this.scrollToTop();
        Q('#btn-scroll-bottom').onclick = () => this.forceScrollToBottom();
        Q('#btn-summary-scroll-bottom').onclick = () => this.forceScrollSummaryToBottom();
        this.bindMessageContextMenu();
        this.bindSummarySelectionMenu();
        this.bindSettingsStorageSync();

        const chatMessages = Q('#chat-messages');
        let lastScrollTop = 0;
        let chatScrollFrameId = null;
        this.addManagedListener(chatMessages, 'scroll', () => {
            if (chatScrollFrameId) return;
            chatScrollFrameId = this.requestManagedFrame(() => {
                chatScrollFrameId = null;
                this.closeMessageContextMenu();
                this.closeSummarySelectionMenu?.();
                const currentScrollTop = chatMessages.scrollTop;
                const isNearBottom = (chatMessages.scrollHeight - currentScrollTop - chatMessages.clientHeight) < 80;
                if (this.isGenerating && !this.isProgrammaticScroll) {
                    this.userScrolledUp = currentScrollTop < lastScrollTop - 10 ? true : (isNearBottom ? false : this.userScrolledUp);
                }
                lastScrollTop = currentScrollTop;
                this.updateScrollButtons();
            });
        }, { passive: true });

        const summaryResult = Q('#summary-result');
        let lastSummaryScrollTop = 0;
        let summaryScrollFrameId = null;
        this.addManagedListener(summaryResult, 'scroll', () => {
            if (summaryScrollFrameId) return;
            summaryScrollFrameId = this.requestManagedFrame(() => {
                summaryScrollFrameId = null;
                this.closeSummarySelectionMenu?.();
                const currentScrollTop = summaryResult.scrollTop;
                const isNearBottom = this.isNearScrollBottom(summaryResult, 80);
                if (this.isGenerating && !this.isSummaryProgrammaticScroll) {
                    this.summaryUserScrolledUp = currentScrollTop < lastSummaryScrollTop - 10
                        ? true
                        : (isNearBottom ? false : this.summaryUserScrolledUp);
                }
                lastSummaryScrollTop = currentScrollTop;
                this.updateSummaryScrollButton();
            });
        }, { passive: true });
        const handleViewportChange = this.createFrameThrottledHandler(() => {
            this.syncVisualViewport();
            if (typeof this.applyResponsiveLayout === 'function') {
                this.applyResponsiveLayout();
            } else {
                this.squeezeBody(this.isOpen);
                this.updateButtonPosition(false);
            }
            this.updateScrollButtons();
            this.updateSummaryScrollButton();
        });
        this.addManagedListener(window, 'resize', handleViewportChange);
        if (window.visualViewport) {
            this.addManagedListener(window.visualViewport, 'resize', handleViewportChange);
        }
        this.syncVisualViewport();

        this.addManagedListener(Q('#cfg-profile-list'), 'click', (e) => {
            const card = this.getClosestElement(e.target, '.api-profile-card');
            if (card?.dataset?.profileId) this.handleApiProfileSelect(card.dataset.profileId);
        });
        this.addManagedListener(Q('#cfg-profile-list'), 'keydown', (e) => {
            if (e.key !== 'Enter' && e.key !== ' ') return;
            const card = this.getClosestElement(e.target, '.api-profile-card');
            if (!card?.dataset?.profileId) return;
            e.preventDefault();
            this.handleApiProfileSelect(card.dataset.profileId);
        });
        this.addManagedListener(Q('#cfg-profile-name'), 'input', () => this.handleApiProfileNameInput());
        ['#cfg-url', '#cfg-key', '#cfg-model'].forEach((selector) => {
            const input = Q(selector);
            if (!input) return;
            this.addManagedListener(input, 'input', () => this.handleApiProfileFieldInput());
            this.addManagedListener(input, 'blur', () => this.flushApiProfilePersist({ render: true, fill: false }));
        });
        [
            ['#cfg-prompt-sum', 'prompt_sum'],
            ['#cfg-prompt-chat', 'prompt_chat'],
            ['#cfg-recent-floors', 'recentFloors']
        ].forEach(([selector, key]) => {
            const input = Q(selector);
            if (input) this.addManagedListener(input, 'input', () => this.markSettingsDirty(key));
        });
        [
            ['#cfg-stream', 'useStream'],
            ['#cfg-autoscroll', 'autoScroll']
        ].forEach(([selector, key]) => {
            const input = Q(selector);
            if (input) this.addManagedListener(input, 'change', () => this.markSettingsDirty(key));
        });
        const floatingMenuOpacityInput = Q('#cfg-floating-menu-opacity');
        if (floatingMenuOpacityInput) {
            this.addManagedListener(floatingMenuOpacityInput, 'input', () => {
                this.applyFloatingMenuOpacity(floatingMenuOpacityInput.value);
                this.markSettingsDirty(CONFIG.floatingMenuOpacityKey);
            });
        }
        Q('#btn-api-profile-add').onclick = () => this.addApiProfile();
        Q('#btn-api-profile-copy').onclick = () => this.copyApiProfile();
        Q('#btn-api-profile-delete').onclick = () => this.deleteApiProfile();

        Q('#btn-save').onclick = () => {
            const apiState = this.flushApiProfilePersist({ render: true, fill: true });
            this.fillApiFormFromProfile(apiState.activeProfile);
            GM_setValue('prompt_sum', Q('#cfg-prompt-sum').value);
            GM_setValue('prompt_chat', Q('#cfg-prompt-chat').value);
            const recentFloors = Math.max(10, Math.min(500, parseInt(Q('#cfg-recent-floors').value) || 50));
            GM_setValue('recentFloors', recentFloors);
            Q('#cfg-recent-floors').value = recentFloors;
            Q('#recent-count').textContent = recentFloors;
            Q('#export-recent-count').textContent = recentFloors;
            GM_setValue('useStream', Q('#cfg-stream').checked);
            GM_setValue('autoScroll', Q('#cfg-autoscroll').checked);
            const floatingMenuOpacity = this.applyFloatingMenuOpacity(
                Q('#cfg-floating-menu-opacity')?.value
            );
            GM_setValue(CONFIG.floatingMenuOpacityKey, floatingMenuOpacity);
            this.clearSettingsDirty(CONFIG.configSyncKeys);
            this.showToast('设置已保存', 'success');
            this.switchTab('summary');
        };

        Q('#btn-fetch-models').onclick = () => this.openModelPicker();
        Q('#btn-refresh-models').onclick = () => this.loadModelList();
        Q('#btn-close-model-picker').onclick = () => this.closeModelPicker();
        Q('#btn-cancel-model-picker').onclick = () => this.closeModelPicker();
        Q('#btn-confirm-workspace-replace').onclick = () => this.closeWorkspaceReplacementConfirm(true);
        Q('#btn-cancel-workspace-replace').onclick = () => this.closeWorkspaceReplacementConfirm(false);
        Q('#btn-close-workspace-replace').onclick = () => this.closeWorkspaceReplacementConfirm(false);

        const modelPickerModal = Q('#model-picker-modal');
        this.addManagedListener(modelPickerModal, 'click', (e) => {
            if (e.target?.id === 'model-picker-modal') this.closeModelPicker();
        });
        this.addManagedListener(modelPickerModal, 'keydown', (e) => {
            if (e.key === 'Escape') {
                e.preventDefault();
                e.stopPropagation();
                this.closeModelPicker();
                return;
            }
            if (e.key !== 'Tab') return;
            const controls = [...modelPickerModal.querySelectorAll(
                'button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
            )];
            if (controls.length === 0) return;
            const first = controls[0];
            const last = controls[controls.length - 1];
            const activeElement = modelPickerModal.getRootNode().activeElement;
            if (e.shiftKey && (activeElement === first || !modelPickerModal.contains(activeElement))) {
                e.preventDefault();
                last.focus();
            } else if (!e.shiftKey && activeElement === last) {
                e.preventDefault();
                first.focus();
            }
        });
        this.addManagedListener(Q('#workspace-replace-modal'), 'click', (e) => {
            if (e.target?.id === 'workspace-replace-modal') this.closeWorkspaceReplacementConfirm(false);
        });
        this.addManagedListener(Q('#workspace-replace-modal'), 'keydown', (e) => {
            if (e.key === 'Escape') {
                e.preventDefault();
                e.stopPropagation();
                this.closeWorkspaceReplacementConfirm(false);
                return;
            }
            if (e.key !== 'Tab') return;
            const modal = Q('#workspace-replace-modal');
            const controls = [...modal.querySelectorAll('button:not([disabled])')];
            if (controls.length === 0) return;
            const first = controls[0];
            const last = controls[controls.length - 1];
            const activeElement = modal.getRootNode().activeElement;
            if (e.shiftKey && (activeElement === first || !modal.contains(activeElement))) {
                e.preventDefault();
                last.focus();
            } else if (!e.shiftKey && activeElement === last) {
                e.preventDefault();
                first.focus();
            }
        });

        this.addManagedListener(Q('#model-picker-list'), 'click', (e) => {
            const option = this.getClosestElement(e.target, '.model-option');
            if (!option) return;
            Q('#cfg-model').value = option.dataset.model || option.textContent.trim();
            this.handleApiProfileFieldInput();
            this.flushApiProfilePersist({ render: true, fill: false });
            this.closeModelPicker();
            this.showToast('已选择模型', 'success');
        });

        // 导出功能事件绑定
        Q('#export-type').onchange = (e) => {
            const isHtml = e.target.value === 'html';
            Q('#html-export-options').style.display = isHtml ? 'block' : 'none';
            Q('#ai-text-options').style.display = isHtml ? 'none' : 'block';
        };
        Q('#export-range-all').onclick = () => this.setExportRange('all');
        Q('#export-range-recent').onclick = () => this.setExportRange('recent');
        ['#export-start', '#export-end'].forEach((selector) => {
            const input = Q(selector);
            if (input) this.addManagedListener(input, 'input', () => this.markExportRangeManual());
        });
        Q('#btn-export').onclick = () => this.doExport();
    },

    getActiveApiProfileIndex() {
        const profiles = Core.normalizeApiProfiles(this.apiProfiles);
        this.apiProfiles = profiles;
        let index = profiles.findIndex((profile) => profile.id === this.activeApiProfileId);
        if (index < 0) {
            index = 0;
            this.activeApiProfileId = profiles[0].id;
        }
        return index;
    },

    syncCurrentApiFormToActiveProfile() {
        const Q = this.uiManager.Q.bind(this.uiManager);
        if (!Array.isArray(this.apiProfiles) || this.apiProfiles.length === 0) {
            const state = Core.loadApiProfileState();
            this.apiProfiles = state.profiles;
            this.activeApiProfileId = state.activeId;
        }

        const index = this.getActiveApiProfileIndex();
        const current = this.apiProfiles[index] || Core.normalizeApiProfile({}, index);
        const nextProfile = Core.normalizeApiProfile({
            ...current,
            name: Q('#cfg-profile-name')?.value.trim(),
            apiUrl: Q('#cfg-url')?.value.trim(),
            apiKey: Q('#cfg-key')?.value.trim(),
            model: Q('#cfg-model')?.value.trim()
        }, index);

        this.apiProfiles[index] = nextProfile;
        this.activeApiProfileId = nextProfile.id;
        return nextProfile;
    },

    renderApiProfileList() {
        const Q = this.uiManager.Q.bind(this.uiManager);
        const list = Q('#cfg-profile-list');
        if (!list) return;

        this.apiProfiles = Core.normalizeApiProfiles(this.apiProfiles);
        if (!this.apiProfiles.some((profile) => profile.id === this.activeApiProfileId)) {
            this.activeApiProfileId = this.apiProfiles[0].id;
        }

        list.innerHTML = '';
        this.apiProfiles.forEach((profile, index) => {
            const card = document.createElement('button');
            const selected = profile.id === this.activeApiProfileId;
            const host = Core.getApiProfileHost(profile.apiUrl) || '自定义接口';
            const model = String(profile.model || CONFIG.defaultModel).trim() || CONFIG.defaultModel;
            card.type = 'button';
            card.className = 'api-profile-card';
            card.dataset.profileId = profile.id;
            card.setAttribute('role', 'option');
            card.setAttribute('aria-selected', selected ? 'true' : 'false');
            card.tabIndex = selected ? 0 : -1;
            card.innerHTML = `
                <span class="api-profile-card-title">${Core.escapeHtml(Core.inferApiProfileName(profile, index))}</span>
                <span class="api-profile-card-meta">${Core.escapeHtml(model)} · ${Core.escapeHtml(host)}</span>
            `;
            list.appendChild(card);
        });
        this.updateApiProfileActionState();
        this.refreshApiProfileSummary();
    },

    renderApiProfileSelect() {
        return this.renderApiProfileList();
    },

    fillApiFormFromProfile(profile) {
        const Q = this.uiManager.Q.bind(this.uiManager);
        const index = this.getActiveApiProfileIndex();
        const normalized = Core.normalizeApiProfile(profile || this.apiProfiles[index], index);
        Q('#cfg-profile-name').value = normalized.name;
        Q('#cfg-url').value = normalized.apiUrl;
        Q('#cfg-key').value = normalized.apiKey;
        Q('#cfg-model').value = normalized.model;
        this.refreshApiProfileSummary();
    },

    refreshApiProfileSummary() {
        const summary = this.uiManager.Q('#api-profile-summary');
        if (!summary) return;
        const index = this.getActiveApiProfileIndex();
        const profile = this.apiProfiles[index];
        summary.textContent = `${Core.getApiProfileOptionLabel(profile, index)}。点击配置立即切换；API 地址、Key 和模型会自动保存。`;
    },

    updateApiProfileActionState() {
        const deleteBtn = this.uiManager.Q('#btn-api-profile-delete');
        if (deleteBtn) deleteBtn.disabled = this.apiProfiles.length <= 1;
    },

    loadApiProfileStateToUi() {
        const state = Core.loadApiProfileState();
        this.apiProfiles = state.profiles;
        this.activeApiProfileId = state.activeId;
        this.renderApiProfileList();
        this.fillApiFormFromProfile(Core.findApiProfile(this.apiProfiles, this.activeApiProfileId));
    },

    persistApiProfileState(options = {}) {
        const apiState = Core.saveApiProfileState(this.apiProfiles, this.activeApiProfileId);
        this.apiProfiles = apiState.profiles;
        this.activeApiProfileId = apiState.activeId;
        this.clearSettingsDirty([
            CONFIG.apiProfilesKey,
            CONFIG.activeApiProfileIdKey,
            'apiUrl',
            'apiKey',
            'model'
        ]);
        if (options.render !== false) this.renderApiProfileList();
        if (options.fill === true) this.fillApiFormFromProfile(apiState.activeProfile);
        return apiState;
    },

    queueApiProfilePersist() {
        this.clearManagedTimeout(this.apiProfilePersistTimerId);
        this.apiProfilePersistTimerId = this.setManagedTimeout(() => {
            this.apiProfilePersistTimerId = null;
            this.syncCurrentApiFormToActiveProfile();
            this.persistApiProfileState({ render: true, fill: false });
        }, 150);
    },

    flushApiProfilePersist(options = {}) {
        this.clearManagedTimeout(this.apiProfilePersistTimerId);
        this.apiProfilePersistTimerId = null;
        this.syncCurrentApiFormToActiveProfile();
        return this.persistApiProfileState(options);
    },

    bindSettingsStorageSync() {
        CONFIG.configSyncKeys.forEach((key) => {
            this.addManagedValueChangeListener(key, (_name, _oldValue, _newValue, remote) => {
                if (!remote) return;
                this.queueSettingsStorageSync(key);
            });
        });
    },

    markSettingsDirty(keys) {
        const list = Array.isArray(keys) ? keys : [keys];
        list.filter(Boolean).forEach((key) => this.dirtySettingsKeys.add(key));
    },

    clearSettingsDirty(keys) {
        const list = Array.isArray(keys) ? keys : [keys];
        list.filter(Boolean).forEach((key) => this.dirtySettingsKeys.delete(key));
        if (this.dirtySettingsKeys.size === 0) this.remoteSettingsConflictNotified = false;
    },

    queueSettingsStorageSync(key) {
        this.pendingSettingsStorageSyncKeys.add(key);
        this.clearManagedTimeout(this.settingsStorageSyncTimerId);
        this.settingsStorageSyncTimerId = this.setManagedTimeout(() => {
            this.settingsStorageSyncTimerId = null;
            this.flushSettingsStorageSync();
        }, CONFIG.configSyncDebounceMs);
    },

    flushSettingsStorageSync() {
        const keys = new Set(this.pendingSettingsStorageSyncKeys);
        this.pendingSettingsStorageSyncKeys.clear();
        if (keys.size === 0) return;
        if (this.isSettingsStorageSyncDirty(keys)) {
            keys.forEach(key => this.pendingSettingsStorageSyncKeys.add(key));
            if (!this.remoteSettingsConflictNotified) {
                this.remoteSettingsConflictNotified = true;
                this.showToast('其他标签页有设置更新，完成当前编辑后将处理同步');
            }
            this.clearManagedTimeout(this.settingsStorageSyncRetryTimerId);
            this.settingsStorageSyncRetryTimerId = this.setManagedTimeout(() => {
                this.settingsStorageSyncRetryTimerId = null;
                this.flushSettingsStorageSync();
            }, CONFIG.configSyncDirtyRetryMs);
            return;
        }
        this.applySettingsStorageSnapshot(keys);
    },

    isSettingsStorageSyncDirty(keys) {
        if (this.applyingRemoteSettingsSnapshot) return false;
        return Array.from(keys).some((key) => this.dirtySettingsKeys.has(key));
    },

    applySettingsStorageSnapshot(changedKeys = new Set()) {
        this.applyingRemoteSettingsSnapshot = true;
        try {
            const keys = changedKeys instanceof Set ? changedKeys : new Set(changedKeys);
            const profileKeys = [CONFIG.apiProfilesKey, CONFIG.activeApiProfileIdKey, 'apiUrl', 'apiKey', 'model'];
            if (profileKeys.some(key => keys.has(key))) {
                this.applyApiProfileStorageSnapshot();
            }
            if (keys.has('prompt_sum') || keys.has('prompt_chat')) {
                this.applyPromptStorageSnapshot();
            }
            if (keys.has('recentFloors')) {
                this.applyRecentFloorsStorageSnapshot();
            }
            if (keys.has('useStream') || keys.has('autoScroll')) {
                this.applyStreamAndAutoscrollStorageSnapshot();
            }
            if (keys.has(CONFIG.floatingMenuOpacityKey)) {
                this.applyFloatingMenuOpacityStorageSnapshot();
            }
        } finally {
            this.applyingRemoteSettingsSnapshot = false;
            this.remoteSettingsConflictNotified = false;
        }
    },

    applyApiProfileStorageSnapshot() {
        this.clearManagedTimeout(this.apiProfilePersistTimerId);
        this.apiProfilePersistTimerId = null;
        this.loadApiProfileStateToUi();
    },

    applyPromptStorageSnapshot() {
        const Q = this.uiManager.Q.bind(this.uiManager);
        const promptSum = GM_getValue('prompt_sum', '请总结以下论坛帖子内容。使用 Markdown 格式，条理清晰，重点突出主要观点、争议点和结论。适当使用标题、列表和引用来组织内容。');
        const promptChat = GM_getValue('prompt_chat', '你是一个帖子阅读助手。基于上文中的帖子内容，回答用户的问题。回答要准确、简洁，必要时引用原文。');
        const sumInput = Q('#cfg-prompt-sum');
        const chatInput = Q('#cfg-prompt-chat');
        if (sumInput) sumInput.value = promptSum;
        if (chatInput) chatInput.value = promptChat;
        this.syncChatPromptMemory(promptChat);
    },

    syncChatPromptMemory(promptChat) {
        if (!this.chatSession?.context || !Array.isArray(this.chatSession.baseMessages)) return;
        this.chatSession.context.promptChat = promptChat;
        if (this.chatSession.baseMessages[0]?.role === 'system') {
            this.chatSession.baseMessages[0] = {
                ...this.chatSession.baseMessages[0],
                content: promptChat
            };
            this.syncLegacyChatHistory();
        }
    },

    applyRecentFloorsStorageSnapshot() {
        const Q = this.uiManager.Q.bind(this.uiManager);
        const recentFloors = Math.max(10, Math.min(500, parseInt(GM_getValue('recentFloors', 50), 10) || 50));
        const input = Q('#cfg-recent-floors');
        if (input) input.value = recentFloors;
        const recentCount = Q('#recent-count');
        if (recentCount) recentCount.textContent = recentFloors;
        const exportRecentCount = Q('#export-recent-count');
        if (exportRecentCount) exportRecentCount.textContent = recentFloors;

        const summaryEnd = parseInt(Q('#inp-end')?.value, 10);
        if (this.rangeMode === 'recent' && Number.isFinite(summaryEnd)) {
            const start = Q('#inp-start');
            if (start) start.value = Math.max(1, summaryEnd - recentFloors + 1);
        }
        const exportEnd = parseInt(Q('#export-end')?.value, 10);
        if (this.exportRangeMode === 'recent' && Number.isFinite(exportEnd)) {
            const start = Q('#export-start');
            if (start) start.value = Math.max(1, exportEnd - recentFloors + 1);
        }
    },

    applyStreamAndAutoscrollStorageSnapshot() {
        const Q = this.uiManager.Q.bind(this.uiManager);
        const streamInput = Q('#cfg-stream');
        const autoscrollInput = Q('#cfg-autoscroll');
        if (streamInput) streamInput.checked = GM_getValue('useStream', true);
        if (autoscrollInput) autoscrollInput.checked = GM_getValue('autoScroll', true);
    },

    applyFloatingMenuOpacityStorageSnapshot() {
        this.applyFloatingMenuOpacity(GM_getValue(
            CONFIG.floatingMenuOpacityKey,
            CONFIG.floatingMenuOpacityDefault
        ));
    },

    handleApiProfileSelect(nextId) {
        this.flushApiProfilePersist({ render: false, fill: false });
        this.syncCurrentApiFormToActiveProfile();
        if (!this.apiProfiles.some((profile) => profile.id === nextId)) return;
        this.activeApiProfileId = nextId;
        const apiState = this.persistApiProfileState({ render: true, fill: false });
        this.fillApiFormFromProfile(Core.findApiProfile(apiState.profiles, apiState.activeId));
        this.showToast('已切换 API 配置', 'success');
    },

    handleApiProfileNameInput() {
        this.handleApiProfileFieldInput();
    },

    handleApiProfileFieldInput() {
        this.markSettingsDirty(CONFIG.apiProfilesKey);
        this.syncCurrentApiFormToActiveProfile();
        this.renderApiProfileList();
        this.queueApiProfilePersist();
    },

    addApiProfile() {
        this.flushApiProfilePersist({ render: false, fill: false });
        const profile = Core.normalizeApiProfile({
            id: Core.createApiProfileId(),
            name: `配置 ${this.apiProfiles.length + 1}`,
            apiUrl: CONFIG.defaultApiUrl,
            apiKey: '',
            model: CONFIG.defaultModel
        }, this.apiProfiles.length);
        this.apiProfiles.push(profile);
        this.activeApiProfileId = profile.id;
        const apiState = this.persistApiProfileState({ render: true, fill: false });
        this.fillApiFormFromProfile(Core.findApiProfile(apiState.profiles, apiState.activeId));
        this.showToast('已新增 API 配置', 'success');
    },

    copyApiProfile() {
        const current = this.flushApiProfilePersist({ render: false, fill: false }).activeProfile;
        const index = this.getActiveApiProfileIndex();
        const profile = Core.normalizeApiProfile({
            ...current,
            id: Core.createApiProfileId(),
            name: `${current.name || '配置'} 副本`
        }, index + 1);
        this.apiProfiles.splice(index + 1, 0, profile);
        this.activeApiProfileId = profile.id;
        const apiState = this.persistApiProfileState({ render: true, fill: false });
        this.fillApiFormFromProfile(Core.findApiProfile(apiState.profiles, apiState.activeId));
        this.showToast('已复制 API 配置', 'success');
    },

    deleteApiProfile() {
        if (!Array.isArray(this.apiProfiles) || this.apiProfiles.length <= 1) {
            this.showToast('至少保留一个 API 配置', 'error');
            return;
        }
        this.flushApiProfilePersist({ render: false, fill: false });
        const index = this.getActiveApiProfileIndex();
        const ok = window.confirm?.('删除当前 API 配置？') ?? true;
        if (!ok) return;
        this.apiProfiles.splice(index, 1);
        const nextIndex = Math.max(0, Math.min(index, this.apiProfiles.length - 1));
        this.activeApiProfileId = this.apiProfiles[nextIndex].id;
        const apiState = this.persistApiProfileState({ render: true, fill: false });
        this.fillApiFormFromProfile(Core.findApiProfile(apiState.profiles, apiState.activeId));
        this.showToast('已删除 API 配置', 'success');
    },

    bindKeyboardShortcuts() {
        this.addManagedListener(document, 'keydown', (e) => {
            if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 's') { e.preventDefault(); this.toggleSidebar(); }
            if (e.key === 'Escape' && this.isOpen) {
                if (this.currentSummarySelection) {
                    this.closeSummarySelectionMenu();
                    return;
                }
                if (this.currentMessageMenuId) {
                    this.closeMessageContextMenu();
                    return;
                }
                if (this.editingMessageId) {
                    this.cancelEditMessage();
                    return;
                }
                const modal = this.uiManager.Q('#model-picker-modal');
                if (modal?.classList.contains('show')) {
                    this.closeModelPicker();
                    return;
                }
                this.toggleSidebar();
            }
        });
    },

    //
};
