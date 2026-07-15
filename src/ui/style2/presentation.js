export const STYLE2_STYLES = `
    :host {
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI Variable Text", "Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif;
        color-scheme: light;
        --ui-canvas: oklch(0.965 0.008 82);
        --ui-surface: oklch(0.988 0.005 82);
        --ui-surface-raised: oklch(0.997 0.003 82);
        --ui-surface-muted: oklch(0.94 0.012 82);
        --ui-text: oklch(0.27 0.018 252);
        --ui-text-secondary: oklch(0.47 0.025 252);
        --ui-text-muted: oklch(0.61 0.022 252);
        --ui-accent: oklch(0.54 0.09 244);
        --ui-accent-hover: oklch(0.47 0.095 244);
        --ui-accent-soft: oklch(0.925 0.032 244);
        --ui-border: oklch(0.875 0.014 82);
        --ui-border-strong: oklch(0.79 0.018 82);
        --ui-success: oklch(0.52 0.105 160);
        --ui-success-soft: oklch(0.93 0.035 160);
        --ui-danger: oklch(0.52 0.13 28);
        --ui-danger-soft: oklch(0.94 0.035 28);
        --ui-warning: oklch(0.72 0.12 78);
        --ui-code: oklch(0.925 0.012 252);
        --ui-user-bubble: oklch(0.91 0.035 244);
        --ui-overlay: color-mix(in oklch, var(--ui-text) 38%, transparent);
        --ui-focus-ring: color-mix(in oklch, var(--ui-accent) 42%, transparent);
        --shadow-surface: 0 1px 2px color-mix(in oklch, var(--ui-text) 8%, transparent), 0 8px 24px color-mix(in oklch, var(--ui-text) 5%, transparent);
        --shadow-menu: 0 16px 42px color-mix(in oklch, var(--ui-text) 16%, transparent), 0 2px 8px color-mix(in oklch, var(--ui-text) 8%, transparent);

        /* Legacy aliases keep shared Style1 behavior presentation-agnostic. */
        --brand-gold: var(--ui-accent);
        --brand-gold-hover: var(--ui-accent-hover);
        --primary: var(--ui-accent);
        --primary-hover: var(--ui-accent-hover);
        --primary-light: var(--ui-accent-soft);
        --success: var(--ui-success);
        --success-light: var(--ui-success-soft);
        --danger: var(--ui-danger);
        --danger-light: var(--ui-danger-soft);
        --warning: var(--ui-warning);
        --bg-base: var(--ui-canvas);
        --bg-card: var(--ui-surface);
        --bg-glass: var(--ui-surface-raised);
        --bg-glass-dark: var(--ui-surface-raised);
        --bg-hover: var(--ui-surface-muted);
        --bg-active: var(--ui-accent-soft);
        --bg-setting: var(--ui-canvas);
        --bg-input: var(--ui-surface-raised);
        --border-light: var(--ui-border);
        --border-medium: var(--ui-border-strong);
        --shadow-sm: var(--shadow-surface);
        --shadow-md: var(--shadow-surface);
        --shadow-lg: var(--shadow-menu);
        --shadow-xl: var(--shadow-menu);
        --text-main: var(--ui-text);
        --text-sec: var(--ui-text-secondary);
        --text-muted: var(--ui-text-muted);
        --text-inverse: oklch(0.985 0.005 82);
        --sidebar-width: 420px;
        --btn-size: 44px;
        --radius-sm: 8px;
        --radius-md: 8px;
        --radius-lg: 12px;
        --radius-xl: 16px;
        --radius-full: 9999px;
        --transition-fast: 140ms cubic-bezier(0.22, 1, 0.36, 1);
        --transition-normal: 180ms cubic-bezier(0.22, 1, 0.36, 1);
        --transition-slow: 220ms cubic-bezier(0.22, 1, 0.36, 1);
    }

    :host(.dark-theme) {
        color-scheme: dark;
        --ui-canvas: oklch(0.195 0.014 252);
        --ui-surface: oklch(0.225 0.016 252);
        --ui-surface-raised: oklch(0.255 0.017 252);
        --ui-surface-muted: oklch(0.285 0.019 252);
        --ui-text: oklch(0.91 0.012 82);
        --ui-text-secondary: oklch(0.75 0.022 244);
        --ui-text-muted: oklch(0.63 0.025 244);
        --ui-accent: oklch(0.72 0.09 244);
        --ui-accent-hover: oklch(0.78 0.085 244);
        --ui-accent-soft: oklch(0.31 0.045 244);
        --ui-border: oklch(0.32 0.02 252);
        --ui-border-strong: oklch(0.4 0.024 252);
        --ui-success: oklch(0.72 0.1 160);
        --ui-success-soft: oklch(0.3 0.04 160);
        --ui-danger: oklch(0.73 0.12 28);
        --ui-danger-soft: oklch(0.29 0.055 28);
        --ui-warning: oklch(0.78 0.1 78);
        --ui-code: oklch(0.18 0.015 252);
        --ui-user-bubble: oklch(0.32 0.055 244);
        --ui-overlay: color-mix(in oklch, oklch(0.08 0.01 252) 68%, transparent);
        --ui-focus-ring: color-mix(in oklch, var(--ui-accent) 48%, transparent);
        --text-inverse: oklch(0.18 0.015 252);
    }

    * { box-sizing: border-box; }
    button, input, textarea, select { font: inherit; }
    button { -webkit-tap-highlight-color: transparent; }
    button:focus-visible, input:focus-visible, textarea:focus-visible, select:focus-visible, [tabindex]:focus-visible {
        outline: 3px solid var(--ui-focus-ring);
        outline-offset: 2px;
    }

    .sidebar-panel {
        position: fixed;
        top: 0;
        bottom: 0;
        width: min(var(--sidebar-width), 100vw);
        max-width: 100vw;
        z-index: 9998;
        display: flex;
        flex-direction: column;
        overflow: hidden;
        color: var(--ui-text);
        background: var(--ui-surface);
        border: 1px solid var(--ui-border);
        box-shadow: var(--shadow-menu);
        transition: transform var(--transition-slow);
    }
    .panel-left { left: 0; border-left: none; transform: translateX(-100%); }
    .panel-left.open { transform: translateX(0); }
    .panel-right { right: 0; border-right: none; transform: translateX(100%); }
    .panel-right.open { transform: translateX(0); }

    #toggle-btn {
        position: fixed;
        width: var(--btn-size);
        height: var(--btn-size);
        z-index: 9999;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 0;
        color: var(--ui-text-secondary);
        background: var(--ui-surface-raised);
        border: 1px solid var(--ui-border-strong);
        box-shadow: var(--shadow-surface);
        cursor: grab;
        user-select: none;
        transition: color var(--transition-fast), background-color var(--transition-fast), border-color var(--transition-fast), transform var(--transition-fast), opacity var(--transition-fast);
    }
    #toggle-btn:hover { color: var(--ui-accent); background: var(--ui-accent-soft); border-color: var(--ui-accent); }
    #toggle-btn:active { cursor: grabbing; transform: scale(0.96); }
    #toggle-btn svg { width: 19px; height: 19px; fill: none; stroke: currentColor; }
    .btn-snap-left { border-radius: 0 var(--radius-md) var(--radius-md) 0; border-left: none; }
    .btn-snap-right { border-radius: var(--radius-md) 0 0 var(--radius-md); border-right: none; }
    .btn-floating { border-radius: var(--radius-full); }

    .resize-handle { position: absolute; top: 0; bottom: 0; width: 6px; z-index: 10001; cursor: col-resize; background: transparent; }
    .resize-handle::after { content: ''; position: absolute; top: 50%; left: 50%; width: 2px; height: 48px; border-radius: 2px; background: var(--ui-border-strong); opacity: 0; transform: translate(-50%, -50%); transition: opacity var(--transition-fast), background-color var(--transition-fast); }
    .resize-handle:hover::after, .resize-handle:focus-visible::after { opacity: 1; background: var(--ui-accent); }
    .handle-left { right: -3px; }
    .handle-right { left: -3px; }

    .header { min-height: 64px; padding: 12px 16px 10px 18px; display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-shrink: 0; background: var(--ui-surface); border-bottom: 1px solid var(--ui-border); }
    .header-title { min-width: 0; display: flex; align-items: center; gap: 10px; color: var(--ui-text); font-size: 17px; font-weight: 680; letter-spacing: -0.015em; }
    .header-title-icon { width: 30px; height: 30px; display: flex; align-items: center; justify-content: center; flex: 0 0 auto; color: var(--ui-accent); background: var(--ui-accent-soft); border-radius: var(--radius-md); }
    .header-title-icon svg { width: 18px; height: 18px; }
    .header-actions { display: flex; align-items: center; gap: 4px; }
    .icon-btn { position: relative; width: 40px; height: 40px; min-height: 40px; padding: 0; display: flex; align-items: center; justify-content: center; color: var(--ui-text-muted); background: transparent; border: 1px solid transparent; border-radius: var(--radius-md); cursor: pointer; transition: color var(--transition-fast), background-color var(--transition-fast), border-color var(--transition-fast); }
    .icon-btn svg { width: 18px; height: 18px; }
    .icon-btn:hover { color: var(--ui-text); background: var(--ui-surface-muted); border-color: var(--ui-border); }
    .icon-btn[data-tooltip]::after { content: attr(data-tooltip); position: absolute; bottom: -34px; left: 50%; z-index: 100; padding: 5px 8px; color: var(--ui-surface); background: var(--ui-text); border-radius: var(--radius-sm); font-size: 11px; white-space: nowrap; opacity: 0; pointer-events: none; transform: translateX(-50%) translateY(-2px); transition: opacity var(--transition-fast), transform var(--transition-fast); }
    .icon-btn[data-tooltip]:hover::after, .icon-btn[data-tooltip]:focus-visible::after { opacity: 1; transform: translateX(-50%) translateY(0); }

    .tab-bar { min-height: 52px; display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); flex-shrink: 0; padding: 0 10px; background: var(--ui-surface); border-bottom: 1px solid var(--ui-border); }
    .tab-item { position: relative; min-width: 0; min-height: 48px; padding: 8px 6px; display: flex; align-items: center; justify-content: center; gap: 6px; color: var(--ui-text-secondary); background: transparent; border: none; border-radius: 0; cursor: pointer; font-size: 13px; font-weight: 560; white-space: nowrap; transition: color var(--transition-fast), background-color var(--transition-fast); }
    .tab-item::after { content: ''; position: absolute; right: 8px; bottom: -1px; left: 8px; height: 2px; border-radius: 2px 2px 0 0; background: var(--ui-accent); opacity: 0; transform: scaleX(0.55); transition: opacity var(--transition-fast), transform var(--transition-fast); }
    .tab-item svg { width: 16px; height: 16px; flex: 0 0 auto; opacity: 0.78; }
    .tab-item:hover { color: var(--ui-text); background: var(--ui-surface-muted); }
    .tab-item.active { color: var(--ui-accent); font-weight: 650; }
    .tab-item.active::after { opacity: 1; transform: scaleX(1); }
    .tab-item.active svg { opacity: 1; }

    .content-area { flex: 1; min-height: 0; overflow-y: auto; position: relative; background: var(--ui-canvas); overscroll-behavior: contain; }
    .content-area.chat-active { overflow: hidden; }
    .view-page { display: none; padding: 20px; animation: style2-fade-in var(--transition-normal); }
    .view-page.active { display: block; }
    #page-chat.view-page.active { display: flex; height: 100%; min-height: 0; }
    @keyframes style2-fade-in { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: translateY(0); } }

    .form-group { margin: 0 0 20px; }
    .form-label { display: block; margin: 0 0 8px; color: var(--ui-text-secondary); font-size: 12px; font-weight: 650; letter-spacing: 0.01em; }
    input, textarea, select { width: 100%; min-height: 42px; padding: 10px 12px; color: var(--ui-text); background: var(--ui-surface-raised); border: 1px solid var(--ui-border-strong); border-radius: var(--radius-md); font-size: 14px; transition: border-color var(--transition-fast), box-shadow var(--transition-fast), background-color var(--transition-fast); }
    input:hover, textarea:hover, select:hover { border-color: color-mix(in oklch, var(--ui-border-strong) 72%, var(--ui-accent)); }
    input:focus, textarea:focus, select:focus { border-color: var(--ui-accent); box-shadow: 0 0 0 3px var(--ui-focus-ring); outline: none; }
    input::placeholder, textarea::placeholder { color: var(--ui-text-muted); }
    textarea { min-height: 104px; resize: vertical; line-height: 1.6; }

    .btn { width: 100%; min-height: 44px; padding: 10px 16px; display: flex; align-items: center; justify-content: center; gap: 8px; color: var(--text-inverse); background: var(--ui-accent); border: 1px solid var(--ui-accent); border-radius: var(--radius-md); box-shadow: none; cursor: pointer; font-size: 14px; font-weight: 650; transition: color var(--transition-fast), background-color var(--transition-fast), border-color var(--transition-fast), transform var(--transition-fast), box-shadow var(--transition-fast); }
    .btn svg { width: 16px; height: 16px; }
    .btn:hover { background: var(--ui-accent-hover); border-color: var(--ui-accent-hover); box-shadow: var(--shadow-surface); }
    .btn:active { transform: translateY(1px); }
    .btn:disabled { opacity: 0.52; cursor: not-allowed; box-shadow: none; transform: none; }
    .btn.ai-stop-active { color: var(--ui-danger); background: var(--ui-danger-soft); border-color: color-mix(in oklch, var(--ui-danger) 48%, var(--ui-border)); }
    .btn-xs { min-height: 40px; padding: 8px 12px; color: var(--ui-text-secondary); background: var(--ui-surface); border: 1px solid var(--ui-border-strong); border-radius: var(--radius-md); cursor: pointer; font-size: 12px; font-weight: 600; white-space: nowrap; transition: color var(--transition-fast), background-color var(--transition-fast), border-color var(--transition-fast); }
    .btn-xs:hover { color: var(--ui-accent); background: var(--ui-accent-soft); border-color: var(--ui-accent); }
    .btn-xs:disabled, .btn-xs.loading { opacity: 0.55; cursor: wait; }

    .summary-result-wrapper { position: relative; }
    .result-box { position: relative; width: 100%; min-height: 150px; max-height: calc(100vh - 350px); margin-top: 16px; padding: 18px 18px 18px 22px; overflow-x: hidden; overflow-y: auto; color: var(--ui-text); background: var(--ui-surface); border: 1px solid var(--ui-border); border-radius: var(--radius-lg); box-shadow: none; font-size: 14px; line-height: 1.72; overflow-wrap: anywhere; direction: rtl; text-align: left; }
    .result-box > * { direction: ltr; }
    .result-box.empty { display: flex; align-items: center; justify-content: center; background: transparent; border-style: dashed; }
    .summary-coverage { margin-top: 16px; padding: 12px 14px; color: var(--ui-text-secondary); background: var(--ui-surface-muted); border: 1px solid var(--ui-border); border-radius: var(--radius-md); font-size: 12px; line-height: 1.6; }
    .summary-coverage summary { min-height: 40px; display: flex; align-items: center; color: var(--ui-text); cursor: pointer; font-weight: 650; }
    .summary-coverage dl { display: grid; grid-template-columns: max-content minmax(0, 1fr); gap: 6px 10px; margin: 8px 0 0; }
    .summary-coverage dt { color: var(--ui-text-secondary); font-weight: 650; }
    .summary-coverage dd { min-width: 0; margin: 0; color: var(--ui-text); overflow-wrap: anywhere; }
    .summary-coverage .coverage-warning { color: var(--ui-danger); }
    .ai-source-meta { margin-top: 10px; color: var(--ui-text-secondary); font-size: 12px; line-height: 1.5; overflow-wrap: anywhere; }
    .bubble .ai-source-meta { padding-top: 8px; border-top: 1px solid var(--ui-border); }
    .result-actions { position: absolute; top: 10px; right: 10px; opacity: 0; transition: opacity var(--transition-fast); }
    .result-box:hover .result-actions, .result-box:focus-within .result-actions { opacity: 1; }
    .result-action-btn { min-height: 40px; padding: 8px 11px; display: flex; align-items: center; gap: 5px; color: var(--ui-text-secondary); background: var(--ui-surface-raised); border: 1px solid var(--ui-border); border-radius: var(--radius-md); box-shadow: var(--shadow-surface); cursor: pointer; font-size: 12px; transition: color var(--transition-fast), background-color var(--transition-fast), border-color var(--transition-fast); }
    .result-action-btn:hover { color: var(--ui-accent); background: var(--ui-accent-soft); border-color: var(--ui-accent); }
    .result-action-btn.copied { color: var(--ui-success); border-color: var(--ui-success); }
    .result-action-btn svg { width: 13px; height: 13px; }

    .result-box h1, .result-box h2, .result-box h3, .bubble-ai h1, .bubble-ai h2, .bubble-ai h3 { color: var(--ui-text); font-weight: 680; letter-spacing: -0.01em; }
    .result-box h1 { margin: 20px 0 10px; font-size: 1.38em; }
    .result-box h2 { margin: 18px 0 8px; padding-bottom: 7px; border-bottom: 1px solid var(--ui-border); font-size: 1.2em; }
    .result-box h3 { margin: 16px 0 8px; color: var(--ui-text-secondary); font-size: 1.08em; }
    .result-box p, .bubble p { margin: 0 0 10px; }
    .result-box p:last-child, .bubble p:last-child { margin-bottom: 0; }
    .result-box ul, .result-box ol, .bubble ul, .bubble ol { margin: 10px 0; padding-left: 22px; }
    .result-box li, .bubble li { margin-bottom: 5px; }
    .result-box li::marker, .bubble li::marker { color: var(--ui-accent); }
    .result-box code, .bubble-ai code, .thinking-content code, .result-box pre code, .bubble-ai pre code, .thinking-content pre code { font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, "Liberation Mono", monospace !important; font-size: 12.5px !important; line-height: 1.55 !important; font-variant-ligatures: none; }
    .result-box code, .bubble-ai code, .thinking-content code:not(pre code) { max-width: 100%; display: inline; padding: 2px 5px; color: var(--ui-text); background: var(--ui-code); border: 1px solid var(--ui-border); border-radius: 5px; overflow-wrap: anywhere; }
    .result-box pre, .bubble-ai pre, .thinking-content-inner pre { max-width: 100%; margin: 12px 0 !important; padding: 14px !important; overflow: auto; color: var(--ui-text); background: var(--ui-code); border: 1px solid var(--ui-border); border-radius: var(--radius-md); white-space: pre !important; word-break: normal; tab-size: 4; }
    .result-box pre code, .bubble-ai pre code, .thinking-content-inner pre code { padding: 0; background: none; border: none; }
    .result-box blockquote, .bubble blockquote { margin: 12px 0; padding: 8px 14px; color: var(--ui-text-secondary); background: var(--ui-surface-muted); border-left: 3px solid var(--ui-accent); }
    .result-box a, .bubble a { color: var(--ui-accent); text-decoration-thickness: 1px; text-underline-offset: 3px; overflow-wrap: anywhere; }
    .result-box strong, .bubble strong { color: var(--ui-text); font-weight: 680; }
    .result-box table, .bubble table { display: block; max-width: 100%; overflow-x: auto; border-collapse: collapse; }
    .result-box th, .result-box td, .bubble th, .bubble td { padding: 7px 9px; border: 1px solid var(--ui-border); text-align: left; }

    .chat-container { width: 100%; height: 100%; min-height: 0; display: flex; flex: 1; flex-direction: column; position: relative; }
    .chat-toolbar { min-height: 44px; display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-shrink: 0; padding: 0 0 10px; border-bottom: 1px solid var(--ui-border); }
    .chat-toolbar-title { display: flex; align-items: center; gap: 8px; color: var(--ui-text-secondary); font-size: 13px; font-weight: 650; }
    .msg-count { min-width: 24px; padding: 2px 7px; color: var(--ui-accent); background: var(--ui-accent-soft); border-radius: var(--radius-full); font-size: 11px; font-weight: 650; text-align: center; }
    .btn-clear { min-height: 40px; padding: 8px 10px; display: flex; align-items: center; gap: 6px; color: var(--ui-danger); background: transparent; border: 1px solid transparent; border-radius: var(--radius-md); cursor: pointer; font-size: 12px; font-weight: 600; transition: color var(--transition-fast), background-color var(--transition-fast), border-color var(--transition-fast); }
    .btn-clear:hover { background: var(--ui-danger-soft); border-color: color-mix(in oklch, var(--ui-danger) 30%, var(--ui-border)); }
    .btn-clear svg { width: 14px; height: 14px; }
    .chat-messages-wrapper { flex: 1; min-height: 0; position: relative; overflow: hidden; }
    .chat-messages { height: 100%; min-height: 0; padding: 14px 4px 14px 8px; overflow-y: auto; overscroll-behavior: contain; direction: rtl; }
    .chat-messages > * { direction: ltr; }
    .chat-list { display: flex; flex-direction: column; gap: 14px; }
    .bubble { max-width: calc(100% - 32px); min-width: 0; position: relative; padding: 12px 15px; color: var(--ui-text); border: 1px solid transparent; border-radius: var(--radius-lg); box-shadow: none; font-size: 14px; line-height: 1.62; overflow-x: hidden; overflow-wrap: anywhere; }
    .bubble-user { align-self: flex-end; background: var(--ui-user-bubble); border-color: color-mix(in oklch, var(--ui-accent) 20%, var(--ui-border)); border-bottom-right-radius: 5px; }
    .bubble-ai { align-self: flex-start; background: var(--ui-surface); border-color: var(--ui-border); border-bottom-left-radius: 5px; }
    .bubble-ai h1, .bubble-ai h2 { margin: 10px 0 7px; font-size: 1.08em; }
    .bubble:focus-visible, .bubble.is-editing { outline: 3px solid var(--ui-focus-ring); outline-offset: 2px; }
    .bubble-error { color: var(--ui-text) !important; background: var(--ui-danger-soft) !important; border-color: color-mix(in oklch, var(--ui-danger) 55%, var(--ui-border)) !important; }
    .bubble-stopped { background: color-mix(in oklch, var(--ui-warning) 8%, var(--ui-surface)) !important; border-color: color-mix(in oklch, var(--ui-warning) 45%, var(--ui-border)) !important; }
    .bubble-streaming { border-color: color-mix(in oklch, var(--ui-accent) 36%, var(--ui-border)); }
    .bubble-error-title { margin-bottom: 6px; color: var(--ui-danger); font-weight: 680; }
    .bubble-error-detail { margin-bottom: 10px; color: var(--ui-text-secondary); font-size: 12px; line-height: 1.6; }
    .bubble-error-actions { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 10px; }
    .bubble-inline-action { min-height: 40px; padding: 8px 11px; color: var(--ui-text); background: var(--ui-surface); border: 1px solid var(--ui-border-strong); border-radius: var(--radius-md); cursor: pointer; font-size: 12px; transition: color var(--transition-fast), background-color var(--transition-fast), border-color var(--transition-fast); }
    .bubble-inline-action:hover { color: var(--ui-accent); background: var(--ui-accent-soft); border-color: var(--ui-accent); }
    .message-menu-trigger, .message-action-trigger, [data-message-menu-trigger] { position: absolute; top: 6px; right: 6px; width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; padding: 0; color: var(--ui-text-muted); background: var(--ui-surface-raised); border: 1px solid var(--ui-border); border-radius: var(--radius-md); box-shadow: var(--shadow-surface); cursor: pointer; opacity: 0; pointer-events: none; transition: opacity var(--transition-fast), color var(--transition-fast), background-color var(--transition-fast); }
    .bubble:hover .message-menu-trigger, .bubble:focus-within .message-menu-trigger, .bubble:hover .message-action-trigger, .bubble:focus-within .message-action-trigger, .bubble:hover [data-message-menu-trigger], .bubble:focus-within [data-message-menu-trigger] { opacity: 1; pointer-events: auto; }

    .message-context-menu { position: absolute; z-index: 10003; min-width: 164px; max-width: 240px; display: none; padding: 6px; background: var(--ui-surface-raised); border: 1px solid var(--ui-border); border-radius: var(--radius-md); box-shadow: var(--shadow-menu); }
    .message-context-menu.show { display: block; }
    .message-menu-item { width: 100%; min-height: 40px; padding: 9px 11px; color: var(--ui-text); background: transparent; border: none; border-radius: 6px; cursor: pointer; font-size: 13px; font-weight: 560; text-align: left; transition: color var(--transition-fast), background-color var(--transition-fast); }
    .message-menu-item:hover:not(:disabled), .message-menu-item:focus-visible:not(:disabled) { color: var(--ui-accent); background: var(--ui-accent-soft); }
    .message-menu-item.danger { color: var(--ui-danger); }
    .message-menu-item.danger:hover:not(:disabled), .message-menu-item.danger:focus-visible:not(:disabled) { color: var(--ui-danger); background: var(--ui-danger-soft); }
    .message-menu-item:disabled { opacity: 0.45; cursor: not-allowed; }

    .summary-selection-menu { position: absolute; z-index: 10004; max-width: calc(100% - 16px); display: none; flex-wrap: wrap; align-items: center; gap: 4px; padding: 6px; background: var(--ui-surface-raised); border: 1px solid var(--ui-border); border-radius: var(--radius-md); box-shadow: var(--shadow-menu); }
    .summary-selection-menu.show { display: flex; }
    .summary-selection-item { min-height: 40px; padding: 8px 11px; color: var(--ui-text); background: transparent; border: 1px solid transparent; border-radius: 6px; cursor: pointer; font-size: 12px; font-weight: 620; white-space: nowrap; transition: color var(--transition-fast), background-color var(--transition-fast), border-color var(--transition-fast); }
    .summary-selection-item:hover, .summary-selection-item:focus-visible { color: var(--ui-accent); background: var(--ui-accent-soft); border-color: color-mix(in oklch, var(--ui-accent) 24%, transparent); }

    .thinking-block { margin: 4px 0 10px; overflow: hidden; background: var(--ui-surface-muted); border: 1px solid var(--ui-border); border-radius: var(--radius-md); }
    .thinking-header { width: 100%; min-height: 40px; padding: 8px 11px; display: flex; align-items: center; justify-content: space-between; gap: 10px; color: inherit; background: transparent; border: none; cursor: pointer; text-align: left; user-select: none; transition: background-color var(--transition-fast); }
    .thinking-header:hover { background: color-mix(in oklch, var(--ui-accent-soft) 48%, transparent); }
    .thinking-header:focus-visible { outline: 3px solid var(--ui-focus-ring); outline-offset: -3px; }
    .thinking-header-left { min-width: 0; display: flex; align-items: center; gap: 7px; flex-wrap: wrap; }
    .thinking-icon { width: 16px; height: 16px; display: flex; align-items: center; justify-content: center; color: var(--ui-text-muted); }
    .thinking-icon svg { width: 14px; height: 14px; }
    .thinking-title { color: var(--ui-text-secondary); font-size: 12px; font-weight: 650; }
    .thinking-status { padding: 2px 6px; color: var(--ui-text-muted); background: var(--ui-surface); border-radius: 5px; font-size: 10px; }
    .thinking-toggle { width: 18px; height: 18px; display: flex; align-items: center; justify-content: center; flex: 0 0 auto; color: var(--ui-text-muted); }
    .thinking-toggle svg { width: 12px; height: 12px; transition: transform var(--transition-normal); }
    .thinking-block.expanded .thinking-toggle svg { transform: rotate(180deg); }
    .thinking-preview { max-height: 3.5em; padding: 0 11px 9px; overflow: hidden; color: var(--ui-text-muted); font-size: 11px; line-height: 1.45; overflow-wrap: anywhere; }
    .thinking-content[hidden] { display: none; }
    .thinking-content { max-height: 0; overflow: hidden; transition: max-height var(--transition-slow); }
    .thinking-block.expanded .thinking-content { max-height: min(60vh, 460px); }
    .thinking-content-inner { width: 100%; max-height: min(54vh, 420px); padding: 10px 11px; overflow: auto; color: var(--ui-text-secondary); background: var(--ui-surface); border-top: 1px dashed var(--ui-border-strong); font-size: 12px; line-height: 1.55; overflow-wrap: anywhere; }
    .ai-output-partial, .ai-output-failure { margin: 8px 0 10px; padding: 8px 10px; color: var(--ui-text-secondary); background: var(--ui-danger-soft); border-radius: var(--radius-md); font-size: 12px; line-height: 1.5; }

    .scroll-buttons { position: absolute; right: 10px; z-index: 10; }
    .scroll-buttons.top-area { top: 10px; }
    .scroll-buttons.bottom-area, .scroll-buttons.summary-bottom-area { bottom: 10px; }
    .scroll-btn { width: 40px; height: 40px; padding: 0; display: flex; align-items: center; justify-content: center; color: var(--ui-text-secondary); background: var(--ui-surface-raised); border: 1px solid var(--ui-border); border-radius: var(--radius-full); box-shadow: var(--shadow-surface); cursor: pointer; opacity: 0; pointer-events: none; transform: translateY(4px); transition: opacity var(--transition-fast), transform var(--transition-fast), color var(--transition-fast), border-color var(--transition-fast), background-color var(--transition-fast); }
    .scroll-btn.visible { opacity: 1; pointer-events: auto; transform: translateY(0); }
    .scroll-btn:hover { color: var(--ui-accent); background: var(--ui-accent-soft); border-color: var(--ui-accent); }
    .scroll-btn svg { width: 16px; height: 16px; }

    .chat-input-area { flex-shrink: 0; padding: 12px 0 max(2px, env(safe-area-inset-bottom)); background: var(--ui-canvas); border-top: 1px solid var(--ui-border); }
    .chat-input-row { display: flex; align-items: flex-end; gap: 9px; }
    .chat-input { flex: 1; min-height: 44px; max-height: 120px; padding: 10px 13px; resize: none; border-radius: var(--radius-lg); font-size: 14px; line-height: 1.5; }
    .send-btn { width: 44px; height: 44px; flex: 0 0 auto; padding: 0; display: flex; align-items: center; justify-content: center; color: var(--text-inverse); background: var(--ui-accent); border: 1px solid var(--ui-accent); border-radius: var(--radius-md); cursor: pointer; transition: color var(--transition-fast), background-color var(--transition-fast), border-color var(--transition-fast), transform var(--transition-fast); }
    .send-btn svg { width: 19px; height: 19px; fill: none; stroke: currentColor; }
    .send-btn:hover { background: var(--ui-accent-hover); border-color: var(--ui-accent-hover); }
    .send-btn:active { transform: translateY(1px); }
    .send-btn:disabled { opacity: 0.5; cursor: not-allowed; }
    .send-btn.ai-stop-active { color: var(--ui-danger); background: var(--ui-danger-soft); border-color: var(--ui-danger); font-size: 12px; font-weight: 650; }

    .settings-page { min-height: 100%; padding: 20px; background: var(--ui-canvas); }
    .settings-group { margin-bottom: 24px; padding: 0; background: transparent; border: none; border-radius: 0; box-shadow: none; overflow: visible; }
    .settings-group-title { padding: 0 2px 9px; color: var(--ui-text-muted); font-size: 11px; font-weight: 720; letter-spacing: 0.08em; text-transform: uppercase; }
    .setting-item { padding: 14px 0; border-top: 1px solid var(--ui-border); }
    .settings-group-title + .setting-item { border-top: none; }
    .setting-label { display: block; margin: 0 0 5px; color: var(--ui-text); font-size: 14px; font-weight: 620; }
    .setting-desc { margin: 0 0 10px; color: var(--ui-text-secondary); font-size: 12px; line-height: 1.5; }
    .setting-item-row { display: flex; align-items: center; justify-content: space-between; gap: 16px; }
    .setting-item-row .setting-info { min-width: 0; flex: 1; margin-right: 0; }
    .setting-item-row .setting-desc { margin-bottom: 0; }
    .api-profile-row { display: flex; flex-direction: column; align-items: stretch; gap: 9px; }
    .api-profile-list { display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 8px; }
    .api-profile-card { min-height: 56px; padding: 10px 11px; overflow: hidden; color: var(--ui-text); background: var(--ui-surface); border: 1px solid var(--ui-border-strong); border-radius: var(--radius-md); cursor: pointer; text-align: left; transition: color var(--transition-fast), background-color var(--transition-fast), border-color var(--transition-fast), box-shadow var(--transition-fast); }
    .api-profile-card:hover, .api-profile-card:focus-visible { background: var(--ui-surface-muted); border-color: var(--ui-accent); }
    .api-profile-card[aria-selected="true"] { background: var(--ui-accent-soft); border-color: var(--ui-accent); box-shadow: 0 0 0 2px var(--ui-focus-ring); }
    .api-profile-card-title { display: block; overflow: hidden; font-size: 13px; font-weight: 650; line-height: 1.35; text-overflow: ellipsis; white-space: nowrap; }
    .api-profile-card-meta { display: block; margin-top: 3px; overflow: hidden; color: var(--ui-text-secondary); font-size: 11px; line-height: 1.35; text-overflow: ellipsis; white-space: nowrap; }
    .api-profile-actions { display: flex; gap: 6px; flex: 0 0 auto; }
    .api-profile-actions .btn-xs { min-width: 48px; height: 40px; padding: 0 9px; }
    .api-profile-summary { margin-top: 8px; margin-bottom: 0; overflow-wrap: anywhere; }
    .model-input-row { display: flex; align-items: center; gap: 8px; }
    .model-input-row input { min-width: 0; flex: 1; }
    .model-fetch-btn { height: 42px; flex: 0 0 auto; padding: 0 11px; }

    .model-picker-overlay { position: absolute; inset: 0; z-index: 10002; display: none; align-items: center; justify-content: center; padding: 20px; background: var(--ui-overlay); }
    .model-picker-overlay.show { display: flex; }
    .model-picker-dialog { width: 100%; max-width: 360px; max-height: 72vh; display: flex; flex-direction: column; overflow: hidden; background: var(--ui-surface-raised); border: 1px solid var(--ui-border); border-radius: var(--radius-lg); box-shadow: var(--shadow-menu); }
    .model-picker-header { min-height: 54px; padding: 8px 9px 8px 16px; display: flex; align-items: center; justify-content: space-between; gap: 12px; border-bottom: 1px solid var(--ui-border); }
    .model-picker-title { color: var(--ui-text); font-size: 14px; font-weight: 680; }
    .model-picker-status { padding: 10px 16px; color: var(--ui-text-secondary); border-bottom: 1px solid var(--ui-border); font-size: 12px; line-height: 1.5; }
    .model-picker-status.error { color: var(--ui-danger); }
    .model-picker-list { min-height: 120px; flex: 1; padding: 7px; overflow-y: auto; }
    .model-option { width: 100%; min-height: 40px; padding: 9px 10px; color: var(--ui-text); background: transparent; border: none; border-radius: 6px; cursor: pointer; font-size: 13px; text-align: left; overflow-wrap: anywhere; transition: color var(--transition-fast), background-color var(--transition-fast); }
    .model-option:hover, .model-option:focus-visible { color: var(--ui-accent); background: var(--ui-accent-soft); }
    .model-picker-actions { padding: 11px 16px 14px; display: flex; justify-content: flex-end; gap: 8px; border-top: 1px solid var(--ui-border); }

    .toggle-switch { position: relative; width: 44px; height: 26px; flex: 0 0 auto; }
    .toggle-switch input { position: absolute; width: 1px; height: 1px; margin: -1px; padding: 0; overflow: hidden; opacity: 0; clip: rect(0 0 0 0); }
    .toggle-slider { position: absolute; inset: 0; cursor: pointer; background: var(--ui-border-strong); border-radius: var(--radius-full); transition: background-color var(--transition-normal), box-shadow var(--transition-normal); }
    .toggle-slider::before { content: ''; position: absolute; left: 3px; bottom: 3px; width: 20px; height: 20px; background: var(--ui-surface-raised); border-radius: 50%; box-shadow: 0 1px 3px color-mix(in oklch, var(--ui-text) 20%, transparent); transition: transform var(--transition-normal); }
    .toggle-switch input:focus-visible + .toggle-slider { box-shadow: 0 0 0 3px var(--ui-focus-ring); }
    .toggle-switch input:checked + .toggle-slider { background: var(--ui-accent); }
    .toggle-switch input:checked + .toggle-slider::before { transform: translateX(18px); }

    .spinner { width: 16px; height: 16px; display: none; border: 2px solid color-mix(in oklch, currentColor 30%, transparent); border-top-color: currentColor; border-radius: 50%; animation: style2-spin 0.8s linear infinite; }
    .btn.loading .spinner { display: inline-block; }
    .btn.loading .btn-text { display: none; }
    @keyframes style2-spin { to { transform: rotate(360deg); } }
    .thinking { display: flex; gap: 4px; padding: 4px 0; }
    .thinking-dot { width: 6px; height: 6px; background: var(--ui-text-muted); border-radius: 50%; animation: style2-thinking 1.4s ease-in-out infinite; }
    .thinking-dot:nth-child(2) { animation-delay: 0.2s; }
    .thinking-dot:nth-child(3) { animation-delay: 0.4s; }
    @keyframes style2-thinking { 0%, 80%, 100% { opacity: 0.42; transform: scale(0.72); } 40% { opacity: 1; transform: scale(1); } }

    .tip-text { padding: 36px 18px; color: var(--ui-text-muted); font-size: 13px; line-height: 1.75; text-align: center; }
    .tip-text strong { color: var(--ui-text); }
    .tip-icon { width: 42px; height: 42px; margin: 0 auto 12px; display: flex; align-items: center; justify-content: center; color: var(--ui-accent); background: var(--ui-accent-soft); border-radius: var(--radius-lg); }
    .tip-icon svg { width: 22px; height: 22px; }
    .hidden { display: none !important; }

    ::-webkit-scrollbar { width: 7px; height: 7px; }
    ::-webkit-scrollbar-track { background: transparent; }
    ::-webkit-scrollbar-thumb { background: color-mix(in oklch, var(--ui-text-muted) 34%, transparent); border-radius: var(--radius-full); }
    ::-webkit-scrollbar-thumb:hover { background: color-mix(in oklch, var(--ui-text-muted) 55%, transparent); }
    input[type="number"] { -moz-appearance: textfield; }
    input[type="number"]::-webkit-outer-spin-button, input[type="number"]::-webkit-inner-spin-button { margin: 0; -webkit-appearance: none; }
    .range-header { min-height: 40px; margin-bottom: 8px; display: flex; align-items: center; justify-content: space-between; gap: 12px; }
    .range-buttons { display: flex; gap: 6px; }
    .range-inputs { display: grid; grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr); align-items: center; gap: 9px; }
    .range-inputs input { min-width: 0; text-align: center; }
    .range-separator { color: var(--ui-text-muted); }
    .shortcut-hint { margin-top: 16px; display: flex; align-items: center; justify-content: center; gap: 5px; color: var(--ui-text-muted); font-size: 11px; }
    .kbd { min-width: 24px; min-height: 22px; padding: 2px 5px; display: inline-flex; align-items: center; justify-content: center; color: var(--ui-text-secondary); background: var(--ui-surface); border: 1px solid var(--ui-border-strong); border-radius: 5px; box-shadow: 0 1px 0 var(--ui-border); font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; font-size: 10px; }
    .toast { position: absolute; bottom: 20px; left: 50%; z-index: 10000; max-width: calc(100% - 32px); padding: 9px 14px; display: flex; align-items: center; gap: 8px; color: var(--ui-surface); background: var(--ui-text); border-radius: var(--radius-md); box-shadow: var(--shadow-menu); font-size: 13px; font-weight: 600; text-align: center; opacity: 0; pointer-events: none; transform: translateX(-50%) translateY(8px); transition: opacity var(--transition-normal), transform var(--transition-normal); }
    .toast.show { opacity: 1; transform: translateX(-50%) translateY(0); }
    .toast.error { color: var(--text-inverse); background: var(--ui-danger); }

    :host(.narrow-viewport) .sidebar-panel { width: 100vw; max-width: 100vw; border-right: none; border-left: none; }
    :host(.narrow-viewport) .resize-handle { display: none; }
    :host(.narrow-viewport) #toggle-btn.arrow-flip { opacity: 0; pointer-events: none; }
    :host(.narrow-viewport) .view-page, :host(.narrow-viewport) .settings-page { padding: 16px; }
    :host(.narrow-viewport) .tab-bar { padding: 0 4px; }
    :host(.narrow-viewport) .tab-item { gap: 4px; padding-inline: 3px; font-size: 12px; }
    :host(.narrow-viewport) .bubble { max-width: calc(100% - 12px); }
    :host(.narrow-viewport) .model-picker-overlay { align-items: flex-end; padding: 12px; }
    :host(.narrow-viewport) .model-picker-dialog { max-width: none; max-height: min(82vh, 680px); border-radius: var(--radius-lg); }

    @media (hover: none), (pointer: coarse) {
        .result-actions, .message-menu-trigger, .message-action-trigger, [data-message-menu-trigger] { opacity: 1; pointer-events: auto; }
        .icon-btn[data-tooltip]::after { display: none; }
    }

    @media (max-width: 700px) {
        .sidebar-panel { width: 100vw; max-width: 100vw; }
        .resize-handle { display: none; }
    }

    @media (prefers-reduced-motion: reduce) {
        *, *::before, *::after { scroll-behavior: auto !important; animation-duration: 1ms !important; animation-iteration-count: 1 !important; transition-duration: 1ms !important; }
        .view-page { animation: none; }
    }
`;
