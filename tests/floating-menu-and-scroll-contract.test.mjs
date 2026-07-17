import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import { CONFIG } from '../src/config.js';
import { style1Interactions } from '../src/ui/style1/interactions.js';
import { style1Lifecycle } from '../src/ui/style1/lifecycle.js';
import { style1State } from '../src/ui/style1/state.js';

const [style1Presentation, style2Presentation, style2Source, eventsSource] = await Promise.all([
    readFile(new URL('../src/ui/style1/presentation.js', import.meta.url), 'utf8'),
    readFile(new URL('../src/ui/style2/presentation.js', import.meta.url), 'utf8'),
    readFile(new URL('../src/ui/style2.js', import.meta.url), 'utf8'),
    readFile(new URL('../src/ui/style1/events.js', import.meta.url), 'utf8')
]);

test('floating-menu opacity is one shared persisted setting with the approved range', () => {
    assert.equal(CONFIG.floatingMenuOpacityKey, 'floatingMenuOpacity');
    assert.equal(CONFIG.floatingMenuOpacityDefault, 88);
    assert.equal(CONFIG.floatingMenuOpacityMin, 80);
    assert.equal(CONFIG.floatingMenuOpacityMax, 100);
    assert.equal(CONFIG.floatingMenuOpacityStep, 1);
    assert.ok(CONFIG.configSyncKeys.includes(CONFIG.floatingMenuOpacityKey));

    const hostValues = [];
    const context = {
        normalizeFloatingMenuOpacity: style1State.normalizeFloatingMenuOpacity,
        uiManager: {
            host: { style: { setProperty: (...args) => hostValues.push(args) } },
            Q: () => null
        }
    };
    assert.equal(style1State.applyFloatingMenuOpacity.call(context, 79), 80);
    assert.equal(style1State.applyFloatingMenuOpacity.call(context, 101), 100);
    assert.equal(style1State.applyFloatingMenuOpacity.call(context, 'bad'), 88);
    assert.deepEqual(hostValues, [
        ['--floating-menu-opacity', '80%'],
        ['--floating-menu-opacity', '100%'],
        ['--floating-menu-opacity', '88%']
    ]);

    for (const source of [style1Presentation, style2Source]) {
        assert.match(source, /id="cfg-floating-menu-opacity"[^>]*min="80"[^>]*max="100"[^>]*step="1"/);
    }
    assert.match(eventsSource, /GM_setValue\(CONFIG\.floatingMenuOpacityKey, floatingMenuOpacity\)/);
    assert.match(eventsSource, /applyFloatingMenuOpacityStorageSnapshot/);
});

test('only the two approved floating menus use configurable glass with robust fallbacks', () => {
    for (const source of [style1Presentation, style2Presentation]) {
        assert.match(source, /--floating-menu-opacity:\s*88%/);
        assert.match(source, /\.message-context-menu[^}]*background:[^;}]+;\s*background:\s*var\([^)]*floating-menu-surface\)/s);
        assert.match(source, /\.summary-selection-menu[^}]*background:[^;}]+;\s*background:\s*var\([^)]*floating-menu-surface\)/s);
        assert.match(source, /\.message-context-menu[^}]*backdrop-filter:\s*blur\(12px\)/s);
        assert.match(source, /\.summary-selection-menu[^}]*backdrop-filter:\s*blur\(12px\)/s);
        assert.match(source, /@supports not \(\(backdrop-filter:/);
        assert.match(source, /prefers-reduced-transparency:\s*reduce/);
        assert.match(source, /forced-colors:\s*active/);
    }
});

test('message action menu is compact in CSS and viewport positioning', () => {
    for (const source of [style1Presentation, style2Presentation]) {
        assert.match(source, /\.message-context-menu[^}]*width:\s*max-content/s);
        assert.match(source, /\.message-context-menu[^}]*min-width:\s*112px/s);
        assert.match(source, /\.message-context-menu[^}]*max-width:\s*180px/s);
        assert.match(source, /\.message-context-menu\.show\s*\{[^}]*display:\s*grid/s);
        assert.match(source, /\.message-menu-item[^}]*width:\s*auto/s);
        assert.match(source, /\.message-menu-item[^}]*min-width:\s*100%/s);
        assert.doesNotMatch(source, /\.message-menu-item[^}]*(?<!-)width:\s*100%/s);
        assert.match(source, /\.message-menu-item[^}]*white-space:\s*nowrap/s);
    }
    const positioning = style1Interactions.positionMessageContextMenu.toString();
    assert.match(positioning, /Math\.max\(112, Math\.min\(180,/);
    assert.match(positioning, /menu\.offsetWidth \|\| 112/);
});

test('summary, chat, and reasoning use local left-scroll shells with LTR content', () => {
    for (const source of [style1Presentation, style2Presentation]) {
        assert.match(source, /\.content-area\.summary-active\s*\{[^}]*direction:\s*rtl/s);
        assert.match(source, /\.content-area\.summary-active\s*>\s*\*\s*\{[^}]*direction:\s*ltr/s);
        assert.match(source, /\.result-box\s*\{[^}]*direction:\s*rtl/s);
        assert.match(source, /\.result-box\s*>\s*\*\s*\{[^}]*direction:\s*ltr/s);
        assert.match(source, /\.chat-messages\s*\{[^}]*direction:\s*rtl/s);
        assert.match(source, /\.chat-messages\s*>\s*\*\s*\{[^}]*direction:\s*ltr/s);
        assert.match(source, /\.thinking-content-inner\s*\{[^}]*direction:\s*rtl/s);
        assert.match(source, /\.thinking-scroll-content\s*\{[^}]*direction:\s*ltr/s);
        assert.match(source, /pre[^}]*direction:\s*ltr/s);
    }
    assert.match(style1State.switchTab.toString(), /classList\.toggle\(['"]summary-active['"], tabName === ['"]summary['"]\)/);
    assert.match(style2Source, /restoreState\(\)[\s\S]*this\.switchTab\(this\.currentTab \|\| 'summary'\);/);
    assert.doesNotMatch(style1Lifecycle.getMessageContextMenuHtml(), /style=/);
});
