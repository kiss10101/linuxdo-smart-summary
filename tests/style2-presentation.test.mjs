import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const style2Source = await readFile(new URL('../src/ui/style2.js', import.meta.url), 'utf8');
const presentationSource = await readFile(new URL('../src/ui/style2/presentation.js', import.meta.url), 'utf8');

test('Style2 uses the independent warm-neutral and steel-blue presentation module', () => {
  assert.match(style2Source, /import \{ STYLE2_STYLES \} from '\.\/style2\/presentation\.js';/);
  assert.match(style2Source, /return STYLE2_STYLES;/);
  assert.match(presentationSource, /--ui-canvas:\s*oklch\(/);
  assert.match(presentationSource, /--ui-accent:\s*oklch\(/);
  assert.match(presentationSource, /:host\(\.dark-theme\)/);
  assert.doesNotMatch(presentationSource, /transition:\s*all\b/i);
  assert.doesNotMatch(presentationSource, /(?:https?:)?\/\//i);
  assert.doesNotMatch(`${style2Source}\n${presentationSource}`, /📦|💡|E3A043/i);
});

test('Style2 preserves attached desktop layout and switches to a narrow overlay', () => {
  assert.match(style2Source, /isNarrowViewport\(\)\s*\{[\s\S]*window\.visualViewport\?\.width/);
  assert.match(style2Source, /Math\.min\(window\.innerWidth, visualWidth\) <= 700/);
  assert.match(style2Source, /body\.style\.marginLeft = ''/);
  assert.match(style2Source, /getEffectiveSidebarWidth\(\)/);
  assert.match(presentationSource, /:host\(\.narrow-viewport\) \.sidebar-panel\s*\{[^}]*width:\s*min\(100vw,\s*var\(--ui-viewport-width,\s*100vw\)\)/);
  assert.match(presentationSource, /:host\(\.narrow-viewport\) \.resize-handle\s*\{\s*display:\s*none/);
  assert.match(presentationSource, /@media \(max-width:\s*700px\)/);
  assert.match(presentationSource, /@media \(prefers-reduced-motion:\s*reduce\)/);
});

test('Style2 renders semantic tabs, sidebar controls, and accessible touch targets', () => {
  assert.match(style2Source, /<button type="button" id="toggle-btn"[^>]*aria-controls="sidebar"[^>]*aria-expanded="false"/);
  assert.match(style2Source, /class="tab-bar" role="tablist"/);
  assert.equal((style2Source.match(/<button[^>]+role="tab"/g) || []).length, 4);
  assert.equal((style2Source.match(/<div[^>]+role="tabpanel"/g) || []).length, 4);
  assert.match(style2Source, /syncTabAccessibility\(tabName\)/);
  assert.match(style2Source, /restoreState\(\)[\s\S]*this\.switchTab\(this\.currentTab \|\| 'summary'\);/);
  assert.doesNotMatch(style2Source, /restoreState\(\)[\s\S]*this\.syncTabAccessibility\(this\.currentTab\);/);
  assert.doesNotMatch(style2Source, /addManagedListener\(tabBar, 'keydown'/);
  assert.match(presentationSource, /\.message-menu-item\s*\{[^}]*min-height:\s*40px/);
  assert.match(presentationSource, /\.summary-selection-item\s*\{[^}]*min-height:\s*40px/);
  assert.match(presentationSource, /\.send-btn\s*\{[^}]*width:\s*44px;[^}]*height:\s*44px/);
});

test('Style2 delegates the shared request lifecycle and dynamic message actions', () => {
  for (const method of [
    'beginChatRequestLifecycle',
    'isCurrentChatRequest',
    'setChatRequestPhase',
    'abortActiveChatRequest',
    'finalizeChatRequest',
    'ensureMessageMenuTrigger',
    'getMessageMenuActions',
    'getMessageMenuAction',
    'renderMessageContextMenuActions',
    'stopMessageUpdate'
  ]) {
    assert.match(style2Source, new RegExp(`${method}: UIRegistry\\.get\\('style1'\\)\\.${method}`));
  }
  assert.match(presentationSource, /\.message-menu-trigger/);
  assert.match(presentationSource, /\.bubble-stopped/);
});
