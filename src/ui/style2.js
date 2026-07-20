import { CONFIG } from '../config.js';
import { Core } from '../core/index.js';
import { UIRegistry } from './registry.js';
import { STYLE2_STYLES } from './style2/presentation.js';

UIRegistry.register('style2', {
    name: 'LinuxDO沉浸风格',
    styleKey: 'style2',
    ICONS: {
        brain: `<svg viewBox="0 0 24 24"><path d="M12 2a10 10 0 0 1 10 10c0 5.52-4.48 10-10 10S2 17.52 2 12 6.48 2 12 2zm0 2a8 8 0 1 0 0 16 8 8 0 0 0 0-16zm1 11a1 1 0 1 1 0 2 1 1 0 0 1 0-2zm0-7a1 1 0 0 1 0 2 1 1 0 0 1 0-2zm-2 7a1 1 0 1 1 0 2 1 1 0 0 1 0-2zm0-7a1 1 0 0 1 0 2 1 1 0 0 1 0-2z" fill="currentColor"/></svg>`,
        summary: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>`,
        chat: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>`,
        settings: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>`,
        moon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>`,
        sun: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>`,
        close: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>`,
        trash: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>`,
        copy: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>`,
        sparkles: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/></svg>`,
        arrowLeft: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>`,
        arrowRight: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>`,
        arrowUp: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="19" x2="12" y2="5"></line><polyline points="5 12 12 5 19 12"></polyline></svg>`,
        arrowDown: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><polyline points="19 12 12 19 5 12"></polyline></svg>`,
        send: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>`,
        robot: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="10" rx="2"></rect><circle cx="12" cy="5" r="2"></circle><path d="M12 7v4"></path><line x1="8" y1="16" x2="8" y2="16"></line><line x1="16" y1="16" x2="16" y2="16"></line></svg>`,
        check: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>`,
        download: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v12"></path><polyline points="7 10 12 15 17 10"></polyline><path d="M5 21h14"></path></svg>`
    },

    init(uiManager) {
        this.uiManager = uiManager;
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

    destroy: UIRegistry.get('style1').destroy,
    getStyleStorageKey: UIRegistry.get('style1').getStyleStorageKey,
    addManagedListener: UIRegistry.get('style1').addManagedListener,
    addManagedValueChangeListener: UIRegistry.get('style1').addManagedValueChangeListener,
    setManagedTimeout: UIRegistry.get('style1').setManagedTimeout,
    clearManagedTimeout: UIRegistry.get('style1').clearManagedTimeout,
    requestManagedFrame: UIRegistry.get('style1').requestManagedFrame,
    cancelManagedFrame: UIRegistry.get('style1').cancelManagedFrame,
    createFrameThrottledHandler: UIRegistry.get('style1').createFrameThrottledHandler,
    getStreamingRenderDelay: UIRegistry.get('style1').getStreamingRenderDelay,
    syncVisualViewport: UIRegistry.get('style1').syncVisualViewport,
    resizeChatInput: UIRegistry.get('style1').resizeChatInput,
    scheduleChatInputResize: UIRegistry.get('style1').scheduleChatInputResize,
    scheduleSummaryRender: UIRegistry.get('style1').scheduleSummaryRender,
    cancelSummaryRender: UIRegistry.get('style1').cancelSummaryRender,
    scheduleBubbleRender: UIRegistry.get('style1').scheduleBubbleRender,
    cancelBubbleRender: UIRegistry.get('style1').cancelBubbleRender,
    resetGlobalUiState() {
        UIRegistry.get('style1').resetGlobalUiState.call(this);
        if (document.body.style.transition === 'margin 0.22s cubic-bezier(0.22, 1, 0.36, 1)') {
            document.body.style.transition = '';
        }
    },

    getStyles() {
        return STYLE2_STYLES;
    },

    render() {
        const html = `
            <button type="button" id="toggle-btn" title="拖动改变位置，点击展开/关闭 (Ctrl+Shift+S)" aria-label="打开智能总结侧栏" aria-controls="sidebar" aria-expanded="false">${this.ICONS.arrowLeft}</button>
            <div class="sidebar-panel" id="sidebar" role="complementary" aria-label="Linux.do 智能总结">
                <div class="resize-handle" id="resizer" aria-hidden="true"></div>
                <div class="toast" id="toast" role="status" aria-live="polite"></div>
                <div class="model-picker-overlay" id="model-picker-modal" aria-hidden="true">
                    <div class="model-picker-dialog" role="dialog" aria-modal="true" aria-labelledby="model-picker-title">
                        <div class="model-picker-header">
                            <div class="model-picker-title" id="model-picker-title">选择模型</div>
                            <button type="button" class="icon-btn" id="btn-close-model-picker" data-tooltip="关闭" title="关闭模型选择器" aria-label="关闭模型选择器">${this.ICONS.close}</button>
                        </div>
                        <div class="model-picker-status" id="model-picker-status">填写 API 地址和 API Key 后获取模型列表。</div>
                        <div class="model-picker-list" id="model-picker-list"></div>
                        <div class="model-picker-actions">
                            <button type="button" class="btn-xs" id="btn-refresh-models">重新获取</button>
                            <button type="button" class="btn-xs" id="btn-cancel-model-picker">取消</button>
                        </div>
                    </div>
                </div>
                <div class="workspace-replace-overlay" id="workspace-replace-modal" aria-hidden="true">
                    <div class="workspace-replace-dialog" role="dialog" aria-modal="true" aria-labelledby="workspace-replace-title" aria-describedby="workspace-replace-message">
                        <div class="workspace-replace-header">
                            <div class="workspace-replace-title" id="workspace-replace-title">替换当前工作区？</div>
                            <button type="button" class="icon-btn" id="btn-close-workspace-replace" data-tooltip="关闭" title="关闭替换确认" aria-label="关闭替换确认">${this.ICONS.close}</button>
                        </div>
                        <div class="workspace-replace-message" id="workspace-replace-message"></div>
                        <div class="workspace-replace-actions">
                            <button type="button" class="btn-xs" id="btn-cancel-workspace-replace">取消</button>
                            <button type="button" class="btn-xs" id="btn-confirm-workspace-replace">总结当前主题</button>
                        </div>
                    </div>
                </div>
                <div class="header">
                    <div class="header-title">
                        <div class="header-title-icon">${this.ICONS.brain}</div>
                        智能总结
                    </div>
                    <div class="header-actions">
                        <button type="button" class="icon-btn" id="btn-theme" data-tooltip="切换主题" title="切换明暗主题" aria-label="切换明暗主题">${this.ICONS.moon}</button>
                        <button type="button" class="icon-btn" id="btn-close" data-tooltip="关闭" title="关闭侧栏" aria-label="关闭侧栏">${this.ICONS.close}</button>
                    </div>
                </div>
                <div class="tab-bar" role="tablist" aria-label="智能总结功能">
                    <button type="button" class="tab-item active" id="tab-summary" data-tab="summary" role="tab" aria-selected="true" aria-controls="page-summary" tabindex="0">${this.ICONS.summary}<span>总结</span></button>
                    <button type="button" class="tab-item" id="tab-chat" data-tab="chat" role="tab" aria-selected="false" aria-controls="page-chat" tabindex="-1">${this.ICONS.chat}<span>对话</span></button>
                    <button type="button" class="tab-item" id="tab-export" data-tab="export" role="tab" aria-selected="false" aria-controls="page-export" tabindex="-1">${this.ICONS.download}<span>导出</span></button>
                    <button type="button" class="tab-item" id="tab-settings" data-tab="settings" role="tab" aria-selected="false" aria-controls="page-settings" tabindex="-1">${this.ICONS.settings}<span>设置</span></button>
                </div>
                <div class="content-area">
                    <div id="page-summary" class="view-page active" role="tabpanel" aria-labelledby="tab-summary" aria-hidden="false">
                         <div class="form-group">
                             <div class="range-header">
                                 <span class="form-label" id="summary-range-label" style="margin:0;">楼层范围</span>
                                 <div class="range-buttons">
                                     <button type="button" class="btn-xs" id="range-all">全部</button>
                                     <button type="button" class="btn-xs" id="range-recent">最近<span id="recent-count">50</span></button>
                                 </div>
                             </div>
                             <div class="range-inputs" role="group" aria-labelledby="summary-range-label">
                                 <input type="number" id="inp-start" placeholder="起始" min="1" aria-label="总结起始楼层">
                                 <span class="range-separator">→</span>
                                 <input type="number" id="inp-end" placeholder="结束" min="1" aria-label="总结结束楼层">
                             </div>
                         </div>
                         <button type="button" class="btn" id="btn-summary">
                             <div class="spinner"></div>
                             <span class="btn-text" style="display:flex;align-items:center;gap:6px;">${this.ICONS.sparkles} 开始智能总结</span>
                         </button>
                         <button type="button" class="btn-xs" id="btn-refresh-summary-cache" style="margin-top:8px;width:100%;">重新获取楼层</button>
                         <div class="workspace-source-status" id="workspace-source-status-summary" role="status" hidden></div>
                         <div class="summary-result-wrapper">
                             <div id="summary-result" class="result-box empty">
                                 <div class="tip-text">
                                     <span class="tip-icon">${this.ICONS.robot}</span>
                                     点击「开始智能总结」后，<br>AI 将分析帖子内容并生成摘要<br><br>
                                     总结完成后可切换到<strong>「对话」</strong>继续追问
                                 </div>
                             </div>
                             <div class="scroll-buttons summary-bottom-area"><button type="button" class="scroll-btn" id="btn-summary-scroll-bottom" title="跳到最新内容" aria-label="跳到最新内容" aria-hidden="true" tabindex="-1">${this.ICONS.arrowDown}</button></div>
                         </div>
                         <div class="shortcut-hint">
                             <span class="kbd">Ctrl</span>+<span class="kbd">Shift</span>+<span class="kbd">S</span> 快速打开
                         </div>
                    </div>
                    <div id="page-chat" class="view-page" role="tabpanel" aria-labelledby="tab-chat" aria-hidden="true">
                        <div class="chat-container">
                             <div class="chat-toolbar">
                                 <div class="chat-toolbar-title">
                                     对话记录
                                     <span class="msg-count" id="msg-count">0</span>
                                 </div>
                                     <button type="button" class="btn-clear" id="btn-clear-chat" title="清空对话">
                                     ${this.ICONS.trash} 清空
                                 </button>
                             </div>
                             <div class="workspace-source-status" id="workspace-source-status-chat" role="status" hidden></div>
                             <div class="chat-messages-wrapper">
                                 <div class="scroll-buttons top-area"><button type="button" class="scroll-btn" id="btn-scroll-top" title="滚动到顶部" aria-label="滚动到顶部" aria-hidden="true" tabindex="-1">${this.ICONS.arrowUp}</button></div>
                                 <div class="chat-messages" id="chat-messages">
                                     <div id="chat-list" class="chat-list"></div>
                                     <div id="chat-empty" class="tip-text">
                                         <span class="tip-icon">${this.ICONS.chat}</span>
                                         请先在<strong>「总结」</strong>页面生成内容摘要，<br>然后即可基于上下文进行对话
                                     </div>
                                 </div>
                                 <div class="scroll-buttons bottom-area"><button type="button" class="scroll-btn" id="btn-scroll-bottom" title="跳到最新消息" aria-label="跳到最新消息" aria-hidden="true" tabindex="-1">${this.ICONS.arrowDown}</button></div>
                             </div>
                             <div class="chat-input-area">
                                 <div class="chat-input-row">
                                     <textarea id="chat-input" class="chat-input" placeholder="输入你的问题... (Enter 发送)" enterkeyhint="send" rows="1" aria-label="对话输入"></textarea>
                                     <button type="button" class="send-btn" id="btn-send" title="发送消息" aria-label="发送消息">${this.ICONS.send}</button>
                                 </div>
                             </div>
                        </div>
                    </div>
                    <!-- 导出页面 -->
                    <div id="page-export" class="view-page" role="tabpanel" aria-labelledby="tab-export" aria-hidden="true">
                        <div class="form-group">
                            <label class="form-label" for="export-type">导出类型</label>
                            <select id="export-type">
                                <option value="html">HTML 离线导出</option>
                                <option value="ai-text">AI 文本导出</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <div class="range-header">
                                <span class="form-label" id="export-range-label" style="margin:0;">导出范围</span>
                                <div class="range-buttons">
                                    <button type="button" class="btn-xs" id="export-range-all">全部</button>
                                    <button type="button" class="btn-xs" id="export-range-recent">最近<span id="export-recent-count">50</span></button>
                                </div>
                            </div>
                            <div class="range-inputs" role="group" aria-labelledby="export-range-label">
                                <input type="number" id="export-start" placeholder="起始" min="1" aria-label="导出起始楼层">
                                <span class="range-separator">→</span>
                                <input type="number" id="export-end" placeholder="结束" min="1" aria-label="导出结束楼层">
                            </div>
                        </div>
                        <div id="html-export-options" class="form-group">
                            <label class="form-label">HTML 导出选项</label>
                            <div class="setting-item-row" style="margin-bottom:12px;">
                                <div class="setting-info">
                                    <label class="setting-label">离线图片</label>
                                    <div class="setting-desc">将图片转为 base64 嵌入</div>
                                </div>
                                <label class="toggle-switch">
                                    <input type="checkbox" id="export-offline-images" aria-label="离线图片" checked>
                                    <span class="toggle-slider"></span>
                                </label>
                            </div>
                            <label class="setting-label" for="export-theme" style="margin-bottom:8px;">主题选择</label>
                            <select id="export-theme">
                                <option value="light">浅色主题</option>
                                <option value="dark">深色主题</option>
                            </select>
                        </div>
                        <div id="ai-text-options" class="form-group" style="display:none;">
                            <label class="form-label">AI 文本选项</label>
                            <div class="setting-item-row" style="margin-bottom:12px;">
                                <div class="setting-info">
                                    <label class="setting-label">包含头部信息</label>
                                    <div class="setting-desc">标题、作者、时间等</div>
                                </div>
                                <label class="toggle-switch">
                                    <input type="checkbox" id="export-ai-header" aria-label="包含头部信息" checked>
                                    <span class="toggle-slider"></span>
                                </label>
                            </div>
                            <div class="setting-item-row" style="margin-bottom:12px;">
                                <div class="setting-info">
                                    <label class="setting-label">包含图片链接</label>
                                    <div class="setting-desc">保留图片 URL</div>
                                </div>
                                <label class="toggle-switch">
                                    <input type="checkbox" id="export-ai-images" aria-label="包含图片链接" checked>
                                    <span class="toggle-slider"></span>
                                </label>
                            </div>
                            <div class="setting-item-row">
                                <div class="setting-info">
                                    <label class="setting-label">包含引用块</label>
                                    <div class="setting-desc">保留引用内容</div>
                                </div>
                                <label class="toggle-switch">
                                    <input type="checkbox" id="export-ai-quotes" aria-label="包含引用块" checked>
                                    <span class="toggle-slider"></span>
                                </label>
                            </div>
                        </div>
                        <button type="button" class="btn" id="btn-export">
                            <div class="spinner"></div>
                            <span class="btn-text" style="display:flex;align-items:center;gap:6px;">${this.ICONS.download} 开始导出</span>
                        </button>
                        <div id="export-status" class="result-box empty" style="margin-top:16px;min-height:100px;">
                            <div class="tip-text">
                                <span class="tip-icon">${this.ICONS.download}</span>
                                选择导出类型和范围后，<br>点击「开始导出」即可下载文件
                            </div>
                        </div>
                    </div>
                    <div id="page-settings" class="view-page settings-page" role="tabpanel" aria-labelledby="tab-settings" aria-hidden="true">
                         <div class="settings-group">
                             <div class="settings-group-title">API 配置</div>
                             <div class="setting-item"><label class="setting-label">当前配置</label><div class="api-profile-row"><div id="cfg-profile-list" class="api-profile-list" role="listbox" aria-label="选择 API 配置"></div><div class="api-profile-actions"><button type="button" class="btn-xs" id="btn-api-profile-add" title="新增配置">新增</button><button type="button" class="btn-xs" id="btn-api-profile-copy" title="复制当前配置">复制</button><button type="button" class="btn-xs" id="btn-api-profile-delete" title="删除当前配置">删除</button></div></div><div class="setting-desc api-profile-summary" id="api-profile-summary">点击配置即可切换，编辑后会自动保存。</div></div>
                             <div class="setting-item"><label class="setting-label" for="cfg-profile-name">配置名称</label><input type="text" id="cfg-profile-name" placeholder="例如：DeepSeek / OpenAI / 本地代理"></div>
                             <div class="setting-item"><label class="setting-label" for="cfg-url">API 地址</label><input type="text" id="cfg-url" placeholder="https://api.openai.com/v1/chat/completions"></div>
                             <div class="setting-item"><label class="setting-label" for="cfg-key">API Key</label><input type="password" id="cfg-key" placeholder="sk-..."></div>
                             <div class="setting-item"><label class="setting-label" for="cfg-model">模型名称</label><div class="model-input-row"><input type="text" id="cfg-model" placeholder="deepseek-chat"><button type="button" class="btn-xs model-fetch-btn" id="btn-fetch-models">获取模型列表</button></div><div class="setting-desc">可从接口返回列表中选择，也可以手动输入模型名称。</div></div>
                         </div>
                         <div class="settings-group">
                             <div class="settings-group-title">提示词配置</div>
                             <div class="setting-item"><label class="setting-label" for="cfg-prompt-sum">总结提示词</label><div class="setting-desc">用于生成帖子摘要时的系统指令</div><textarea id="cfg-prompt-sum" rows="4"></textarea></div>
                             <div class="setting-item"><label class="setting-label" for="cfg-prompt-chat">对话提示词</label><div class="setting-desc">用于后续追问时的系统指令</div><textarea id="cfg-prompt-chat" rows="4"></textarea></div>
                         </div>
                         <div class="settings-group">
                             <div class="settings-group-title">高级设置</div>
                             <div class="setting-item setting-item-row">
                                 <div class="setting-info"><label class="setting-label" for="cfg-recent-floors">快捷楼层数</label><div class="setting-desc">"最近N楼"按钮的楼层数量</div></div>
                                 <input type="number" id="cfg-recent-floors" min="10" max="500" style="width:80px; text-align:center; padding:6px 10px;">
                             </div>
                             <div class="setting-item setting-item-row">
                                 <div class="setting-info"><label class="setting-label">流式输出</label><div class="setting-desc">开启后内容会逐字显示，关闭则等待完成后一次性显示</div></div>
                                 <label class="toggle-switch"><input type="checkbox" id="cfg-stream" aria-label="流式输出" checked><span class="toggle-slider"></span></label>
                             </div>
                             <div class="setting-item setting-item-row">
                                 <div class="setting-info"><label class="setting-label">自动滚动</label><div class="setting-desc">生成内容时自动滚动到最新位置</div></div>
                                 <label class="toggle-switch"><input type="checkbox" id="cfg-autoscroll" aria-label="自动滚动" checked><span class="toggle-slider"></span></label>
                             </div>
                             <div class="setting-item setting-item-row floating-opacity-setting">
                                 <div class="setting-info"><label class="setting-label" for="cfg-floating-menu-opacity">悬浮菜单不透明度</label><div class="setting-desc" id="cfg-floating-menu-opacity-desc">仅影响选中文本和消息操作菜单；数值越低越透明</div></div>
                                 <div class="range-setting-control"><input type="range" id="cfg-floating-menu-opacity" min="80" max="100" step="1" value="88" aria-describedby="cfg-floating-menu-opacity-desc"><output id="cfg-floating-menu-opacity-output" for="cfg-floating-menu-opacity">88%</output></div>
                             </div>
                         </div>
                         <button type="button" class="btn" id="btn-save">${this.ICONS.check} 保存设置</button>
                    </div>
                </div>
                ${this.getMessageContextMenuHtml()}
                ${this.getSummarySelectionMenuHtml()}
            </div>`;
        this.uiManager.shadow.innerHTML += html;
    },

    getMessageContextMenuHtml: UIRegistry.get('style1').getMessageContextMenuHtml,
    getSummarySelectionMenuHtml: UIRegistry.get('style1').getSummarySelectionMenuHtml,
    bindEvents() {
        UIRegistry.get('style1').bindEvents.call(this);
        this.applyResponsiveLayout();
    },
    bindKeyboardShortcuts: UIRegistry.get('style1').bindKeyboardShortcuts,
    getActiveApiProfileIndex: UIRegistry.get('style1').getActiveApiProfileIndex,
    syncCurrentApiFormToActiveProfile: UIRegistry.get('style1').syncCurrentApiFormToActiveProfile,
    renderApiProfileList: UIRegistry.get('style1').renderApiProfileList,
    renderApiProfileSelect: UIRegistry.get('style1').renderApiProfileSelect,
    normalizeFloatingMenuOpacity: UIRegistry.get('style1').normalizeFloatingMenuOpacity,
    applyFloatingMenuOpacity: UIRegistry.get('style1').applyFloatingMenuOpacity,
    fillApiFormFromProfile: UIRegistry.get('style1').fillApiFormFromProfile,
    refreshApiProfileSummary: UIRegistry.get('style1').refreshApiProfileSummary,
    updateApiProfileActionState: UIRegistry.get('style1').updateApiProfileActionState,
    loadApiProfileStateToUi: UIRegistry.get('style1').loadApiProfileStateToUi,
    persistApiProfileState: UIRegistry.get('style1').persistApiProfileState,
    queueApiProfilePersist: UIRegistry.get('style1').queueApiProfilePersist,
    flushApiProfilePersist: UIRegistry.get('style1').flushApiProfilePersist,
    handleApiProfileSelect: UIRegistry.get('style1').handleApiProfileSelect,
    handleApiProfileNameInput: UIRegistry.get('style1').handleApiProfileNameInput,
    handleApiProfileFieldInput: UIRegistry.get('style1').handleApiProfileFieldInput,
    addApiProfile: UIRegistry.get('style1').addApiProfile,
    copyApiProfile: UIRegistry.get('style1').copyApiProfile,
    deleteApiProfile: UIRegistry.get('style1').deleteApiProfile,
    restoreState() {
        const Q = this.uiManager.Q.bind(this.uiManager);
        this.uiManager.host.style.setProperty('--sidebar-width', `${this.sidebarWidth}px`);
        const btn = Q('#toggle-btn');
        btn.style.top = this.btnPos.top;
        this.applySideState();
        if (this.isDarkTheme) {
            this.uiManager.host.classList.add('dark-theme');
            Q('#btn-theme').innerHTML = this.ICONS.sun;
        } else {
            Q('#btn-theme').innerHTML = this.ICONS.moon;
        }
        Q('#btn-theme').setAttribute('aria-label', this.isDarkTheme ? '切换至浅色主题' : '切换至深色主题');

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
        this.syncSidebarAccessibility();
        this.applyResponsiveLayout();
    },
    isNarrowViewport() {
        const visualWidth = Number(window.visualViewport?.width) || window.innerWidth;
        return Math.min(window.innerWidth, visualWidth) <= 700;
    },
    getEffectiveSidebarWidth() {
        const savedWidth = Number(this.sidebarWidth) || 420;
        const viewportWidth = Math.min(window.innerWidth, Number(window.visualViewport?.width) || window.innerWidth);
        if (this.isNarrowViewport()) return viewportWidth;
        const viewportLimit = Math.max(360, viewportWidth - 48);
        return Math.min(700, viewportLimit, Math.max(360, savedWidth));
    },
    applyResponsiveLayout() {
        const narrow = this.isNarrowViewport();
        this.uiManager.host.classList.toggle('narrow-viewport', narrow);
        if (!narrow) {
            this.uiManager.host.style.setProperty('--sidebar-width', `${this.getEffectiveSidebarWidth()}px`);
        }
        this.squeezeBody(this.isOpen);
        this.updateButtonPosition(false);
        this.syncSidebarAccessibility();
    },
    syncSidebarAccessibility() {
        const Q = this.uiManager.Q.bind(this.uiManager);
        const button = Q('#toggle-btn');
        const sidebar = Q('#sidebar');
        if (button) {
            button.setAttribute('aria-expanded', `${this.isOpen}`);
            button.setAttribute('aria-label', this.isOpen ? '关闭智能总结侧栏' : '打开智能总结侧栏');
        }
        if (sidebar) {
            sidebar.setAttribute('aria-hidden', `${!this.isOpen}`);
            sidebar.toggleAttribute('inert', !this.isOpen);
        }
    },
    syncTabAccessibility(tabName) {
        const Q = this.uiManager.Q.bind(this.uiManager);
        const tabBar = Q('.tab-bar');
        const contentArea = Q('.content-area');
        if (!tabBar || !contentArea) return;
        tabBar.querySelectorAll('[role="tab"]').forEach((tab) => {
            const active = tab.dataset.tab === tabName;
            tab.setAttribute('aria-selected', `${active}`);
            tab.tabIndex = active ? 0 : -1;
        });
        contentArea.querySelectorAll('[role="tabpanel"]').forEach((page) => {
            const active = page.id === `page-${tabName}`;
            page.setAttribute('aria-hidden', `${!active}`);
            page.toggleAttribute('hidden', !active);
        });
    },
    applySideState() {
        const Q = this.uiManager.Q.bind(this.uiManager);
        const btn = Q('#toggle-btn');
        const sidebar = Q('#sidebar');
        const resizer = Q('#resizer');
        btn.style.left = ''; btn.style.right = '';

        if (this.side === 'left') {
            sidebar.className = 'sidebar-panel panel-left' + (this.isOpen ? ' open' : '');
            resizer.className = 'resize-handle handle-left';
            btn.className = 'btn-snap-left' + (this.isOpen ? ' arrow-flip' : '');
            btn.innerHTML = this.ICONS.arrowRight;
        } else {
            sidebar.className = 'sidebar-panel panel-right' + (this.isOpen ? ' open' : '');
            resizer.className = 'resize-handle handle-right';
            btn.className = 'btn-snap-right' + (this.isOpen ? ' arrow-flip' : '');
            btn.innerHTML = this.ICONS.arrowLeft;
        }
        this.updateButtonPosition();
        this.syncSidebarAccessibility();
    },
    updateButtonPosition(useTransition = true) {
        const button = this.uiManager.Q('#toggle-btn');
        if (!button) return;
        if (!useTransition) button.style.transition = 'none';
        const offset = this.isNarrowViewport() ? 0 : (this.isOpen ? this.getEffectiveSidebarWidth() : 0);
        if (this.side === 'left') {
            button.style.right = 'auto';
            button.style.left = `${offset}px`;
        } else {
            button.style.left = 'auto';
            button.style.right = `${offset}px`;
        }
        if (!useTransition) {
            button.offsetHeight;
            this.requestManagedFrame(() => { button.style.transition = ''; });
        }
    },
    toggleSidebar() {
        UIRegistry.get('style1').toggleSidebar.call(this);
        this.syncSidebarAccessibility();
    },
    squeezeBody(active) {
        const body = document.body;
        const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
        body.style.transition = reducedMotion ? 'none' : 'margin 0.22s cubic-bezier(0.22, 1, 0.36, 1)';
        if (!active || this.isNarrowViewport()) {
            body.style.marginLeft = '';
            body.style.marginRight = '';
            return;
        }
        const width = this.getEffectiveSidebarWidth();
        this.uiManager.host.style.setProperty('--sidebar-width', `${width}px`);
        if (this.side === 'left') {
            body.style.marginLeft = `${width}px`;
            body.style.marginRight = '';
        } else {
            body.style.marginRight = `${width}px`;
            body.style.marginLeft = '';
        }
    },
    switchTab(tabName) {
        UIRegistry.get('style1').switchTab.call(this, tabName);
        this.syncTabAccessibility(tabName);
    },
    toggleTheme() {
        const Q = this.uiManager.Q.bind(this.uiManager);
        this.isDarkTheme = !this.isDarkTheme;
        GM_setValue(this.getStyleStorageKey('isDarkTheme'), this.isDarkTheme);
        this.uiManager.host.classList.toggle('dark-theme', this.isDarkTheme);
        Q('#btn-theme').innerHTML = this.isDarkTheme ? this.ICONS.sun : this.ICONS.moon;
        Q('#btn-theme').setAttribute('aria-label', this.isDarkTheme ? '切换至浅色主题' : '切换至深色主题');
    },
    setLoading: UIRegistry.get('style1').setLoading,
    isAiAbortButton: UIRegistry.get('style1').isAiAbortButton,
    setAiAbortButtonState(btnId, isActive) {
        UIRegistry.get('style1').setAiAbortButtonState.call(this, btnId, isActive);
        const button = this.uiManager.Q(btnId);
        if (!button) return;
        if (btnId === '#btn-send') button.setAttribute('aria-label', isActive ? '停止生成' : '发送消息');
    },
    getAiAbortButtonSelector: UIRegistry.get('style1').getAiAbortButtonSelector,
    isCurrentLifecycleEpoch: UIRegistry.get('style1').isCurrentLifecycleEpoch,
    beginSummaryRequestLifecycle: UIRegistry.get('style1').beginSummaryRequestLifecycle,
    attachSummaryAbortController: UIRegistry.get('style1').attachSummaryAbortController,
    isCurrentSummaryRequest: UIRegistry.get('style1').isCurrentSummaryRequest,
    abortActiveSummaryRequest: UIRegistry.get('style1').abortActiveSummaryRequest,
    finalizeSummaryRequest: UIRegistry.get('style1').finalizeSummaryRequest,
    hasWorkspaceContent: UIRegistry.get('style1').hasWorkspaceContent,
    getWorkspaceReplacementContext: UIRegistry.get('style1').getWorkspaceReplacementContext,
    setWorkspaceTopicId: UIRegistry.get('style1').setWorkspaceTopicId,
    updateWorkspaceSourceStatus: UIRegistry.get('style1').updateWorkspaceSourceStatus,
    requestWorkspaceReplacementConfirm: UIRegistry.get('style1').requestWorkspaceReplacementConfirm,
    closeWorkspaceReplacementConfirm: UIRegistry.get('style1').closeWorkspaceReplacementConfirm,
    onTopicRouteChange: UIRegistry.get('style1').onTopicRouteChange,
    startAiAbortController: UIRegistry.get('style1').startAiAbortController,
    clearAiAbortController: UIRegistry.get('style1').clearAiAbortController,
    stopCurrentAiGeneration: UIRegistry.get('style1').stopCurrentAiGeneration,
    handleSummaryButtonClick: UIRegistry.get('style1').handleSummaryButtonClick,
    handleSendButtonClick: UIRegistry.get('style1').handleSendButtonClick,
    updateChatInputMode: UIRegistry.get('style1').updateChatInputMode,
    createEmptyChatSession: UIRegistry.get('style1').createEmptyChatSession,
    beginChatRequestLifecycle: UIRegistry.get('style1').beginChatRequestLifecycle,
    isCurrentChatRequest: UIRegistry.get('style1').isCurrentChatRequest,
    setChatRequestPhase: UIRegistry.get('style1').setChatRequestPhase,
    abortActiveChatRequest: UIRegistry.get('style1').abortActiveChatRequest,
    finalizeChatRequest: UIRegistry.get('style1').finalizeChatRequest,
    createMessageId: UIRegistry.get('style1').createMessageId,
    createVisibleMessage: UIRegistry.get('style1').createVisibleMessage,
    hasChatContext: UIRegistry.get('style1').hasChatContext,
    setChatContext: UIRegistry.get('style1').setChatContext,
    clearChatContext: UIRegistry.get('style1').clearChatContext,
    syncLegacyChatHistory: UIRegistry.get('style1').syncLegacyChatHistory,
    findVisibleMessage: UIRegistry.get('style1').findVisibleMessage,
    findVisibleMessageIndex: UIRegistry.get('style1').findVisibleMessageIndex,
    getBubbleElement: UIRegistry.get('style1').getBubbleElement,
    getClosestElement: UIRegistry.get('style1').getClosestElement,
    getVisibleMessagesForApi: UIRegistry.get('style1').getVisibleMessagesForApi,
    buildChatApiMessages: UIRegistry.get('style1').buildChatApiMessages,
    appendVisibleMessage: UIRegistry.get('style1').appendVisibleMessage,
    removeVisibleMessagesFrom: UIRegistry.get('style1').removeVisibleMessagesFrom,
    setVisibleMessage: UIRegistry.get('style1').setVisibleMessage,
    renderChatMessages: UIRegistry.get('style1').renderChatMessages,
    bindSettingsStorageSync: UIRegistry.get('style1').bindSettingsStorageSync,
    markSettingsDirty: UIRegistry.get('style1').markSettingsDirty,
    clearSettingsDirty: UIRegistry.get('style1').clearSettingsDirty,
    queueSettingsStorageSync: UIRegistry.get('style1').queueSettingsStorageSync,
    flushSettingsStorageSync: UIRegistry.get('style1').flushSettingsStorageSync,
    isSettingsStorageSyncDirty: UIRegistry.get('style1').isSettingsStorageSyncDirty,
    applySettingsStorageSnapshot: UIRegistry.get('style1').applySettingsStorageSnapshot,
    applyApiProfileStorageSnapshot: UIRegistry.get('style1').applyApiProfileStorageSnapshot,
    applyPromptStorageSnapshot: UIRegistry.get('style1').applyPromptStorageSnapshot,
    syncChatPromptMemory: UIRegistry.get('style1').syncChatPromptMemory,
    applyRecentFloorsStorageSnapshot: UIRegistry.get('style1').applyRecentFloorsStorageSnapshot,
    applyStreamAndAutoscrollStorageSnapshot: UIRegistry.get('style1').applyStreamAndAutoscrollStorageSnapshot,
    applyFloatingMenuOpacityStorageSnapshot: UIRegistry.get('style1').applyFloatingMenuOpacityStorageSnapshot,
    getAssistantForUser: UIRegistry.get('style1').getAssistantForUser,
    getUserForAssistant: UIRegistry.get('style1').getUserForAssistant,
    removeVisibleMessagesAfter: UIRegistry.get('style1').removeVisibleMessagesAfter,
    requestAssistantForUser: UIRegistry.get('style1').requestAssistantForUser,
    getMessageCopyText: UIRegistry.get('style1').getMessageCopyText,
    renderChatErrorContent: UIRegistry.get('style1').renderChatErrorContent,
    renderBubbleContent: UIRegistry.get('style1').renderBubbleContent,
    ensureMessageMenuTrigger: UIRegistry.get('style1').ensureMessageMenuTrigger,
    getMessageMenuActions: UIRegistry.get('style1').getMessageMenuActions,
    getMessageMenuAction: UIRegistry.get('style1').getMessageMenuAction,
    renderMessageContextMenuActions: UIRegistry.get('style1').renderMessageContextMenuActions,
    bindMessageContextMenu: UIRegistry.get('style1').bindMessageContextMenu,
    bindSummarySelectionMenu: UIRegistry.get('style1').bindSummarySelectionMenu,
    getCurrentSelection: UIRegistry.get('style1').getCurrentSelection,
    clearCurrentSelection: UIRegistry.get('style1').clearCurrentSelection,
    getContentSelectionState: UIRegistry.get('style1').getContentSelectionState,
    getSummarySelectionState: UIRegistry.get('style1').getSummarySelectionState,
    getTrustedDirectAnswer: UIRegistry.get('style1').getTrustedDirectAnswer,
    resolveContentSelectionSource: UIRegistry.get('style1').resolveContentSelectionSource,
    isSummarySelectionRangeAllowed: UIRegistry.get('style1').isSummarySelectionRangeAllowed,
    getSelectionAnchorRect: UIRegistry.get('style1').getSelectionAnchorRect,
    openSummarySelectionMenu: UIRegistry.get('style1').openSummarySelectionMenu,
    positionSummarySelectionMenu: UIRegistry.get('style1').positionSummarySelectionMenu,
    closeSummarySelectionMenu: UIRegistry.get('style1').closeSummarySelectionMenu,
    openMessageContextMenu: UIRegistry.get('style1').openMessageContextMenu,
    positionMessageContextMenu: UIRegistry.get('style1').positionMessageContextMenu,
    closeMessageContextMenu: UIRegistry.get('style1').closeMessageContextMenu,
    handleMessageMenuAction: UIRegistry.get('style1').handleMessageMenuAction,
    handleSummarySelectionAction: UIRegistry.get('style1').handleSummarySelectionAction,
    fillChatInputWithSelectionPrompt: UIRegistry.get('style1').fillChatInputWithSelectionPrompt,
    copyMessage: UIRegistry.get('style1').copyMessage,
    startEditMessage: UIRegistry.get('style1').startEditMessage,
    confirmEditMessage: UIRegistry.get('style1').confirmEditMessage,
    cancelEditMessage: UIRegistry.get('style1').cancelEditMessage,
    getRegenerateUserMessage: UIRegistry.get('style1').getRegenerateUserMessage,
    regenerateMessage: UIRegistry.get('style1').regenerateMessage,
    stopMessageUpdate: UIRegistry.get('style1').stopMessageUpdate,
    deleteMessage: UIRegistry.get('style1').deleteMessage,
    refreshSummaryCache: UIRegistry.get('style1').refreshSummaryCache,
    doSummary: UIRegistry.get('style1').doSummary,
    doChat: UIRegistry.get('style1').doChat,
    getRangeUpperBound: UIRegistry.get('style1').getRangeUpperBound,
    initRangeInputs: UIRegistry.get('style1').initRangeInputs,
    setRangeButtonsLoading: UIRegistry.get('style1').setRangeButtonsLoading,
    markSummaryRangeManual: UIRegistry.get('style1').markSummaryRangeManual,
    markExportRangeManual: UIRegistry.get('style1').markExportRangeManual,
    getRangeSelectors: UIRegistry.get('style1').getRangeSelectors,
    applyOptimisticRangeFromCache: UIRegistry.get('style1').applyOptimisticRangeFromCache,
    restoreOptimisticRange: UIRegistry.get('style1').restoreOptimisticRange,
    waitForRangeConfirmation: UIRegistry.get('style1').waitForRangeConfirmation,
    setRange: UIRegistry.get('style1').setRange,
    getReasoningPanelViewState: UIRegistry.get('style1').getReasoningPanelViewState,
    updateResultBox: UIRegistry.get('style1').updateResultBox,
    updateBubble: UIRegistry.get('style1').updateBubble,
    addBubble: UIRegistry.get('style1').addBubble,
    renderWithThinking: UIRegistry.get('style1').renderWithThinking,
    showToast: UIRegistry.get('style1').showToast,
    copyToClipboard: UIRegistry.get('style1').copyToClipboard,
    openModelPicker: UIRegistry.get('style1').openModelPicker,
    closeModelPicker: UIRegistry.get('style1').closeModelPicker,
    setModelListLoading: UIRegistry.get('style1').setModelListLoading,
    cancelModelListRequest: UIRegistry.get('style1').cancelModelListRequest,
    setModelPickerStatus: UIRegistry.get('style1').setModelPickerStatus,
    renderModelOptions: UIRegistry.get('style1').renderModelOptions,
    loadModelList: UIRegistry.get('style1').loadModelList,
    updateScrollButtons: UIRegistry.get('style1').updateScrollButtons,
    setScrollButtonState: UIRegistry.get('style1').setScrollButtonState,
    isNearScrollBottom: UIRegistry.get('style1').isNearScrollBottom,
    updateSummaryScrollButton: UIRegistry.get('style1').updateSummaryScrollButton,
    scrollToTop: UIRegistry.get('style1').scrollToTop,
    scrollToBottom: UIRegistry.get('style1').scrollToBottom,
    forceScrollToBottom: UIRegistry.get('style1').forceScrollToBottom,
    scrollSummaryToBottom: UIRegistry.get('style1').scrollSummaryToBottom,
    forceScrollSummaryToBottom: UIRegistry.get('style1').forceScrollSummaryToBottom,
    clearChat: UIRegistry.get('style1').clearChat,
    updateMessageCount: UIRegistry.get('style1').updateMessageCount,
    beginExportRequest: UIRegistry.get('style1').beginExportRequest,
    isCurrentExportRequest: UIRegistry.get('style1').isCurrentExportRequest,
    abortActiveExportRequest: UIRegistry.get('style1').abortActiveExportRequest,
    finalizeExportRequest: UIRegistry.get('style1').finalizeExportRequest,
    setExportRange: UIRegistry.get('style1').setExportRange,
    doExport: UIRegistry.get('style1').doExport,
    exportAsHtml: UIRegistry.get('style1').exportAsHtml,
    exportAsAiText: UIRegistry.get('style1').exportAsAiText
});
