import assert from 'node:assert/strict';
import test from 'node:test';
import { Core } from '../src/core/index.js';
import { style1Helpers } from '../src/ui/style1/helpers.js';

function createElement(initial = {}) {
  return {
    className: '',
    disabled: false,
    innerHTML: '',
    textContent: '',
    value: '',
    classList: {
      add() {},
      remove() {}
    },
    setAttribute() {},
    ...initial
  };
}

function createHarness() {
  const elements = new Map([
    ['#cfg-url', createElement({ value: 'https://api.example.invalid/v1/chat/completions' })],
    ['#cfg-key', createElement({ value: 'test-key' })],
    ['#model-picker-list', createElement()],
    ['#model-picker-status', createElement()],
    ['#model-picker-modal', createElement()],
    ['#btn-refresh-models', createElement()],
    ['#btn-fetch-models', createElement()]
  ]);

  const harness = Object.assign({}, style1Helpers, {
    uiManager: {
      Q(selector) {
        return elements.get(selector) || null;
      }
    },
    modelListRequestSeq: 0,
    modelListAbortController: null,
    modelListTimeoutId: null,
    modelListLoading: false,
    modelListTimeoutMs: 30,
    _timerIds: new Set(),
    renderedModels: [],
    renderModelOptions(models) {
      this.renderedModels = [...models];
    },
    setManagedTimeout(handler, delay) {
      let timerId = null;
      timerId = setTimeout(() => {
        this._timerIds.delete(timerId);
        handler();
      }, delay);
      this._timerIds.add(timerId);
      return timerId;
    },
    clearManagedTimeout(timerId) {
      if (timerId === null || timerId === undefined) return;
      clearTimeout(timerId);
      this._timerIds.delete(timerId);
    }
  });

  return { elements, harness };
}

function rejectWhenAborted(signal) {
  return new Promise((resolve, reject) => {
    signal.addEventListener('abort', () => {
      reject(new DOMException('The operation was aborted.', 'AbortError'));
    }, { once: true });
  });
}

test('model-list buttons are disabled only while a request is active', async (t) => {
  const originalFetchModelList = Core.fetchModelList;
  t.after(() => {
    Core.fetchModelList = originalFetchModelList;
  });

  let requestSignal = null;
  Core.fetchModelList = async (url, key, options) => {
    requestSignal = options.signal;
    return rejectWhenAborted(options.signal);
  };

  const { elements, harness } = createHarness();
  const request = harness.loadModelList();
  assert.equal(elements.get('#btn-refresh-models').disabled, true);
  assert.equal(elements.get('#btn-fetch-models').disabled, true);

  harness.closeModelPicker();
  await request;

  assert.equal(requestSignal.aborted, true);
  assert.equal(harness.modelListTimeoutId, null);
  assert.equal(elements.get('#btn-refresh-models').disabled, false);
  assert.equal(elements.get('#btn-fetch-models').disabled, false);
  assert.equal(harness._timerIds.size, 0);
});

test('model-list timeout aborts the request and restores controls', async (t) => {
  const originalFetchModelList = Core.fetchModelList;
  t.after(() => {
    Core.fetchModelList = originalFetchModelList;
  });

  Core.fetchModelList = async (url, key, options) => rejectWhenAborted(options.signal);
  const { elements, harness } = createHarness();
  harness.modelListTimeoutMs = 5;

  await harness.loadModelList();

  assert.match(elements.get('#model-picker-status').textContent, /获取模型列表超时/);
  assert.equal(elements.get('#model-picker-status').className, 'model-picker-status error');
  assert.equal(elements.get('#btn-refresh-models').disabled, false);
  assert.equal(elements.get('#btn-fetch-models').disabled, false);
  assert.equal(harness.modelListAbortController, null);
  assert.equal(harness.modelListTimeoutId, null);
  assert.equal(harness._timerIds.size, 0);
});

test('a successful model-list request renders models and clears lifecycle state', async (t) => {
  const originalFetchModelList = Core.fetchModelList;
  t.after(() => {
    Core.fetchModelList = originalFetchModelList;
  });

  Core.fetchModelList = async () => ({
    models: ['model-a', 'model-b'],
    url: 'https://api.example.invalid/v1/models'
  });
  const { elements, harness } = createHarness();

  await harness.loadModelList();

  assert.deepEqual(harness.renderedModels, ['model-a', 'model-b']);
  assert.match(elements.get('#model-picker-status').textContent, /获取 2 个模型/);
  assert.equal(elements.get('#btn-refresh-models').disabled, false);
  assert.equal(harness.modelListAbortController, null);
  assert.equal(harness.modelListTimeoutId, null);
  assert.equal(harness._timerIds.size, 0);
});

test('provider model IDs are rendered as text rather than HTML', (t) => {
  const originalDocument = globalThis.document;
  t.after(() => {
    globalThis.document = originalDocument;
  });

  const appended = [];
  const list = createElement({
    appendChild(element) {
      appended.push(element);
    }
  });
  globalThis.document = {
    createElement() {
      return createElement({ dataset: {} });
    }
  };

  style1Helpers.renderModelOptions.call({
    uiManager: {
      Q() {
        return list;
      }
    }
  }, ['<img src=x onerror=alert(1)>']);

  assert.equal(appended.length, 1);
  assert.equal(appended[0].textContent, '<img src=x onerror=alert(1)>');
  assert.equal(appended[0].innerHTML, '');
});
