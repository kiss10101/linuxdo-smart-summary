export const aiOutputCore = {
    createAiOutputState(seed = {}) {
        const now = Date.now();
        const reasoningText = `${seed.reasoningText ?? ''}`;
        const contentText = `${seed.contentText ?? ''}`;
        const phase = seed.phase || (contentText.trim() ? 'answering' : reasoningText.trim() ? 'reasoning' : 'waiting');
        return {
            reasoningText,
            contentText,
            phase,
            finishReason: seed.finishReason || null,
            reasoningSource: seed.reasoningSource || '',
            startedAt: Number.isFinite(seed.startedAt) ? seed.startedAt : now,
            reasoningStartedAt: Number.isFinite(seed.reasoningStartedAt) ? seed.reasoningStartedAt : (reasoningText ? now : null),
            contentStartedAt: Number.isFinite(seed.contentStartedAt) ? seed.contentStartedAt : (contentText ? now : null),
            endedAt: Number.isFinite(seed.endedAt) ? seed.endedAt : null,
            partial: seed.partial === true,
            errorKind: seed.errorKind || ''
        };
    },

    isAiOutputState(value) {
        return Boolean(value && typeof value === 'object' && (
            Object.prototype.hasOwnProperty.call(value, 'reasoningText')
            || Object.prototype.hasOwnProperty.call(value, 'contentText')
            || Object.prototype.hasOwnProperty.call(value, 'phase')
        ));
    },

    extractResponseText(value, keys = [], seen = new Set()) {
        if (typeof value === 'string') return value;
        if (typeof value === 'number') return `${value}`;
        if (!value || typeof value !== 'object' || seen.has(value)) return '';
        seen.add(value);
        if (Array.isArray(value)) {
            return value.map(item => this.extractResponseText(item, keys, seen)).filter(Boolean).join('');
        }
        for (const key of keys) {
            if (Object.prototype.hasOwnProperty.call(value, key)) {
                const text = this.extractResponseText(value[key], keys, seen);
                if (text) return text;
            }
        }
        return '';
    },

    extractReasoningText(value) {
        return this.extractResponseText(value, ['text', 'content', 'summary', 'reasoning_content', 'reasoning', 'thinking']);
    },

    extractContentText(value) {
        return this.extractResponseText(value, ['text', 'content', 'output_text', 'delta']);
    },

    createEmbeddedThinkingParser() {
        const tags = [
            { open: '<think>', closes: ['</think>', '<\\think>'] },
            { open: '<thinking>', closes: ['</thinking>', '<\\thinking>'] },
            { open: '<reasoning>', closes: ['</reasoning>'] },
            { open: '<reason>', closes: ['</reason>'] },
            { open: '<|think|>', closes: ['<|/think|>'] },
            { open: '<|thinking|>', closes: ['<|/thinking|>'] },
            { open: '[think]', closes: ['[/think]'] },
            { open: '[thinking]', closes: ['[/thinking]'] }
        ];
        const state = { mode: 'undecided', pending: '', tag: null };
        const emit = (events, type, text, source = '') => {
            if (text) events.push({ type, text, source });
        };
        const getOpeningPrefix = (value) => tags.some(tag => tag.open.startsWith(value));
        const findClosing = (value, tag) => {
            const lower = value.toLowerCase();
            let result = null;
            for (const close of tag.closes) {
                const index = lower.indexOf(close);
                if (index >= 0 && (!result || index < result.index)) result = { index, close };
            }
            return result;
        };
        return {
            push(chunk, final = false) {
                state.pending += `${chunk ?? ''}`;
                const events = [];
                while (state.pending) {
                    if (state.mode === 'undecided') {
                        const leading = state.pending.match(/^\s*/)?.[0] || '';
                        const candidate = state.pending.slice(leading.length);
                        const lowerCandidate = candidate.toLowerCase();
                        const tag = tags.find(item => lowerCandidate.startsWith(item.open));
                        if (tag) {
                            emit(events, 'content_delta', leading);
                            state.pending = candidate.slice(tag.open.length);
                            state.mode = 'reasoning';
                            state.tag = tag;
                            continue;
                        }
                        if (!final && (!candidate || getOpeningPrefix(lowerCandidate))) break;
                        emit(events, 'content_delta', state.pending);
                        state.pending = '';
                        state.mode = 'content';
                        continue;
                    }
                    if (state.mode === 'reasoning') {
                        const closing = findClosing(state.pending, state.tag);
                        if (closing) {
                            emit(events, 'reasoning_delta', state.pending.slice(0, closing.index), 'embedded_tag');
                            state.pending = state.pending.slice(closing.index + closing.close.length);
                            state.mode = 'content';
                            state.tag = null;
                            continue;
                        }
                        const reserve = Math.max(...state.tag.closes.map(close => close.length)) - 1;
                        if (final) {
                            emit(events, 'reasoning_delta', state.pending, 'embedded_tag');
                            state.pending = '';
                        } else if (state.pending.length > reserve) {
                            emit(events, 'reasoning_delta', state.pending.slice(0, -reserve), 'embedded_tag');
                            state.pending = state.pending.slice(-reserve);
                        }
                        break;
                    }
                    emit(events, 'content_delta', state.pending);
                    state.pending = '';
                }
                return events;
            },
            disable() {
                if (state.mode === 'undecided' && state.pending) {
                    const events = [{ type: 'content_delta', text: state.pending }];
                    state.pending = '';
                    state.mode = 'content';
                    return events;
                }
                state.mode = 'content';
                state.tag = null;
                return [];
            }
        };
    },

    parseThinkingContent(text) {
        const parser = this.createEmbeddedThinkingParser();
        const events = parser.push(`${text ?? ''}`, true);
        const output = this.createAiOutputState();
        events.forEach(event => this.applyAiOutputEvent(output, event));
        return {
            thinking: output.reasoningText.trim(),
            content: output.contentText.trim()
        };
    },

    normalizeAiOutputState(value, meta = {}) {
        if (this.isAiOutputState(value)) return value;
        const parsed = this.parseThinkingContent(`${value ?? ''}`);
        return this.createAiOutputState({
            reasoningText: parsed.thinking,
            contentText: parsed.content,
            finishReason: meta.finishReason || null
        });
    },

    applyAiOutputEvent(output, event = {}) {
        const state = this.isAiOutputState(output) ? output : this.createAiOutputState();
        const text = `${event.text ?? ''}`;
        if (!text) return state;
        const now = Date.now();
        if (event.type === 'reasoning_delta') {
            state.reasoningText += text;
            state.reasoningSource = state.reasoningSource || event.source || 'provider';
            state.reasoningStartedAt = state.reasoningStartedAt || now;
            state.phase = state.contentText.trim() ? 'answering' : 'reasoning';
        } else if (event.type === 'content_delta') {
            state.contentText += text;
            state.contentStartedAt = state.contentStartedAt || now;
            state.phase = 'answering';
        }
        return state;
    },

    finishAiOutputState(output, meta = {}) {
        const state = this.isAiOutputState(output) ? output : this.createAiOutputState();
        state.finishReason = meta.finishReason || state.finishReason || null;
        state.endedAt = state.endedAt || Date.now();
        state.partial = ['length', 'content_filter', 'tool_calls', 'function_call'].includes(state.finishReason);
        if (state.reasoningText.trim() || state.contentText.trim()) {
            state.phase = state.partial ? 'partial' : 'done';
        } else {
            state.phase = 'done';
        }
        return state;
    },

    markAiOutputFailure(output, failure = {}) {
        const state = this.isAiOutputState(output) ? output : this.createAiOutputState();
        state.finishReason = failure.finishReason || state.finishReason || null;
        state.errorKind = failure.kind || state.errorKind || 'request_failed';
        state.endedAt = state.endedAt || Date.now();
        state.partial = Boolean(state.reasoningText.trim() || state.contentText.trim());
        state.phase = this.isAiAbortFailure(failure) ? 'stopped' : 'error';
        return state;
    },

    getAiOutputElapsedSeconds(output) {
        const state = this.normalizeAiOutputState(output);
        if (!state.reasoningStartedAt) return 0;
        const end = state.endedAt || Date.now();
        return Math.max(1, Math.ceil((end - state.reasoningStartedAt) / 1000));
    },

    getAiOutputEvents(payload, source = 'stream') {
        const events = [];
        const appendReasoning = (field, value) => {
            const text = this.extractReasoningText(value);
            if (text) events.push({ type: 'reasoning_delta', text, source: field });
        };
        const appendContent = (value) => {
            const text = this.extractContentText(value);
            if (text) events.push({ type: 'content_delta', text, source });
        };
        const container = source === 'stream'
            ? payload?.choices?.[0]?.delta
            : payload?.choices?.[0]?.message;
        if (!container || typeof container !== 'object') return events;
        appendReasoning('reasoning_content', container.reasoning_content);
        appendReasoning('reasoning', container.reasoning);
        appendReasoning('thinking', container.thinking);
        appendReasoning('reasoning_details', container.reasoning_details);
        appendContent(container.content ?? container.output_text);
        return events;
    },

    classifyAiOutput(output, meta = {}) {
        const state = this.normalizeAiOutputState(output, meta);
        const thinking = state.reasoningText.trim();
        const content = state.contentText.trim();
        const finishReason = meta?.finishReason || state.finishReason || null;
        const rawText = `${thinking ? `${thinking}\n` : ''}${content}`.trim();

        if (finishReason === 'content_filter') {
            return { kind: 'finish_content_filter', rawText, thinking, content, finishReason, partial: Boolean(content) };
        }
        if (finishReason === 'length') {
            return { kind: 'finish_length', rawText, thinking, content, finishReason, partial: Boolean(content) };
        }
        if (finishReason === 'tool_calls' || finishReason === 'function_call') {
            return { kind: 'finish_unsupported', rawText, thinking, content, finishReason, partial: Boolean(content) };
        }
        if (content) {
            return { kind: 'success', rawText, thinking, content, finishReason, partial: false };
        }
        if (thinking) {
            return { kind: 'thinking_only', rawText, thinking, content: '', finishReason, partial: false };
        }
        return { kind: 'empty_response', rawText: '', thinking: '', content: '', finishReason, partial: false };
    },

    sanitizeErrorText(value, maxChars = 500) {
        let text = `${value ?? ''}`
            .replace(/<[^>]+>/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();
        if (!text) return '';
        text = text
            .replace(/\bBearer\s+[A-Za-z0-9._~+/=-]{8,}/gi, 'Bearer [已隐藏]')
            .replace(/\bsk-[A-Za-z0-9_-]{8,}\b/g, 'sk-[已隐藏]')
            .replace(/([?&](?:api[_-]?key|access[_-]?token|token|key)=)[^&\s]+/gi, '$1[已隐藏]');
        if (text.length > maxChars) return text.slice(0, maxChars).trim() + '...';
        return text;
    },

    getResponseHeader(resp, names) {
        for (const name of names) {
            const value = resp?.headers?.get?.(name);
            if (value) return value;
        }
        return '';
    },

    parseRetryAfter(resp) {
        const raw = this.getResponseHeader(resp, ['retry-after']);
        if (!raw) return null;
        const seconds = Number(raw);
        if (Number.isFinite(seconds)) return Math.max(0, seconds);
        const retryAt = Date.parse(raw);
        if (Number.isFinite(retryAt)) return Math.max(0, Math.ceil((retryAt - Date.now()) / 1000));
        return null;
    },

    parseUpstreamErrorBody(bodyText) {
        const body = `${bodyText ?? ''}`;
        if (!body.trim()) return { data: null, isJson: false, rawSnippet: '' };
        try {
            const data = JSON.parse(body);
            const error = data?.error && typeof data.error === 'object' ? data.error : data;
            return {
                data,
                isJson: true,
                providerMessage: error?.message || data?.message || '',
                upstreamCode: error?.code || data?.code || '',
                upstreamType: error?.type || data?.type || '',
                upstreamParam: error?.param || data?.param || '',
                rawSnippet: this.sanitizeErrorText(body, 500),
                rawSnippetTruncated: body.length > 500
            };
        } catch (e) {
            const snippet = this.sanitizeErrorText(body, 500);
            return {
                data: null,
                isJson: false,
                providerMessage: snippet,
                rawSnippet: snippet,
                rawSnippetTruncated: body.length > 500
            };
        }
    },

    classifyHttpFailure(status, upstreamCode = '', upstreamType = '') {
        const codeText = `${upstreamCode || upstreamType || ''}`.toLowerCase();
        if (status === 401) return { category: 'auth', userTitle: 'API Key 被上游拒绝', userHint: '请检查当前 API 配置档案的 Key 是否正确。', retryable: false };
        if (status === 403) return { category: 'permission', userTitle: '当前账号或模型无权限', userHint: '请检查账号权限、模型权限或服务地区限制。', retryable: false };
        if (status === 404) return { category: 'provider_schema', userTitle: '上游接口或模型不存在', userHint: '请检查 API 地址和模型名称是否匹配当前服务商。', retryable: false };
        if (status === 408 || status === 409 || status === 425) return { category: 'network', userTitle: '上游请求暂时未完成', userHint: '可以稍后重试。', retryable: true };
        if (status === 429) {
            if (/quota|balance|insufficient|billing/.test(codeText)) {
                return { category: 'quota', userTitle: '上游额度不足', userHint: '请检查余额、计费状态或项目额度。', retryable: false };
            }
            return { category: 'rate_limit', userTitle: '请求过快，被上游限流', userHint: '请稍后重试，或降低请求频率。', retryable: true };
        }
        if (status >= 500) return { category: 'server', userTitle: '上游服务暂时异常', userHint: '可以稍后重试。', retryable: true };
        if (status >= 400) return { category: 'permission', userTitle: '上游拒绝了请求', userHint: '请检查 API 配置、模型名称和账号权限。', retryable: false };
        return { category: 'unknown', userTitle: '上游返回异常', userHint: '请检查 API 服务商响应。', retryable: false };
    },

    createAiFailure(options = {}) {
        const http = Number(options.httpStatus);
        const httpStatus = Number.isFinite(http) && http > 0 ? http : null;
        const upstreamCode = options.upstreamCode ? `${options.upstreamCode}` : '';
        const upstreamType = options.upstreamType ? `${options.upstreamType}` : '';
        const httpClass = httpStatus ? this.classifyHttpFailure(httpStatus, upstreamCode, upstreamType) : {};
        const kind = options.kind || (httpStatus ? 'http_error' : 'unknown');
        const sourceConfig = this.normalizeAiSourceConfig(options.sourceConfig);
        const providerMessage = this.sanitizeErrorText(options.providerMessage || options.message || '', 500);
        const rawSnippet = this.sanitizeErrorText(options.rawSnippet || '', 500);
        const detailParts = [];
        if (httpStatus) detailParts.push(`HTTP ${httpStatus}${options.statusText ? ` ${options.statusText}` : ''}`);
        if (upstreamCode) detailParts.push(upstreamCode);
        if (upstreamType && upstreamType !== upstreamCode) detailParts.push(upstreamType);
        if (options.finishReason) detailParts.push(`finish_reason=${options.finishReason}`);
        if (providerMessage) detailParts.push(providerMessage);
        const safeDetail = this.sanitizeErrorText(detailParts.join(' / '), 700);

        return {
            ok: false,
            operation: options.operation || 'chat',
            stage: options.stage || (httpStatus ? 'http' : 'unknown'),
            kind,
            category: options.category || httpClass.category || 'unknown',
            httpStatus,
            statusText: options.statusText || '',
            upstreamCode,
            upstreamType,
            upstreamParam: options.upstreamParam ? `${options.upstreamParam}` : '',
            finishReason: options.finishReason || '',
            requestId: options.requestId || '',
            retryAfterSeconds: Number.isFinite(Number(options.retryAfterSeconds)) ? Number(options.retryAfterSeconds) : null,
            providerMessage,
            safeDetail,
            userTitle: options.userTitle || httpClass.userTitle || '请求失败',
            userHint: options.userHint || httpClass.userHint || '请检查 API 配置或稍后重试。',
            retryable: options.retryable ?? httpClass.retryable ?? false,
            sourceConfig,
            apiProfileName: options.apiProfileName || sourceConfig?.name || '',
            apiHost: options.apiHost || sourceConfig?.apiHost || (options.apiUrl ? this.getApiProfileHost(options.apiUrl) : ''),
            model: options.model || sourceConfig?.model || '',
            rawSnippet,
            rawSnippetTruncated: options.rawSnippetTruncated === true
        };
    },

    isAiAbortFailure(error) {
        const failure = error?.ok === false ? error : error?.aiFailure;
        return failure?.kind === 'request_aborted';
    },

    createFailureError(failure) {
        const error = new Error(failure.safeDetail || failure.userTitle || '请求失败');
        error.aiFailure = failure;
        return error;
    },

    normalizeAiFailure(error, defaults = {}) {
        if (error?.aiFailure) return { ...defaults, ...error.aiFailure, operation: defaults.operation || error.aiFailure.operation };
        if (error?.ok === false) return { ...defaults, ...error, operation: defaults.operation || error.operation };
        if (typeof error === 'string') {
            return this.createAiFailure({ ...defaults, kind: 'unknown', providerMessage: error, userTitle: defaults.userTitle || '请求失败' });
        }
        const message = error?.message || `${error ?? ''}` || '请求失败';
        if (error?.name === 'AbortError') {
            return this.createAiFailure({
                ...defaults,
                stage: 'abort',
                kind: 'request_aborted',
                category: 'cancelled',
                providerMessage: '用户已停止本次 AI 生成',
                userTitle: '已停止生成',
                userHint: '已停止 AI 输出；不会因此重新请求 Linux.do。',
                retryable: false
            });
        }
        if (/failed to fetch|network|cors|load failed/i.test(message)) {
            return this.createAiFailure({ ...defaults, stage: 'network', kind: 'network_error', category: 'network', providerMessage: message, userTitle: '浏览器无法连接 API', userHint: '可能是 CORS、代理、DNS、TLS 或接口地址不可达。', retryable: true });
        }
        return this.createAiFailure({ ...defaults, kind: 'unknown', providerMessage: message, userTitle: defaults.userTitle || '请求失败' });
    },

    createHttpFailure(resp, bodyText, options = {}) {
        const parsed = this.parseUpstreamErrorBody(bodyText);
        const status = Number(resp?.status) || null;
        const httpClass = this.classifyHttpFailure(status, parsed.upstreamCode, parsed.upstreamType);
        const kind = parsed.isJson ? 'http_error' : 'non_json_response';
        const failure = this.createAiFailure({
            ...options,
            stage: 'http',
            kind,
            category: parsed.isJson ? httpClass.category : (status >= 500 ? 'server' : 'provider_schema'),
            httpStatus: status,
            statusText: resp?.statusText || '',
            upstreamCode: parsed.upstreamCode,
            upstreamType: parsed.upstreamType,
            upstreamParam: parsed.upstreamParam,
            providerMessage: parsed.providerMessage,
            rawSnippet: parsed.rawSnippet,
            rawSnippetTruncated: parsed.rawSnippetTruncated,
            requestId: this.getResponseHeader(resp, ['x-request-id', 'openai-request-id', 'x-correlation-id']),
            retryAfterSeconds: this.parseRetryAfter(resp),
            userTitle: parsed.isJson ? httpClass.userTitle : '上游返回了非 JSON 错误页',
            userHint: parsed.isJson ? httpClass.userHint : '接口可能被网关、代理、登录页或错误页拦截。'
        });
        return failure;
    },

    createSseFailure(payload, options = {}) {
        const parsed = this.parseUpstreamErrorBody(payload);
        return this.createAiFailure({
            ...options,
            stage: options.stage || 'sse',
            kind: parsed.isJson && parsed.providerMessage ? 'sse_error' : 'invalid_schema',
            category: parsed.isJson && parsed.providerMessage ? 'provider_schema' : 'provider_schema',
            upstreamCode: parsed.upstreamCode,
            upstreamType: parsed.upstreamType,
            upstreamParam: parsed.upstreamParam,
            providerMessage: parsed.providerMessage || '流式响应不是有效 JSON',
            rawSnippet: parsed.rawSnippet || `${payload ?? ''}`.slice(0, 500),
            rawSnippetTruncated: parsed.rawSnippetTruncated,
            userTitle: parsed.isJson && parsed.providerMessage ? '流式返回中断' : '上游流式数据格式异常',
            userHint: parsed.isJson && parsed.providerMessage ? '上游在流式响应中返回了错误。' : '请检查 API 服务商是否兼容 OpenAI Chat Completions 流式格式。'
        });
    },

    createModelOutputFailure(classified, options = {}) {
        const kind = classified?.kind || 'empty_response';
        const finishReason = classified?.finishReason || '';
        const map = {
            thinking_only: ['empty', 'AI 服务只返回了推理内容', '没有生成可展示的正文。可重新生成或更换模型。'],
            empty_response: ['empty', 'AI 返回了空内容', '上游请求成功，但没有生成正文。可直接重试。'],
            finish_content_filter: ['safety', '输出被上游安全策略拦截', '请调整提问或减少敏感内容。'],
            finish_length: ['truncated', '输出达到长度上限被截断', '请缩小楼层范围、简化提示词或调整模型参数。'],
            finish_unsupported: ['provider_schema', '模型返回了当前脚本不支持的结果', '请更换普通对话模型，或关闭会返回工具调用的配置。']
        };
        const [category, userTitle, userHint] = map[kind] || map.empty_response;
        return this.createAiFailure({
            ...options,
            stage: 'model_output',
            kind,
            category,
            finishReason,
            userTitle,
            userHint,
            providerMessage: userHint,
            retryable: true
        });
    },

    formatAiFailureForUi(error, defaults = {}) {
        const failure = this.normalizeAiFailure(error, defaults);
        const detailParts = [];
        if (failure.httpStatus) {
            detailParts.push(`HTTP ${failure.httpStatus}${failure.upstreamCode ? ` / ${failure.upstreamCode}` : ''}`);
        } else if (failure.upstreamCode) {
            detailParts.push(`错误码 ${failure.upstreamCode}`);
        }
        if (failure.finishReason) detailParts.push(`finish_reason=${failure.finishReason}`);
        if (failure.providerMessage && !detailParts.includes(failure.providerMessage)) {
            detailParts.push(failure.providerMessage);
        }
        if (failure.retryAfterSeconds !== null && failure.retryAfterSeconds !== undefined) {
            detailParts.push(`建议 ${failure.retryAfterSeconds} 秒后重试`);
        }
        const detail = this.sanitizeErrorText(detailParts.join('。'), 700);
        const toastParts = [];
        if (failure.httpStatus) toastParts.push(`HTTP ${failure.httpStatus}`);
        if (failure.upstreamCode) toastParts.push(failure.upstreamCode);
        if (!toastParts.length && failure.finishReason) toastParts.push(`finish_reason=${failure.finishReason}`);
        return {
            failure,
            title: failure.userTitle || defaults.userTitle || '请求失败',
            detail: detail || failure.safeDetail || failure.providerMessage || '',
            hint: failure.userHint || '',
            toast: toastParts.length ? `${failure.userTitle}: ${toastParts.join(' / ')}` : (failure.userTitle || '请求失败')
        };
    },

    renderAiFailureBlock(error, defaults = {}) {
        const formatted = this.formatAiFailureForUi(error, defaults);
        const rows = [];
        if (formatted.detail) rows.push(`<div>${this.escapeHtml(formatted.detail)}</div>`);
        if (formatted.hint) rows.push(`<div>${this.escapeHtml(formatted.hint)}</div>`);
        const failure = formatted.failure;
        const meta = [];
        const sourceText = this.renderAiSourceConfigText(failure.sourceConfig);
        if (sourceText) {
            meta.push(`本次 AI: ${sourceText}`);
        } else {
            if (failure.apiHost) meta.push(`API: ${failure.apiHost}`);
            if (failure.model) meta.push(`模型: ${failure.model}`);
        }
        if (failure.requestId) meta.push(`请求 ID: ${failure.requestId}`);
        if (meta.length) rows.push(`<div>${this.escapeHtml(meta.join(' · '))}</div>`);
        if (failure.rawSnippet && failure.kind === 'non_json_response') {
            rows.push(`<details class="summary-coverage"><summary>查看上游响应片段</summary><pre>${this.escapeHtml(failure.rawSnippet)}</pre></details>`);
        }
        return `
            <div style="color:var(--danger)">❌ ${this.escapeHtml(formatted.title)}</div>
            ${rows.length ? `<div style="margin-top:8px;line-height:1.6;color:var(--text-sec);font-size:13px;">${rows.join('')}</div>` : ''}
        `;
    },
};
