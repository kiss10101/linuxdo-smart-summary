import assert from 'node:assert/strict';
import test from 'node:test';
import { Core } from '../src/core/index.js';

test('Core composes summary-selection behavior from source modules', () => {
  const normalized = Core.normalizeSummarySelectionText('  第一段\n\n第二段  ', { maxChars: 200 });
  assert.equal(normalized.text, '第一段 第二段');
  assert.equal(Core.isSummarySelectionTextUseful('AI'), true);
  assert.equal(Core.isSummarySelectionTextUseful('，。'), false);

  const simplify = Core.buildSummarySelectionPrompt('simplify', '继续精简');
  assert.equal(simplify.autoSend, true);
  assert.equal(simplify.action, 'simplify');
  assert.match(simplify.prompt, /更短、更清晰/);

  const quote = Core.buildSummarySelectionPrompt('quote', '引用片段');
  assert.equal(quote.autoSend, false);
  assert.equal(quote.action, 'quote');
  assert.match(quote.prompt, /^> 引用片段/);
});

test('Core keeps post timestamps stable in AI context', () => {
  const post = {
    post_number: 2,
    name: '示例用户',
    username: 'example_user',
    created_at: '2026-07-14T11:04:05+08:00',
    cooked: '正文'
  };

  assert.equal(Core.formatPostCreatedAt(post), '2026-07-14T03:04:05.000Z');
  assert.match(Core.formatPostForAiContext(post), /\n发帖时间: 2026-07-14T03:04:05\.000Z\n/);
});

test('Core sanitizes untrusted export filename fragments', () => {
  assert.equal(Core.sanitizeFilenamePart('  <script> bad:name\n  '), '_script_ bad_name_');
  assert.equal(Core.sanitizeFilenamePart(''), 'Linux.do 主题');
  assert.equal(Core.sanitizeFilenamePart('x'.repeat(200)).length, 160);
});

test('fetchModelList forwards AbortSignal and normalizes the models endpoint', async (t) => {
  const originalFetch = globalThis.fetch;
  t.after(() => {
    globalThis.fetch = originalFetch;
  });

  const controller = new AbortController();
  let request = null;
  globalThis.fetch = async (url, options) => {
    request = { url, options };
    return {
      ok: true,
      status: 200,
      statusText: 'OK',
      async text() {
        return JSON.stringify({ data: [{ id: 'model-b' }, { id: 'model-a' }] });
      }
    };
  };

  const result = await Core.fetchModelList(
    'https://api.example.invalid/v1/chat/completions?ignored=true',
    'test-key',
    { signal: controller.signal }
  );

  assert.equal(request.url, 'https://api.example.invalid/v1/models');
  assert.equal(request.options.signal, controller.signal);
  assert.equal(request.options.headers.Authorization, 'Bearer test-key');
  assert.deepEqual(result.models, ['model-b', 'model-a']);
});
