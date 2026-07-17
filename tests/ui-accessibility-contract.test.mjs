import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import { style1Interactions } from '../src/ui/style1/interactions.js';
import { style1Lifecycle } from '../src/ui/style1/lifecycle.js';

const [style1PresentationSource, style1EventsSource, style1StateSource, style2Source, style2PresentationSource] = await Promise.all([
    readFile(new URL('../src/ui/style1/presentation.js', import.meta.url), 'utf8'),
    readFile(new URL('../src/ui/style1/events.js', import.meta.url), 'utf8'),
    readFile(new URL('../src/ui/style1/state.js', import.meta.url), 'utf8'),
    readFile(new URL('../src/ui/style2.js', import.meta.url), 'utf8'),
    readFile(new URL('../src/ui/style2/presentation.js', import.meta.url), 'utf8')
]);

function orderedIndices(text, fragments) {
    const indices = fragments.map(fragment => text.indexOf(fragment));
    assert.ok(indices.every(index => index >= 0), `missing ordered fragment in ${JSON.stringify(fragments)}`);
    assert.deepEqual(indices, [...indices].sort((left, right) => left - right));
}

test('selection toolbar is semantic and exposes only the three approved actions in order', () => {
    const html = style1Lifecycle.getSummarySelectionMenuHtml();

    assert.match(html, /role="toolbar"/);
    assert.match(html, /aria-label="总结选区操作"/);
    orderedIndices(html, [
        'data-summary-selection-action="explain"',
        'data-summary-selection-action="simplify"',
        'data-summary-selection-action="quote"'
    ]);
    assert.match(html, /data-summary-selection-action="explain"[^>]*tabindex="0"[^>]*>解释/);
    assert.match(html, /data-summary-selection-action="simplify"[^>]*tabindex="-1"[^>]*>精简/);
    assert.match(html, /data-summary-selection-action="quote"[^>]*tabindex="-1"[^>]*>引用到对话/);
    assert.doesNotMatch(html, /data-summary-selection-action="(?:ask|summarize|insert)"/);
});

test('selection toolbar supports roving keyboard focus and Escape dismissal', () => {
    const source = style1Interactions.bindSummarySelectionMenu.toString();

    assert.match(source, /addManagedListener\(menu, ['"]keydown['"]/);
    for (const key of ['ArrowRight', 'ArrowLeft', 'Home', 'End', 'Escape']) {
        assert.match(source, new RegExp(key));
    }
    assert.match(source, /\.focus\(\)/);
    assert.match(source, /closeSummarySelectionMenu/);
});

test('message menu, ellipsis trigger, and context-key entry use accessible semantics', () => {
    const menuHtml = style1Lifecycle.getMessageContextMenuHtml();
    const triggerSource = style1Interactions.ensureMessageMenuTrigger.toString();
    const bindingSource = style1Interactions.bindMessageContextMenu.toString();

    assert.match(menuHtml, /role="menu"/);
    assert.match(menuHtml, /aria-label="消息操作"/);
    assert.match(triggerSource, /document\.createElement\(['"]button['"]\)/);
    assert.match(triggerSource, /aria-haspopup/);
    assert.match(triggerSource, /aria-controls/);
    assert.match(triggerSource, /aria-expanded/);
    assert.match(triggerSource, /消息操作/);
    assert.match(bindingSource, /ContextMenu/);
    assert.match(bindingSource, /F10/);
    for (const key of ['ArrowDown', 'ArrowUp', 'Home', 'End', 'Escape']) {
        assert.match(bindingSource, new RegExp(key));
    }
    assert.match(bindingSource, /restoreFocus:\s*true/);
});

test('both themes render semantic tabs and keyboard navigation remains shared', () => {
    for (const source of [style1PresentationSource, style2Source]) {
        assert.match(source, /role="tablist"/);
        assert.match(source, /role="tab"/);
        assert.match(source, /aria-selected=/);
        assert.match(source, /aria-controls="page-summary"/);
        assert.match(source, /role="tabpanel"/);
        assert.match(source, /aria-labelledby="tab-summary"/);
    }

    for (const key of ['ArrowRight', 'ArrowLeft', 'Home', 'End']) {
        assert.match(style1EventsSource, new RegExp(key));
    }
    assert.match(style1StateSource, /tab\.tabIndex\s*=\s*active\s*\?\s*0\s*:\s*-1/);
    assert.match(style1StateSource, /panel\.hidden\s*=\s*!active/);
});

test('Style2 provides a no-squeeze narrow fallback and reduced-motion contract', () => {
    assert.match(style2Source, /window\.innerWidth\s*<=\s*700/);
    assert.match(style2Source, /classList\.toggle\(['"]narrow-viewport['"]/);
    assert.match(style2Source, /if\s*\(!active\s*\|\|\s*this\.isNarrowViewport\(\)\)/);
    assert.match(style2Source, /body\.style\.marginLeft\s*=\s*['"]/);
    assert.match(style2Source, /body\.style\.marginRight\s*=\s*['"]/);
    assert.match(style2PresentationSource, /@media \(max-width:\s*700px\)/);
    assert.match(style2PresentationSource, /width:\s*100vw/);
    assert.match(style2PresentationSource, /\.resize-handle\s*\{\s*display:\s*none/);
    assert.match(style2PresentationSource, /@media \(prefers-reduced-motion:\s*reduce\)/);
});

test('Style2 stays self-contained and avoids broad transition declarations', () => {
    assert.doesNotMatch(style2PresentationSource, /@import\s+url\(/);
    assert.doesNotMatch(style2PresentationSource, /https?:\/\//);
    assert.doesNotMatch(style2PresentationSource, /transition:\s*all\b/);
    assert.match(style2PresentationSource, /--ui-canvas:/);
    assert.match(style2PresentationSource, /--ui-surface:/);
    assert.match(style2PresentationSource, /--ui-accent:/);
    assert.match(style2PresentationSource, /--ui-focus-ring:/);
});
