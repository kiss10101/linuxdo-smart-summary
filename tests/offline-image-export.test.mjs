import assert from 'node:assert/strict';
import test from 'node:test';

import { Core } from '../src/core/index.js';
import { style1Helpers } from '../src/ui/style1/helpers.js';

function createHeaders(values = {}) {
    return {
        get(name) {
            return values[String(name).toLowerCase()] ?? null;
        }
    };
}

function createStreamingResponse(chunks, { contentLength = null } = {}) {
    let index = 0;
    let cancelled = 0;
    const reader = {
        async read() {
            if (index >= chunks.length) return { done: true, value: undefined };
            return { done: false, value: chunks[index++] };
        },
        async cancel() {
            cancelled += 1;
        }
    };
    const response = {
        ok: true,
        status: 200,
        headers: createHeaders(contentLength === null ? {} : { 'content-length': `${contentLength}` }),
        body: {
            getReader() {
                return reader;
            },
            async cancel() {
                cancelled += 1;
            }
        }
    };
    return {
        response,
        get cancelled() {
            return cancelled;
        },
        reader
    };
}

test('bounded image response rejects declared oversize before reading', async () => {
    let getReaderCalls = 0;
    let cancelCalls = 0;
    const response = {
        ok: true,
        headers: createHeaders({ 'content-length': '9' }),
        body: {
            getReader() {
                getReaderCalls += 1;
                return null;
            },
            async cancel() {
                cancelCalls += 1;
            }
        }
    };

    await assert.rejects(
        Core.readResponseBlobBounded(response, 8),
        (error) => error.name === 'ExportResourceLimitError' && error.code === 'export_resource_limit'
    );
    assert.equal(getReaderCalls, 0);
    assert.equal(cancelCalls, 1);
});

test('bounded image response cancels streamed reads at the byte limit', async () => {
    const streamed = createStreamingResponse([new Uint8Array([1, 2]), new Uint8Array([3, 4, 5])]);
    await assert.rejects(
        Core.readResponseBlobBounded(streamed.response, 4),
        (error) => error.name === 'ExportResourceLimitError'
    );
    assert.equal(streamed.cancelled, 1);

    const exact = createStreamingResponse([new Uint8Array([1, 2]), new Uint8Array([3, 4])]);
    const resource = await Core.readResponseBlobBounded(exact.response, 4, undefined, 'image/png');
    assert.equal(resource.byteLength, 4);
    assert.equal((await resource.blob.arrayBuffer()).byteLength, 4);
});

test('image fetch distinguishes external abort from timeout', async (t) => {
    const originalFetch = globalThis.fetch;
    t.after(() => {
        globalThis.fetch = originalFetch;
    });

    let fetchAbortCount = 0;
    globalThis.fetch = async (_url, { signal }) => new Promise((_resolve, reject) => {
        signal.addEventListener('abort', () => {
            fetchAbortCount += 1;
            const error = new Error('aborted');
            error.name = 'AbortError';
            reject(error);
        }, { once: true });
    });

    const external = new AbortController();
    const externalRequest = Core.fetchImageAsDataUrl('https://example.invalid/a.png', {
        signal: external.signal,
        timeoutMs: 1000
    });
    external.abort();
    await assert.rejects(externalRequest, (error) => error.name === 'AbortError');

    const timeoutRequest = Core.fetchImageAsDataUrl('https://example.invalid/b.png', {
        timeoutMs: 5
    });
    await assert.rejects(timeoutRequest, (error) => error.name === 'TimeoutError');
    assert.equal(fetchAbortCount, 2);
});

test('HTML export deduplicates image URLs and enforces encoded-byte budget', async (t) => {
    const originalPolicy = Core.offlineImageExportPolicy;
    const originalMethods = {
        absoluteUrl: Core.absoluteUrl,
        postHasImage: Core.postHasImage,
        sanitizeExportHtml: Core.sanitizeExportHtml,
        fetchImageAsDataUrl: Core.fetchImageAsDataUrl,
        downloadFile: Core.downloadFile,
        formatReplyRelationHtml: Core.formatReplyRelationHtml,
        formatBoostsHtml: Core.formatBoostsHtml,
        sanitizeFilenamePart: Core.sanitizeFilenamePart
    };
    t.after(() => {
        Core.offlineImageExportPolicy = originalPolicy;
        Object.assign(Core, originalMethods);
    });

    Core.offlineImageExportPolicy = {
        maxImageBytes: 6,
        maxTotalDataUrlBytes: 8,
        dataUrlOverheadBytes: 0,
        requestTimeoutMs: 100
    };
    Core.absoluteUrl = (value) => value;
    Core.postHasImage = (post) => /<img\b/i.test(post.cooked || '');
    Core.sanitizeExportHtml = (html) => html;
    Core.formatReplyRelationHtml = () => '';
    Core.formatBoostsHtml = () => '';
    Core.sanitizeFilenamePart = (value) => value;

    const fetchCalls = [];
    Core.fetchImageAsDataUrl = async (url, options) => {
        fetchCalls.push({ url, maxBytes: options.maxBytes });
        if (url.endsWith('/a.png')) {
            return { dataUrl: 'data:image/png;base64,A', encodedByteLength: 5, byteLength: 3 };
        }
        return { dataUrl: 'data:image/png;base64,B', encodedByteLength: 3, byteLength: 2 };
    };

    let downloadedHtml = '';
    Core.downloadFile = (html) => {
        downloadedHtml = html;
    };

    const statusBox = { innerHTML: '' };
    const context = {
        ...style1Helpers,
        uiManager: {
            Q(selector) {
                if (selector === '#export-offline-images') return { checked: true };
                if (selector === '#export-theme') return { value: 'light' };
                return null;
            }
        },
        showToast() {}
    };
    const posts = [
        {
            post_number: 1,
            name: 'a',
            username: 'a',
            created_at: '2026-07-19T00:00:00Z',
            cooked: '<a href="https://cdn.invalid/a.png"><img src="https://cdn.invalid/a.png"></a>'
        },
        {
            post_number: 2,
            name: 'b',
            username: 'b',
            created_at: '2026-07-19T00:00:00Z',
            cooked: '<img src="https://cdn.invalid/a.png"><img src="https://cdn.invalid/b.png">'
        },
        {
            post_number: 3,
            name: 'c',
            username: 'c',
            created_at: '2026-07-19T00:00:00Z',
            cooked: '<img src="https://cdn.invalid/c.png">'
        }
    ];

    await context.exportAsHtml.call(
        context,
        { title: '预算测试', created_at: '2026-07-19T00:00:00Z', details: {} },
        posts,
        statusBox,
        null
    );

    assert.deepEqual(fetchCalls, [
        { url: 'https://cdn.invalid/a.png', maxBytes: 6 },
        { url: 'https://cdn.invalid/b.png', maxBytes: 2 }
    ]);
    assert.match(downloadedHtml, /href="https:\/\/cdn\.invalid\/a\.png"/);
    assert.match(downloadedHtml, /src="data:image\/png;base64,A"/);
    assert.match(downloadedHtml, /src="data:image\/png;base64,B"/);
    assert.match(downloadedHtml, /src="https:\/\/cdn\.invalid\/c\.png"/);
    assert.match(statusBox.innerHTML, /1 个图片资源/);
});
