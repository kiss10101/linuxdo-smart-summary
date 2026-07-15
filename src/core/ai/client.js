import { CONFIG } from '../../config.js';

export const aiClientCore = {
    async streamChat(messages, onOutputEvent, onDone, onError, options = {}) {
        const activeProfile = this.getActiveApiProfile();
        const key = activeProfile.apiKey;
        const url = activeProfile.apiUrl || CONFIG.defaultApiUrl;
        const model = activeProfile.model || CONFIG.defaultModel;
        const useStream = GM_getValue('useStream', true);
        const safeMessages = this.sanitizeMessagesForApi(messages);
        const operation = options.operation || 'chat';
        const sourceConfig = this.getActiveApiProfileSnapshot(activeProfile);
        const failureDefaults = { operation, apiUrl: url, model, sourceConfig };

        if (!key) {
            return onError(this.createAiFailure({
                ...failureDefaults,
                stage: 'preflight',
                kind: 'config_missing',
                category: 'config',
                userTitle: '未配置 API Key',
                userHint: '请先在设置中配置 API Key。',
                providerMessage: '未配置 API Key'
            }));
        }
        if (safeMessages.length === 0) {
            return onError(this.createAiFailure({
                ...failureDefaults,
                stage: 'preflight',
                kind: 'config_missing',
                category: 'config',
                userTitle: '没有可发送给 AI 的有效消息',
                userHint: '请检查当前总结或对话上下文。',
                providerMessage: '没有可发送给 AI 的有效消息'
            }));
        }

        try {
            const resp = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${key}` },
                body: JSON.stringify({ model, messages: safeMessages, stream: useStream }),
                signal: options.signal
            });
            if (!resp.ok) {
                const body = await resp.text().catch(() => '');
                throw this.createFailureError(this.createHttpFailure(resp, body, failureDefaults));
            }

            const responseMeta = { finishReason: null, sourceConfig };
            if (useStream) {
                const reader = resp.body?.getReader();
                if (!reader) throw new Error('响应不支持流式读取');
                const decoder = new TextDecoder();
                let pending = '';
                let sawStructuredReasoning = false;
                const embeddedThinkingParser = this.createEmbeddedThinkingParser();
                const emit = (event) => {
                    if (event?.text) onOutputEvent?.(event);
                };
                const emitProviderEvents = (events) => {
                    const reasoningEvents = events.filter(event => event.type === 'reasoning_delta');
                    const contentEvents = events.filter(event => event.type === 'content_delta');
                    if (reasoningEvents.length) {
                        if (!sawStructuredReasoning) {
                            embeddedThinkingParser.disable().forEach(emit);
                            sawStructuredReasoning = true;
                        }
                        reasoningEvents.forEach(emit);
                    }
                    contentEvents.forEach((event) => {
                        if (sawStructuredReasoning) {
                            emit(event);
                        } else {
                            embeddedThinkingParser.push(event.text, false).forEach(emit);
                        }
                    });
                };

                const handleStreamFrame = (rawFrame) => {
                    const lines = `${rawFrame ?? ''}`.split(/\r?\n/);
                    let eventName = 'message';
                    const dataLines = [];
                    for (const rawLine of lines) {
                        const line = rawLine.trimEnd();
                        if (!line || line.startsWith(':')) continue;
                        if (line.startsWith('event:')) {
                            eventName = line.slice(6).trim() || 'message';
                        } else if (line.startsWith('data:')) {
                            dataLines.push(line.slice(5).trimStart());
                        }
                    }

                    const payload = dataLines.join('\n').trim();
                    if (!payload || payload === '[DONE]') return;
                    if (eventName === 'error') {
                        throw this.createFailureError(this.createSseFailure(payload, failureDefaults));
                    }

                    let json;
                    try {
                        json = JSON.parse(payload);
                    } catch (e) {
                        throw this.createFailureError(this.createSseFailure(payload, failureDefaults));
                    }

                    if (json?.error) {
                        throw this.createFailureError(this.createSseFailure(JSON.stringify(json), failureDefaults));
                    }

                    const choice = json.choices?.[0];
                    if (!choice && json.usage) return;
                    if (choice?.finish_reason) responseMeta.finishReason = choice.finish_reason;
                    emitProviderEvents(this.getAiOutputEvents(json, 'stream'));
                };

                while (true) {
                    const { done, value } = await reader.read();
                    if (value) {
                        pending += decoder.decode(value, { stream: !done });
                    }
                    if (done) {
                        pending += decoder.decode();
                    }

                    const frames = pending.split(/\r?\n\r?\n/);
                    pending = frames.pop() ?? '';
                    for (const frame of frames) {
                        handleStreamFrame(frame);
                    }

                    if (done) {
                        if (pending.trim()) handleStreamFrame(pending);
                        break;
                    }
                }
                if (!sawStructuredReasoning) embeddedThinkingParser.push('', true).forEach(emit);
            } else {
                const bodyText = await resp.text();
                let data;
                try {
                    data = JSON.parse(bodyText);
                } catch (e) {
                    throw this.createFailureError(this.createAiFailure({
                        ...failureDefaults,
                        stage: 'parse',
                        kind: 'non_json_response',
                        category: 'provider_schema',
                        providerMessage: '非流式响应不是有效 JSON',
                        rawSnippet: this.sanitizeErrorText(bodyText, 500),
                        rawSnippetTruncated: bodyText.length > 500,
                        userTitle: '上游返回了非 JSON 响应',
                        userHint: '请检查 API 服务商是否兼容 OpenAI Chat Completions 非流式格式。'
                    }));
                }

                if (data?.error) {
                    throw this.createFailureError(this.createSseFailure(JSON.stringify(data), {
                        ...failureDefaults,
                        stage: 'parse'
                    }));
                }

                const choice = data.choices?.[0];
                if (!choice) {
                    throw this.createFailureError(this.createAiFailure({
                        ...failureDefaults,
                        stage: 'parse',
                        kind: 'invalid_schema',
                        category: 'provider_schema',
                        providerMessage: '响应缺少 choices[0]',
                        rawSnippet: this.sanitizeErrorText(bodyText, 500),
                        rawSnippetTruncated: bodyText.length > 500,
                        userTitle: '上游响应结构不兼容',
                        userHint: '请检查 API 服务商是否返回 OpenAI Chat Completions 兼容结构。'
                    }));
                }
                responseMeta.finishReason = choice.finish_reason || null;
                const events = this.getAiOutputEvents(data, 'non_stream');
                const hasStructuredReasoning = events.some(event => event.type === 'reasoning_delta');
                if (hasStructuredReasoning) {
                    events.forEach(event => onOutputEvent?.(event));
                } else {
                    const embeddedThinkingParser = this.createEmbeddedThinkingParser();
                    events.forEach((event) => {
                        if (event.type === 'content_delta') {
                            embeddedThinkingParser.push(event.text, false).forEach(nextEvent => onOutputEvent?.(nextEvent));
                        }
                    });
                    embeddedThinkingParser.push('', true).forEach(nextEvent => onOutputEvent?.(nextEvent));
                }
            }
            onDone(responseMeta);
        } catch (e) {
            onError(this.normalizeAiFailure(e, failureDefaults));
        }
    },

    buildModelsUrl(apiUrl) {
        if (!apiUrl) throw new Error('请先填写 API 地址');

        let url;
        try {
            url = new URL(apiUrl);
        } catch (e) {
            throw new Error('API 地址格式无效');
        }

        const path = url.pathname.replace(/\/+$/, '');
        if (/\/chat\/completions$/i.test(path)) {
            url.pathname = path.replace(/\/chat\/completions$/i, '/models');
        } else if (/\/completions$/i.test(path)) {
            url.pathname = path.replace(/\/completions$/i, '/models');
        } else if (/\/responses$/i.test(path)) {
            url.pathname = path.replace(/\/responses$/i, '/models');
        } else if (!/\/models$/i.test(path)) {
            url.pathname = `${path || ''}/models`;
        }
        url.search = '';
        url.hash = '';
        return url.toString();
    },

    async fetchModelList(apiUrl, apiKey, options = {}) {
        if (!apiKey) {
            throw this.createFailureError(this.createAiFailure({
                operation: 'models',
                stage: 'preflight',
                kind: 'config_missing',
                category: 'config',
                userTitle: '请先填写 API Key',
                userHint: '模型列表请求需要使用当前 API 配置档案的 Key。',
                providerMessage: '缺少 API Key'
            }));
        }

        const modelsUrl = this.buildModelsUrl(apiUrl);
        const resp = await fetch(modelsUrl, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            signal: options.signal
        });

        const bodyText = await resp.text();
        let data = null;
        try {
            data = bodyText ? JSON.parse(bodyText) : null;
        } catch (e) {
            if (!resp.ok) {
                throw this.createFailureError(this.createHttpFailure(resp, bodyText, {
                    operation: 'models',
                    apiUrl: modelsUrl,
                    userTitle: '获取模型列表失败'
                }));
            }
            throw this.createFailureError(this.createAiFailure({
                operation: 'models',
                stage: 'parse',
                kind: 'non_json_response',
                category: 'provider_schema',
                apiUrl: modelsUrl,
                providerMessage: '模型列表响应不是有效 JSON',
                rawSnippet: this.sanitizeErrorText(bodyText, 500),
                rawSnippetTruncated: bodyText.length > 500,
                userTitle: '模型列表响应不是有效 JSON',
                userHint: '请检查 API 地址是否指向 OpenAI 兼容服务。'
            }));
        }

        if (!resp.ok) {
            throw this.createFailureError(this.createHttpFailure(resp, bodyText, {
                operation: 'models',
                apiUrl: modelsUrl,
                userTitle: '获取模型列表失败'
            }));
        }

        const source = Array.isArray(data?.data) ? data.data
            : Array.isArray(data?.models) ? data.models
            : Array.isArray(data) ? data
            : [];

        const models = [...new Set(source.map((item) => {
            if (typeof item === 'string') return item;
            return item?.id || item?.name || item?.model;
        }).filter(Boolean))];

        if (models.length === 0) {
            throw this.createFailureError(this.createAiFailure({
                operation: 'models',
                stage: 'parse',
                kind: 'invalid_schema',
                category: 'provider_schema',
                apiUrl: modelsUrl,
                providerMessage: '未从响应中解析到模型列表',
                rawSnippet: this.sanitizeErrorText(bodyText, 500),
                rawSnippetTruncated: bodyText.length > 500,
                userTitle: '未从响应中解析到模型列表',
                userHint: '请检查该服务的 /models 响应是否包含 data、models 或数组形式的模型列表。'
            }));
        }
        return { models, url: modelsUrl };
    },
};
