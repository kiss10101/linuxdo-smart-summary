import vm from 'node:vm';

const CORE_START = '    const Core = {';
const CORE_END = '\n    };\n\n    // =================================================================================\n    // 3. UI';

export function loadUserscriptCore(source, globals = {}) {
  const text = String(source || '');
  const declarationStart = text.indexOf(CORE_START);
  if (declarationStart < 0) throw new Error('userscript Core declaration not found');

  const objectStart = text.indexOf('{', declarationStart);
  const objectEndMarker = text.indexOf(CORE_END, objectStart);
  if (objectEndMarker < 0) throw new Error('userscript Core declaration end not found');

  const objectSource = text.slice(objectStart, objectEndMarker + '\n    }'.length);
  const context = vm.createContext({
    console,
    TextDecoder,
    TextEncoder,
    URL,
    AbortController,
    Blob,
    CONFIG: {
      defaultApiUrl: 'https://provider.example/v1/chat/completions',
      defaultModel: 'fixture-model'
    },
    GM_getValue: (_key, fallback) => fallback,
    ...globals
  });
  const Core = new vm.Script(`(${objectSource})`, {
    filename: 'userscript-core.fixture.js'
  }).runInContext(context);
  context.Core = Core;
  return { Core, context };
}

export function splitUtf8ByPattern(text, sizes = [1, 2, 3, 5, 8]) {
  const bytes = new TextEncoder().encode(String(text || ''));
  const chunks = [];
  let offset = 0;
  let index = 0;
  while (offset < bytes.length) {
    const requested = Math.max(1, Number(sizes[index % sizes.length]) || 1);
    const end = Math.min(bytes.length, offset + requested);
    chunks.push(bytes.slice(offset, end));
    offset = end;
    index += 1;
  }
  return chunks;
}

export function createStreamingResponse(chunks) {
  let index = 0;
  return {
    ok: true,
    status: 200,
    headers: { get: () => '' },
    body: {
      getReader() {
        return {
          async read() {
            if (index >= chunks.length) return { done: true, value: undefined };
            const value = chunks[index];
            index += 1;
            return { done: false, value };
          }
        };
      }
    }
  };
}

export function createJsonResponse(payload) {
  return {
    ok: true,
    status: 200,
    headers: { get: () => 'application/json' },
    async text() {
      return JSON.stringify(payload);
    }
  };
}
