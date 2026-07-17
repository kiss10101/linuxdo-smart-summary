import { CONFIG } from '../../config.js';
import { Core } from '../../core/index.js';
import { UIRegistry } from '../registry.js';

export const style1Presentation = {
    getStyles() {
        // 从原脚本 "Linux.do 智能总结-风格1.js" 复制的 STYLES 常量
        return `
    @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');
    :host {
        font-family: 'Outfit', -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        --primary: #c96442; --primary-light: #e07d5c; --primary-dark: #a84d32;
        --primary-gradient: linear-gradient(135deg, #c96442 0%, #e08860 50%, #d4724e 100%);
        --primary-glow: rgba(201, 100, 66, 0.35);
        --success: #2d9d78; --success-light: #d1fae5; --danger: #dc4446; --danger-light: #fef2f2; --warning: #d4a054;
        --bg-base: #faf8f6; --bg-card: #ffffff; --bg-glass: rgba(255, 255, 255, 0.88);
        --bg-glass-dark: rgba(250, 248, 246, 0.96); --bg-hover: rgba(201, 100, 66, 0.08);
        --bg-active: rgba(201, 100, 66, 0.12); --bg-setting: #f5f2ef; --bg-input: #ffffff;
        --border-light: rgba(201, 100, 66, 0.12); --border-medium: rgba(201, 100, 66, 0.2);
        --shadow-sm: 0 1px 3px rgba(168, 77, 50, 0.06), 0 1px 2px rgba(168, 77, 50, 0.08);
        --shadow-md: 0 4px 12px -2px rgba(168, 77, 50, 0.12), 0 2px 6px -2px rgba(168, 77, 50, 0.08);
        --shadow-lg: 0 12px 40px -8px rgba(168, 77, 50, 0.18), 0 4px 12px -4px rgba(168, 77, 50, 0.08);
        --shadow-xl: 0 20px 50px -12px rgba(168, 77, 50, 0.25), 0 0 0 1px rgba(201, 100, 66, 0.05);
        --shadow-glow: 0 4px 20px var(--primary-glow), 0 0 0 1px rgba(201, 100, 66, 0.1);
        --text-main: #2d2520; --text-sec: #6b5d54; --text-muted: #9c8b80; --text-inverse: #ffffff;
        --floating-menu-opacity: 88%; --floating-menu-surface: color-mix(in srgb, var(--bg-card) var(--floating-menu-opacity), transparent);
        --sidebar-width: 420px; --btn-size: 52px; --radius-sm: 10px; --radius-md: 14px;
        --radius-lg: 18px; --radius-xl: 24px; --radius-full: 9999px;
        --transition-fast: 0.15s cubic-bezier(0.4, 0, 0.2, 1);
        --transition-normal: 0.25s cubic-bezier(0.4, 0, 0.2, 1);
        --transition-slow: 0.35s cubic-bezier(0.4, 0, 0.2, 1);
    }
    :host(.dark-theme) {
        --bg-base: #1a1614; --bg-card: #252220; --bg-glass: rgba(37, 34, 32, 0.92);
        --bg-glass-dark: rgba(26, 22, 20, 0.96); --bg-hover: rgba(224, 125, 92, 0.12);
        --bg-active: rgba(224, 125, 92, 0.18); --bg-setting: #1e1b19; --bg-input: #2d2926;
        --border-light: rgba(224, 125, 92, 0.15); --border-medium: rgba(224, 125, 92, 0.25);
        --shadow-sm: 0 1px 3px rgba(0, 0, 0, 0.2); --shadow-md: 0 4px 12px -2px rgba(0, 0, 0, 0.3);
        --shadow-lg: 0 12px 40px -8px rgba(0, 0, 0, 0.4); --shadow-xl: 0 20px 50px -12px rgba(0, 0, 0, 0.5);
        --text-main: #f5f0eb; --text-sec: #b8a99d; --text-muted: #7a6d64;
    }
    * { box-sizing: border-box; }
    .sidebar-panel { position: fixed; top: 0; bottom: 0; width: var(--sidebar-width); background: var(--bg-glass-dark); backdrop-filter: blur(24px) saturate(180%); -webkit-backdrop-filter: blur(24px) saturate(180%); box-shadow: var(--shadow-xl); z-index: 9998; display: flex; flex-direction: column; transition: transform var(--transition-slow); border: 1px solid var(--border-light); }
    .panel-left { left: 0; border-left: none; border-radius: 0 var(--radius-xl) var(--radius-xl) 0; transform: translateX(-100%); }
    .panel-left.open { transform: translateX(0); }
    .panel-right { right: 0; border-right: none; border-radius: var(--radius-xl) 0 0 var(--radius-xl); transform: translateX(100%); }
    .panel-right.open { transform: translateX(0); }
    #toggle-btn { position: fixed; width: var(--btn-size); height: var(--btn-size); background: var(--primary-gradient); color: white; box-shadow: var(--shadow-glow); z-index: 9999; cursor: grab; display: flex; align-items: center; justify-content: center; user-select: none; transition: all var(--transition-normal); border: 2px solid rgba(255, 255, 255, 0.2); outline: none; }
    #toggle-btn::before { content: ''; position: absolute; inset: -3px; border-radius: inherit; background: var(--primary-gradient); opacity: 0; z-index: -1; filter: blur(12px); transition: opacity var(--transition-normal); }
    #toggle-btn:hover { transform: scale(1.08); box-shadow: 0 8px 30px var(--primary-glow), 0 0 0 4px rgba(201, 100, 66, 0.15); }
    #toggle-btn:hover::before { opacity: 0.6; }
    #toggle-btn:active { cursor: grabbing; transform: scale(0.96); }
    #toggle-btn svg { width: 24px; height: 24px; fill: currentColor; transition: transform var(--transition-normal); filter: drop-shadow(0 2px 4px rgba(0,0,0,0.15)); }
    .btn-snap-left { border-radius: 0 var(--radius-lg) var(--radius-lg) 0; }
    .btn-snap-right { border-radius: var(--radius-lg) 0 0 var(--radius-lg); }
    .btn-floating { border-radius: var(--radius-lg); }
    #toggle-btn.arrow-flip svg { transform: rotate(180deg); }
    .resize-handle { position: absolute; top: 0; bottom: 0; width: 6px; cursor: col-resize; z-index: 10001; background: transparent; transition: background var(--transition-fast); }
    .resize-handle::after { content: ''; position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 3px; height: 40px; background: var(--primary); border-radius: 2px; opacity: 0; transition: opacity var(--transition-fast); }
    .resize-handle:hover::after { opacity: 0.5; }
    .handle-left { right: -3px; }
    .handle-right { left: -3px; }
    .header { padding: 20px 24px; border-bottom: 1px solid var(--border-light); display: flex; justify-content: space-between; align-items: center; background: linear-gradient(to bottom, var(--bg-card), transparent); flex-shrink: 0; }
    .header-title { font-size: 18px; font-weight: 700; color: var(--text-main); display: flex; align-items: center; gap: 12px; letter-spacing: -0.02em; }
    .header-title-icon { width: 36px; height: 36px; background: var(--primary-gradient); border-radius: var(--radius-sm); display: flex; align-items: center; justify-content: center; font-size: 18px; box-shadow: var(--shadow-sm); }
    .header-actions { display: flex; gap: 6px; }
    .icon-btn { background: transparent; border: none; cursor: pointer; padding: 10px; border-radius: var(--radius-sm); color: var(--text-sec); transition: all var(--transition-fast); font-size: 16px; display: flex; align-items: center; justify-content: center; position: relative; }
    .icon-btn:hover { background: var(--bg-hover); color: var(--primary); transform: scale(1.05); }
    .icon-btn:active { transform: scale(0.95); }
    .icon-btn.active { background: var(--bg-active); color: var(--primary); }
    .icon-btn[data-tooltip]::after { content: attr(data-tooltip); position: absolute; bottom: -32px; left: 50%; transform: translateX(-50%) scale(0.9); background: var(--text-main); color: var(--text-inverse); padding: 5px 10px; border-radius: 6px; font-size: 11px; font-weight: 500; white-space: nowrap; opacity: 0; pointer-events: none; transition: all var(--transition-fast); z-index: 100; }
    .icon-btn[data-tooltip]:hover::after { opacity: 1; transform: translateX(-50%) scale(1); }
    .tab-bar { display: flex; padding: 12px 16px; gap: 6px; border-bottom: 1px solid var(--border-light); background: var(--bg-glass); flex-shrink: 0; }
    .tab-item { flex: 1; padding: 12px 16px; text-align: center; font: inherit; font-size: 13px; font-weight: 600; color: var(--text-sec); cursor: pointer; border: none; border-radius: var(--radius-sm); background: transparent; transition: all var(--transition-fast); display: flex; align-items: center; justify-content: center; gap: 8px; position: relative; overflow: hidden; }
    .tab-item::before { content: ''; position: absolute; inset: 0; background: var(--primary-gradient); opacity: 0; transition: opacity var(--transition-fast); }
    .tab-item:hover { color: var(--primary); background: var(--bg-hover); }
    .tab-item.active { color: var(--text-inverse); background: var(--primary-gradient); box-shadow: var(--shadow-md), inset 0 1px 0 rgba(255,255,255,0.2); }
    .tab-item.active::before { opacity: 1; }
    .tab-item span { position: relative; z-index: 1; }
    .content-area { flex: 1; min-height: 0; overflow-y: auto; position: relative; background: var(--bg-base); }
    .content-area.chat-active { overflow: hidden; }
    .content-area.summary-active { direction: rtl; scrollbar-gutter: stable; overscroll-behavior-y: contain; }
    .content-area.summary-active > * { direction: ltr; unicode-bidi: isolate; }
    .view-page { padding: 24px; display: none; animation: fadeSlideIn 0.35s ease; }
    .view-page.active { display: block; }
    #page-chat.view-page.active { display: flex; height: 100%; min-height: 0; box-sizing: border-box; }
    @keyframes fadeSlideIn { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
    .form-group { margin-bottom: 24px; }
    .form-label { display: block; font-size: 11px; color: var(--text-sec); margin-bottom: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; }
    input, textarea, select { width: 100%; padding: 14px 18px; border: 2px solid var(--border-light); border-radius: var(--radius-md); font-size: 14px; font-family: inherit; background: var(--bg-input); box-sizing: border-box; transition: all var(--transition-fast); color: var(--text-main); }
    input:focus, textarea:focus { outline: none; border-color: var(--primary); box-shadow: 0 0 0 4px rgba(201, 100, 66, 0.12); background: var(--bg-card); }
    input::placeholder, textarea::placeholder { color: var(--text-muted); }
    textarea { resize: vertical; min-height: 100px; line-height: 1.6; }
    .btn { width: 100%; padding: 16px 24px; border: none; border-radius: var(--radius-md); background: var(--primary-gradient); color: var(--text-inverse); font-weight: 600; font-size: 15px; font-family: inherit; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 10px; transition: all var(--transition-normal); box-shadow: var(--shadow-glow); letter-spacing: 0.02em; position: relative; overflow: hidden; }
    .btn::before { content: ''; position: absolute; top: 0; left: -100%; width: 100%; height: 100%; background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent); transition: left 0.5s; }
    .btn:hover { transform: translateY(-2px); box-shadow: 0 8px 30px var(--primary-glow); }
    .btn:hover::before { left: 100%; }
    .btn:active { transform: translateY(0) scale(0.98); }
    .btn:disabled { opacity: 0.6; cursor: not-allowed; transform: none; box-shadow: none; }
    .btn-secondary { background: var(--bg-card); color: var(--text-main); box-shadow: var(--shadow-sm); border: 2px solid var(--border-light); }
    .btn-secondary:hover { background: var(--bg-hover); border-color: var(--primary); box-shadow: var(--shadow-md); }
    .btn-xs { padding: 8px 14px; font-size: 12px; font-family: inherit; background: var(--bg-card); color: var(--text-main); border-radius: var(--radius-sm); border: 1.5px solid var(--border-light); cursor: pointer; white-space: nowrap; font-weight: 600; transition: all var(--transition-fast); }
    .btn-xs:hover { background: var(--primary); color: var(--text-inverse); border-color: var(--primary); transform: translateY(-1px); }
    .btn-xs:disabled, .btn-xs.loading { opacity: 0.62; cursor: wait; transform: none; }
    .summary-result-wrapper { position: relative; }
    .result-box { margin-top: 20px; padding: 24px 24px 24px 28px; background: var(--bg-card); border: 1px solid var(--border-light); border-radius: var(--radius-lg); font-size: 14px; line-height: 1.8; color: var(--text-main); min-height: 180px; max-height: calc(100vh - 380px); overflow-x: hidden; overflow-y: auto; overscroll-behavior-y: contain; scrollbar-gutter: stable; word-break: break-word; box-shadow: var(--shadow-sm); position: relative; direction: rtl; text-align: start; }
    .result-box > * { direction: ltr; unicode-bidi: isolate; }
    .result-box.empty { display: flex; align-items: center; justify-content: center; color: var(--text-muted); font-size: 13px; text-align: center; background: linear-gradient(135deg, var(--bg-card) 0%, var(--bg-base) 100%); }
    .summary-coverage { margin-top: 18px; padding: 14px 16px; border: 1px solid var(--border-light); border-radius: var(--radius-md); background: var(--bg-hover); color: var(--text-sec); font-size: 12px; line-height: 1.6; }
    .summary-coverage summary { cursor: pointer; color: var(--text-main); font-weight: 700; }
    .summary-coverage dl { display: grid; grid-template-columns: max-content 1fr; gap: 7px 12px; margin: 12px 0 0; }
    .summary-coverage dt { color: var(--text-muted); font-weight: 600; }
    .summary-coverage dd { margin: 0; color: var(--text-sec); overflow-wrap: anywhere; }
    .summary-coverage .coverage-warning { color: var(--danger); }
    .ai-source-meta { margin-top: 10px; color: var(--text-muted); font-size: 12px; line-height: 1.5; overflow-wrap: anywhere; }
    .bubble .ai-source-meta { margin-top: 12px; padding-top: 8px; border-top: 1px solid var(--border-light); }
    .result-actions { position: absolute; top: 12px; right: 12px; display: flex; gap: 6px; opacity: 0; transition: opacity var(--transition-fast); }
    .result-box:hover .result-actions { opacity: 1; }
    .result-action-btn { padding: 6px 12px; font-size: 11px; font-family: inherit; background: var(--bg-glass); color: var(--text-sec); border: 1px solid var(--border-light); border-radius: var(--radius-sm); cursor: pointer; display: flex; align-items: center; gap: 4px; transition: all var(--transition-fast); backdrop-filter: blur(8px); }
    .result-action-btn:hover { background: var(--primary); color: var(--text-inverse); border-color: var(--primary); }
    .result-action-btn.copied { background: var(--success); color: var(--text-inverse); border-color: var(--success); }
    .result-box h1, .result-box h2, .result-box h3 { margin: 20px 0 12px; font-weight: 700; color: var(--text-main); letter-spacing: -0.02em; }
    .result-box h1 { font-size: 1.5em; }
    .result-box h2 { font-size: 1.25em; border-bottom: 2px solid var(--border-light); padding-bottom: 8px; }
    .result-box h3 { font-size: 1.1em; color: var(--primary); }
    .result-box p { margin-bottom: 14px; }
    .result-box ul, .result-box ol { padding-left: 24px; margin: 12px 0; }
    .result-box li { margin-bottom: 8px; }
    .result-box li::marker { color: var(--primary); }
    .result-box code { background: var(--bg-hover); padding: 3px 8px; border-radius: 6px; font-family: 'JetBrains Mono', 'SF Mono', monospace; color: var(--primary-dark); font-size: 0.88em; border: 1px solid var(--border-light); }
    .result-box pre { background: linear-gradient(135deg, #2d2520 0%, #3d332c 100%); padding: 18px; border-radius: var(--radius-md); overflow-x: auto; color: #f5f0eb; border: 1px solid rgba(255,255,255,0.1); }
    .result-box pre code { background: none; color: #f5f0eb; padding: 0; border: none; }
    .result-box blockquote { border-left: 4px solid var(--primary); margin: 16px 0; padding: 14px 20px; color: var(--text-sec); background: var(--bg-hover); border-radius: 0 var(--radius-sm) var(--radius-sm) 0; font-style: italic; }
    .result-box a { color: var(--primary); text-decoration: none; border-bottom: 1px solid var(--primary-light); transition: all var(--transition-fast); }
    .result-box a:hover { color: var(--primary-dark); border-bottom-color: var(--primary-dark); }
    .result-box strong { color: var(--primary-dark); font-weight: 600; }
    .chat-container { display: flex; flex: 1; flex-direction: column; width: 100%; height: 100%; min-height: 0; position: relative; }
    .chat-toolbar { display: flex; justify-content: space-between; align-items: center; padding-bottom: 14px; border-bottom: 1px solid var(--border-light); margin-bottom: 14px; }
    .chat-toolbar-title { font-size: 13px; color: var(--text-sec); font-weight: 600; display: flex; align-items: center; gap: 8px; }
    .chat-toolbar-title .msg-count { background: var(--primary-gradient); color: var(--text-inverse); font-size: 11px; padding: 3px 10px; border-radius: var(--radius-full); font-weight: 700; box-shadow: var(--shadow-sm); }
    .btn-clear { padding: 8px 14px; font-size: 12px; font-family: inherit; background: var(--danger-light); color: var(--danger); border-radius: var(--radius-sm); border: 1px solid transparent; cursor: pointer; font-weight: 600; transition: all var(--transition-fast); display: flex; align-items: center; gap: 5px; }
    .btn-clear:hover { background: var(--danger); color: var(--text-inverse); transform: scale(1.02); }
    .chat-messages-wrapper { flex: 1; min-height: 0; position: relative; overflow: hidden; }
    .chat-messages { height: 100%; min-height: 0; overflow-x: hidden; overflow-y: auto; overscroll-behavior-y: contain; scrollbar-gutter: stable; padding: 16px 0 16px 8px; direction: rtl; }
    .chat-messages > * { direction: ltr; unicode-bidi: isolate; }
    .chat-list { display: flex; flex-direction: column; gap: 18px; }
    .bubble { padding: 16px 20px; border-radius: var(--radius-lg); font-size: 14px; line-height: 1.75; max-width: 88%; word-break: break-word; box-shadow: var(--shadow-sm); animation: bubbleIn 0.35s cubic-bezier(0.34, 1.56, 0.64, 1); position: relative; }
    @keyframes bubbleIn { from { opacity: 0; transform: translateY(15px) scale(0.92); } to { opacity: 1; transform: translateY(0) scale(1); } }
    .bubble-user { align-self: flex-end; background: var(--primary-gradient); color: var(--text-inverse); border-bottom-right-radius: 6px; box-shadow: var(--shadow-glow); }
    .bubble-ai { align-self: flex-start; background: var(--bg-card); border: 1px solid var(--border-light); color: var(--text-main); border-bottom-left-radius: 6px; }
    .bubble-ai h1, .bubble-ai h2, .bubble-ai h3 { margin: 12px 0 8px; }
    .bubble-ai p { margin-bottom: 10px; }
    .bubble-ai p:last-child { margin-bottom: 0; }
    .bubble.is-editing { outline: 2px solid var(--primary); outline-offset: 3px; }
    .bubble-error { border-color: var(--danger) !important; background: var(--danger-light) !important; color: var(--text-main) !important; }
    .bubble-stopped { border-style: dashed; }
    .bubble-error-title { font-weight: 700; color: var(--danger); margin-bottom: 6px; }
    .bubble-error-detail { color: var(--text-sec); font-size: 12px; line-height: 1.6; margin-bottom: 10px; }
    .bubble-error-actions { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 10px; }
    .bubble-inline-action { padding: 6px 10px; border: 1px solid var(--border-light); border-radius: var(--radius-sm); background: var(--bg-card); color: var(--text-main); font: inherit; font-size: 12px; cursor: pointer; }
    .bubble-inline-action:hover { border-color: var(--primary); color: var(--primary); background: var(--bg-hover); }
    .message-menu-trigger { position: absolute; top: 6px; right: 6px; width: 40px; height: 40px; display: inline-flex; align-items: center; justify-content: center; border: 1px solid var(--border-light); border-radius: var(--radius-sm); background: var(--bg-glass); color: var(--text-sec); font: inherit; font-size: 18px; line-height: 1; cursor: pointer; opacity: 0; pointer-events: none; transition: opacity var(--transition-fast), color var(--transition-fast), background-color var(--transition-fast); }
    .bubble:hover > .message-menu-trigger, .bubble:focus-within > .message-menu-trigger, .message-menu-trigger[aria-expanded="true"] { opacity: 1; pointer-events: auto; }
    .message-menu-trigger:hover { color: var(--primary); background: var(--bg-card); }
    .message-context-menu { position: absolute; z-index: 10003; width: max-content; min-width: 112px; max-width: 180px; padding: 6px; display: none; background: var(--bg-card); background: var(--floating-menu-surface); border: 1px solid var(--border-light); border-radius: var(--radius-md); box-shadow: var(--shadow-xl); backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px); }
    .message-context-menu.show { display: grid; }
    .message-menu-item { width: auto; min-width: 100%; min-height: 40px; padding: 8px 10px; border: none; border-radius: var(--radius-sm); background: transparent; color: var(--text-main); font: inherit; font-size: 13px; font-weight: 600; text-align: left; white-space: nowrap; cursor: pointer; }
    .message-menu-item[hidden] { display: none; }
    .message-menu-item:hover:not(:disabled) { background: var(--primary); color: var(--text-inverse); }
    .message-menu-item.danger { color: var(--danger); }
    .message-menu-item.danger:hover:not(:disabled) { background: var(--danger); color: var(--text-inverse); }
    .message-menu-item:disabled { opacity: 0.45; cursor: not-allowed; }
    .summary-selection-menu { position: absolute; z-index: 10004; display: none; flex-wrap: wrap; align-items: center; gap: 6px; max-width: calc(100% - 16px); padding: 7px; background: var(--bg-card); background: var(--floating-menu-surface); border: 1px solid var(--border-light); border-radius: var(--radius-md); box-shadow: var(--shadow-xl); backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px); }
    .summary-selection-menu.show { display: flex; }
    .summary-selection-item { min-height: 40px; padding: 8px 12px; border: none; border-radius: var(--radius-sm); background: transparent; color: var(--text-main); font: inherit; font-size: 12px; font-weight: 700; cursor: pointer; white-space: nowrap; box-shadow: inset 0 0 0 1px transparent; transition: color var(--transition-fast), background-color var(--transition-fast), box-shadow var(--transition-fast); }
    .summary-selection-item:hover { background: var(--primary); color: var(--text-inverse); box-shadow: inset 0 0 0 1px transparent; }
    #toggle-btn:focus-visible, .tab-item:focus-visible, .icon-btn:focus-visible, .message-menu-trigger:focus-visible, .message-menu-item:focus-visible, .summary-selection-item:focus-visible { outline: 3px solid var(--primary-light); outline-offset: 2px; }
    .bubble-ai code { background: var(--bg-hover); padding: 2px 6px; border-radius: 4px; font-family: 'JetBrains Mono', monospace; font-size: 0.85em; }
    .bubble-ai .thinking-block { margin: -6px -8px 12px; border-radius: var(--radius-sm); }
    .bubble-ai .thinking-block:last-child { margin-bottom: -6px; }
    .bubble-ai .thinking-header { padding: 8px 12px; }
    .bubble-ai .thinking-preview { padding: 0 12px 10px; font-size: 11px; }
    .bubble-ai .thinking-content-inner { padding: 10px 12px 12px; font-size: 11px; max-height: 300px; }
    .scroll-buttons { position: absolute; right: 10px; display: flex; flex-direction: column; gap: 8px; z-index: 10; transition: all var(--transition-normal); }
    .scroll-buttons.top-area { top: 10px; }
    .scroll-buttons.bottom-area { bottom: 10px; }
    .scroll-buttons.summary-bottom-area { bottom: 10px; }
    .scroll-btn { width: 36px; height: 36px; border-radius: var(--radius-full); background: var(--bg-card); border: 1px solid var(--border-light); box-shadow: var(--shadow-md); cursor: pointer; display: flex; align-items: center; justify-content: center; color: var(--text-sec); transition: all var(--transition-fast); opacity: 0; transform: scale(0.8); pointer-events: none; }
    .scroll-btn.visible { opacity: 1; transform: scale(1); pointer-events: auto; }
    .scroll-btn:hover { background: var(--primary); color: var(--text-inverse); border-color: var(--primary); box-shadow: var(--shadow-glow); transform: scale(1.1); }
    .scroll-btn.generating { background: var(--primary-gradient); color: var(--text-inverse); border-color: var(--primary); box-shadow: var(--shadow-glow); animation: pulse-btn 1.5s ease-in-out infinite; }
    .scroll-btn.generating::after { content: '新内容'; position: absolute; right: 42px; background: var(--primary-gradient); color: white; font-size: 10px; font-weight: 600; padding: 4px 10px; border-radius: 12px; white-space: nowrap; box-shadow: var(--shadow-md); animation: fadeIn 0.3s ease; }
    @keyframes pulse-btn { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.08); } }
    @keyframes fadeIn { from { opacity: 0; transform: translateX(10px); } to { opacity: 1; transform: translateX(0); } }
    .scroll-btn svg { width: 18px; height: 18px; fill: currentColor; }
    .chat-input-area { border-top: 1px solid var(--border-light); padding: 18px 0 0; flex-shrink: 0; background: linear-gradient(to top, var(--bg-base), transparent); }
    .chat-input-row { display: flex; gap: 14px; align-items: flex-end; }
    .chat-input { flex: 1; min-height: 52px; max-height: 140px; border-radius: var(--radius-xl); padding: 16px 22px; resize: none; border: 2px solid var(--border-light); font-size: 14px; line-height: 1.5; transition: all var(--transition-fast); }
    .chat-input:focus { border-color: var(--primary); box-shadow: 0 0 0 4px rgba(201, 100, 66, 0.12); }
    .chat-input:disabled { opacity: 0.6; cursor: not-allowed; background: var(--bg-setting); }
    .chat-input::placeholder { color: var(--text-muted); font-style: italic; }
    .thinking-block { margin-bottom: 16px; border-radius: var(--radius-md); overflow: hidden; background: linear-gradient(135deg, rgba(201, 100, 66, 0.05) 0%, rgba(201, 100, 66, 0.02) 100%); border: 1px solid rgba(201, 100, 66, 0.12); transition: all var(--transition-normal); }
    .thinking-block:hover { border-color: rgba(201, 100, 66, 0.22); box-shadow: 0 2px 12px rgba(201, 100, 66, 0.06); }
    .thinking-header { display: flex; width: 100%; align-items: center; justify-content: space-between; padding: 10px 14px; border: none; background: transparent; color: inherit; font: inherit; text-align: left; cursor: pointer; user-select: none; transition: background var(--transition-fast); }
    .thinking-header:hover { background: rgba(201, 100, 66, 0.05); }
    .thinking-header:focus-visible { outline: 2px solid var(--primary); outline-offset: -2px; }
    .thinking-header-left { display: flex; min-width: 0; align-items: center; gap: 8px; flex-wrap: wrap; }
    .thinking-icon { width: 24px; height: 24px; border-radius: 6px; background: var(--primary-gradient); display: flex; align-items: center; justify-content: center; font-size: 12px; box-shadow: var(--shadow-sm); flex-shrink: 0; }
    .thinking-title { font-size: 12px; font-weight: 600; color: var(--primary-dark); }
    .thinking-status { font-size: 10px; color: var(--text-muted); background: rgba(201, 100, 66, 0.1); padding: 2px 8px; border-radius: 10px; margin-left: 6px; }
    .thinking-block.streaming .thinking-status { background: var(--primary); color: white; animation: status-pulse 1.2s ease-in-out infinite; }
    @keyframes status-pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.6; } }
    .thinking-toggle { width: 22px; height: 22px; border-radius: 50%; background: rgba(201, 100, 66, 0.08); display: flex; align-items: center; justify-content: center; transition: all var(--transition-fast); flex-shrink: 0; }
    .thinking-toggle:hover { background: rgba(201, 100, 66, 0.15); }
    .thinking-toggle svg { width: 12px; height: 12px; fill: var(--primary); transition: transform var(--transition-normal); }
    .thinking-block.expanded .thinking-toggle svg { transform: rotate(180deg); }
    .thinking-preview { padding: 0 14px 12px; font-size: 12px; line-height: 1.5; color: var(--text-muted); max-height: 4.5em; overflow: hidden; position: relative; }
    .thinking-preview p { margin: 0 0 4px; font-size: 12px; }
    .thinking-preview p:last-child { margin-bottom: 0; }
    .thinking-preview::after { content: ''; position: absolute; bottom: 0; left: 0; right: 0; height: 24px; background: linear-gradient(to bottom, transparent, rgba(253, 250, 247, 0.98)); pointer-events: none; }
    .thinking-block.expanded .thinking-preview { display: none; }
    .thinking-content[hidden] { display: none; }
    .thinking-content { max-height: 0; overflow: hidden; transition: max-height 0.4s cubic-bezier(0.4, 0, 0.2, 1); }
    .thinking-block.expanded .thinking-content { max-height: min(60vh, 460px); }
    .thinking-content-inner { padding: 12px 14px 14px; font-size: 12px; line-height: 1.7; color: var(--text-sec); border-top: 1px dashed rgba(201, 100, 66, 0.12); max-height: 400px; overflow-x: hidden; overflow-y: auto; overscroll-behavior-y: contain; scrollbar-gutter: stable; direction: rtl; }
    .thinking-scroll-content { direction: ltr; unicode-bidi: isolate; text-align: start; }
    .result-box pre, .result-box code, .result-box table, .bubble pre, .bubble code, .bubble table, .thinking-scroll-content pre, .thinking-scroll-content code, .thinking-scroll-content table { direction: ltr; unicode-bidi: isolate; }
    .thinking-content-inner p { margin-bottom: 8px; font-size: 12px; }
    .thinking-content-inner p:last-child { margin-bottom: 0; }
    .thinking-content-inner h1, .thinking-content-inner h2, .thinking-content-inner h3 { font-size: 13px; margin: 10px 0 6px; color: var(--primary-dark); }
    .thinking-content-inner ul, .thinking-content-inner ol { padding-left: 18px; margin: 6px 0; }
    .thinking-content-inner li { margin-bottom: 4px; font-size: 12px; }
    .thinking-content-inner code { font-family: 'JetBrains Mono', monospace; font-size: 11px; background: rgba(201, 100, 66, 0.08); padding: 1px 5px; border-radius: 3px; }
    .thinking-content-inner pre { background: rgba(45, 37, 32, 0.9); padding: 10px; border-radius: 6px; overflow-x: auto; font-size: 11px; }
    .thinking-content-inner pre code { background: none; padding: 0; }
    .ai-output-partial, .ai-output-failure { margin: 8px 0 12px; padding: 8px 10px; border-radius: var(--radius-sm); background: var(--danger-light); color: var(--text-sec); font-size: 12px; line-height: 1.5; }
    .thinking-block.streaming .thinking-icon { animation: pulse-glow 1.5s ease-in-out infinite; }
    @keyframes pulse-glow { 0%, 100% { box-shadow: var(--shadow-sm); } 50% { box-shadow: 0 0 10px var(--primary-glow); } }
    :host(.dark-theme) .thinking-block { background: linear-gradient(135deg, rgba(224, 125, 92, 0.06) 0%, rgba(224, 125, 92, 0.02) 100%); border-color: rgba(224, 125, 92, 0.15); }
    :host(.dark-theme) .thinking-header:hover { background: rgba(224, 125, 92, 0.06); }
    :host(.dark-theme) .thinking-title { color: var(--primary-light); }
    :host(.dark-theme) .thinking-toggle { background: rgba(224, 125, 92, 0.12); }
    :host(.dark-theme) .thinking-content-inner { border-top-color: rgba(224, 125, 92, 0.15); }
    :host(.dark-theme) .thinking-preview::after { background: linear-gradient(to bottom, transparent, rgba(37, 34, 32, 0.98)); }
    :host(.dark-theme) .content-area::-webkit-scrollbar-track { background: rgba(224, 125, 92, 0.05); }
    :host(.dark-theme) .result-box::-webkit-scrollbar-thumb { background: rgba(184, 169, 157, 0.25); }
    :host(.dark-theme) .result-box::-webkit-scrollbar-thumb:hover { background: rgba(184, 169, 157, 0.4); }
    :host(.dark-theme) .chat-messages::-webkit-scrollbar-thumb { background: rgba(184, 169, 157, 0.2); }
    :host(.dark-theme) .chat-messages::-webkit-scrollbar-thumb:hover { background: rgba(184, 169, 157, 0.35); }
    :host(.dark-theme) .thinking-content-inner::-webkit-scrollbar-thumb { background: rgba(224, 125, 92, 0.2); }
    :host(.dark-theme) .thinking-content-inner::-webkit-scrollbar-thumb:hover { background: rgba(224, 125, 92, 0.35); }
    .result-box pre code, .bubble-ai pre code, .thinking-content-inner pre code { white-space: pre-wrap !important; word-break: break-word !important; overflow-wrap: break-word !important; }
    .result-box pre, .bubble-ai pre, .thinking-content-inner pre { white-space: pre-wrap !important; word-break: break-word !important; overflow-wrap: break-word !important; overflow-x: hidden !important; max-width: 100% !important; box-sizing: border-box !important; }
    .result-box, .bubble-ai, .thinking-content-inner, .result-box p, .bubble-ai p, .thinking-content-inner p { word-break: break-word !important; overflow-wrap: break-word !important; white-space: normal !important; hyphens: auto; overflow-x: hidden !important; max-width: 100% !important; }
    .result-box a, .bubble-ai a, .thinking-content-inner a { word-break: break-all !important; overflow-wrap: break-word !important; hyphens: auto; }
    .result-box, .bubble-ai, .thinking-content-inner { box-sizing: border-box !important; width: 100% !important; }
    .send-btn { width: 52px; height: 52px; border-radius: var(--radius-full); padding: 0; flex-shrink: 0; display: flex; align-items: center; justify-content: center; background: var(--primary-gradient); border: none; cursor: pointer; transition: all var(--transition-normal); box-shadow: var(--shadow-glow); }
    .send-btn:hover { transform: scale(1.08) rotate(5deg); box-shadow: 0 8px 30px var(--primary-glow); }
    .send-btn:active { transform: scale(0.95); }
    .send-btn:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }
    .send-btn svg { width: 22px; height: 22px; fill: white; margin-left: 3px; filter: drop-shadow(0 1px 2px rgba(0,0,0,0.2)); }
    .settings-page { background: var(--bg-setting); min-height: 100%; padding: 24px; box-sizing: border-box; }
    .settings-group { background: var(--bg-card); border-radius: var(--radius-lg); overflow: hidden; margin-bottom: 24px; box-shadow: var(--shadow-sm); border: 1px solid var(--border-light); }
    .settings-group-title { font-size: 11px; color: var(--primary); text-transform: uppercase; padding: 20px 20px 10px; font-weight: 700; letter-spacing: 0.1em; display: flex; align-items: center; gap: 8px; }
    .settings-group-title::before { content: ''; width: 4px; height: 14px; background: var(--primary-gradient); border-radius: 2px; }
    .setting-item { padding: 18px 20px; border-bottom: 1px solid var(--border-light); transition: background var(--transition-fast); }
    .setting-item:last-child { border-bottom: none; }
    .setting-item:hover { background: var(--bg-hover); }
    .setting-label { font-size: 14px; font-weight: 600; color: var(--text-main); margin-bottom: 6px; display: block; }
    .setting-desc { font-size: 12px; color: var(--text-sec); margin-bottom: 12px; line-height: 1.6; }
    .setting-item-row { display: flex; justify-content: space-between; align-items: center; }
    .setting-item-row .setting-info { flex: 1; margin-right: 16px; }
    .setting-item-row .setting-label { margin-bottom: 4px; }
    .setting-item-row .setting-desc { margin-bottom: 0; }
    .api-profile-row { display: flex; flex-direction: column; gap: 10px; align-items: stretch; }
    .api-profile-list { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 8px; }
    .api-profile-card { min-height: 58px; padding: 10px 12px; border: 1.5px solid var(--border-light); border-radius: var(--radius-sm); background: var(--bg-card); color: var(--text-main); text-align: left; font: inherit; cursor: pointer; transition: all var(--transition-fast); overflow: hidden; }
    .api-profile-card:hover, .api-profile-card:focus { border-color: var(--primary); background: var(--bg-hover); outline: none; }
    .api-profile-card[aria-selected="true"] { border-color: var(--primary); box-shadow: 0 0 0 2px rgba(201, 100, 66, 0.14); background: var(--bg-hover); }
    .api-profile-card-title { display: block; font-size: 13px; font-weight: 700; line-height: 1.35; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .api-profile-card-meta { display: block; margin-top: 4px; font-size: 11px; color: var(--text-sec); line-height: 1.35; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .api-profile-actions { display: flex; gap: 6px; flex: 0 0 auto; }
    .api-profile-actions .btn-xs { min-width: 38px; padding: 0 10px; height: 40px; }
    .api-profile-summary { margin-top: 10px; margin-bottom: 0; overflow-wrap: anywhere; }
    .model-input-row { display: flex; gap: 10px; align-items: center; }
    .model-input-row input { flex: 1; min-width: 0; }
    .model-fetch-btn { flex: 0 0 auto; padding: 0 14px; height: 48px; }
    .model-picker-overlay { position: absolute; inset: 0; z-index: 10002; display: none; align-items: center; justify-content: center; padding: 22px; background: rgba(45, 37, 32, 0.42); backdrop-filter: blur(6px); -webkit-backdrop-filter: blur(6px); }
    .model-picker-overlay.show { display: flex; }
    .model-picker-dialog { width: 100%; max-width: 380px; max-height: 72vh; display: flex; flex-direction: column; background: var(--bg-card); border: 1px solid var(--border-light); border-radius: var(--radius-lg); box-shadow: var(--shadow-xl); overflow: hidden; }
    .model-picker-header { display: flex; align-items: center; justify-content: space-between; padding: 16px 18px; border-bottom: 1px solid var(--border-light); }
    .model-picker-title { font-size: 14px; font-weight: 700; color: var(--text-main); }
    .model-picker-status { padding: 12px 18px; color: var(--text-sec); font-size: 12px; line-height: 1.5; border-bottom: 1px solid var(--border-light); }
    .model-picker-status.error { color: var(--danger); }
    .model-picker-list { flex: 1; min-height: 120px; overflow-y: auto; padding: 8px; }
    .model-option { width: 100%; padding: 10px 12px; border: none; border-radius: var(--radius-sm); background: transparent; color: var(--text-main); text-align: left; font: inherit; font-size: 13px; cursor: pointer; transition: background var(--transition-fast), color var(--transition-fast); overflow-wrap: anywhere; }
    .model-option:hover { background: var(--bg-hover); color: var(--primary); }
    .model-picker-actions { display: flex; gap: 8px; justify-content: flex-end; padding: 12px 18px 16px; border-top: 1px solid var(--border-light); }
    .toggle-switch { position: relative; width: 52px; height: 28px; flex-shrink: 0; }
    .toggle-switch input { opacity: 0; width: 0; height: 0; position: absolute; }
    .toggle-slider { position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0; background: var(--border-medium); border-radius: var(--radius-full); transition: all var(--transition-normal); }
    .toggle-slider::before { content: ''; position: absolute; height: 22px; width: 22px; left: 3px; bottom: 3px; background: white; border-radius: 50%; transition: all var(--transition-normal); box-shadow: var(--shadow-sm); }
    .toggle-switch input:checked + .toggle-slider { background: var(--primary-gradient); box-shadow: var(--shadow-glow); }
    .toggle-switch input:checked + .toggle-slider::before { transform: translateX(24px); }
    .toggle-switch input:focus + .toggle-slider { box-shadow: 0 0 0 3px rgba(201, 100, 66, 0.2); }
    .range-setting-control { width: min(160px, 42%); flex: 0 0 auto; display: grid; grid-template-columns: minmax(76px, 1fr) 42px; align-items: center; gap: 8px; }
    .range-setting-control input[type="range"] { min-height: 40px; padding: 0; border: none; background: transparent; box-shadow: none; accent-color: var(--primary); cursor: pointer; }
    .range-setting-control output { color: var(--text-sec); font-size: 12px; font-variant-numeric: tabular-nums; text-align: right; }
    @supports not ((backdrop-filter: blur(1px)) or (-webkit-backdrop-filter: blur(1px))) {
        .message-context-menu, .summary-selection-menu { background: var(--bg-card); }
    }
    @media (prefers-reduced-transparency: reduce), (prefers-contrast: more) {
        .message-context-menu, .summary-selection-menu { background: var(--bg-card); backdrop-filter: none; -webkit-backdrop-filter: none; }
    }
    @media (forced-colors: active) {
        .message-context-menu, .summary-selection-menu { color: CanvasText; background: Canvas; border-color: CanvasText; box-shadow: none; backdrop-filter: none; -webkit-backdrop-filter: none; }
    }
    .spinner { width: 20px; height: 20px; border: 2.5px solid rgba(255,255,255,0.25); border-top-color: #fff; border-radius: 50%; animation: spin 0.7s linear infinite; display: none; }
    .btn.loading .spinner { display: inline-block; }
    .btn.loading .btn-text { display: none; }
    @keyframes spin { to { transform: rotate(360deg); } }
    .thinking { display: flex; gap: 5px; padding: 8px 0; }
    .thinking-dot { width: 8px; height: 8px; background: var(--primary); border-radius: 50%; animation: thinking 1.4s ease-in-out infinite; }
    .thinking-dot:nth-child(2) { animation-delay: 0.2s; }
    .thinking-dot:nth-child(3) { animation-delay: 0.4s; }
    @keyframes thinking { 0%, 80%, 100% { transform: scale(0.6); opacity: 0.4; } 40% { transform: scale(1); opacity: 1; } }
    .tip-text { text-align: center; color: var(--text-muted); font-size: 14px; padding: 50px 24px; line-height: 2; }
    .tip-text strong { color: var(--primary); }
    .tip-text .tip-icon { font-size: 48px; display: block; margin-bottom: 16px; opacity: 0.7; }
    .hidden { display: none !important; }
    .content-area::-webkit-scrollbar { width: 6px; }
    .content-area::-webkit-scrollbar-track { background: rgba(201, 100, 66, 0.05); border-radius: 3px; }
    .content-area::-webkit-scrollbar-thumb { background: linear-gradient(180deg, var(--primary-light), var(--primary)); border-radius: 3px; }
    .content-area::-webkit-scrollbar-thumb:hover { background: linear-gradient(180deg, var(--primary), var(--primary-dark)); }
    .chat-messages::-webkit-scrollbar { width: 5px; }
    .chat-messages::-webkit-scrollbar-track { background: transparent; }
    .chat-messages::-webkit-scrollbar-thumb { background: rgba(156, 139, 128, 0.25); border-radius: 3px; }
    .chat-messages::-webkit-scrollbar-thumb:hover { background: rgba(156, 139, 128, 0.45); }
    input[type="number"] { -moz-appearance: textfield; }
    input[type="number"]::-webkit-outer-spin-button, input[type="number"]::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }
    .range-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px; }
    .range-buttons { display: flex; gap: 8px; }
    .range-inputs { display: flex; gap: 14px; align-items: center; }
    .range-inputs input { flex: 1; }
    .range-separator { color: var(--text-muted); font-size: 18px; font-weight: 300; }
    .shortcut-hint { display: flex; align-items: center; gap: 8px; font-size: 11px; color: var(--text-muted); margin-top: 12px; }
    .kbd { display: inline-flex; padding: 3px 7px; background: var(--bg-card); border: 1px solid var(--border-light); border-radius: 5px; font-family: 'JetBrains Mono', monospace; font-size: 10px; box-shadow: var(--shadow-sm); }
    .toast { position: absolute; bottom: 20px; left: 50%; transform: translateX(-50%) translateY(20px); background: var(--text-main); color: var(--text-inverse); padding: 12px 20px; border-radius: var(--radius-md); font-size: 12px; font-weight: 500; box-shadow: var(--shadow-lg); z-index: 10000; opacity: 0; pointer-events: none; transition: all var(--transition-normal); display: flex; align-items: center; gap: 8px; max-width: 90%; text-align: center; }
    .toast.show { transform: translateX(-50%) translateY(0); opacity: 1; }
    .toast.error { background: var(--danger); }
    @media (hover: none), (pointer: coarse) {
        .message-menu-trigger { opacity: 1; pointer-events: auto; }
    }
    @media (prefers-reduced-motion: reduce) {
        *, *::before, *::after { scroll-behavior: auto !important; animation-duration: 0.01ms !important; animation-iteration-count: 1 !important; transition-duration: 0.01ms !important; }
    }
        `;
    },

    render() {
        const arrowLeft = `<svg viewBox="0 0 24 24"><path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"/></svg>`;
        const sendIcon = `<svg viewBox="0 0 24 24"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>`;
        const arrowUpIcon = `<svg viewBox="0 0 24 24"><path d="M7.41 15.41L12 10.83l4.59 4.58L18 14l-6-6-6 6z"/></svg>`;
        const arrowDownIcon = `<svg viewBox="0 0 24 24"><path d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6z"/></svg>`;

        const html = `
            <!-- 悬浮按钮 -->
            <button type="button" id="toggle-btn" title="拖动改变位置，点击展开/关闭 (Ctrl+Shift+S)" aria-label="打开智能总结侧栏" aria-expanded="false" aria-controls="sidebar">${arrowLeft}</button>
            <!-- 侧边栏 -->
            <div class="sidebar-panel" id="sidebar">
                <div class="resize-handle" id="resizer"></div>
                <div class="toast" id="toast"></div>
                <div class="model-picker-overlay" id="model-picker-modal" aria-hidden="true">
                    <div class="model-picker-dialog" role="dialog" aria-modal="true" aria-labelledby="model-picker-title">
                        <div class="model-picker-header">
                            <div class="model-picker-title" id="model-picker-title">选择模型</div>
                            <button class="icon-btn" id="btn-close-model-picker" data-tooltip="关闭">✕</button>
                        </div>
                        <div class="model-picker-status" id="model-picker-status">填写 API 地址和 API Key 后获取模型列表。</div>
                        <div class="model-picker-list" id="model-picker-list"></div>
                        <div class="model-picker-actions">
                            <button class="btn-xs" id="btn-refresh-models">重新获取</button>
                            <button class="btn-xs" id="btn-cancel-model-picker">取消</button>
                        </div>
                    </div>
                </div>
                <!-- Header -->
                <div class="header">
                    <div class="header-title">
                        <div class="header-title-icon">🧠</div>
                        智能总结
                    </div>
                    <div class="header-actions">
                        <button type="button" class="icon-btn" id="btn-theme" data-tooltip="切换主题" aria-label="切换明暗主题">🌙</button>
                        <button type="button" class="icon-btn" id="btn-close" data-tooltip="关闭" aria-label="关闭智能总结侧栏">✕</button>
                    </div>
                </div>
                <!-- Tab 导航 -->
                <div class="tab-bar" role="tablist" aria-label="智能总结功能">
                    <button type="button" id="tab-summary" class="tab-item active" data-tab="summary" role="tab" aria-selected="true" aria-controls="page-summary"><span>📝 总结</span></button>
                    <button type="button" id="tab-chat" class="tab-item" data-tab="chat" role="tab" aria-selected="false" aria-controls="page-chat" tabindex="-1"><span>💬 对话</span></button>
                    <button type="button" id="tab-export" class="tab-item" data-tab="export" role="tab" aria-selected="false" aria-controls="page-export" tabindex="-1"><span>📦 导出</span></button>
                    <button type="button" id="tab-settings" class="tab-item" data-tab="settings" role="tab" aria-selected="false" aria-controls="page-settings" tabindex="-1"><span>⚙️ 设置</span></button>
                </div>
                <!-- 内容区 -->
                <div class="content-area">
                    <!-- 总结页面 -->
                    <div id="page-summary" class="view-page active" role="tabpanel" aria-labelledby="tab-summary">
                        <div class="form-group">
                            <div class="range-header">
                                <label class="form-label" style="margin:0;">楼层范围</label>
                                <div class="range-buttons">
                                    <button class="btn-xs" id="range-all">全部</button>
                                    <button class="btn-xs" id="range-recent">最近<span id="recent-count">50</span></button>
                                </div>
                            </div>
                            <div class="range-inputs">
                                <input type="number" id="inp-start" placeholder="起始楼层" min="1">
                                <span class="range-separator">→</span>
                                <input type="number" id="inp-end" placeholder="结束楼层" min="1">
                            </div>
                        </div>
                        <button class="btn" id="btn-summary">
                            <div class="spinner"></div>
                            <span class="btn-text">✨ 开始智能总结</span>
                        </button>
                        <button class="btn-xs" id="btn-refresh-summary-cache" style="margin-top:8px;width:100%;">重新获取楼层</button>
                        <div class="summary-result-wrapper">
                            <div id="summary-result" class="result-box empty">
                                <div class="tip-text">
                                    <span class="tip-icon">🤖</span>
                                    点击「开始智能总结」后，<br>AI 将分析帖子内容并生成摘要<br><br>
                                    💡 总结完成后可切换到<strong>「对话」</strong>继续追问
                                </div>
                            </div>
                            <div class="scroll-buttons summary-bottom-area">
                                <button type="button" class="scroll-btn" id="btn-summary-scroll-bottom" title="跳到最新内容" aria-label="跳到最新内容" aria-hidden="true" tabindex="-1">${arrowDownIcon}</button>
                            </div>
                        </div>
                        <div class="shortcut-hint">
                            <span class="kbd">Ctrl</span>+<span class="kbd">Shift</span>+<span class="kbd">S</span> 快速打开
                        </div>
                    </div>
                    <!-- 对话页面 -->
                    <div id="page-chat" class="view-page" role="tabpanel" aria-labelledby="tab-chat" hidden>
                        <div class="chat-container">
                            <div class="chat-toolbar">
                                <div class="chat-toolbar-title">
                                    对话记录
                                    <span class="msg-count" id="msg-count">0</span>
                                </div>
                                <button class="btn-clear" id="btn-clear-chat" title="清空对话">
                                    🗑️ 清空
                                </button>
                            </div>
                            <div class="chat-messages-wrapper">
                                <div class="scroll-buttons top-area">
                                    <button type="button" class="scroll-btn" id="btn-scroll-top" title="滚动到顶部" aria-label="滚动到顶部" aria-hidden="true" tabindex="-1">${arrowUpIcon}</button>
                                </div>
                                <div class="chat-messages" id="chat-messages">
                                    <div id="chat-list" class="chat-list"></div>
                                    <div id="chat-empty" class="tip-text">
                                        <span class="tip-icon">💬</span>
                                        请先在<strong>「总结」</strong>页面生成内容摘要，<br>然后即可基于上下文进行对话
                                    </div>
                                </div>
                                <div class="scroll-buttons bottom-area">
                                    <button type="button" class="scroll-btn" id="btn-scroll-bottom" title="跳到最新消息" aria-label="跳到最新消息" aria-hidden="true" tabindex="-1">${arrowDownIcon}</button>
                                </div>
                            </div>
                            <div class="chat-input-area">
                                <div class="chat-input-row">
                                    <textarea id="chat-input" class="chat-input" placeholder="输入你的问题... (Enter 发送)" rows="1"></textarea>
                                    <button class="send-btn" id="btn-send" title="发送消息">${sendIcon}</button>
                                </div>
                            </div>
                        </div>
                    </div>
                    <!-- 导出页面 -->
                    <div id="page-export" class="view-page" role="tabpanel" aria-labelledby="tab-export" hidden>
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
                                <input type="number" id="export-start" placeholder="起始楼层" min="1">
                                <span class="range-separator">→</span>
                                <input type="number" id="export-end" placeholder="结束楼层" min="1">
                            </div>
                        </div>
                        <div id="html-export-options" class="form-group">
                            <label class="form-label">HTML 导出选项</label>
                            <div class="setting-item-row" style="margin-bottom:12px;">
                                <div class="setting-info">
                                    <label class="setting-label" style="font-size:13px;">离线图片</label>
                                    <div class="setting-desc" style="font-size:11px;">将图片转为 base64 嵌入</div>
                                </div>
                                <label class="toggle-switch">
                                    <input type="checkbox" id="export-offline-images" checked>
                                    <span class="toggle-slider"></span>
                                </label>
                            </div>
                            <label class="setting-label" style="font-size:13px;margin-bottom:8px;">主题选择</label>
                            <select id="export-theme">
                                <option value="light">浅色主题</option>
                                <option value="dark">深色主题</option>
                            </select>
                        </div>
                        <div id="ai-text-options" class="form-group" style="display:none;">
                            <label class="form-label">AI 文本选项</label>
                            <div class="setting-item-row" style="margin-bottom:12px;">
                                <div class="setting-info">
                                    <label class="setting-label" style="font-size:13px;">包含头部信息</label>
                                    <div class="setting-desc" style="font-size:11px;">标题、作者、时间等</div>
                                </div>
                                <label class="toggle-switch">
                                    <input type="checkbox" id="export-ai-header" checked>
                                    <span class="toggle-slider"></span>
                                </label>
                            </div>
                            <div class="setting-item-row" style="margin-bottom:12px;">
                                <div class="setting-info">
                                    <label class="setting-label" style="font-size:13px;">包含图片链接</label>
                                    <div class="setting-desc" style="font-size:11px;">保留图片 URL</div>
                                </div>
                                <label class="toggle-switch">
                                    <input type="checkbox" id="export-ai-images" checked>
                                    <span class="toggle-slider"></span>
                                </label>
                            </div>
                            <div class="setting-item-row">
                                <div class="setting-info">
                                    <label class="setting-label" style="font-size:13px;">包含引用块</label>
                                    <div class="setting-desc" style="font-size:11px;">保留引用内容</div>
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
                    <!-- 设置页面 -->
                    <div id="page-settings" class="view-page settings-page" role="tabpanel" aria-labelledby="tab-settings" hidden>
                        <div class="settings-group">
                            <div class="settings-group-title">API 配置</div>
                            <div class="setting-item">
                                <label class="setting-label">当前配置</label>
                                <div class="api-profile-row">
                                    <div id="cfg-profile-list" class="api-profile-list" role="listbox" aria-label="选择 API 配置"></div>
                                    <div class="api-profile-actions">
                                        <button type="button" class="btn-xs" id="btn-api-profile-add" title="新增配置">新增</button>
                                        <button type="button" class="btn-xs" id="btn-api-profile-copy" title="复制当前配置">复制</button>
                                        <button type="button" class="btn-xs" id="btn-api-profile-delete" title="删除当前配置">删除</button>
                                    </div>
                                </div>
                                <div class="setting-desc api-profile-summary" id="api-profile-summary">点击配置即可切换，编辑后会自动保存。</div>
                            </div>
                            <div class="setting-item">
                                <label class="setting-label">配置名称</label>
                                <input type="text" id="cfg-profile-name" placeholder="例如：DeepSeek / OpenAI / 本地代理">
                            </div>
                            <div class="setting-item">
                                <label class="setting-label">API 地址</label>
                                <input type="text" id="cfg-url" placeholder="https://api.deepseek.com/v1/chat/completions">
                            </div>
                            <div class="setting-item">
                                <label class="setting-label">API Key</label>
                                <input type="password" id="cfg-key" placeholder="sk-...">
                            </div>
                            <div class="setting-item">
                                <label class="setting-label">模型名称</label>
                                <div class="model-input-row">
                                    <input type="text" id="cfg-model" placeholder="deepseek-chat">
                                    <button type="button" class="btn-xs model-fetch-btn" id="btn-fetch-models">获取模型列表</button>
                                </div>
                                <div class="setting-desc">可从接口返回列表中选择，也可以手动输入模型名称。</div>
                            </div>
                        </div>
                        <div class="settings-group">
                            <div class="settings-group-title">提示词配置</div>
                            <div class="setting-item">
                                <label class="setting-label">总结提示词</label>
                                <div class="setting-desc">用于生成帖子摘要时的系统指令</div>
                                <textarea id="cfg-prompt-sum" rows="4"></textarea>
                            </div>
                            <div class="setting-item">
                                <label class="setting-label">对话提示词</label>
                                <div class="setting-desc">用于后续追问时的系统指令</div>
                                <textarea id="cfg-prompt-chat" rows="4"></textarea>
                            </div>
                        </div>
                        <div class="settings-group">
                            <div class="settings-group-title">高级设置</div>
                            <div class="setting-item setting-item-row">
                                <div class="setting-info">
                                    <label class="setting-label">快捷楼层数</label>
                                    <div class="setting-desc">"最近N楼"按钮的楼层数量</div>
                                </div>
                                <input type="number" id="cfg-recent-floors" min="10" max="500" style="width:80px; text-align:center; padding:8px 12px;">
                            </div>
                            <div class="setting-item setting-item-row">
                                <div class="setting-info">
                                    <label class="setting-label">流式输出</label>
                                    <div class="setting-desc">开启后内容会逐字显示，关闭则等待完成后一次性显示</div>
                                </div>
                                <label class="toggle-switch">
                                    <input type="checkbox" id="cfg-stream" checked>
                                    <span class="toggle-slider"></span>
                                </label>
                            </div>
                            <div class="setting-item setting-item-row">
                                <div class="setting-info">
                                    <label class="setting-label">自动滚动</label>
                                    <div class="setting-desc">生成内容时自动滚动到最新位置（正文和思考内容）</div>
                                </div>
                                <label class="toggle-switch">
                                    <input type="checkbox" id="cfg-autoscroll" checked>
                                    <span class="toggle-slider"></span>
                                </label>
                            </div>
                            <div class="setting-item setting-item-row floating-opacity-setting">
                                <div class="setting-info">
                                    <label class="setting-label" for="cfg-floating-menu-opacity">悬浮菜单不透明度</label>
                                    <div class="setting-desc" id="cfg-floating-menu-opacity-desc">仅影响选中文本和消息操作菜单；数值越低越透明</div>
                                </div>
                                <div class="range-setting-control">
                                    <input type="range" id="cfg-floating-menu-opacity" min="80" max="100" step="1" value="88" aria-describedby="cfg-floating-menu-opacity-desc">
                                    <output id="cfg-floating-menu-opacity-output" for="cfg-floating-menu-opacity">88%</output>
                                </div>
                            </div>
                        </div>
                        <button class="btn" id="btn-save">💾 保存设置</button>
                    </div>
                </div>
                ${this.getMessageContextMenuHtml()}
                ${this.getSummarySelectionMenuHtml()}
            </div>
        `;
        this.uiManager.shadow.innerHTML += html;
    },

    //
    // 3. 事件绑定与处理
    //
};
