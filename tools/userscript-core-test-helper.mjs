import { Core as SourceCore } from '../src/core/index.js';

export function loadSourceCore(globals = {}) {
  Object.assign(globalThis, {
    TextDecoder,
    TextEncoder,
    URL,
    AbortController,
    Blob,
    GM_getValue: (_key, fallback) => fallback,
    ...globals
  });
  return { Core: SourceCore, context: globalThis };
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
