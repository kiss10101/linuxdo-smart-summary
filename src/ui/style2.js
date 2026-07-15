import { CONFIG } from '../config.js';
import { Core } from '../core/index.js';
import { UIRegistry } from './registry.js';

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
        check: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>`
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

    destroy: UIRegistry.get('style1').destroy,
    getStyleStorageKey: UIRegistry.get('style1').getStyleStorageKey,
    addManagedListener: UIRegistry.get('style1').addManagedListener,
    addManagedValueChangeListener: UIRegistry.get('style1').addManagedValueChangeListener,
    setManagedTimeout: UIRegistry.get('style1').setManagedTimeout,
    clearManagedTimeout: UIRegistry.get('style1').clearManagedTimeout,
    requestManagedFrame: UIRegistry.get('style1').requestManagedFrame,
    cancelManagedFrame: UIRegistry.get('style1').cancelManagedFrame,
    createFrameThrottledHandler: UIRegistry.get('style1').createFrameThrottledHandler,
    scheduleSummaryRender: UIRegistry.get('style1').scheduleSummaryRender,
    cancelSummaryRender: UIRegistry.get('style1').cancelSummaryRender,
    scheduleBubbleRender: UIRegistry.get('style1').scheduleBubbleRender,
    cancelBubbleRender: UIRegistry.get('style1').cancelBubbleRender,
    resetGlobalUiState: UIRegistry.get('style1').resetGlobalUiState,

    getStyles() {
        return `
        :host { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; --brand-gold: #E3A043; --brand-gold-hover: #d48f35; --primary: #222222; --primary-hover: #000000; --primary-light: #f0f0f0; --success: #2d9d78; --success-light: #d1fae5; --danger: #d93025; --danger-light: #fef2f2; --warning: #f2c04d; --bg-base: #F9FAFB; --bg-card: #FFFFFF; --bg-glass: rgba(255, 255, 255, 0.95); --bg-glass-dark: rgba(255, 255, 255, 0.98); --bg-hover: #F2F2F2; --bg-active: #E5E7EB; --bg-setting: #F9FAFB; --bg-input: #FFFFFF; --border-light: #E5E7EB; --border-medium: #D1D5DB; --shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05); --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.08), 0 2px 4px -1px rgba(0, 0, 0, 0.04); --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.08), 0 4px 6px -2px rgba(0, 0, 0, 0.04); --shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04); --shadow-glow: 0 0 0 1px rgba(0,0,0,0.05); --text-main: #111827; --text-sec: #4B5563; --text-muted: #9CA3AF; --text-inverse: #FFFFFF; --sidebar-width: 420px; --btn-size: 42px; --radius-sm: 4px; --radius-md: 6px; --radius-lg: 8px; --radius-xl: 12px; --radius-full: 9999px; --transition-fast: 0.15s ease; --transition-normal: 0.25s ease; --transition-slow: 0.35s ease; }
        :host(.dark-theme) { --primary: #E3A043; --primary-hover: #ffb85c; --primary-light: #2D2D2D; --bg-base: #111111; --bg-card: #1E1E1E; --bg-glass: rgba(30, 30, 30, 0.95); --bg-glass-dark: rgba(20, 20, 20, 0.98); --bg-hover: #2D2D2D; --bg-active: #374151; --bg-setting: #111111; --bg-input: #2D2D2D; --border-light: #374151; --border-medium: #4B5563; --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.5); --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.5); --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.5); --shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.5); --text-main: #F3F4F6; --text-sec: #D1D5DB; --text-muted: #6B7280; --text-inverse: #111827; }
        * { box-sizing: border-box; }
        .sidebar-panel { position: fixed; top: 0; bottom: 0; width: var(--sidebar-width); background: var(--bg-card); box-shadow: var(--shadow-xl); z-index: 9998; display: flex; flex-direction: column; transition: transform var(--transition-slow); border: 1px solid var(--border-light); }
        .panel-left { left: 0; border-left: none; transform: translateX(-100%); }
        .panel-left.open { transform: translateX(0); }
        .panel-right { right: 0; border-right: none; transform: translateX(100%); }
        .panel-right.open { transform: translateX(0); }
        #toggle-btn { position: fixed; width: var(--btn-size); height: var(--btn-size); background: var(--bg-card); color: var(--text-sec); box-shadow: var(--shadow-md); z-index: 9999; cursor: grab; display: flex; align-items: center; justify-content: center; user-select: none; transition: all var(--transition-normal); border: 1px solid var(--border-light); outline: none; }
        #toggle-btn:hover { background: var(--bg-hover); color: var(--brand-gold); transform: scale(1.05); }
        #toggle-btn:active { cursor: grabbing; transform: scale(0.96); }
        #toggle-btn svg { width: 20px; height: 20px; fill: none; stroke: currentColor; }
        .btn-snap-left { border-radius: 0 var(--radius-md) var(--radius-md) 0; border-left: none; }
        .btn-snap-right { border-radius: var(--radius-md) 0 0 var(--radius-md); border-right: none; }
        .btn-floating { border-radius: 50%; box-shadow: var(--shadow-lg); }
        .resize-handle { position: absolute; top: 0; bottom: 0; width: 4px; cursor: col-resize; z-index: 10001; background: transparent; transition: background var(--transition-fast); }
        .resize-handle:hover { background: var(--brand-gold); }
        .handle-left { right: -2px; } .handle-right { left: -2px; }
        .header { padding: 16px 20px; border-bottom: 1px solid var(--border-light); display: flex; justify-content: space-between; align-items: center; background: var(--bg-card); flex-shrink: 0; }
        .header-title { font-size: 16px; font-weight: 600; color: var(--text-main); display: flex; align-items: center; gap: 10px; }
        .header-title-icon { color: var(--brand-gold); display: flex; align-items: center; justify-content: center; }
        .header-title-icon svg { width: 22px; height: 22px; }
        .header-actions { display: flex; gap: 4px; }
        .icon-btn { background: transparent; border: none; cursor: pointer; padding: 8px; border-radius: var(--radius-sm); color: var(--text-muted); transition: all var(--transition-fast); display: flex; align-items: center; justify-content: center; position: relative; }
        .icon-btn svg { width: 18px; height: 18px; }
        .icon-btn:hover { background: var(--bg-hover); color: var(--text-main); }
        .icon-btn[data-tooltip]::after { content: attr(data-tooltip); position: absolute; bottom: -30px; left: 50%; transform: translateX(-50%); background: #333; color: white; padding: 4px 8px; border-radius: 4px; font-size: 11px; white-space: nowrap; opacity: 0; pointer-events: none; transition: opacity var(--transition-fast); z-index: 100; }
        .icon-btn[data-tooltip]:hover::after { opacity: 1; }
        .tab-bar { display: flex; padding: 0 16px; gap: 24px; border-bottom: 1px solid var(--border-light); background: var(--bg-card); flex-shrink: 0; }
        .tab-item { padding: 14px 4px; text-align: center; font-size: 14px; font-weight: 500; color: var(--text-sec); cursor: pointer; border-bottom: 2px solid transparent; transition: all var(--transition-fast); display: flex; align-items: center; gap: 6px; }
        .tab-item svg { width: 16px; height: 16px; opacity: 0.8; }
        .tab-item:hover { color: var(--text-main); }
        .tab-item.active { color: var(--brand-gold); border-bottom-color: var(--brand-gold); font-weight: 600; }
        .tab-item.active svg { opacity: 1; stroke-width: 2.5; }
        .content-area { flex: 1; min-height: 0; overflow-y: auto; position: relative; background: var(--bg-base); }
        .content-area.chat-active { overflow: hidden; }
        .view-page { padding: 20px; display: none; animation: fadeIn 0.2s ease; }
        .view-page.active { display: block; }
        #page-chat.view-page.active { display: flex; height: 100%; min-height: 0; box-sizing: border-box; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: translateY(0); } }
        .form-group { margin-bottom: 20px; }
        .form-label { display: block; font-size: 12px; color: var(--text-sec); margin-bottom: 8px; font-weight: 600; }
        input, textarea, select { width: 100%; padding: 10px 12px; border: 1px solid var(--border-medium); border-radius: var(--radius-md); font-size: 14px; font-family: inherit; background: var(--bg-input); color: var(--text-main); box-sizing: border-box; transition: all var(--transition-fast); }
        input:focus, textarea:focus { outline: none; border-color: var(--brand-gold); box-shadow: 0 0 0 2px rgba(227, 160, 67, 0.15); }
        input::placeholder, textarea::placeholder { color: var(--text-muted); }
        textarea { resize: vertical; min-height: 100px; line-height: 1.6; }
        .btn { width: 100%; padding: 10px 16px; border: none; border-radius: var(--radius-md); background: var(--primary); color: var(--text-inverse); font-weight: 600; font-size: 14px; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px; transition: all var(--transition-normal); box-shadow: var(--shadow-sm); }
        .btn svg { width: 16px; height: 16px; }
        .btn:hover { background: var(--primary-hover); transform: translateY(-1px); box-shadow: var(--shadow-md); }
        .btn:active { transform: translateY(0); }
        .btn:disabled { opacity: 0.6; cursor: not-allowed; transform: none; box-shadow: none; }
        :host(.dark-theme) .btn { color: #111; }
        .btn-xs { padding: 4px 10px; font-size: 12px; background: var(--bg-card); color: var(--text-sec); border-radius: var(--radius-sm); border: 1px solid var(--border-medium); cursor: pointer; white-space: nowrap; transition: all var(--transition-fast); }
        .btn-xs:hover { color: var(--brand-gold); border-color: var(--brand-gold); }
        .btn-xs:disabled, .btn-xs.loading { opacity: 0.62; cursor: wait; transform: none; }
        .summary-result-wrapper { position: relative; }
        .result-box { margin-top: 16px; padding: 16px 16px 16px 22px; background: var(--bg-card); border: 1px solid var(--border-light); border-radius: var(--radius-lg); font-size: 14px; line-height: 1.7; color: var(--text-main); min-height: 150px; max-height: calc(100vh - 350px); overflow-y: auto; overflow-x: hidden; word-break: break-word; overflow-wrap: break-word; white-space: normal; width: 100%; box-sizing: border-box; position: relative; direction: rtl; text-align: left; }
        .result-box > * { direction: ltr; }
        .result-box.empty { display: flex; align-items: center; justify-content: center; background: var(--bg-base); }
        .summary-coverage { margin-top: 16px; padding: 12px 14px; border: 1px solid var(--border-light); border-radius: var(--radius-md); background: var(--bg-hover); color: var(--text-sec); font-size: 12px; line-height: 1.6; }
        .summary-coverage summary { cursor: pointer; color: var(--text-main); font-weight: 600; }
        .summary-coverage dl { display: grid; grid-template-columns: max-content 1fr; gap: 6px 10px; margin: 10px 0 0; }
        .summary-coverage dt { color: var(--text-sec); font-weight: 600; }
        .summary-coverage dd { margin: 0; color: var(--text-main); overflow-wrap: anywhere; }
        .summary-coverage .coverage-warning { color: var(--danger); }
        .ai-source-meta { margin-top: 10px; color: var(--text-sec); font-size: 12px; line-height: 1.5; overflow-wrap: anywhere; }
        .bubble .ai-source-meta { margin-top: 10px; padding-top: 8px; border-top: 1px solid var(--border-light); }
        .result-actions { position: absolute; top: 10px; right: 10px; opacity: 0; transition: opacity var(--transition-fast); }
        .result-box:hover .result-actions { opacity: 1; }
        .result-action-btn { padding: 4px 10px; font-size: 12px; background: var(--bg-card); color: var(--text-sec); border: 1px solid var(--border-light); border-radius: var(--radius-sm); cursor: pointer; display: flex; align-items: center; gap: 4px; box-shadow: var(--shadow-sm); }
        .result-action-btn:hover { border-color: var(--brand-gold); color: var(--brand-gold); }
        .result-action-btn.copied { border-color: var(--success); color: var(--success); }
        .result-action-btn svg { width: 12px; height: 12px; }
        .result-box h1, .result-box h2, .result-box h3 { margin: 16px 0 8px; font-weight: 600; color: var(--text-main); }
        .result-box h1 { font-size: 1.4em; }
        .result-box h2 { font-size: 1.2em; border-bottom: 1px solid var(--border-light); padding-bottom: 6px; }
        .result-box h3 { font-size: 1.1em; color: var(--text-sec); }
        .result-box p { margin-bottom: 10px; }
        .result-box ul, .result-box ol { padding-left: 20px; margin: 10px 0; }
        .result-box li { margin-bottom: 6px; }
        .result-box li::marker { color: var(--brand-gold); }
        .result-box code, .bubble-ai code, .thinking-content code, .result-box pre code, .bubble-ai pre code, .thinking-content pre code { font-family: 'JetBrains Mono', 'Fira Code', ui-monospace, SFMono-Regular, Menlo, Consolas, 'Liberation Mono', monospace !important; font-size: 13px !important; line-height: 1.5 !important; font-variant-ligatures: none; letter-spacing: 0; }
        .result-box code, .bubble-ai code, .thinking-content code:not(pre code) { background: var(--bg-hover); padding: 2px 6px; border-radius: 4px; color: var(--text-main); border: 1px solid var(--border-medium); word-break: break-all; overflow-wrap: break-word; max-width: 100%; display: inline-block; margin: 0 2px; }
        :host(.dark-theme) .result-box code, :host(.dark-theme) .bubble-ai code, :host(.dark-theme) .thinking-content code:not(pre code) { background: rgba(255,255,255,0.1); color: #e0e0e0; border-color: rgba(255,255,255,0.2); }
        .result-box pre, .bubble-ai pre, .thinking-content-inner pre { background: var(--bg-card); padding: 16px !important; margin: 12px 0 !important; border-radius: var(--radius-md); border: 1px solid var(--border-medium); overflow-x: auto; overflow-y: auto; color: var(--text-main); white-space: pre-wrap !important; word-break: break-all; word-wrap: break-word; tab-size: 4; max-width: 100%; box-sizing: border-box; font-size: 13px !important; line-height: 1.5 !important; }
        :host(.dark-theme) .result-box pre, :host(.dark-theme) .bubble-ai pre, :host(.dark-theme) .thinking-content-inner pre { background: #1e1e1e; color: #d4d4d4; border-color: #404040; }
        .result-box pre::-webkit-scrollbar, .bubble-ai pre::-webkit-scrollbar, .thinking-content-inner pre::-webkit-scrollbar { width: 8px; height: 8px; }
        .result-box pre::-webkit-scrollbar-track, .bubble-ai pre::-webkit-scrollbar-track, .thinking-content-inner pre::-webkit-scrollbar-track { background: rgba(0,0,0,0.1); border-radius: 4px; }
        .result-box pre::-webkit-scrollbar-thumb, .bubble-ai pre::-webkit-scrollbar-thumb, .thinking-content-inner pre::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.3); border-radius: 4px; }
        :host(.dark-theme) .result-box pre::-webkit-scrollbar-thumb, :host(.dark-theme) .bubble-ai pre::-webkit-scrollbar-thumb, :host(.dark-theme) .thinking-content-inner pre::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.3); }
        .result-box pre code { background: none; color: inherit; padding: 0; border: none; }
        .result-box blockquote { border-left: 3px solid var(--brand-gold); margin: 12px 0; padding: 6px 16px; color: var(--text-sec); background: var(--bg-hover); font-style: italic; }
        .result-box a { color: var(--brand-gold); text-decoration: none; border-bottom: 1px solid transparent; }
        .result-box a:hover { border-bottom-color: var(--brand-gold); }
        .result-box strong { color: var(--text-main); font-weight: 600; }
        .chat-container { display: flex; flex: 1; flex-direction: column; width: 100%; height: 100%; min-height: 0; position: relative; }
        .chat-toolbar { display: flex; justify-content: space-between; align-items: center; padding-bottom: 12px; border-bottom: 1px solid var(--border-light); margin-bottom: 12px; }
        .chat-toolbar-title { font-size: 13px; color: var(--text-sec); font-weight: 600; display: flex; align-items: center; gap: 8px; }
        .msg-count { background: var(--bg-active); color: var(--text-sec); font-size: 11px; padding: 2px 8px; border-radius: 10px; font-weight: normal; }
        .btn-clear { padding: 6px 12px; font-size: 12px; background: transparent; color: var(--danger); border-radius: var(--radius-sm); border: none; cursor: pointer; display: flex; align-items: center; gap: 5px; }
        .btn-clear:hover { background: var(--danger-light); }
        .btn-clear svg { width: 14px; height: 14px; }
        .chat-messages-wrapper { flex: 1; min-height: 0; position: relative; overflow: hidden; }
        .chat-messages { height: 100%; min-height: 0; overflow-y: auto; padding: 10px 0 10px 8px; direction: rtl; }
        .chat-messages > * { direction: ltr; }
        .chat-list { display: flex; flex-direction: column; gap: 16px; }
        .bubble { padding: 12px 16px; border-radius: var(--radius-lg); font-size: 14px; line-height: 1.6; max-width: 90%; word-break: break-word; overflow-wrap: break-word; white-space: normal; overflow-x: hidden; box-shadow: var(--shadow-sm); position: relative; box-sizing: border-box; }
        .bubble-user { align-self: flex-end; background: var(--primary); color: var(--text-inverse); border-bottom-right-radius: 2px; }
        :host(.dark-theme) .bubble-user { color: #111; }
        .bubble-ai { align-self: flex-start; background: var(--bg-card); border: 1px solid var(--border-light); color: var(--text-main); border-bottom-left-radius: 2px; }
        .bubble-ai h1, .bubble-ai h2 { font-size: 1.1em; margin: 8px 0; }
        .bubble.is-editing { outline: 2px solid var(--brand-gold); outline-offset: 3px; }
        .bubble-error { border-color: var(--danger) !important; background: var(--danger-light) !important; color: var(--text-main) !important; }
        .bubble-error-title { font-weight: 600; color: var(--danger); margin-bottom: 6px; }
        .bubble-error-detail { color: var(--text-sec); font-size: 12px; line-height: 1.6; margin-bottom: 10px; }
        .bubble-error-actions { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 10px; }
        .bubble-inline-action { padding: 6px 10px; border: 1px solid var(--border-light); border-radius: var(--radius-sm); background: var(--bg-card); color: var(--text-main); font: inherit; font-size: 12px; cursor: pointer; }
        .bubble-inline-action:hover { border-color: var(--brand-gold); color: var(--brand-gold); background: var(--bg-hover); }
        .message-context-menu { position: absolute; z-index: 10003; min-width: 150px; max-width: 240px; padding: 6px; display: none; background: var(--bg-card); border: 1px solid var(--border-light); border-radius: var(--radius-md); box-shadow: var(--shadow-xl); }
        .message-context-menu.show { display: block; }
        .message-menu-item { width: 100%; min-height: 34px; padding: 8px 10px; border: none; border-radius: var(--radius-sm); background: transparent; color: var(--text-main); font: inherit; font-size: 13px; font-weight: 500; text-align: left; cursor: pointer; }
        .message-menu-item:hover:not(:disabled) { background: var(--bg-hover); color: var(--brand-gold); }
        .message-menu-item.danger { color: var(--danger); }
        .message-menu-item.danger:hover:not(:disabled) { background: var(--danger-light); color: var(--danger); }
        .message-menu-item:disabled { opacity: 0.45; cursor: not-allowed; }
        .summary-selection-menu { position: absolute; z-index: 10004; display: none; flex-wrap: wrap; align-items: center; gap: 6px; max-width: calc(100% - 16px); padding: 7px; background: var(--bg-card); border: 1px solid var(--border-light); border-radius: var(--radius-md); box-shadow: var(--shadow-xl); }
        .summary-selection-menu.show { display: flex; }
        .summary-selection-item { min-height: 32px; padding: 7px 11px; border: none; border-radius: var(--radius-sm); background: var(--bg-hover); color: var(--text-main); font: inherit; font-size: 12px; font-weight: 600; cursor: pointer; white-space: nowrap; box-shadow: inset 0 0 0 1px var(--border-light); transition: all var(--transition-fast); }
        .summary-selection-item:hover { background: var(--primary); color: var(--text-inverse); box-shadow: inset 0 0 0 1px transparent; }
        .thinking-block { margin: 4px 0 10px; border-radius: var(--radius-md); background: var(--bg-setting); border: 1px solid var(--border-light); overflow: hidden; }
        .thinking-header { display: flex; width: 100%; align-items: center; justify-content: space-between; padding: 8px 12px; border: none; background: transparent; color: inherit; font: inherit; text-align: left; cursor: pointer; user-select: none; transition: background var(--transition-fast); }
        .thinking-header:hover { background: rgba(0,0,0,0.03); }
        .thinking-header:focus-visible { outline: 2px solid var(--brand-gold); outline-offset: -2px; }
        .thinking-header-left { display: flex; min-width: 0; align-items: center; gap: 8px; flex-wrap: wrap; }
        .thinking-icon { width: 16px; height: 16px; display: flex; align-items: center; justify-content: center; color: var(--text-muted); }
        .thinking-icon svg { width: 14px; height: 14px; }
        .thinking-title { font-size: 12px; font-weight: 600; color: var(--text-sec); }
        .thinking-status { font-size: 10px; color: var(--text-muted); background: rgba(0,0,0,0.05); padding: 1px 6px; border-radius: 4px; }
        .thinking-toggle { width: 18px; height: 18px; display: flex; align-items: center; justify-content: center; color: var(--text-muted); }
        .thinking-toggle svg { width: 12px; height: 12px; transition: transform 0.2s; }
        .thinking-block.expanded .thinking-toggle svg { transform: rotate(180deg); }
        .thinking-preview { padding: 0 12px 8px; font-size: 11px; color: var(--text-muted); line-height: 1.4; max-height: 3.5em; overflow: hidden; word-break: break-word; overflow-wrap: break-word; white-space: normal; }
        .thinking-content[hidden] { display: none; }
        .thinking-content { max-height: 0; overflow: hidden; transition: max-height 0.3s cubic-bezier(0.4, 0, 0.2, 1); }
        .thinking-block.expanded .thinking-content { max-height: min(60vh, 460px); }
        .thinking-content-inner { max-height: min(54vh, 420px); overflow-y: auto; padding: 10px 12px; font-size: 12px; color: var(--text-sec); border-top: 1px dashed var(--border-medium); background: var(--bg-card); word-break: break-word; overflow-wrap: break-word; white-space: normal; overflow-x: hidden; width: 100%; box-sizing: border-box; }
        .ai-output-partial, .ai-output-failure { margin: 8px 0 10px; padding: 8px 10px; border-radius: var(--radius-sm); background: var(--danger-light); color: var(--text-sec); font-size: 12px; line-height: 1.5; }
        .scroll-buttons { position: absolute; right: 10px; z-index: 10; }
        .scroll-buttons.top-area { top: 10px; }
        .scroll-buttons.bottom-area { bottom: 10px; }
        .scroll-buttons.summary-bottom-area { bottom: 10px; }
        .scroll-btn { width: 32px; height: 32px; border-radius: 50%; background: var(--bg-card); border: 1px solid var(--border-light); box-shadow: var(--shadow-md); cursor: pointer; display: flex; align-items: center; justify-content: center; color: var(--text-sec); opacity: 0; transform: scale(0.8); pointer-events: none; transition: all var(--transition-fast); }
        .scroll-btn.visible { opacity: 1; transform: scale(1); pointer-events: auto; }
        .scroll-btn:hover { color: var(--brand-gold); border-color: var(--brand-gold); }
        .scroll-btn svg { width: 16px; height: 16px; }
        .chat-input-area { border-top: 1px solid var(--border-light); padding: 16px 0 0; flex-shrink: 0; }
        .chat-input-row { display: flex; gap: 10px; align-items: flex-end; }
        .chat-input { flex: 1; min-height: 44px; max-height: 120px; border-radius: 22px; padding: 10px 18px; resize: none; border: 1px solid var(--border-medium); font-size: 14px; line-height: 1.5; }
        .chat-input:focus { border-color: var(--brand-gold); }
        .send-btn { width: 44px; height: 44px; border-radius: 50%; padding: 0; flex-shrink: 0; display: flex; align-items: center; justify-content: center; background: var(--primary); border: none; cursor: pointer; transition: all var(--transition-fast); }
        .send-btn svg { width: 20px; height: 20px; fill: none; stroke: var(--text-inverse); }
        :host(.dark-theme) .send-btn svg { stroke: #111; }
        .send-btn:hover { transform: scale(1.05); }
        .send-btn:disabled { opacity: 0.5; cursor: not-allowed; }
        .settings-page { background: var(--bg-setting); min-height: 100%; padding: 20px; }
        .settings-group { background: var(--bg-card); border-radius: var(--radius-lg); overflow: hidden; margin-bottom: 20px; box-shadow: var(--shadow-sm); border: 1px solid var(--border-light); }
        .settings-group-title { font-size: 11px; color: var(--text-muted); text-transform: uppercase; padding: 16px 20px 8px; font-weight: 700; letter-spacing: 0.05em; }
        .setting-item { padding: 14px 20px; border-bottom: 1px solid var(--border-light); }
        .setting-item:last-child { border-bottom: none; }
        .setting-label { font-size: 14px; font-weight: 500; color: var(--text-main); margin-bottom: 4px; display: block; }
        .setting-desc { font-size: 12px; color: var(--text-sec); margin-bottom: 10px; }
        .setting-item-row { display: flex; justify-content: space-between; align-items: center; }
        .setting-item-row .setting-info { flex: 1; margin-right: 16px; }
        .api-profile-row { display: flex; flex-direction: column; gap: 8px; align-items: stretch; }
        .api-profile-list { display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 8px; }
        .api-profile-card { min-height: 52px; padding: 9px 10px; border: 1px solid var(--border-medium); border-radius: var(--radius-sm); background: var(--bg-card); color: var(--text-main); text-align: left; font: inherit; cursor: pointer; transition: all var(--transition-fast); overflow: hidden; }
        .api-profile-card:hover, .api-profile-card:focus { border-color: var(--brand-gold); background: var(--bg-hover); outline: none; }
        .api-profile-card[aria-selected="true"] { border-color: var(--brand-gold); box-shadow: 0 0 0 2px rgba(227, 160, 67, 0.14); background: var(--bg-hover); }
        .api-profile-card-title { display: block; font-size: 13px; font-weight: 600; line-height: 1.35; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .api-profile-card-meta { display: block; margin-top: 3px; font-size: 11px; color: var(--text-sec); line-height: 1.35; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .api-profile-actions { display: flex; gap: 6px; flex: 0 0 auto; }
        .api-profile-actions .btn-xs { min-width: 34px; padding: 0 8px; height: 36px; }
        .api-profile-summary { margin-top: 8px; margin-bottom: 0; overflow-wrap: anywhere; }
        .model-input-row { display: flex; gap: 8px; align-items: center; }
        .model-input-row input { flex: 1; min-width: 0; }
        .model-fetch-btn { flex: 0 0 auto; padding: 0 10px; height: 40px; }
        .model-picker-overlay { position: absolute; inset: 0; z-index: 10002; display: none; align-items: center; justify-content: center; padding: 20px; background: rgba(17, 24, 39, 0.38); backdrop-filter: blur(5px); -webkit-backdrop-filter: blur(5px); }
        .model-picker-overlay.show { display: flex; }
        .model-picker-dialog { width: 100%; max-width: 360px; max-height: 72vh; display: flex; flex-direction: column; background: var(--bg-card); border: 1px solid var(--border-light); border-radius: var(--radius-lg); box-shadow: var(--shadow-xl); overflow: hidden; }
        .model-picker-header { display: flex; align-items: center; justify-content: space-between; padding: 14px 16px; border-bottom: 1px solid var(--border-light); }
        .model-picker-title { font-size: 14px; font-weight: 600; color: var(--text-main); }
        .model-picker-status { padding: 10px 16px; color: var(--text-sec); font-size: 12px; line-height: 1.5; border-bottom: 1px solid var(--border-light); }
        .model-picker-status.error { color: var(--danger); }
        .model-picker-list { flex: 1; min-height: 120px; overflow-y: auto; padding: 8px; }
        .model-option { width: 100%; padding: 9px 10px; border: none; border-radius: var(--radius-sm); background: transparent; color: var(--text-main); text-align: left; font: inherit; font-size: 13px; cursor: pointer; overflow-wrap: anywhere; }
        .model-option:hover { background: var(--bg-hover); color: var(--brand-gold); }
        .model-picker-actions { display: flex; gap: 8px; justify-content: flex-end; padding: 12px 16px 14px; border-top: 1px solid var(--border-light); }
        .toggle-switch { position: relative; width: 44px; height: 24px; flex-shrink: 0; }
        .toggle-switch input { opacity: 0; width: 0; height: 0; position: absolute; }
        .toggle-slider { position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0; background: var(--border-medium); border-radius: 24px; transition: .3s; }
        .toggle-slider::before { content: ''; position: absolute; height: 18px; width: 18px; left: 3px; bottom: 3px; background: white; border-radius: 50%; transition: .3s; box-shadow: 0 1px 2px rgba(0,0,0,0.2); }
        .toggle-switch input:checked + .toggle-slider { background: var(--brand-gold); }
        .toggle-switch input:checked + .toggle-slider::before { transform: translateX(20px); }
        .spinner { width: 16px; height: 16px; border: 2px solid rgba(255,255,255,0.3); border-top-color: #fff; border-radius: 50%; animation: spin 0.8s linear infinite; display: none; }
        .btn.loading .spinner { display: inline-block; }
        .btn.loading .btn-text { display: none; }
        @keyframes spin { to { transform: rotate(360deg); } }
        .thinking { display: flex; gap: 4px; padding: 4px 0; }
        .thinking-dot { width: 6px; height: 6px; background: var(--text-muted); border-radius: 50%; animation: thinking 1.4s ease-in-out infinite; }
        .thinking-dot:nth-child(2) { animation-delay: 0.2s; }
        .thinking-dot:nth-child(3) { animation-delay: 0.4s; }
        @keyframes thinking { 0%, 80%, 100% { transform: scale(0.6); opacity: 0.4; } 40% { transform: scale(1); opacity: 1; } }
        .tip-text { text-align: center; color: var(--text-muted); font-size: 13px; padding: 40px 20px; line-height: 1.8; }
        .tip-text strong { color: var(--text-main); }
        .tip-icon { display: block; margin-bottom: 12px; color: var(--border-medium); }
        .tip-icon svg { width: 40px; height: 40px; }
        .hidden { display: none !important; }
        ::-webkit-scrollbar { width: 6px; height: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.1); border-radius: 3px; }
        ::-webkit-scrollbar-thumb:hover { background: rgba(0,0,0,0.2); }
        :host(.dark-theme) ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); }
        input[type="number"] { -moz-appearance: textfield; }
        input[type="number"]::-webkit-outer-spin-button, input[type="number"]::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }
        .range-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }
        .range-buttons { display: flex; gap: 6px; }
        .range-inputs { display: flex; gap: 10px; align-items: center; }
        .range-inputs input { flex: 1; text-align: center; }
        .range-separator { color: var(--text-muted); }
        .shortcut-hint { display: flex; align-items: center; justify-content: center; gap: 6px; font-size: 11px; color: var(--text-muted); margin-top: 16px; }
        .kbd { display: inline-flex; padding: 2px 5px; background: var(--bg-card); border: 1px solid var(--border-medium); border-radius: 4px; font-family: ui-monospace, monospace; font-size: 10px; }
        .toast { position: absolute; bottom: 20px; left: 50%; transform: translateX(-50%) translateY(10px); background: #333; color: white; padding: 8px 16px; border-radius: 4px; font-size: 13px; font-weight: 500; box-shadow: var(--shadow-lg); z-index: 10000; opacity: 0; pointer-events: none; transition: all 0.2s; display: flex; align-items: center; gap: 8px; }
        .toast.show { transform: translateX(-50%) translateY(0); opacity: 1; }
        .toast.error { background: var(--danger); }
        `;
    },

    render() {
        const html = `
            <div id="toggle-btn" title="拖动改变位置，点击展开/关闭 (Ctrl+Shift+S)">${this.ICONS.arrowLeft}</div>
            <div class="sidebar-panel" id="sidebar">
                <div class="resize-handle" id="resizer"></div>
                <div class="toast" id="toast"></div>
                <div class="model-picker-overlay" id="model-picker-modal" aria-hidden="true">
                    <div class="model-picker-dialog" role="dialog" aria-modal="true" aria-labelledby="model-picker-title">
                        <div class="model-picker-header">
                            <div class="model-picker-title" id="model-picker-title">选择模型</div>
                            <button class="icon-btn" id="btn-close-model-picker" data-tooltip="关闭">${this.ICONS.close}</button>
                        </div>
                        <div class="model-picker-status" id="model-picker-status">填写 API 地址和 API Key 后获取模型列表。</div>
                        <div class="model-picker-list" id="model-picker-list"></div>
                        <div class="model-picker-actions">
                            <button class="btn-xs" id="btn-refresh-models">重新获取</button>
                            <button class="btn-xs" id="btn-cancel-model-picker">取消</button>
                        </div>
                    </div>
                </div>
                <div class="header">
                    <div class="header-title">
                        <div class="header-title-icon">${this.ICONS.brain}</div>
                        智能总结
                    </div>
                    <div class="header-actions">
                        <button class="icon-btn" id="btn-theme" data-tooltip="切换主题">${this.ICONS.moon}</button>
                        <button class="icon-btn" id="btn-close" data-tooltip="关闭">${this.ICONS.close}</button>
                    </div>
                </div>
                <div class="tab-bar">
                    <div class="tab-item active" data-tab="summary">${this.ICONS.summary}<span>总结</span></div>
                    <div class="tab-item" data-tab="chat">${this.ICONS.chat}<span>对话</span></div>
                    <div class="tab-item" data-tab="export">📦<span>导出</span></div>
                    <div class="tab-item" data-tab="settings">${this.ICONS.settings}<span>设置</span></div>
                </div>
                <div class="content-area">
                    <div id="page-summary" class="view-page active">
                         <div class="form-group">
                             <div class="range-header">
                                 <label class="form-label" style="margin:0;">楼层范围</label>
                                 <div class="range-buttons">
                                     <button class="btn-xs" id="range-all">全部</button>
                                     <button class="btn-xs" id="range-recent">最近<span id="recent-count">50</span></button>
                                 </div>
                             </div>
                             <div class="range-inputs">
                                 <input type="number" id="inp-start" placeholder="起始" min="1">
                                 <span class="range-separator">→</span>
                                 <input type="number" id="inp-end" placeholder="结束" min="1">
                             </div>
                         </div>
                         <button class="btn" id="btn-summary">
                             <div class="spinner"></div>
                             <span class="btn-text" style="display:flex;align-items:center;gap:6px;">${this.ICONS.sparkles} 开始智能总结</span>
                         </button>
                         <button class="btn-xs" id="btn-refresh-summary-cache" style="margin-top:8px;width:100%;">重新获取楼层</button>
                         <div class="summary-result-wrapper">
                             <div id="summary-result" class="result-box empty">
                                 <div class="tip-text">
                                     <span class="tip-icon">${this.ICONS.robot}</span>
                                     点击「开始智能总结」后，<br>AI 将分析帖子内容并生成摘要<br><br>
                                     💡 总结完成后可切换到<strong>「对话」</strong>继续追问
                                 </div>
                             </div>
                             <div class="scroll-buttons summary-bottom-area"><button type="button" class="scroll-btn" id="btn-summary-scroll-bottom" title="跳到最新内容" aria-label="跳到最新内容" aria-hidden="true" tabindex="-1">${this.ICONS.arrowDown}</button></div>
                         </div>
                         <div class="shortcut-hint">
                             <span class="kbd">Ctrl</span>+<span class="kbd">Shift</span>+<span class="kbd">S</span> 快速打开
                         </div>
                    </div>
                    <div id="page-chat" class="view-page">
                        <div class="chat-container">
                             <div class="chat-toolbar">
                                 <div class="chat-toolbar-title">
                                     对话记录
                                     <span class="msg-count" id="msg-count">0</span>
                                 </div>
                                 <button class="btn-clear" id="btn-clear-chat" title="清空对话">
                                     ${this.ICONS.trash} 清空
                                 </button>
                             </div>
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
                                     <textarea id="chat-input" class="chat-input" placeholder="输入你的问题... (Enter 发送)" rows="1"></textarea>
                                     <button class="send-btn" id="btn-send" title="发送消息">${this.ICONS.send}</button>
                                 </div>
                             </div>
                        </div>
                    </div>
                    <!-- 导出页面 -->
                    <div id="page-export" class="view-page">
                        <div class="form-group">
                            <label class="form-label">导出类型</label>
                            <select id="export-type">
                                <option value="html">HTML 离线导出</option>
                                <option value="ai-text">AI 文本导出</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <div class="range-header">
                                <label class="form-label" style="margin:0;">导出范围</label>
                                <div class="range-buttons">
                                    <button class="btn-xs" id="export-range-all">全部</button>
                                    <button class="btn-xs" id="export-range-recent">最近<span id="export-recent-count">50</span></button>
                                </div>
                            </div>
                            <div class="range-inputs">
                                <input type="number" id="export-start" placeholder="起始" min="1">
                                <span class="range-separator">→</span>
                                <input type="number" id="export-end" placeholder="结束" min="1">
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
                                    <input type="checkbox" id="export-offline-images" checked>
                                    <span class="toggle-slider"></span>
                                </label>
                            </div>
                            <label class="setting-label" style="margin-bottom:8px;">主题选择</label>
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
                                    <input type="checkbox" id="export-ai-header" checked>
                                    <span class="toggle-slider"></span>
                                </label>
                            </div>
                            <div class="setting-item-row" style="margin-bottom:12px;">
                                <div class="setting-info">
                                    <label class="setting-label">包含图片链接</label>
                                    <div class="setting-desc">保留图片 URL</div>
                                </div>
                                <label class="toggle-switch">
                                    <input type="checkbox" id="export-ai-images" checked>
                                    <span class="toggle-slider"></span>
                                </label>
                            </div>
                            <div class="setting-item-row">
                                <div class="setting-info">
                                    <label class="setting-label">包含引用块</label>
                                    <div class="setting-desc">保留引用内容</div>
                                </div>
                                <label class="toggle-switch">
                                    <input type="checkbox" id="export-ai-quotes" checked>
                                    <span class="toggle-slider"></span>
                                </label>
                            </div>
                        </div>
                        <button class="btn" id="btn-export">
                            <div class="spinner"></div>
                            <span class="btn-text">📦 开始导出</span>
                        </button>
                        <div id="export-status" class="result-box empty" style="margin-top:16px;min-height:100px;">
                            <div class="tip-text">
                                <span class="tip-icon">📦</span>
                                选择导出类型和范围后，<br>点击「开始导出」即可下载文件
                            </div>
                        </div>
                    </div>
                    <div id="page-settings" class="view-page settings-page">
                         <div class="settings-group">
                             <div class="settings-group-title">API 配置</div>
                             <div class="setting-item"><label class="setting-label">当前配置</label><div class="api-profile-row"><div id="cfg-profile-list" class="api-profile-list" role="listbox" aria-label="选择 API 配置"></div><div class="api-profile-actions"><button type="button" class="btn-xs" id="btn-api-profile-add" title="新增配置">新增</button><button type="button" class="btn-xs" id="btn-api-profile-copy" title="复制当前配置">复制</button><button type="button" class="btn-xs" id="btn-api-profile-delete" title="删除当前配置">删除</button></div></div><div class="setting-desc api-profile-summary" id="api-profile-summary">点击配置即可切换，编辑后会自动保存。</div></div>
                             <div class="setting-item"><label class="setting-label">配置名称</label><input type="text" id="cfg-profile-name" placeholder="例如：DeepSeek / OpenAI / 本地代理"></div>
                             <div class="setting-item"><label class="setting-label">API 地址</label><input type="text" id="cfg-url" placeholder="https://api.openai.com/v1/chat/completions"></div>
                             <div class="setting-item"><label class="setting-label">API Key</label><input type="password" id="cfg-key" placeholder="sk-..."></div>
                             <div class="setting-item"><label class="setting-label">模型名称</label><div class="model-input-row"><input type="text" id="cfg-model" placeholder="deepseek-chat"><button type="button" class="btn-xs model-fetch-btn" id="btn-fetch-models">获取模型列表</button></div><div class="setting-desc">可从接口返回列表中选择，也可以手动输入模型名称。</div></div>
                         </div>
                         <div class="settings-group">
                             <div class="settings-group-title">提示词配置</div>
                             <div class="setting-item"><label class="setting-label">总结提示词</label><div class="setting-desc">用于生成帖子摘要时的系统指令</div><textarea id="cfg-prompt-sum" rows="4"></textarea></div>
                             <div class="setting-item"><label class="setting-label">对话提示词</label><div class="setting-desc">用于后续追问时的系统指令</div><textarea id="cfg-prompt-chat" rows="4"></textarea></div>
                         </div>
                         <div class="settings-group">
                             <div class="settings-group-title">高级设置</div>
                             <div class="setting-item setting-item-row">
                                 <div class="setting-info"><label class="setting-label">快捷楼层数</label><div class="setting-desc">"最近N楼"按钮的楼层数量</div></div>
                                 <input type="number" id="cfg-recent-floors" min="10" max="500" style="width:80px; text-align:center; padding:6px 10px;">
                             </div>
                             <div class="setting-item setting-item-row">
                                 <div class="setting-info"><label class="setting-label">流式输出</label><div class="setting-desc">开启后内容会逐字显示，关闭则等待完成后一次性显示</div></div>
                                 <label class="toggle-switch"><input type="checkbox" id="cfg-stream" checked><span class="toggle-slider"></span></label>
                             </div>
                             <div class="setting-item setting-item-row">
                                 <div class="setting-info"><label class="setting-label">自动滚动</label><div class="setting-desc">生成内容时自动滚动到最新位置</div></div>
                                 <label class="toggle-switch"><input type="checkbox" id="cfg-autoscroll" checked><span class="toggle-slider"></span></label>
                             </div>
                         </div>
                         <button class="btn" id="btn-save">${this.ICONS.check} 保存设置</button>
                    </div>
                </div>
                ${this.getMessageContextMenuHtml()}
                ${this.getSummarySelectionMenuHtml()}
            </div>`;
        this.uiManager.shadow.innerHTML += html;
    },

    getMessageContextMenuHtml: UIRegistry.get('style1').getMessageContextMenuHtml,
    getSummarySelectionMenuHtml: UIRegistry.get('style1').getSummarySelectionMenuHtml,
    bindEvents: UIRegistry.get('style1').bindEvents,
    bindKeyboardShortcuts: UIRegistry.get('style1').bindKeyboardShortcuts,
    getActiveApiProfileIndex: UIRegistry.get('style1').getActiveApiProfileIndex,
    syncCurrentApiFormToActiveProfile: UIRegistry.get('style1').syncCurrentApiFormToActiveProfile,
    renderApiProfileList: UIRegistry.get('style1').renderApiProfileList,
    renderApiProfileSelect: UIRegistry.get('style1').renderApiProfileSelect,
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

        this.loadApiProfileStateToUi();
        Q('#cfg-prompt-sum').value = GM_getValue('prompt_sum', '请总结以下论坛帖子内容。使用 Markdown 格式，条理清晰，重点突出主要观点、争议点和结论。适当使用标题、列表和引用来组织内容。');
        Q('#cfg-prompt-chat').value = GM_getValue('prompt_chat', '你是一个帖子阅读助手。基于上文中的帖子内容，回答用户的问题。回答要准确、简洁，必要时引用原文。');
        const recentFloors = GM_getValue('recentFloors', 50);
        Q('#cfg-recent-floors').value = recentFloors;
        Q('#recent-count').textContent = recentFloors;
        Q('#export-recent-count').textContent = recentFloors;
        Q('#cfg-stream').checked = GM_getValue('useStream', true);
        Q('#cfg-autoscroll').checked = GM_getValue('autoScroll', true);
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
    },
    updateButtonPosition: UIRegistry.get('style1').updateButtonPosition,
    toggleSidebar: UIRegistry.get('style1').toggleSidebar,
    squeezeBody: UIRegistry.get('style1').squeezeBody,
    switchTab: UIRegistry.get('style1').switchTab,
    toggleTheme() {
        const Q = this.uiManager.Q.bind(this.uiManager);
        this.isDarkTheme = !this.isDarkTheme;
        GM_setValue(this.getStyleStorageKey('isDarkTheme'), this.isDarkTheme);
        this.uiManager.host.classList.toggle('dark-theme', this.isDarkTheme);
        Q('#btn-theme').innerHTML = this.isDarkTheme ? this.ICONS.sun : this.ICONS.moon;
    },
    setLoading: UIRegistry.get('style1').setLoading,
    isAiAbortButton: UIRegistry.get('style1').isAiAbortButton,
    setAiAbortButtonState: UIRegistry.get('style1').setAiAbortButtonState,
    getAiAbortButtonSelector: UIRegistry.get('style1').getAiAbortButtonSelector,
    startAiAbortController: UIRegistry.get('style1').startAiAbortController,
    clearAiAbortController: UIRegistry.get('style1').clearAiAbortController,
    stopCurrentAiGeneration: UIRegistry.get('style1').stopCurrentAiGeneration,
    handleSummaryButtonClick: UIRegistry.get('style1').handleSummaryButtonClick,
    handleSendButtonClick: UIRegistry.get('style1').handleSendButtonClick,
    updateChatInputMode: UIRegistry.get('style1').updateChatInputMode,
    createEmptyChatSession: UIRegistry.get('style1').createEmptyChatSession,
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
    getAssistantForUser: UIRegistry.get('style1').getAssistantForUser,
    getUserForAssistant: UIRegistry.get('style1').getUserForAssistant,
    removeVisibleMessagesAfter: UIRegistry.get('style1').removeVisibleMessagesAfter,
    requestAssistantForUser: UIRegistry.get('style1').requestAssistantForUser,
    getMessageCopyText: UIRegistry.get('style1').getMessageCopyText,
    renderChatErrorContent: UIRegistry.get('style1').renderChatErrorContent,
    renderBubbleContent: UIRegistry.get('style1').renderBubbleContent,
    bindMessageContextMenu: UIRegistry.get('style1').bindMessageContextMenu,
    bindSummarySelectionMenu: UIRegistry.get('style1').bindSummarySelectionMenu,
    getCurrentSelection: UIRegistry.get('style1').getCurrentSelection,
    clearCurrentSelection: UIRegistry.get('style1').clearCurrentSelection,
    getSummarySelectionState: UIRegistry.get('style1').getSummarySelectionState,
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
    setExportRange: UIRegistry.get('style1').setExportRange,
    doExport: UIRegistry.get('style1').doExport,
    exportAsHtml: UIRegistry.get('style1').exportAsHtml,
    exportAsAiText: UIRegistry.get('style1').exportAsAiText
});
