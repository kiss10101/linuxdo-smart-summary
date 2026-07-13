// ==UserScript==
// @name         Linux.do 智能总结
// @namespace    http://tampermonkey.net/
// @version      7.6.1
// @description  Linux.do 帖子总结与导出，支持多种UI风格切换，集成HTML离线导出和AI文本导出功能。
// @author       半杯无糖、WolfHolo、LD Export
// @match        https://linux.do/*
// @icon         https://linux.do/uploads/default/original/4X/c/c/d/ccd8c210609d498cbeb3d5201d4c259348447562.png
// @require      https://cdn.jsdelivr.net/npm/marked@18.0.6/lib/marked.umd.js#sha384-uGn1eBC40GtuBgao0epc/cz9O4Lo8/flg/10SW+69UjLI5nP31iT4UPc65Xz10Le
// @require      https://cdn.jsdelivr.net/npm/dompurify@3.4.12/dist/purify.min.js#sha384-piCcpDdJ7qVeK4Tv8Z6Hpcr3ZBIgP16TxQTPVfsLFdZ5uDgwc3Y8Ho7oUnqf12qu
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_setClipboard
// @grant        GM_registerMenuCommand
// @grant        GM_download
// @license      MIT
// ==/UserScript==

/*
 * 更新摘要
 * Upstream: GreasyFork script 558028, publisher Passerby1011; original metadata author 半杯无糖、WolfHolo、LD Export; MIT license.
 * 7.6.1: 公开稳定补丁；固定 marked/DOMPurify 版本与完整性哈希，不改变 Linux.do 请求策略或 7.6 运行时功能。
 * 7.6: 正式稳定版，整合 7.6 预览线的总结选区快捷操作、短选区触发、运行时节流、API 配置档案、楼层范围强制刷新和 Edge 148 兼容确认。
 * 7.6-alpha.6: “全部/最近”楼层范围改为显式刷新最高楼层并显示获取状态；API 配置改为可点击档案列表，切换、编辑、新增、复制、删除后立即持久化生效。
 * 7.6-alpha.5: API 配置支持多个档案列表切换，可新增、复制、删除配置，并兼容迁移旧版 API 地址、Key 和模型设置。
 * 7.6-alpha.4: 取消总结选区快捷菜单的最少字数门槛；短词、缩写、用户名、楼层号等有意义短选区也可触发菜单。
 * 7.6-alpha.3: 稳定总结选区快捷菜单生命周期，避免重复选区操作后旧延迟任务、残留 selection 或聊天生成状态影响下一次唤起。
 * 7.6-alpha.2: 修复流式输出高频整段重绘、非主题页无条件初始化、拖拽/滚动高频事件和大范围请求缺少总预算保护的问题。
 * 7.6-alpha.1: 总结结果支持选中文本后弹出快捷操作条，可将选区带入对话页进行解释、追问或局部总结；不新增 Linux.do 请求。
 * 7.5: 稳定发布 7.5-alpha.6；保留 7.5 系列楼层范围、boosts、对话和引用归因修复，并降低缓存清理定时器与 HTML 文本解析的运行时开销。
 * 7.5-alpha.6: 保留 Discourse 引用/跨主题转发链接的来源用户、主题、楼层和标题，避免 AI 把引用内容误归因给当前楼层作者。
 * 7.5-alpha.5: 修复右侧侧边栏中聊天消息右键菜单可能被定位到屏幕外的问题，并增强事件目标兼容性。
 * 7.5-alpha.4: 重构总结后对话状态，识别 AI 空回与思考-only；对用户/AI 消息增加右键菜单，支持复制、编辑、重新生成和删除，并避免 UI 元数据进入 AI 请求。
 * 7.5-alpha.3: 修复全帖/最近快捷范围把右侧时间线计数误当最高楼层的问题；改用 Discourse topic JSON 的 highest_post_number，并让总结与导出共享短时 topic 数据。
 * 7.5-alpha.2: 统一 Linux.do/Discourse topic 路由解析；总结完成后展示楼层覆盖、缓存、回看校准和元数据纳入情况；补充发布前版本一致性检查。
 * 7.5-alpha.1: 支持读取 Linux.do/Discourse boosts 字段，在 AI 总结上下文、HTML 导出和 AI 文本导出中展示帖子 boost 信息，不新增 Linux.do 请求。
 * 7.4: 稳定发布 7.4-alpha.4；将 Linux.do posts 拉取回调为每批 200、串行低频请求；增加当前标签页楼层内容短暂缓存，AI 空回或失败后可重试而不重复拉取楼层。
 * 7.4-alpha.4: 将 Linux.do posts 拉取回调为每批 200、串行低频请求；增加当前标签页楼层内容短暂缓存，AI 空回或失败后可重试而不重复拉取楼层。
 * 7.4-alpha.3: 保留回帖关系元数据；当被回复楼层已删除或不可见时，在总结和导出中标记回复目标楼层。
 * 7.4-alpha.2: 发布 7.4 修复版；按 post_number 输出用户选择范围，并在发现 stream 下标偏移时用受控回看窗口校准。
 * 7.4-alpha.1: 建立并实装楼层范围映射修复基线。
 * 7.3: 优化 Linux.do 帖子数据请求策略，改用 topic stream + 小批量 posts 拉取；默认每批 40 条、并发 2、批次启动间隔 250ms，并补充基础响应校验。
 * 7.2: API 配置支持获取模型列表；模型名称可从侧栏弹窗选择，也可手动输入；修复用户聊天输入直接写入 innerHTML 的安全问题。
 */

(function() {
    'use strict';

    // =================================================================================
    // 1. 配置区 (CONFIG)
    // =================================================================================
    const CONFIG = {
        defaultUI: 'style2', // 默认UI风格
        storageKey: 'ld_summary_ui_style', // 用于存储UI选择的键名
        apiProfilesKey: 'apiProfiles',
        activeApiProfileIdKey: 'activeApiProfileId',
        defaultApiUrl: 'https://api.deepseek.com/v1/chat/completions',
        defaultModel: 'deepseek-chat',
    };


    // =================================================================================
    // 2. 核心逻辑模块 (CORE LOGIC)
    //    这部分代码与UI完全解耦，处理数据获取和API请求等。
    // =================================================================================
    const Core = {
        linuxDoPostFetchPolicy: {
            batchSize: 200,
            concurrency: 1,
            batchDelayMs: 600
        },
        linuxDoRequestBudgetPolicy: {
            maxCandidateIds: 4000,
            maxPostBatchRequests: 20
        },
        linuxDoRangeMappingPolicy: {
            lookBehindStepIds: 40,
            maxLookBehindIds: 240,
            fallbackConcurrency: 1,
            fallbackBatchDelayMs: 600
        },
        dialogueCachePolicy: {
            ttlMs: 10 * 60 * 1000,
            maxAgeMs: 15 * 60 * 1000,
            cleanupIntervalMs: 60 * 1000,
            maxTopics: 3,
            maxRangesPerTopic: 3,
            maxTotalBytes: 8 * 1024 * 1024,
            maxEntryBytes: 4 * 1024 * 1024
        },
        dialogueCacheTopics: new Map(),
        dialogueCacheCleanupTimer: null,
        htmlParser: null,
        topicDataCachePolicy: {
            ttlMs: 60 * 1000,
            maxTopics: 5
        },
        topicDataCache: new Map(),
        topicDataInflight: new Map(),

        createApiProfileId() {
            if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
                return crypto.randomUUID();
            }
            return `api_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
        },

        getApiProfileHost(apiUrl) {
            const raw = String(apiUrl || '').trim();
            if (!raw) return '';
            try {
                return new URL(raw).host.replace(/^api\./i, '');
            } catch (e) {
                return raw.replace(/^https?:\/\//i, '').split('/')[0].replace(/^api\./i, '');
            }
        },

        inferApiProfileName(profile = {}, index = 0) {
            const explicitName = String(profile.name || '').trim();
            if (explicitName) return explicitName;
            const model = String(profile.model || profile.modelName || '').trim();
            if (model) return model;
            const host = this.getApiProfileHost(profile.apiUrl || profile.baseUrl || profile.url);
            if (host) return host;
            return `配置 ${index + 1}`;
        },

        normalizeApiProfile(profile = {}, index = 0) {
            const source = profile && typeof profile === 'object' ? profile : {};
            const apiUrl = String(source.apiUrl ?? source.baseUrl ?? source.url ?? CONFIG.defaultApiUrl).trim() || CONFIG.defaultApiUrl;
            const apiKey = String(source.apiKey ?? source.key ?? '').trim();
            const model = String(source.model ?? source.modelName ?? CONFIG.defaultModel).trim() || CONFIG.defaultModel;
            return {
                id: String(source.id || this.createApiProfileId()).trim() || this.createApiProfileId(),
                name: this.inferApiProfileName({ ...source, apiUrl, model }, index),
                apiUrl,
                apiKey,
                model
            };
        },

        normalizeApiProfiles(profiles) {
            const list = Array.isArray(profiles) ? profiles : [];
            const seenIds = new Set();
            const normalized = list.map((profile, index) => {
                const next = this.normalizeApiProfile(profile, index);
                while (!next.id || seenIds.has(next.id)) {
                    next.id = this.createApiProfileId();
                }
                seenIds.add(next.id);
                return next;
            });

            if (normalized.length > 0) return normalized;
            return [this.normalizeApiProfile(this.getLegacyApiProfile(), 0)];
        },

        getLegacyApiProfile() {
            return {
                id: 'default',
                name: '默认配置',
                apiUrl: GM_getValue('apiUrl', CONFIG.defaultApiUrl),
                apiKey: GM_getValue('apiKey', ''),
                model: GM_getValue('model', CONFIG.defaultModel)
            };
        },

        loadApiProfileState() {
            const storedProfiles = GM_getValue(CONFIG.apiProfilesKey, null);
            const profiles = this.normalizeApiProfiles(storedProfiles);
            let activeId = String(GM_getValue(CONFIG.activeApiProfileIdKey, '') || '').trim();
            if (!profiles.some((profile) => profile.id === activeId)) {
                activeId = profiles[0].id;
            }
            return { profiles, activeId };
        },

        findApiProfile(profiles, activeId) {
            const list = this.normalizeApiProfiles(profiles);
            return list.find((profile) => profile.id === activeId) || list[0];
        },

        getActiveApiProfile() {
            const state = this.loadApiProfileState();
            return this.findApiProfile(state.profiles, state.activeId);
        },

        saveApiProfileState(profiles, activeId) {
            const normalizedProfiles = this.normalizeApiProfiles(profiles);
            let normalizedActiveId = String(activeId || '').trim();
            if (!normalizedProfiles.some((profile) => profile.id === normalizedActiveId)) {
                normalizedActiveId = normalizedProfiles[0].id;
            }
            const activeProfile = this.findApiProfile(normalizedProfiles, normalizedActiveId);

            GM_setValue(CONFIG.apiProfilesKey, normalizedProfiles);
            GM_setValue(CONFIG.activeApiProfileIdKey, normalizedActiveId);
            GM_setValue('apiUrl', activeProfile.apiUrl);
            GM_setValue('apiKey', activeProfile.apiKey);
            GM_setValue('model', activeProfile.model);

            return {
                profiles: normalizedProfiles,
                activeId: normalizedActiveId,
                activeProfile
            };
        },

        getApiProfileOptionLabel(profile, index = 0) {
            const name = this.inferApiProfileName(profile, index);
            const model = String(profile?.model || '').trim() || CONFIG.defaultModel;
            const host = this.getApiProfileHost(profile?.apiUrl);
            return [name, model, host].filter(Boolean).join(' · ');
        },

        parseTopicIdentity(input = window.location.href) {
            const raw = String(input || '');
            let pathname = raw;
            try {
                pathname = new URL(raw, window.location.origin).pathname;
            } catch (e) {
                pathname = raw.split(/[?#]/)[0];
            }

            const patterns = [
                { name: 'topic-json', re: /^\/t\/-\/(\d+)(?:\.json)?\/?$/ },
                { name: 'topic-slug', re: /^\/t\/(?:[^/]+\/)?(\d+)(?:\/\d+)?\/?$/ },
                { name: 'topic-legacy', re: /^\/topic\/(\d+)\/?$/ }
            ];

            for (const pattern of patterns) {
                const match = pathname.match(pattern.re);
                if (match?.[1]) {
                    return {
                        topicId: match[1],
                        route: pattern.name,
                        pathname
                    };
                }
            }

            return null;
        },

        getTopicId() {
            return this.parseTopicIdentity()?.topicId;
        },

        isTopicPage(input = window.location.href) {
            return Boolean(this.parseTopicIdentity(input));
        },

        parseThinkingContent(text) {
            if (!text) return { thinking: '', content: '' };

            let thinkingParts = [];
            let mainContent = text;

            const thinkingPatterns = [
                /<think>([\s\S]*?)<\/think>/gi,
                /<thinking>([\s\S]*?)<\/thinking>/gi,
                /<reason>([\s\S]*?)<\/reason>/gi,
                /<reasoning>([\s\S]*?)<\/reasoning>/gi,
                /<reflection>([\s\S]*?)<\/reflection>/gi,
                /<inner_thought>([\s\S]*?)<\/inner_thought>/gi,
                /<think>([\s\S]*?)<\\think>/gi,
                /<thinking>([\s\S]*?)<\\thinking>/gi,
                /<\|think\|>([\s\S]*?)<\|\/think\|>/gi,
                /<\|thinking\|>([\s\S]*?)<\|\/thinking\|>/gi,
                /\[think\]([\s\S]*?)\[\/think\]/gi,
                /\[thinking\]([\s\S]*?)\[\/thinking\]/gi,
            ];

            for (const pattern of thinkingPatterns) {
                pattern.lastIndex = 0;
                let match;
                while ((match = pattern.exec(mainContent)) !== null) {
                    const thinkContent = match[1].trim();
                    if (thinkContent) {
                        thinkingParts.push(thinkContent);
                    }
                    mainContent = mainContent.replace(match[0], '');
                    pattern.lastIndex = 0;
                }
            }

            const unclosedPatterns = [
                { start: /<think>/i, end: /<\/think>|<\\think>/i, tag: '<think>' },
                { start: /<thinking>/i, end: /<\/thinking>|<\\thinking>/i, tag: '<thinking>' },
                { start: /<\|think\|>/i, end: /<\|\/think\|>/i, tag: '<|think|>' },
            ];

            for (const { start, end, tag } of unclosedPatterns) {
                const startMatch = mainContent.match(start);
                if (startMatch && !end.test(mainContent)) {
                    const startIdx = mainContent.indexOf(startMatch[0]);
                    const thinkContent = mainContent.slice(startIdx + startMatch[0].length).trim();
                    if (thinkContent) {
                        thinkingParts.push(thinkContent + ' ⏳');
                        mainContent = mainContent.slice(0, startIdx);
                    }
                    break;
                }
            }

            return {
                thinking: thinkingParts.join('\n\n'),
                content: mainContent.trim()
            };
        },

        classifyAiOutput(rawText) {
            const raw = `${rawText ?? ''}`;
            const parsed = this.parseThinkingContent(raw);
            const thinking = parsed.thinking.trim();
            const content = parsed.content.trim();

            if (content) {
                return { kind: 'success', rawText: raw, thinking, content };
            }
            if (thinking) {
                return { kind: 'thinking_only', rawText: raw, thinking, content: '' };
            }
            return { kind: 'empty_response', rawText: raw, thinking: '', content: '' };
        },

        normalizeSummarySelectionText(rawText, options = {}) {
            const maxChars = Math.max(200, Math.min(8000, options.maxChars || 2000));
            const text = `${rawText ?? ''}`.replace(/\s+/g, ' ').trim();
            if (!text) return { text: '', truncated: false, originalLength: 0, maxChars };
            return {
                text: text.length > maxChars ? text.slice(0, maxChars).trim() : text,
                truncated: text.length > maxChars,
                originalLength: text.length,
                maxChars
            };
        },

        isSummarySelectionTextUseful(rawText) {
            const { text } = this.normalizeSummarySelectionText(rawText);
            if (!text) return false;
            const compact = text.replace(/\s+/g, '');
            const meaningful = compact.replace(/[^0-9A-Za-z\u3400-\u9fff]/g, '');
            return meaningful.length > 0;
        },

        buildSummarySelectionPrompt(action, rawText) {
            const normalized = this.normalizeSummarySelectionText(rawText);
            const selectedText = normalized.text;
            if (!selectedText) return { prompt: '', autoSend: false, action, truncated: false };
            const quote = `\u300c${selectedText}\u300d`;
            const truncatedNote = normalized.truncated
                ? `\n\n注：原选区较长，已截取前 ${normalized.maxChars} 字。`
                : '';

            if (action === 'explain') {
                return {
                    action,
                    autoSend: true,
                    truncated: normalized.truncated,
                    prompt: `请解释下面这段总结内容。要求：\n1. 说明它在原帖讨论中的含义；\n2. 如果涉及人物、楼层、争议点，请结合已有帖子上下文解释；\n3. 不要编造原文没有的信息。\n\n选中文本：\n${quote}${truncatedNote}`
                };
            }

            if (action === 'summarize') {
                return {
                    action,
                    autoSend: true,
                    truncated: normalized.truncated,
                    prompt: `请只针对下面这段总结内容做进一步压缩总结。要求：\n1. 提炼核心观点；\n2. 保留关键实体、原因和结论；\n3. 如有不确定处，请说明不确定。\n\n选中文本：\n${quote}${truncatedNote}`
                };
            }

            if (action === 'ask') {
                return {
                    action,
                    autoSend: false,
                    truncated: normalized.truncated,
                    prompt: `我想基于下面这段内容继续提问：\n\n${quote}${truncatedNote}\n\n我的问题是：`
                };
            }

            return {
                action: 'insert',
                autoSend: false,
                truncated: normalized.truncated,
                prompt: `选中的总结片段：\n\n${quote}${truncatedNote}\n\n请基于这段内容回答：`
            };
        },

        toOpenAiMessage(message) {
            const role = message?.role === 'ai' ? 'assistant' : message?.role;
            if (!['system', 'user', 'assistant'].includes(role)) return null;

            const content = `${message?.content ?? ''}`;
            if (!content.trim()) return null;

            return { role, content };
        },

        sanitizeMessagesForApi(messages) {
            if (!Array.isArray(messages)) return [];
            return messages
                .map(message => this.toOpenAiMessage(message))
                .filter(Boolean);
        },

        getReplyCount: () => {
            const el = document.querySelector('.timeline-replies');
            if (!el) return 0;
            const txt = el.textContent.trim();
            return parseInt(txt.includes('/') ? txt.split('/')[1] : txt) || 0;
        },

        getLinuxDoFetchOptions(options = {}) {
            const csrf = document.querySelector('meta[name="csrf-token"]')?.content;
            const headers = {
                'accept': 'application/json',
                'x-requested-with': 'XMLHttpRequest'
            };
            if (csrf) headers['x-csrf-token'] = csrf;
            const fetchOptions = { headers, credentials: 'same-origin' };
            if (options.noStore) fetchOptions.cache = 'no-store';
            return fetchOptions;
        },

        async fetchLinuxDoJson(url, opts = {}) {
            const resp = await fetch(url, opts);
            const contentType = resp.headers.get('content-type') || '';

            if (!resp.ok) {
                throw new Error(`Linux.do 请求失败：HTTP ${resp.status}`);
            }

            if (!contentType.toLowerCase().includes('application/json')) {
                const body = await resp.text().catch(() => '');
                if (/cloudflare|challenge|cf-/i.test(body)) {
                    throw new Error('Linux.do 返回了安全校验页面，请缩小范围或稍后重试');
                }
                if (/login|csrf|authenticity/i.test(body)) {
                    throw new Error('Linux.do 返回了登录或会话校验页面，请确认当前页面已登录且会话有效');
                }
                throw new Error(`Linux.do 返回非 JSON 响应：${contentType || '未知类型'}`);
            }

            return resp.json();
        },

        normalizeTopicId(topicId) {
            return String(topicId || '').trim();
        },

        getCachedTopicData(topicId) {
            const key = this.normalizeTopicId(topicId);
            if (!key) return null;

            const cached = this.topicDataCache.get(key);
            if (!cached) return null;

            const ageMs = Date.now() - cached.createdAt;
            if (ageMs > this.topicDataCachePolicy.ttlMs) {
                this.topicDataCache.delete(key);
                return null;
            }

            this.topicDataCache.delete(key);
            this.topicDataCache.set(key, cached);
            return cached.topicData;
        },

        setCachedTopicData(topicId, topicData) {
            const key = this.normalizeTopicId(topicId);
            if (!key || !topicData) return topicData;

            this.topicDataCache.set(key, {
                createdAt: Date.now(),
                topicData
            });

            while (this.topicDataCache.size > this.topicDataCachePolicy.maxTopics) {
                const oldestKey = this.topicDataCache.keys().next().value;
                this.topicDataCache.delete(oldestKey);
            }

            return topicData;
        },

        clearTopicDataCache(topicId = null) {
            const key = this.normalizeTopicId(topicId);
            if (key) {
                this.topicDataCache.delete(key);
                for (const inflightKey of this.topicDataInflight.keys()) {
                    if (inflightKey.startsWith(`${key}:`)) this.topicDataInflight.delete(inflightKey);
                }
                return;
            }
            this.topicDataCache.clear();
            this.topicDataInflight.clear();
        },

        async fetchTopicData(topicId, opts = this.getLinuxDoFetchOptions(), options = {}) {
            const key = this.normalizeTopicId(topicId);
            if (!key) throw new Error('未检测到帖子ID');
            const forceRefresh = options.forceRefresh === true;

            if (!forceRefresh) {
                const cached = this.getCachedTopicData(key);
                if (cached) return { topicData: cached, cacheHit: true };
            }

            const inflightKey = `${key}:${forceRefresh ? 'force' : 'normal'}`;
            if (this.topicDataInflight.has(inflightKey)) {
                return this.topicDataInflight.get(inflightKey);
            }

            const fetchOptions = forceRefresh
                ? { ...opts, cache: 'no-store' }
                : opts;
            const request = this.fetchLinuxDoJson(`https://linux.do/t/-/${key}.json`, fetchOptions)
                .then((topicData) => {
                    this.setCachedTopicData(key, topicData);
                    return { topicData, cacheHit: false };
                })
                .finally(() => {
                    this.topicDataInflight.delete(inflightKey);
                });
            this.topicDataInflight.set(inflightKey, request);
            return request;
        },

        getTopicBoundsFromTopicData(topicData, topicId = '') {
            const initialPosts = Array.isArray(topicData?.post_stream?.posts)
                ? topicData.post_stream.posts
                : [];
            const postNumbers = initialPosts
                .map(post => Number(post?.post_number))
                .filter(Number.isFinite);
            const highestFromTopic = Number(topicData?.highest_post_number);
            const highestFromPosts = postNumbers.length > 0 ? Math.max(...postNumbers) : 0;
            const highestPostNumber = Number.isFinite(highestFromTopic) && highestFromTopic > 0
                ? highestFromTopic
                : highestFromPosts;
            const postsCount = Number(topicData?.posts_count);
            const replyCount = Number(topicData?.reply_count);
            const streamIds = this.getTopicStreamIds(topicData);

            return {
                topicId: this.normalizeTopicId(topicData?.id || topicId),
                highestPostNumber: Number.isFinite(highestPostNumber) && highestPostNumber > 0 ? highestPostNumber : 0,
                postsCount: Number.isFinite(postsCount) ? postsCount : null,
                replyCount: Number.isFinite(replyCount) ? replyCount : null,
                streamLength: streamIds.length,
                source: Number.isFinite(highestFromTopic) && highestFromTopic > 0 ? 'topic-json' : 'initial-posts',
                topicData
            };
        },

        async getTopicBounds(topicId, options = {}) {
            const key = this.normalizeTopicId(topicId);
            let topicData = options.topicData || null;

            if (!topicData && key) {
                const forceRefresh = options.forceRefresh === true;
                const fetched = await this.fetchTopicData(key, this.getLinuxDoFetchOptions({ noStore: forceRefresh }), {
                    forceRefresh
                });
                topicData = fetched.topicData;
            }

            const bounds = this.getTopicBoundsFromTopicData(topicData, key);
            if (bounds.highestPostNumber > 0) return bounds;
            if (options.allowDomFallback === false) return bounds;

            const fallback = this.getReplyCount();
            return {
                ...bounds,
                highestPostNumber: fallback,
                source: fallback ? 'dom-fallback' : bounds.source
            };
        },

        sleep(ms) {
            return new Promise(resolve => setTimeout(resolve, ms));
        },

        chunkArray(items, size) {
            const chunks = [];
            for (let i = 0; i < items.length; i += size) {
                chunks.push(items.slice(i, i + size));
            }
            return chunks;
        },

        getTopicStreamIds(topicData) {
            const stream = topicData?.post_stream?.stream;
            if (Array.isArray(stream) && stream.length > 0) return stream;
            return (topicData?.post_stream?.posts || []).map(post => post.id).filter(Boolean);
        },

        getCurrentUserKey() {
            try {
                const discourseUser = window.Discourse?.User?.current?.();
                if (discourseUser?.username) return `user:${discourseUser.username}`;
                const metaUser = document.querySelector('meta[name="current-user"]')?.content
                    || document.querySelector('meta[name="discourse-current-username"]')?.content;
                if (metaUser) return `meta:${metaUser}`;
                const dataUser = document.body?.dataset?.userId || document.body?.dataset?.username;
                if (dataUser) return `body:${dataUser}`;
            } catch (e) {
                console.warn('[Linux.do 智能总结] 获取当前用户标识失败', e);
            }
            return 'unknown';
        },

        getDialogueCacheKeys(topicId, start, end, userKey = this.getCurrentUserKey()) {
            return {
                topicKey: String(topicId),
                rangeKey: `${Number(start)}:${Number(end)}:${userKey || 'unknown'}`
            };
        },

        estimateCacheTextBytes(text) {
            const value = String(text || '');
            if (typeof TextEncoder !== 'undefined') {
                return new TextEncoder().encode(value).length;
            }
            return value.length * 2;
        },

        isDialogueCacheEntryExpired(entry, now = Date.now()) {
            const policy = this.dialogueCachePolicy;
            return !entry
                || now - entry.createdAt > policy.maxAgeMs
                || now - entry.lastAccessAt > policy.ttlMs;
        },

        scheduleDialogueCacheCleanup() {
            if (this.dialogueCacheCleanupTimer || typeof setInterval !== 'function') return;
            this.dialogueCacheCleanupTimer = setInterval(() => {
                this.pruneDialogueCache();
            }, this.dialogueCachePolicy.cleanupIntervalMs);
        },

        stopDialogueCacheCleanup() {
            if (!this.dialogueCacheCleanupTimer || typeof clearInterval !== 'function') return;
            clearInterval(this.dialogueCacheCleanupTimer);
            this.dialogueCacheCleanupTimer = null;
        },

        pruneDialogueCache(now = Date.now()) {
            const policy = this.dialogueCachePolicy;

            for (const [topicKey, rangeMap] of this.dialogueCacheTopics.entries()) {
                for (const [rangeKey, entry] of rangeMap.entries()) {
                    if (this.isDialogueCacheEntryExpired(entry, now)) {
                        rangeMap.delete(rangeKey);
                    }
                }

                const ranges = [...rangeMap.entries()]
                    .sort((a, b) => a[1].lastAccessAt - b[1].lastAccessAt);
                while (ranges.length > policy.maxRangesPerTopic) {
                    const [rangeKey] = ranges.shift();
                    rangeMap.delete(rangeKey);
                }

                if (rangeMap.size === 0) {
                    this.dialogueCacheTopics.delete(topicKey);
                }
            }

            const topics = [...this.dialogueCacheTopics.entries()]
                .map(([topicKey, rangeMap]) => ({
                    topicKey,
                    lastAccessAt: Math.max(...[...rangeMap.values()].map(entry => entry.lastAccessAt))
                }))
                .sort((a, b) => a.lastAccessAt - b.lastAccessAt);
            while (topics.length > policy.maxTopics) {
                const topic = topics.shift();
                this.dialogueCacheTopics.delete(topic.topicKey);
            }

            const entries = [];
            let totalBytes = 0;
            for (const [topicKey, rangeMap] of this.dialogueCacheTopics.entries()) {
                for (const [rangeKey, entry] of rangeMap.entries()) {
                    totalBytes += entry.approxSize;
                    entries.push({ topicKey, rangeKey, entry });
                }
            }
            entries.sort((a, b) => a.entry.lastAccessAt - b.entry.lastAccessAt);
            while (totalBytes > policy.maxTotalBytes && entries.length > 0) {
                const item = entries.shift();
                const rangeMap = this.dialogueCacheTopics.get(item.topicKey);
                if (rangeMap?.delete(item.rangeKey)) {
                    totalBytes -= item.entry.approxSize;
                    if (rangeMap.size === 0) this.dialogueCacheTopics.delete(item.topicKey);
                }
            }

            if (this.dialogueCacheTopics.size === 0) {
                this.stopDialogueCacheCleanup();
            }
        },

        getCachedDialogue(topicId, start, end) {
            const now = Date.now();
            this.pruneDialogueCache(now);

            const { topicKey, rangeKey } = this.getDialogueCacheKeys(topicId, start, end);
            const rangeMap = this.dialogueCacheTopics.get(topicKey);
            const entry = rangeMap?.get(rangeKey);
            if (!entry) return null;
            if (this.isDialogueCacheEntryExpired(entry, now)) {
                rangeMap.delete(rangeKey);
                if (rangeMap.size === 0) this.dialogueCacheTopics.delete(topicKey);
                return null;
            }

            entry.lastAccessAt = now;
            return { ...entry, cacheHit: true };
        },

        setCachedDialogue(topicId, start, end, text, meta = {}) {
            const approxSize = this.estimateCacheTextBytes(text);
            if (!text || approxSize > this.dialogueCachePolicy.maxEntryBytes) return null;

            const now = Date.now();
            const { topicKey, rangeKey } = this.getDialogueCacheKeys(topicId, start, end);
            if (!this.dialogueCacheTopics.has(topicKey)) {
                this.dialogueCacheTopics.set(topicKey, new Map());
            }

            const entry = {
                topicId: String(topicId),
                start: Number(start),
                end: Number(end),
                text,
                postCount: meta.postCount || 0,
                rangeMapping: meta.rangeMapping || null,
                createdAt: now,
                lastAccessAt: now,
                approxSize
            };
            this.dialogueCacheTopics.get(topicKey).set(rangeKey, entry);
            this.pruneDialogueCache(now);
            this.scheduleDialogueCacheCleanup();
            return entry;
        },

        clearDialogueCache(topicId = null, start = null, end = null) {
            const finish = (count) => {
                if (this.dialogueCacheTopics.size === 0) this.stopDialogueCacheCleanup();
                return count;
            };

            if (!topicId) {
                const count = this.dialogueCacheTopics.size;
                this.dialogueCacheTopics.clear();
                return finish(count);
            }

            const topicKey = String(topicId);
            const rangeMap = this.dialogueCacheTopics.get(topicKey);
            if (!rangeMap) return finish(0);

            if (!start || !end) {
                const count = rangeMap.size;
                this.dialogueCacheTopics.delete(topicKey);
                return finish(count);
            }

            const { rangeKey } = this.getDialogueCacheKeys(topicId, start, end);
            const removed = rangeMap.delete(rangeKey) ? 1 : 0;
            if (rangeMap.size === 0) this.dialogueCacheTopics.delete(topicKey);
            return finish(removed);
        },

        async fetchPostsByIds(topicId, postIds, opts, onProgress, policyOverride = {}, progressMeta = {}) {
            const ids = [...new Set(postIds.filter(Boolean))];
            if (ids.length === 0) return [];

            const policy = { ...this.linuxDoPostFetchPolicy, ...policyOverride };
            const chunks = this.chunkArray(ids, policy.batchSize);
            this.assertLinuxDoRequestBudget({
                idCount: ids.length,
                candidateIdCount: progressMeta.candidateIdCount || ids.length,
                batchCount: progressMeta.usedPostBatchRequests || chunks.length,
                start: progressMeta.start,
                end: progressMeta.end,
                stage: progressMeta.stage
            });
            const results = new Array(chunks.length);
            const workerCount = Math.min(policy.concurrency, chunks.length);
            let cursor = 0;
            let doneBatches = 0;
            let doneIds = 0;
            let nextBatchStartAt = 0;

            const waitForBatchSlot = async () => {
                if (policy.batchDelayMs <= 0) return;

                const now = Date.now();
                const waitMs = Math.max(0, nextBatchStartAt - now);
                nextBatchStartAt = Math.max(now, nextBatchStartAt) + policy.batchDelayMs;
                if (waitMs > 0) {
                    await this.sleep(waitMs);
                }
            };

            const runWorker = async () => {
                while (cursor < chunks.length) {
                    const index = cursor++;
                    await waitForBatchSlot();

                    const chunk = chunks[index];
                    const q = chunk.map(id => `post_ids[]=${encodeURIComponent(id)}`).join('&');
                    const data = await this.fetchLinuxDoJson(`https://linux.do/t/${topicId}/posts.json?${q}&include_suggested=false`, opts);
                    results[index] = data.post_stream?.posts || [];
                    doneBatches += 1;
                    doneIds += chunk.length;

                    if (typeof onProgress === 'function') {
                        onProgress({
                            ...progressMeta,
                            doneIds: Math.min(doneIds, ids.length),
                            totalIds: ids.length,
                            doneBatches,
                            totalBatches: chunks.length,
                            batchSize: policy.batchSize,
                            concurrency: policy.concurrency,
                            batchDelayMs: policy.batchDelayMs
                        });
                    }
                }
            };

            await Promise.all(Array.from({ length: workerCount }, () => runWorker()));
            return results.flat();
        },

        assertLinuxDoRequestBudget({ idCount = 0, candidateIdCount = idCount, batchCount = 0, start = null, end = null, stage = '' } = {}) {
            const budget = this.linuxDoRequestBudgetPolicy;
            const normalizedIdCount = Math.max(0, Number(idCount) || 0);
            const normalizedCandidateIdCount = Math.max(0, Number(candidateIdCount) || 0);
            const normalizedBatchCount = Math.max(0, Number(batchCount) || 0);
            const overCandidateIds = normalizedCandidateIdCount > budget.maxCandidateIds;
            const overBatchRequests = normalizedBatchCount > budget.maxPostBatchRequests;

            if (!overCandidateIds && !overBatchRequests) {
                return {
                    idCount: normalizedIdCount,
                    candidateIdCount: normalizedCandidateIdCount,
                    batchCount: normalizedBatchCount
                };
            }

            const rangeText = Number.isFinite(Number(start)) && Number.isFinite(Number(end))
                ? `${start}-${end} 楼`
                : '当前范围';
            const stageText = stage ? `（${stage}）` : '';
            throw new Error(
                `范围过大：${rangeText}${stageText}候选 ${normalizedCandidateIdCount} 条，` +
                `预计 posts 请求 ${normalizedBatchCount} 批，超过脚本安全上限（候选 ${budget.maxCandidateIds} 条，` +
                `posts 请求 ${budget.maxPostBatchRequests} 批）。请缩小楼层范围或分段总结/导出。`
            );
        },

        createLinuxDoRequestBudgetTracker({ start = null, end = null, stage = 'topic-range' } = {}) {
            const core = this;
            const budget = this.linuxDoRequestBudgetPolicy;
            let usedPostBatchRequests = 0;

            return {
                assertNext({ idCount = 0, candidateIdCount = idCount, batchCount = 0, stage: nextStage = stage } = {}) {
                    const normalizedBatchCount = Math.max(0, Number(batchCount) || 0);
                    const projectedBatchCount = usedPostBatchRequests + normalizedBatchCount;
                    core.assertLinuxDoRequestBudget({
                        idCount,
                        candidateIdCount,
                        batchCount: projectedBatchCount,
                        start,
                        end,
                        stage: nextStage
                    });
                    usedPostBatchRequests = projectedBatchCount;
                    return {
                        usedPostBatchRequests,
                        remainingPostBatchRequests: Math.max(0, budget.maxPostBatchRequests - usedPostBatchRequests)
                    };
                }
            };
        },

        getRangeLookBehindRounds(start) {
            const policy = this.linuxDoRangeMappingPolicy;
            const startIndex = Math.max(0, start - 1);
            const maxLookBehind = Math.min(startIndex, policy.maxLookBehindIds);
            const step = Math.max(1, policy.lookBehindStepIds);
            const rounds = [0];

            for (let value = step; value < maxLookBehind; value += step) {
                rounds.push(value);
            }
            if (maxLookBehind > 0 && rounds[rounds.length - 1] !== maxLookBehind) {
                rounds.push(maxLookBehind);
            }

            return rounds;
        },

        getTopicStreamWindow(streamIds, start, end, lookBehindIds) {
            const upperIndex = Math.min(streamIds.length, Math.max(0, end + lookBehindIds));
            const lowerIndex = Math.min(upperIndex, Math.max(0, start - 1 - lookBehindIds));
            return {
                ids: streamIds.slice(lowerIndex, upperIndex),
                lowerIndex,
                upperIndex,
                lookBehindIds
            };
        },

        filterPostsByPostNumber(posts, start, end) {
            return posts
                .filter((post) => {
                    const postNumber = Number(post?.post_number);
                    return Number.isFinite(postNumber) && postNumber >= start && postNumber <= end;
                })
                .sort((a, b) => Number(a.post_number) - Number(b.post_number));
        },

        createPostsByPostNumber(posts) {
            const map = new Map();
            (posts || []).forEach((post) => {
                const postNumber = Number(post?.post_number);
                if (Number.isFinite(postNumber) && !map.has(postNumber)) {
                    map.set(postNumber, post);
                }
            });
            return map;
        },

        getReplyRelation(post, postsByPostNumber = null) {
            const replyToPostNumber = Number(post?.reply_to_post_number);
            if (!Number.isFinite(replyToPostNumber) || replyToPostNumber <= 0) {
                return null;
            }

            const replyToUser = post?.reply_to_user;
            const localReplyPost = postsByPostNumber?.get(replyToPostNumber);
            const hasReplyToUser = Boolean(replyToUser?.name || replyToUser?.username);
            const replyUser = hasReplyToUser ? replyToUser : (localReplyPost || null);

            if (replyUser) {
                return {
                    postNumber: replyToPostNumber,
                    available: true,
                    inCurrentRange: Boolean(localReplyPost),
                    name: replyUser.name || replyUser.username || '',
                    username: replyUser.username || ''
                };
            }

            return {
                postNumber: replyToPostNumber,
                available: false,
                inCurrentRange: false,
                name: '',
                username: ''
            };
        },

        formatReplyRelationInline(post, postsByPostNumber = null) {
            const relation = this.getReplyRelation(post, postsByPostNumber);
            if (!relation) return '';

            if (!relation.available) {
                return `-回复[${relation.postNumber}楼]（原帖已删除或不可见）`;
            }

            const userPart = relation.name || relation.username
                ? ` ${relation.name || relation.username}${relation.username ? `（${relation.username}）` : ''}`
                : '';
            return `-回复[${relation.postNumber}楼]${userPart}`;
        },

        formatReplyRelationLine(post, postsByPostNumber = null) {
            const relation = this.getReplyRelation(post, postsByPostNumber);
            if (!relation) return '';

            if (!relation.available) {
                return `回复: [${relation.postNumber}楼]（原帖已删除或不可见）`;
            }

            const userPart = relation.name || relation.username
                ? ` ${relation.name || relation.username}${relation.username ? `（@${relation.username}）` : ''}`
                : '';
            return `回复: [${relation.postNumber}楼]${userPart}`;
        },

        formatReplyRelationHtml(post, postsByPostNumber = null) {
            const relation = this.getReplyRelation(post, postsByPostNumber);
            if (!relation) return '';

            const target = `回复 #${relation.postNumber}`;
            if (!relation.available) {
                return `<span class="reply-relation reply-relation-missing">${this.escapeHtml(`${target}（原帖已删除或不可见）`)}</span>`;
            }

            const userPart = relation.name || relation.username
                ? ` ${relation.name || relation.username}${relation.username ? `（@${relation.username}）` : ''}`
                : '';
            const text = this.escapeHtml(`${target}${userPart}`);
            if (relation.inCurrentRange) {
                return `<a class="reply-relation" href="#post-${relation.postNumber}">${text}</a>`;
            }
            return `<span class="reply-relation">${text}</span>`;
        },

        getHtmlParser() {
            if (typeof DOMParser === 'undefined') return null;
            if (!this.htmlParser) this.htmlParser = new DOMParser();
            return this.htmlParser;
        },

        plainTextFromHtml(html) {
            const source = `${html ?? ''}`;
            if (!source) return '';

            const parser = this.getHtmlParser();
            if (parser) {
                const doc = parser.parseFromString(source, 'text/html');
                doc.querySelectorAll('script, style, iframe, object, embed').forEach((el) => el.remove());
                return this.normalizePlainText(doc.body?.textContent || '');
            }

            const withoutUnsafeBlocks = source.replace(/<script[\s\S]*?<\/script>/gi, ' ')
                .replace(/<style[\s\S]*?<\/style>/gi, ' ')
                .replace(/<iframe[\s\S]*?<\/iframe>/gi, ' ')
                .replace(/<object[\s\S]*?<\/object>/gi, ' ')
                .replace(/<embed[\s\S]*?>/gi, ' ');
            return this.normalizePlainText(this.decodeEntities(withoutUnsafeBlocks.replace(/<[^>]+>/g, ' ')));
        },

        normalizePlainText(text) {
            return `${text ?? ''}`
                .replace(/\r\n/g, '\n')
                .replace(/[ \t]+\n/g, '\n')
                .replace(/\n{3,}/g, '\n\n')
                .replace(/[ \t]{2,}/g, ' ')
                .replace(/\s+([,.!?;:，。！？；：])/g, '$1')
                .trim();
        },

        truncatePlainText(text, maxLength = 160) {
            const value = this.normalizePlainText(text);
            if (value.length <= maxLength) return value;
            return `${value.slice(0, maxLength).trim()}...`;
        },

        getHtmlAttribute(html, attrName) {
            const escapedName = `${attrName}`.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const match = `${html ?? ''}`.match(new RegExp(`\\s${escapedName}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s>]+))`, 'i'));
            return this.decodeEntities(match?.[1] || match?.[2] || match?.[3] || '').trim();
        },

        extractFirstLinkInfo(html) {
            const match = `${html ?? ''}`.match(/<a\b[^>]*href\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))[^>]*>([\s\S]*?)<\/a>/i);
            if (!match) return { href: '', text: '' };
            const href = this.decodeEntities(match[1] || match[2] || match[3] || '').trim();
            return {
                href: href ? this.absoluteUrl(href) : '',
                text: this.plainTextFromHtml(match[4] || '')
            };
        },

        formatDiscourseQuoteForAiText(asideHtml, quoteInner, sourcePost = null) {
            const username = this.getHtmlAttribute(asideHtml, 'data-username');
            const quotedTopic = this.getHtmlAttribute(asideHtml, 'data-topic');
            const quotedPost = this.getHtmlAttribute(asideHtml, 'data-post');
            const link = this.extractFirstLinkInfo(asideHtml);
            const quoteText = this.plainTextFromHtml(quoteInner);
            const sourceTopic = sourcePost?.topic_id ?? sourcePost?.topicId ?? '';
            const hasTopicContext = quotedTopic && sourceTopic;
            const quoteLabel = hasTopicContext && String(quotedTopic) !== String(sourceTopic)
                ? '跨主题引用/转发'
                : quotedTopic && !sourceTopic
                    ? '引用/转发'
                    : '引用';

            const sourceParts = [];
            if (username) sourceParts.push(`@${username}`);
            if (link.text) sourceParts.push(`《${link.text}》`);
            if (quotedTopic || quotedPost) {
                const location = [
                    quotedTopic ? `topic ${quotedTopic}` : '',
                    quotedPost ? `#${quotedPost}` : ''
                ].filter(Boolean).join(' ');
                if (location) sourceParts.push(location);
            }
            if (link.href) sourceParts.push(`链接 ${link.href}`);

            const header = sourceParts.length ? `${quoteLabel}: ${sourceParts.join('，')}` : quoteLabel;
            return `\n[${header}]\n${quoteText}\n[/${quoteLabel}]\n`;
        },

        getBoosts(post) {
            const boosts = Array.isArray(post?.boosts) ? post.boosts : [];
            return boosts.map((boost) => {
                const user = boost?.user || {};
                const username = user.username || boost?.username || '';
                const name = user.name || boost?.name || username;
                return {
                    id: boost?.id ?? null,
                    name,
                    username,
                    text: this.truncatePlainText(this.plainTextFromHtml(boost?.cooked || boost?.text || boost?.raw || ''))
                };
            });
        },

        formatBoostAuthor(boost, atPrefix = false) {
            const name = boost?.name || boost?.username || '未知用户';
            const username = boost?.username || '';
            if (username && username !== name) {
                return `${name}（${atPrefix ? '@' : ''}${username}）`;
            }
            return atPrefix && username ? `@${username}` : name;
        },

        formatBoostsText(post, options = {}) {
            const boosts = this.getBoosts(post);
            if (boosts.length === 0) return '';

            const maxItems = options.maxItems || 5;
            const lines = boosts.slice(0, maxItems).map((boost) => {
                const author = this.formatBoostAuthor(boost, options.atPrefix === true);
                return boost.text ? `- ${author}: ${boost.text}` : `- ${author}`;
            });
            if (boosts.length > maxItems) {
                lines.push(`- 另有 ${boosts.length - maxItems} 条 boost 未展开`);
            }

            return `Boosts: ${boosts.length} 条\n${lines.join('\n')}`;
        },

        formatBoostsHtml(post) {
            const boosts = this.getBoosts(post);
            if (boosts.length === 0) return '';

            const maxItems = 10;
            const items = boosts.slice(0, maxItems).map((boost) => {
                const author = this.escapeHtml(this.formatBoostAuthor(boost, true));
                const text = boost.text ? `<span class="boost-text">${this.escapeHtml(boost.text)}</span>` : '';
                return `<li><span class="boost-author">${author}</span>${text}</li>`;
            }).join('');
            const overflow = boosts.length > maxItems
                ? `<li class="boost-more">另有 ${boosts.length - maxItems} 条 boost 未展开</li>`
                : '';

            return `
                <div class="post-boosts">
                    <div class="boosts-title">Boosts · ${boosts.length}</div>
                    <ul>${items}${overflow}</ul>
                </div>
            `;
        },

        getFetchProgressText(progress, subject = '帖子内容') {
            if (progress.stage === 'cache-hit') {
                return `使用刚获取的${subject}缓存，正在重新请求 AI...`;
            }
            const stage = progress.stage === 'range-lookbehind'
                ? `正在校准楼层范围（回看 ${progress.lookBehindIds} 个索引）`
                : `正在分批获取${subject}`;
            return `${stage} ${progress.doneIds}/${progress.totalIds}（${progress.doneBatches}/${progress.totalBatches} 批，每批 ${progress.batchSize}，并发 ${progress.concurrency}，间隔 ${progress.batchDelayMs}ms）...`;
        },

        buildSummaryCoverageReport({ topicId, start, end, cacheHit, cacheEntry, rangeMapping }) {
            const mapping = rangeMapping || cacheEntry?.rangeMapping || null;
            const visiblePostCount = Number.isFinite(Number(mapping?.visiblePostCount))
                ? Number(mapping.visiblePostCount)
                : Number.isFinite(Number(cacheEntry?.postCount))
                    ? Number(cacheEntry.postCount)
                    : null;
            const candidateIdCount = Number.isFinite(Number(mapping?.candidateIdCount))
                ? Number(mapping.candidateIdCount)
                : null;
            const fetchedPostCount = Number.isFinite(Number(mapping?.fetchedPostCount))
                ? Number(mapping.fetchedPostCount)
                : null;
            const missingCandidateIdCount = Number.isFinite(Number(mapping?.missingCandidateIdCount))
                ? Number(mapping.missingCandidateIdCount)
                : null;
            const lookBehindIds = Number.isFinite(Number(mapping?.lookBehindIds))
                ? Number(mapping.lookBehindIds)
                : 0;
            const highestPostNumber = Number.isFinite(Number(mapping?.highestPostNumber))
                ? Number(mapping.highestPostNumber)
                : null;
            const requestedEnd = Number(end);

            return {
                topicId: topicId ? String(topicId) : '',
                requestedStart: Number(start),
                requestedEnd,
                highestPostNumber,
                postsCount: Number.isFinite(Number(mapping?.postsCount)) ? Number(mapping.postsCount) : null,
                replyCount: Number.isFinite(Number(mapping?.replyCount)) ? Number(mapping.replyCount) : null,
                streamLength: Number.isFinite(Number(mapping?.streamLength)) ? Number(mapping.streamLength) : null,
                rangeBoundSource: mapping?.rangeBoundSource || null,
                requestedEndBelowHighest: Boolean(highestPostNumber && requestedEnd < highestPostNumber),
                visiblePostCount,
                candidateIdCount,
                fetchedPostCount,
                missingCandidateIdCount,
                cacheHit: cacheHit === true,
                fallbackUsed: mapping?.fallbackUsed === true,
                lookBehindIds,
                complete: mapping?.complete !== false,
                metadata: {
                    replyRelation: true,
                    boosts: true
                }
            };
        },

        renderSummaryCoverageReport(report) {
            if (!report) return '';
            const rows = [];
            const addRow = (label, value, className = '') => {
                if (value === null || value === undefined || value === '') return;
                const safeLabel = this.escapeHtml(label);
                const safeValue = this.escapeHtml(value);
                const valueClass = className ? ` class="${className}"` : '';
                rows.push(`<dt>${safeLabel}</dt><dd${valueClass}>${safeValue}</dd>`);
            };

            addRow('Topic', report.topicId);
            addRow('请求范围', `${report.requestedStart}-${report.requestedEnd} 楼`);
            addRow('主题最高楼层', report.highestPostNumber === null ? '未知' : `${report.highestPostNumber} 楼`);
            addRow('楼层上限来源', report.rangeBoundSource);
            addRow('实际可见楼层', report.visiblePostCount === null ? '未知' : `${report.visiblePostCount} 条`);
            addRow('候选 stream 项', report.candidateIdCount === null ? null : `${report.candidateIdCount} 个`);
            addRow('已取得候选帖', report.fetchedPostCount === null ? null : `${report.fetchedPostCount} 条`);
            addRow('缓存', report.cacheHit ? '命中当前标签页短时缓存' : '本次重新获取楼层内容');
            addRow('原始拉取回看', report.fallbackUsed ? `是，回看 ${report.lookBehindIds} 个 stream 项` : '否');
            addRow('请求范围完整性', report.complete ? '已在安全请求上限内确认' : '未完全确认', report.complete ? '' : 'coverage-warning');
            if (report.requestedEndBelowHighest) {
                addRow('范围提示', '结束楼层小于主题最高楼层，当前不是全帖范围', 'coverage-warning');
            }
            if (report.missingCandidateIdCount) {
                addRow('缺失候选帖', `${report.missingCandidateIdCount} 条`, 'coverage-warning');
            }
            addRow('元数据', '回复关系与 boosts 已纳入 AI 上下文');

            return `
                <details class="summary-coverage">
                    <summary>本次总结覆盖报告</summary>
                    <dl>${rows.join('')}</dl>
                </details>
            `;
        },

        isTopicStreamWindowComplete(windowPosts, window, start, end, streamLength) {
            if (window.ids.length === 0 || windowPosts.length === 0) return false;

            const postNumbers = windowPosts
                .map(post => Number(post?.post_number))
                .filter(Number.isFinite);
            const firstPostNumber = Math.min(...postNumbers);
            const lastPostNumber = Math.max(...postNumbers);
            const startCovered = window.lowerIndex === 0 || firstPostNumber <= start;
            const endCovered = window.upperIndex >= streamLength || lastPostNumber >= end;

            return Number.isFinite(firstPostNumber)
                && Number.isFinite(lastPostNumber)
                && startCovered
                && endCovered;
        },

        async fetchTopicPosts(topicId, start, end, onProgress, options = {}) {
            const opts = this.getLinuxDoFetchOptions();
            const { topicData } = await this.fetchTopicData(topicId, opts, {
                forceRefresh: options.forceRefreshTopicData === true
            });
            const topicBounds = this.getTopicBoundsFromTopicData(topicData, topicId);
            const streamIds = this.getTopicStreamIds(topicData);

            if (streamIds.length === 0) {
                throw new Error('未获取到帖子楼层索引');
            }

            const initialPosts = topicData.post_stream?.posts || [];
            const postsById = new Map(initialPosts.filter(post => post?.id).map(post => [post.id, post]));
            const lookBehindRounds = this.getRangeLookBehindRounds(start);
            const maxLookBehindIds = lookBehindRounds[lookBehindRounds.length - 1] || 0;
            const widestStreamWindow = this.getTopicStreamWindow(streamIds, start, end, maxLookBehindIds);
            const budgetTracker = this.createLinuxDoRequestBudgetTracker({ start, end, stage: 'topic-range' });
            this.assertLinuxDoRequestBudget({
                idCount: widestStreamWindow.ids.filter(id => !postsById.has(id)).length,
                candidateIdCount: widestStreamWindow.ids.length,
                batchCount: 0,
                start,
                end,
                stage: 'topic-range'
            });
            const fallbackPolicy = {
                concurrency: this.linuxDoRangeMappingPolicy.fallbackConcurrency,
                batchDelayMs: this.linuxDoRangeMappingPolicy.fallbackBatchDelayMs
            };
            let lastMapping = null;

            for (const lookBehindIds of lookBehindRounds) {
                const streamWindow = this.getTopicStreamWindow(streamIds, start, end, lookBehindIds);
                const idsToFetch = streamWindow.ids.filter(id => !postsById.has(id));
                const batchCount = Math.ceil(idsToFetch.length / Math.max(1, this.linuxDoPostFetchPolicy.batchSize));
                const requestBudget = budgetTracker.assertNext({
                    idCount: idsToFetch.length,
                    candidateIdCount: streamWindow.ids.length,
                    batchCount,
                    stage: lookBehindIds > 0 ? 'range-lookbehind' : 'initial-range'
                });
                const fetchedPosts = await this.fetchPostsByIds(
                    topicId,
                    idsToFetch,
                    opts,
                    onProgress,
                    lookBehindIds > 0 ? fallbackPolicy : {},
                    {
                        stage: lookBehindIds > 0 ? 'range-lookbehind' : 'initial-range',
                        start,
                        end,
                        lookBehindIds,
                        candidateIdCount: streamWindow.ids.length,
                        usedPostBatchRequests: requestBudget.usedPostBatchRequests,
                        remainingPostBatchRequests: requestBudget.remainingPostBatchRequests
                    }
                );

                fetchedPosts.forEach((post) => {
                    if (post?.id) postsById.set(post.id, post);
                });

                const missingCandidateIds = streamWindow.ids.filter(id => !postsById.has(id));
                const windowPosts = streamWindow.ids
                    .map(id => postsById.get(id))
                    .filter(Boolean)
                    .sort((a, b) => Number(a.post_number) - Number(b.post_number));
                const posts = this.filterPostsByPostNumber(windowPosts, start, end);
                const complete = missingCandidateIds.length === 0
                    && this.isTopicStreamWindowComplete(windowPosts, streamWindow, start, end, streamIds.length);

                lastMapping = {
                    start,
                    end,
                    complete,
                    fallbackUsed: lookBehindIds > 0,
                    lookBehindIds,
                    candidateIdCount: streamWindow.ids.length,
                    fetchedPostCount: windowPosts.length,
                    visiblePostCount: posts.length,
                    lowerIndex: streamWindow.lowerIndex,
                    upperIndex: streamWindow.upperIndex,
                    missingCandidateIdCount: missingCandidateIds.length,
                    highestPostNumber: topicBounds.highestPostNumber || null,
                    postsCount: topicBounds.postsCount,
                    replyCount: topicBounds.replyCount,
                    streamLength: topicBounds.streamLength,
                    rangeBoundSource: topicBounds.source,
                    requestedEndBelowHighest: Boolean(topicBounds.highestPostNumber && end < topicBounds.highestPostNumber)
                };

                if (complete) {
                    return {
                        topicData,
                        posts,
                        targetIds: posts.map(post => post.id),
                        candidateIds: streamWindow.ids,
                        rangeMapping: lastMapping
                    };
                }
            }

            const detail = lastMapping
                ? `已回看 ${lastMapping.lookBehindIds} 个 stream 项，候选 ${lastMapping.candidateIdCount} 条`
                : '未形成有效候选窗口';
            throw new Error(`无法在安全请求上限内确认 ${start}-${end} 楼的完整映射（${detail}）。请缩小范围，或从更靠前的楼层开始。`);
        },

        formatPostForAiContext(post, postsByPostNumber = null) {
            let content = post.cooked;
            content = content.replace(/<div class="lightbox-wrapper">\s*<a class="lightbox" href="([^"]+)"(?:\s+data-download-href="([^"]+)")?[^>]*title="([^"]*)"[^>]*>[\s\S]*?<\/a>\s*<\/div>/gi, (match, hrefUrl, downloadHref, title) => {
                let imgUrl = hrefUrl || `https://linux.do${downloadHref || ''}`;
                const filename = title || '图片';
                return `\n[图片: ${filename}](${imgUrl})\n`;
            });
            content = content.replace(/<a class="attachment" href="([^"]+)"[^>]*>([^<]+)<\/a>/gi, (match, url, name) => `\n[附件: ${name.trim()}](${url})\n`);
            content = content.replace(/<img[^>]+class="emoji[^>]*alt="([^"]*)"[^>]*>/gi, '$1 ');
            content = content.replace(/<aside\b(?=[^>]*\bclass=["'][^"']*\bquote(?:-modified)?\b)[^>]*>[\s\S]*?<blockquote\b[^>]*>([\s\S]*?)<\/blockquote>[\s\S]*?<\/aside>/gi, (match, quoteInner) => {
                return this.formatDiscourseQuoteForAiText(match, quoteInner, post);
            });
            content = content.replace(/<[^>]+>/g, '').trim();
            const userName = post.name || post.username;
            const userPart = `${userName}（${post.username}）`;
            const replyPart = this.formatReplyRelationInline(post, postsByPostNumber);
            const boostsText = this.formatBoostsText(post);
            const boostPart = boostsText ? `${boostsText}\n\n` : '';
            return `[${post.post_number}楼] ${userPart}${replyPart}:\n${boostPart}${content}`;
        },

        formatPostsForAiContext(posts) {
            const postsByPostNumber = this.createPostsByPostNumber(posts);
            return posts.map(post => this.formatPostForAiContext(post, postsByPostNumber)).join('\n\n');
        },

        async fetchDialogues(building, start, end, onProgress, options = {}) {
            const { posts } = await this.fetchTopicPosts(building, start, end, onProgress, options);
            return this.formatPostsForAiContext(posts);
        },

        async fetchDialoguesCached(building, start, end, onProgress, options = {}) {
            const normalizedStart = Number(start);
            const normalizedEnd = Number(end);

            if (!options.forceRefresh) {
                const cached = this.getCachedDialogue(building, normalizedStart, normalizedEnd);
                if (cached) {
                    if (typeof onProgress === 'function') {
                        onProgress({
                            stage: 'cache-hit',
                            postCount: cached.postCount,
                            ageMs: Date.now() - cached.createdAt
                        });
                    }
                    return { text: cached.text, cacheHit: true, cacheEntry: cached, rangeMapping: cached.rangeMapping || null };
                }
            } else {
                this.clearDialogueCache(building, normalizedStart, normalizedEnd);
            }

            const { posts, rangeMapping } = await this.fetchTopicPosts(building, normalizedStart, normalizedEnd, onProgress, {
                forceRefreshTopicData: options.forceRefreshTopicData === true || options.forceRefresh === true
            });
            const text = this.formatPostsForAiContext(posts);
            const cacheEntry = this.setCachedDialogue(building, normalizedStart, normalizedEnd, text, {
                postCount: posts.length,
                rangeMapping
            });

            return { text, cacheHit: false, cacheEntry, rangeMapping };
        },

        async streamChat(messages, onChunk, onDone, onError) {
            const activeProfile = this.getActiveApiProfile();
            const key = activeProfile.apiKey;
            const url = activeProfile.apiUrl || CONFIG.defaultApiUrl;
            const model = activeProfile.model || CONFIG.defaultModel;
            const useStream = GM_getValue('useStream', true);
            const safeMessages = this.sanitizeMessagesForApi(messages);

            if (!key) return onError("未配置 API Key，请先在设置中配置");
            if (safeMessages.length === 0) return onError("没有可发送给 AI 的有效消息");

            try {
                const resp = await fetch(url, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${key}` },
                    body: JSON.stringify({ model, messages: safeMessages, stream: useStream })
                });
                if (!resp.ok) {
                    const body = await resp.text().catch(() => '');
                    let detail = '';
                    try {
                        const json = JSON.parse(body);
                        detail = json?.error?.message || json?.message || '';
                    } catch (e) {
                        detail = body.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 160);
                    }
                    throw new Error(`HTTP ${resp.status}${detail ? `: ${detail}` : ''}`);
                }

                if (useStream) {
                    const reader = resp.body?.getReader();
                    if (!reader) throw new Error('响应不支持流式读取');
                    const decoder = new TextDecoder();
                    let contentStarted = false;
                    let thinkTagSent = false;
                    let pending = '';

                    const handleStreamLine = (rawLine) => {
                        const line = rawLine.trim();
                        if (!line.startsWith('data:')) return;

                        const payload = line.slice(5).trimStart();
                        if (!payload || payload === '[DONE]') return;

                        try {
                            const json = JSON.parse(payload);
                            const delta = json.choices?.[0]?.delta;
                            if (delta?.reasoning_content) {
                                if (!thinkTagSent) {
                                    onChunk('<think>');
                                    thinkTagSent = true;
                                }
                                onChunk(delta.reasoning_content);
                            }
                            if (delta?.content) {
                                if (thinkTagSent && !contentStarted) {
                                    onChunk('</think>');
                                    contentStarted = true;
                                }
                                onChunk(delta.content);
                            }
                        } catch (e) {}
                    };

                    while (true) {
                        const { done, value } = await reader.read();
                        if (value) {
                            pending += decoder.decode(value, { stream: !done });
                        }
                        if (done) {
                            pending += decoder.decode();
                        }

                        const lines = pending.split(/\r?\n/);
                        pending = lines.pop() ?? '';
                        for (const line of lines) {
                            handleStreamLine(line);
                        }

                        if (done) {
                            if (pending.trim()) handleStreamLine(pending);
                            break;
                        }
                    }
                    if (thinkTagSent && !contentStarted) {
                        onChunk('</think>');
                    }
                } else {
                    const data = await resp.json();
                    const message = data.choices?.[0]?.message;
                    let fullContent = '';
                    if (message?.reasoning_content) {
                        fullContent += `<think>${message.reasoning_content}</think>`;
                    }
                    if (message?.content) {
                        fullContent += message.content;
                    }
                    if (fullContent) onChunk(fullContent);
                }
                onDone();
            } catch (e) { onError(e.message); }
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

        async fetchModelList(apiUrl, apiKey) {
            if (!apiKey) throw new Error('请先填写 API Key');

            const modelsUrl = this.buildModelsUrl(apiUrl);
            const resp = await fetch(modelsUrl, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                    'Authorization': `Bearer ${apiKey}`
                }
            });

            const bodyText = await resp.text();
            let data = null;
            try {
                data = bodyText ? JSON.parse(bodyText) : null;
            } catch (e) {
                if (!resp.ok) throw new Error(`获取模型列表失败：HTTP ${resp.status}`);
                throw new Error('模型列表响应不是有效 JSON');
            }

            if (!resp.ok) {
                const msg = data?.error?.message || data?.message || `HTTP ${resp.status}`;
                throw new Error(`获取模型列表失败：${msg}`);
            }

            const source = Array.isArray(data?.data) ? data.data
                : Array.isArray(data?.models) ? data.models
                : Array.isArray(data) ? data
                : [];

            const models = [...new Set(source.map((item) => {
                if (typeof item === 'string') return item;
                return item?.id || item?.name || item?.model;
            }).filter(Boolean))];

            if (models.length === 0) throw new Error('未从响应中解析到模型列表');
            return { models, url: modelsUrl };
        },

        // ========== 导出功能相关工具函数 ==========

        // 辅助函数：绝对URL转换
        absoluteUrl(src) {
            if (!src) return "";
            if (src.startsWith("http://") || src.startsWith("https://")) return src;
            if (src.startsWith("//")) return window.location.protocol + src;
            if (src.startsWith("/")) return window.location.origin + src;
            return window.location.origin + "/" + src.replace(/^\.?\//, "");
        },

        // 辅助函数：HTML转义
        escapeHtml(s) {
            return (s ?? "").toString()
                .replaceAll("&", "&amp;")
                .replaceAll("<", "&lt;")
                .replaceAll(">", "&gt;")
                .replaceAll('"', "&quot;")
                .replaceAll("'", "&#039;");
        },

        // 辅助函数：解码HTML实体
        decodeEntities(str) {
            const el = document.createElement("textarea");
            el.innerHTML = str || "";
            return el.value;
        },

        getMarked() {
            if (typeof marked !== 'undefined' && typeof marked.parse === 'function') return marked;
            if (globalThis.marked && typeof globalThis.marked.parse === 'function') return globalThis.marked;
            return null;
        },

        getSanitizer() {
            if (typeof DOMPurify !== 'undefined' && typeof DOMPurify.sanitize === 'function') return DOMPurify;
            if (globalThis.DOMPurify && typeof globalThis.DOMPurify.sanitize === 'function') return globalThis.DOMPurify;
            return null;
        },

        fallbackSanitizeHtml(html) {
            const tpl = document.createElement('template');
            tpl.innerHTML = html || '';

            tpl.content.querySelectorAll('script, iframe, object, embed, link, style, meta').forEach((el) => el.remove());
            tpl.content.querySelectorAll('*').forEach((el) => {
                [...el.attributes].forEach((attr) => {
                    const name = attr.name.toLowerCase();
                    const value = attr.value || '';
                    if (name.startsWith('on') || name === 'srcdoc') {
                        el.removeAttribute(attr.name);
                        return;
                    }
                    if ((name === 'href' || name === 'src' || name === 'xlink:href') && /^\s*javascript:/i.test(value)) {
                        el.removeAttribute(attr.name);
                    }
                });
            });

            return tpl.innerHTML;
        },

        sanitizeExportHtml(html) {
            const sanitizer = this.getSanitizer();
            if (sanitizer) {
                return sanitizer.sanitize(html || '');
            }

            console.warn('DOMPurify 未加载，导出 HTML 已使用内置回退清理逻辑');
            return this.fallbackSanitizeHtml(html);
        },

        renderMarkdown(text) {
            const source = `${text ?? ''}`;
            const markdownLib = this.getMarked();
            if (!markdownLib) {
                return this.escapeHtml(source).replace(/\n/g, '<br>');
            }

            const parsedHtml = markdownLib.parse(source);
            const sanitizer = this.getSanitizer();
            if (sanitizer) {
                return sanitizer.sanitize(parsedHtml);
            }

            console.warn('DOMPurify 未加载，已使用内置回退清理逻辑');
            return this.fallbackSanitizeHtml(parsedHtml);
        },

        // 下载文件（优先GM_download，失败则回退到<a download>）
        downloadFile(content, filename, type) {
            const blob = new Blob([content], { type });
            const url = URL.createObjectURL(blob);

            let usedGm = false;
            try {
                if (typeof GM_download === "function") {
                    usedGm = true;
                    GM_download({
                        url,
                        name: filename,
                        saveAs: false,
                        onerror: function (err) {
                            console.warn("GM_download 失败，回退到 <a download> 方式：", err);
                            const a = document.createElement("a");
                            a.href = url;
                            a.download = filename;
                            document.body.appendChild(a);
                            a.click();
                            document.body.removeChild(a);
                        },
                    });
                }
            } catch (e) {
                console.warn("调用 GM_download 异常，将使用 <a download>：", e);
                usedGm = false;
            }

            if (!usedGm) {
                const a = document.createElement("a");
                a.href = url;
                a.download = filename;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
            }

            // 延迟释放URL
            setTimeout(() => URL.revokeObjectURL(url), 10000);
        },

        // DOM转AI文本（用于AI文本导出）
        cookedToAiText(cookedHtml, opts) {
            const { includeImages, includeQuotes } = opts;
            const parser = this.getHtmlParser() || new DOMParser();
            const doc = parser.parseFromString(cookedHtml || "", "text/html");
            const root = doc.body;

            function serialize(node, inPre = false) {
                if (!node) return "";
                if (node.nodeType === Node.TEXT_NODE) return node.nodeValue || "";
                if (node.nodeType !== Node.ELEMENT_NODE) return "";

                const el = node;
                const tag = el.tagName.toLowerCase();

                if (tag === "br") return "\n";

                if (tag === "img") {
                    if (!includeImages) return "";
                    const src = el.getAttribute("src") || el.getAttribute("data-src") || "";
                    const full = Core.absoluteUrl(src);
                    if (!full) return "";
                    return `\n[图片] ${full}\n`;
                }

                if (tag === "a") {
                    const hasImg = el.querySelector("img");
                    const href = el.getAttribute("href") || "";
                    if (hasImg) {
                        return Array.from(el.childNodes).map((c) => serialize(c, inPre)).join("");
                    }
                    const text = Array.from(el.childNodes).map((c) => serialize(c, inPre)).join("").trim();
                    const link = Core.absoluteUrl(href);
                    if (!link) return text;
                    if (!text) return link;
                    if (text === link) return text;
                    return `${text}（${link}）`;
                }

                if (tag === "pre") {
                    const codeEl = el.querySelector("code");
                    const langClass = codeEl?.getAttribute("class") || "";
                    const lang = (langClass.match(/lang(?:uage)?-([a-z0-9_+-]+)/i) || [])[1] || "";
                    const code = (codeEl ? codeEl.textContent : el.textContent) || "";
                    return `\n\`\`\`${lang}\n${code.replace(/\n+$/g, "")}\n\`\`\`\n\n`;
                }

                if (tag === "code") {
                    if (inPre) return el.textContent || "";
                    const t = (el.textContent || "").replace(/\n/g, " ");
                    return t ? `\`${t}\`` : "";
                }

                if (tag === "aside" && /\bquote(?:-modified)?\b/.test(el.getAttribute("class") || "")) {
                    const quoteEl = el.querySelector("blockquote");
                    const quoteText = (quoteEl?.textContent || "").trim();
                    if (!includeQuotes) return quoteText ? "\n(引用已省略)\n" : "";
                    return Core.formatDiscourseQuoteForAiText(el.outerHTML, quoteEl?.innerHTML || "", null);
                }

                if (tag === "blockquote") {
                    if (!includeQuotes) {
                        const inner = (el.textContent || "").trim();
                        return inner ? "\n(引用已省略)\n" : "";
                    }
                    const inner = Array.from(el.childNodes).map((c) => serialize(c, inPre)).join("");
                    return `\n【引用开始】\n${inner.trim()}\n【引用结束】\n\n`;
                }

                if (/^h[1-6]$/.test(tag)) {
                    const inner = (el.textContent || "").trim();
                    return inner ? `\n${inner}\n\n` : "";
                }

                if (tag === "li") {
                    const inner = Array.from(el.childNodes).map((c) => serialize(c, inPre)).join("").trim();
                    return inner ? `- ${inner}\n` : "";
                }

                if (tag === "ul" || tag === "ol") {
                    const inner = Array.from(el.childNodes).map((c) => serialize(c, inPre)).join("");
                    return `\n${inner}\n`;
                }

                if (tag === "p") {
                    const inner = Array.from(el.childNodes).map((c) => serialize(c, inPre)).join("").trim();
                    return inner ? `${inner}\n\n` : "\n";
                }

                const nextInPre = inPre || tag === "pre";
                return Array.from(el.childNodes).map((c) => serialize(c, nextInPre)).join("");
            }

            let text = Array.from(root.childNodes).map((n) => serialize(n, false)).join("");
            text = Core.decodeEntities(text);
            text = text.replace(/\r\n/g, "\n");
            text = text.replace(/[ \t]+\n/g, "\n");
            text = text.replace(/\n{3,}/g, "\n\n").trim();
            return text;
        },

        // 检查帖子是否包含图片
        postHasImage(post) {
            const cooked = post?.cooked || "";
            return cooked.includes("<img");
        }
    };

    // =================================================================================
    // 3. UI 模块注册表 (UI REGISTRY)
    //    所有UI风格都在此注册。
    // =================================================================================
    const UIRegistry = {
        _styles: {},
        register(name, styleObject) {
            this._styles[name] = styleObject;
        },
        get(name) {
            return this._styles[name];
        },
        getAllNames() {
            return Object.keys(this._styles);
        }
    };

    // =================================================================================
    // 4. UI 风格模块 (UI STYLES)
    //    每个风格都是一个独立的对象，实现共同的接口。
    // =================================================================================

    // -------------------------------------------------
    // UI 风格 1: 现代风格
    // -------------------------------------------------
    UIRegistry.register('style1', {
        name: '橘色现代风格',
        styleKey: 'style1',

        //
        // 1. 初始化与销毁
        //
        init(uiManager) {
            this.uiManager = uiManager; // 保存UI管理器的引用

            // 初始化内部状态
            this.isOpen = false;
            this._cleanupFns = [];
            this._timerIds = new Set();
            this._frameIds = new Set();
            this.streamingRenderDelayMs = 80;
            this.summaryRenderTask = null;
            this.bubbleRenderTasks = new Map();
            this.scrollButtonsFrame = null;
            this.btnPos = GM_getValue(this.getStyleStorageKey('btnPos'), { side: 'right', top: '50%' });
            this.side = this.btnPos.side;
            this.sidebarWidth = GM_getValue(this.getStyleStorageKey('sidebarWidth'), 420);
            this.isDarkTheme = GM_getValue(this.getStyleStorageKey('isDarkTheme'), false);
            this.chatHistory = [];
            this.chatSession = this.createEmptyChatSession();
            this.editingMessageId = null;
            this.editingDraftBefore = '';
            this.currentMessageMenuId = null;
            this.currentSummarySelection = null;
            this.summarySelectionOpenTimerId = null;
            this.summarySelectionRequestSeq = 0;
            this.chatRequestSeq = 0;
            this.postContent = '';
            this.lastSummary = '';
            this.forceRefreshDialogueCache = false;
            this.isGenerating = false;
            this.currentTab = 'summary';
            this.userMessageCount = 0;
            this.userScrolledUp = false;
            this.isProgrammaticScroll = false;
            this.apiProfiles = [];
            this.activeApiProfileId = '';
            this.apiProfilePersistTimerId = null;
            this.rangeRequestSeq = 0;
            this.exportRangeRequestSeq = 0;
            this.rangeMode = 'manual';
            this.exportRangeMode = 'manual';
            this.rangeBoundsTopicId = '';
            this.rangeBoundsLastRefreshAt = 0;

            this.render();
            this.restoreState();
            this.bindEvents();
            this.bindKeyboardShortcuts();
        },

        destroy() {
            this._cleanupFns?.forEach((cleanup) => cleanup());
            this._cleanupFns = [];
            this._timerIds?.forEach((timerId) => clearTimeout(timerId));
            this._timerIds?.clear();
            this._frameIds?.forEach((frameId) => {
                if (typeof cancelAnimationFrame === 'function') {
                    cancelAnimationFrame(frameId);
                } else {
                    clearTimeout(frameId);
                }
            });
            this._frameIds?.clear();
            this.summaryRenderTask = null;
            this.bubbleRenderTasks?.clear();
            this.scrollButtonsFrame = null;
            this.summarySelectionOpenTimerId = null;
            this.summarySelectionRequestSeq = (this.summarySelectionRequestSeq || 0) + 1;
            this.currentSummarySelection = null;
            this.resetGlobalUiState();
            this.isOpen = false;
        },

        getStyleStorageKey(key) {
            return `${this.styleKey}_${key}`;
        },

        addManagedListener(target, eventName, handler, options) {
            target.addEventListener(eventName, handler, options);
            this._cleanupFns.push(() => target.removeEventListener(eventName, handler, options));
        },

        setManagedTimeout(handler, delay = 0) {
            const timerId = setTimeout(() => {
                this._timerIds?.delete(timerId);
                handler();
            }, delay);
            this._timerIds?.add(timerId);
            return timerId;
        },

        clearManagedTimeout(timerId) {
            if (!timerId) return;
            clearTimeout(timerId);
            this._timerIds?.delete(timerId);
        },

        requestManagedFrame(handler) {
            if (typeof requestAnimationFrame !== 'function') {
                return this.setManagedTimeout(() => handler(Date.now()), 0);
            }
            const frameId = requestAnimationFrame((timestamp) => {
                this._frameIds?.delete(frameId);
                handler(timestamp);
            });
            this._frameIds?.add(frameId);
            return frameId;
        },

        cancelManagedFrame(frameId) {
            if (!frameId) return;
            if (typeof cancelAnimationFrame === 'function') {
                cancelAnimationFrame(frameId);
                this._frameIds?.delete(frameId);
            } else {
                this.clearManagedTimeout(frameId);
            }
        },

        createFrameThrottledHandler(handler) {
            let frameId = null;
            let lastArgs = null;
            return (...args) => {
                lastArgs = args;
                if (frameId) return;
                frameId = this.requestManagedFrame(() => {
                    frameId = null;
                    const argsToUse = lastArgs;
                    lastArgs = null;
                    handler(...argsToUse);
                });
            };
        },

        scheduleSummaryRender(resultBox, getText) {
            const task = this.summaryRenderTask || {};
            task.resultBox = resultBox;
            task.getText = getText;
            this.summaryRenderTask = task;
            if (task.timerId || task.frameId) return;

            task.timerId = this.setManagedTimeout(() => {
                task.timerId = null;
                task.frameId = this.requestManagedFrame(() => {
                    task.frameId = null;
                    if (this.summaryRenderTask !== task) return;
                    this.updateResultBox(task.resultBox, task.getText(), true);
                });
            }, this.streamingRenderDelayMs);
        },

        cancelSummaryRender() {
            const task = this.summaryRenderTask;
            if (!task) return;
            this.clearManagedTimeout(task.timerId);
            this.cancelManagedFrame(task.frameId);
            this.summaryRenderTask = null;
        },

        scheduleBubbleRender(messageId, bubbleDiv, getText) {
            const key = messageId || bubbleDiv?.dataset?.messageId || '__active_bubble__';
            let task = this.bubbleRenderTasks?.get(key);
            if (!task) {
                task = {};
                this.bubbleRenderTasks?.set(key, task);
            }
            task.bubbleDiv = bubbleDiv;
            task.getText = getText;
            if (task.timerId || task.frameId) return;

            task.timerId = this.setManagedTimeout(() => {
                task.timerId = null;
                task.frameId = this.requestManagedFrame(() => {
                    task.frameId = null;
                    if (this.bubbleRenderTasks?.get(key) !== task) return;
                    this.updateBubble(task.bubbleDiv, task.getText(), true);
                    this.scrollToBottom();
                });
            }, this.streamingRenderDelayMs);
        },

        cancelBubbleRender(messageId) {
            const key = messageId || '__active_bubble__';
            const task = this.bubbleRenderTasks?.get(key);
            if (!task) return;
            this.clearManagedTimeout(task.timerId);
            this.cancelManagedFrame(task.frameId);
            this.bubbleRenderTasks?.delete(key);
        },

        resetGlobalUiState() {
            const body = document.body;
            body.style.marginLeft = '';
            body.style.marginRight = '';
            if (body.style.cursor === 'col-resize') body.style.cursor = '';
            if (body.style.transition === 'margin 0.35s cubic-bezier(0.4, 0, 0.2, 1)' || body.style.transition === 'none') {
                body.style.transition = '';
            }
        },

        getMessageContextMenuHtml() {
            return `
                <div class="message-context-menu" id="message-context-menu" role="menu" aria-hidden="true">
                    <button type="button" class="message-menu-item" data-message-menu-action="copy" role="menuitem">复制</button>
                    <button type="button" class="message-menu-item" data-message-menu-action="edit" role="menuitem">编辑</button>
                    <button type="button" class="message-menu-item" data-message-menu-action="regenerate" role="menuitem">重新生成</button>
                    <button type="button" class="message-menu-item danger" data-message-menu-action="delete" role="menuitem">删除</button>
                </div>
            `;
        },

        getSummarySelectionMenuHtml() {
            return `
                <div class="summary-selection-menu" id="summary-selection-menu" role="menu" aria-hidden="true">
                    <button type="button" class="summary-selection-item" data-summary-selection-action="explain" role="menuitem">解释</button>
                    <button type="button" class="summary-selection-item" data-summary-selection-action="ask" role="menuitem">追问</button>
                    <button type="button" class="summary-selection-item" data-summary-selection-action="summarize" role="menuitem">总结</button>
                    <button type="button" class="summary-selection-item" data-summary-selection-action="insert" role="menuitem">带入</button>
                </div>
            `;
        },

        //
        // 2. 样式与渲染
        //
        getStyles() {
            // 从原脚本 "Linux.do 智能总结-风格1.js" 复制的 STYLES 常量
            return `
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');
        :host {
            font-family: 'Outfit', -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
            --primary: #c96442; --primary-light: #e07d5c; --primary-dark: #a84d32;
            --primary-gradient: linear-gradient(135deg, #c96442 0%, #e08860 50%, #d4724e 100%);
            --primary-glow: rgba(201, 100, 66, 0.35);
            --success: #2d9d78; --success-light: #d1fae5; --danger: #dc4446; --danger-light: #fef2f2; --warning: #d4a054;
            --bg-base: #faf8f6; --bg-card: #ffffff; --bg-glass: rgba(255, 255, 255, 0.88);
            --bg-glass-dark: rgba(250, 248, 246, 0.96); --bg-hover: rgba(201, 100, 66, 0.08);
            --bg-active: rgba(201, 100, 66, 0.12); --bg-setting: #f5f2ef; --bg-input: #ffffff;
            --border-light: rgba(201, 100, 66, 0.12); --border-medium: rgba(201, 100, 66, 0.2);
            --shadow-sm: 0 1px 3px rgba(168, 77, 50, 0.06), 0 1px 2px rgba(168, 77, 50, 0.08);
            --shadow-md: 0 4px 12px -2px rgba(168, 77, 50, 0.12), 0 2px 6px -2px rgba(168, 77, 50, 0.08);
            --shadow-lg: 0 12px 40px -8px rgba(168, 77, 50, 0.18), 0 4px 12px -4px rgba(168, 77, 50, 0.08);
            --shadow-xl: 0 20px 50px -12px rgba(168, 77, 50, 0.25), 0 0 0 1px rgba(201, 100, 66, 0.05);
            --shadow-glow: 0 4px 20px var(--primary-glow), 0 0 0 1px rgba(201, 100, 66, 0.1);
            --text-main: #2d2520; --text-sec: #6b5d54; --text-muted: #9c8b80; --text-inverse: #ffffff;
            --sidebar-width: 420px; --btn-size: 52px; --radius-sm: 10px; --radius-md: 14px;
            --radius-lg: 18px; --radius-xl: 24px; --radius-full: 9999px;
            --transition-fast: 0.15s cubic-bezier(0.4, 0, 0.2, 1);
            --transition-normal: 0.25s cubic-bezier(0.4, 0, 0.2, 1);
            --transition-slow: 0.35s cubic-bezier(0.4, 0, 0.2, 1);
        }
        :host(.dark-theme) {
            --bg-base: #1a1614; --bg-card: #252220; --bg-glass: rgba(37, 34, 32, 0.92);
            --bg-glass-dark: rgba(26, 22, 20, 0.96); --bg-hover: rgba(224, 125, 92, 0.12);
            --bg-active: rgba(224, 125, 92, 0.18); --bg-setting: #1e1b19; --bg-input: #2d2926;
            --border-light: rgba(224, 125, 92, 0.15); --border-medium: rgba(224, 125, 92, 0.25);
            --shadow-sm: 0 1px 3px rgba(0, 0, 0, 0.2); --shadow-md: 0 4px 12px -2px rgba(0, 0, 0, 0.3);
            --shadow-lg: 0 12px 40px -8px rgba(0, 0, 0, 0.4); --shadow-xl: 0 20px 50px -12px rgba(0, 0, 0, 0.5);
            --text-main: #f5f0eb; --text-sec: #b8a99d; --text-muted: #7a6d64;
        }
        * { box-sizing: border-box; }
        .sidebar-panel { position: fixed; top: 0; bottom: 0; width: var(--sidebar-width); background: var(--bg-glass-dark); backdrop-filter: blur(24px) saturate(180%); -webkit-backdrop-filter: blur(24px) saturate(180%); box-shadow: var(--shadow-xl); z-index: 9998; display: flex; flex-direction: column; transition: transform var(--transition-slow); border: 1px solid var(--border-light); }
        .panel-left { left: 0; border-left: none; border-radius: 0 var(--radius-xl) var(--radius-xl) 0; transform: translateX(-100%); }
        .panel-left.open { transform: translateX(0); }
        .panel-right { right: 0; border-right: none; border-radius: var(--radius-xl) 0 0 var(--radius-xl); transform: translateX(100%); }
        .panel-right.open { transform: translateX(0); }
        #toggle-btn { position: fixed; width: var(--btn-size); height: var(--btn-size); background: var(--primary-gradient); color: white; box-shadow: var(--shadow-glow); z-index: 9999; cursor: grab; display: flex; align-items: center; justify-content: center; user-select: none; transition: all var(--transition-normal); border: 2px solid rgba(255, 255, 255, 0.2); outline: none; }
        #toggle-btn::before { content: ''; position: absolute; inset: -3px; border-radius: inherit; background: var(--primary-gradient); opacity: 0; z-index: -1; filter: blur(12px); transition: opacity var(--transition-normal); }
        #toggle-btn:hover { transform: scale(1.08); box-shadow: 0 8px 30px var(--primary-glow), 0 0 0 4px rgba(201, 100, 66, 0.15); }
        #toggle-btn:hover::before { opacity: 0.6; }
        #toggle-btn:active { cursor: grabbing; transform: scale(0.96); }
        #toggle-btn svg { width: 24px; height: 24px; fill: currentColor; transition: transform var(--transition-normal); filter: drop-shadow(0 2px 4px rgba(0,0,0,0.15)); }
        .btn-snap-left { border-radius: 0 var(--radius-lg) var(--radius-lg) 0; }
        .btn-snap-right { border-radius: var(--radius-lg) 0 0 var(--radius-lg); }
        .btn-floating { border-radius: var(--radius-lg); }
        #toggle-btn.arrow-flip svg { transform: rotate(180deg); }
        .resize-handle { position: absolute; top: 0; bottom: 0; width: 6px; cursor: col-resize; z-index: 10001; background: transparent; transition: background var(--transition-fast); }
        .resize-handle::after { content: ''; position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 3px; height: 40px; background: var(--primary); border-radius: 2px; opacity: 0; transition: opacity var(--transition-fast); }
        .resize-handle:hover::after { opacity: 0.5; }
        .handle-left { right: -3px; }
        .handle-right { left: -3px; }
        .header { padding: 20px 24px; border-bottom: 1px solid var(--border-light); display: flex; justify-content: space-between; align-items: center; background: linear-gradient(to bottom, var(--bg-card), transparent); flex-shrink: 0; }
        .header-title { font-size: 18px; font-weight: 700; color: var(--text-main); display: flex; align-items: center; gap: 12px; letter-spacing: -0.02em; }
        .header-title-icon { width: 36px; height: 36px; background: var(--primary-gradient); border-radius: var(--radius-sm); display: flex; align-items: center; justify-content: center; font-size: 18px; box-shadow: var(--shadow-sm); }
        .header-actions { display: flex; gap: 6px; }
        .icon-btn { background: transparent; border: none; cursor: pointer; padding: 10px; border-radius: var(--radius-sm); color: var(--text-sec); transition: all var(--transition-fast); font-size: 16px; display: flex; align-items: center; justify-content: center; position: relative; }
        .icon-btn:hover { background: var(--bg-hover); color: var(--primary); transform: scale(1.05); }
        .icon-btn:active { transform: scale(0.95); }
        .icon-btn.active { background: var(--bg-active); color: var(--primary); }
        .icon-btn[data-tooltip]::after { content: attr(data-tooltip); position: absolute; bottom: -32px; left: 50%; transform: translateX(-50%) scale(0.9); background: var(--text-main); color: var(--text-inverse); padding: 5px 10px; border-radius: 6px; font-size: 11px; font-weight: 500; white-space: nowrap; opacity: 0; pointer-events: none; transition: all var(--transition-fast); z-index: 100; }
        .icon-btn[data-tooltip]:hover::after { opacity: 1; transform: translateX(-50%) scale(1); }
        .tab-bar { display: flex; padding: 12px 16px; gap: 6px; border-bottom: 1px solid var(--border-light); background: var(--bg-glass); flex-shrink: 0; }
        .tab-item { flex: 1; padding: 12px 16px; text-align: center; font-size: 13px; font-weight: 600; color: var(--text-sec); cursor: pointer; border-radius: var(--radius-sm); transition: all var(--transition-fast); display: flex; align-items: center; justify-content: center; gap: 8px; position: relative; overflow: hidden; }
        .tab-item::before { content: ''; position: absolute; inset: 0; background: var(--primary-gradient); opacity: 0; transition: opacity var(--transition-fast); }
        .tab-item:hover { color: var(--primary); background: var(--bg-hover); }
        .tab-item.active { color: var(--text-inverse); background: var(--primary-gradient); box-shadow: var(--shadow-md), inset 0 1px 0 rgba(255,255,255,0.2); }
        .tab-item.active::before { opacity: 1; }
        .tab-item span { position: relative; z-index: 1; }
        .content-area { flex: 1; overflow-y: auto; position: relative; background: var(--bg-base); }
        .view-page { padding: 24px; display: none; animation: fadeSlideIn 0.35s ease; }
        .view-page.active { display: block; }
        @keyframes fadeSlideIn { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
        .form-group { margin-bottom: 24px; }
        .form-label { display: block; font-size: 11px; color: var(--text-sec); margin-bottom: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; }
        input, textarea, select { width: 100%; padding: 14px 18px; border: 2px solid var(--border-light); border-radius: var(--radius-md); font-size: 14px; font-family: inherit; background: var(--bg-input); box-sizing: border-box; transition: all var(--transition-fast); color: var(--text-main); }
        input:focus, textarea:focus { outline: none; border-color: var(--primary); box-shadow: 0 0 0 4px rgba(201, 100, 66, 0.12); background: var(--bg-card); }
        input::placeholder, textarea::placeholder { color: var(--text-muted); }
        textarea { resize: vertical; min-height: 100px; line-height: 1.6; }
        .btn { width: 100%; padding: 16px 24px; border: none; border-radius: var(--radius-md); background: var(--primary-gradient); color: var(--text-inverse); font-weight: 600; font-size: 15px; font-family: inherit; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 10px; transition: all var(--transition-normal); box-shadow: var(--shadow-glow); letter-spacing: 0.02em; position: relative; overflow: hidden; }
        .btn::before { content: ''; position: absolute; top: 0; left: -100%; width: 100%; height: 100%; background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent); transition: left 0.5s; }
        .btn:hover { transform: translateY(-2px); box-shadow: 0 8px 30px var(--primary-glow); }
        .btn:hover::before { left: 100%; }
        .btn:active { transform: translateY(0) scale(0.98); }
        .btn:disabled { opacity: 0.6; cursor: not-allowed; transform: none; box-shadow: none; }
        .btn-secondary { background: var(--bg-card); color: var(--text-main); box-shadow: var(--shadow-sm); border: 2px solid var(--border-light); }
        .btn-secondary:hover { background: var(--bg-hover); border-color: var(--primary); box-shadow: var(--shadow-md); }
        .btn-xs { padding: 8px 14px; font-size: 12px; font-family: inherit; background: var(--bg-card); color: var(--text-main); border-radius: var(--radius-sm); border: 1.5px solid var(--border-light); cursor: pointer; white-space: nowrap; font-weight: 600; transition: all var(--transition-fast); }
        .btn-xs:hover { background: var(--primary); color: var(--text-inverse); border-color: var(--primary); transform: translateY(-1px); }
        .btn-xs:disabled, .btn-xs.loading { opacity: 0.62; cursor: wait; transform: none; }
        .result-box { margin-top: 20px; padding: 24px; background: var(--bg-card); border: 1px solid var(--border-light); border-radius: var(--radius-lg); font-size: 14px; line-height: 1.8; color: var(--text-main); min-height: 180px; max-height: calc(100vh - 380px); overflow-y: auto; word-break: break-word; box-shadow: var(--shadow-sm); position: relative; }
        .result-box.empty { display: flex; align-items: center; justify-content: center; color: var(--text-muted); font-size: 13px; text-align: center; background: linear-gradient(135deg, var(--bg-card) 0%, var(--bg-base) 100%); }
        .summary-coverage { margin-top: 18px; padding: 14px 16px; border: 1px solid var(--border-light); border-radius: var(--radius-md); background: var(--bg-hover); color: var(--text-sec); font-size: 12px; line-height: 1.6; }
        .summary-coverage summary { cursor: pointer; color: var(--text-main); font-weight: 700; }
        .summary-coverage dl { display: grid; grid-template-columns: max-content 1fr; gap: 7px 12px; margin: 12px 0 0; }
        .summary-coverage dt { color: var(--text-muted); font-weight: 600; }
        .summary-coverage dd { margin: 0; color: var(--text-sec); overflow-wrap: anywhere; }
        .summary-coverage .coverage-warning { color: var(--danger); }
        .result-actions { position: absolute; top: 12px; right: 12px; display: flex; gap: 6px; opacity: 0; transition: opacity var(--transition-fast); }
        .result-box:hover .result-actions { opacity: 1; }
        .result-action-btn { padding: 6px 12px; font-size: 11px; font-family: inherit; background: var(--bg-glass); color: var(--text-sec); border: 1px solid var(--border-light); border-radius: var(--radius-sm); cursor: pointer; display: flex; align-items: center; gap: 4px; transition: all var(--transition-fast); backdrop-filter: blur(8px); }
        .result-action-btn:hover { background: var(--primary); color: var(--text-inverse); border-color: var(--primary); }
        .result-action-btn.copied { background: var(--success); color: var(--text-inverse); border-color: var(--success); }
        .result-box h1, .result-box h2, .result-box h3 { margin: 20px 0 12px; font-weight: 700; color: var(--text-main); letter-spacing: -0.02em; }
        .result-box h1 { font-size: 1.5em; }
        .result-box h2 { font-size: 1.25em; border-bottom: 2px solid var(--border-light); padding-bottom: 8px; }
        .result-box h3 { font-size: 1.1em; color: var(--primary); }
        .result-box p { margin-bottom: 14px; }
        .result-box ul, .result-box ol { padding-left: 24px; margin: 12px 0; }
        .result-box li { margin-bottom: 8px; }
        .result-box li::marker { color: var(--primary); }
        .result-box code { background: var(--bg-hover); padding: 3px 8px; border-radius: 6px; font-family: 'JetBrains Mono', 'SF Mono', monospace; color: var(--primary-dark); font-size: 0.88em; border: 1px solid var(--border-light); }
        .result-box pre { background: linear-gradient(135deg, #2d2520 0%, #3d332c 100%); padding: 18px; border-radius: var(--radius-md); overflow-x: auto; color: #f5f0eb; border: 1px solid rgba(255,255,255,0.1); }
        .result-box pre code { background: none; color: #f5f0eb; padding: 0; border: none; }
        .result-box blockquote { border-left: 4px solid var(--primary); margin: 16px 0; padding: 14px 20px; color: var(--text-sec); background: var(--bg-hover); border-radius: 0 var(--radius-sm) var(--radius-sm) 0; font-style: italic; }
        .result-box a { color: var(--primary); text-decoration: none; border-bottom: 1px solid var(--primary-light); transition: all var(--transition-fast); }
        .result-box a:hover { color: var(--primary-dark); border-bottom-color: var(--primary-dark); }
        .result-box strong { color: var(--primary-dark); font-weight: 600; }
        .chat-container { display: flex; flex-direction: column; height: 100%; position: relative; }
        .chat-toolbar { display: flex; justify-content: space-between; align-items: center; padding-bottom: 14px; border-bottom: 1px solid var(--border-light); margin-bottom: 14px; }
        .chat-toolbar-title { font-size: 13px; color: var(--text-sec); font-weight: 600; display: flex; align-items: center; gap: 8px; }
        .chat-toolbar-title .msg-count { background: var(--primary-gradient); color: var(--text-inverse); font-size: 11px; padding: 3px 10px; border-radius: var(--radius-full); font-weight: 700; box-shadow: var(--shadow-sm); }
        .btn-clear { padding: 8px 14px; font-size: 12px; font-family: inherit; background: var(--danger-light); color: var(--danger); border-radius: var(--radius-sm); border: 1px solid transparent; cursor: pointer; font-weight: 600; transition: all var(--transition-fast); display: flex; align-items: center; gap: 5px; }
        .btn-clear:hover { background: var(--danger); color: var(--text-inverse); transform: scale(1.02); }
        .chat-messages-wrapper { flex: 1; position: relative; overflow: hidden; }
        .chat-messages { height: 100%; overflow-y: auto; padding: 16px 0; }
        .chat-list { display: flex; flex-direction: column; gap: 18px; }
        .bubble { padding: 16px 20px; border-radius: var(--radius-lg); font-size: 14px; line-height: 1.75; max-width: 88%; word-break: break-word; box-shadow: var(--shadow-sm); animation: bubbleIn 0.35s cubic-bezier(0.34, 1.56, 0.64, 1); position: relative; }
        @keyframes bubbleIn { from { opacity: 0; transform: translateY(15px) scale(0.92); } to { opacity: 1; transform: translateY(0) scale(1); } }
        .bubble-user { align-self: flex-end; background: var(--primary-gradient); color: var(--text-inverse); border-bottom-right-radius: 6px; box-shadow: var(--shadow-glow); }
        .bubble-ai { align-self: flex-start; background: var(--bg-card); border: 1px solid var(--border-light); color: var(--text-main); border-bottom-left-radius: 6px; }
        .bubble-ai h1, .bubble-ai h2, .bubble-ai h3 { margin: 12px 0 8px; }
        .bubble-ai p { margin-bottom: 10px; }
        .bubble-ai p:last-child { margin-bottom: 0; }
        .bubble.is-editing { outline: 2px solid var(--primary); outline-offset: 3px; }
        .bubble-error { border-color: var(--danger) !important; background: var(--danger-light) !important; color: var(--text-main) !important; }
        .bubble-error-title { font-weight: 700; color: var(--danger); margin-bottom: 6px; }
        .bubble-error-detail { color: var(--text-sec); font-size: 12px; line-height: 1.6; margin-bottom: 10px; }
        .bubble-error-actions { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 10px; }
        .bubble-inline-action { padding: 6px 10px; border: 1px solid var(--border-light); border-radius: var(--radius-sm); background: var(--bg-card); color: var(--text-main); font: inherit; font-size: 12px; cursor: pointer; }
        .bubble-inline-action:hover { border-color: var(--primary); color: var(--primary); background: var(--bg-hover); }
        .message-context-menu { position: absolute; z-index: 10003; min-width: 150px; max-width: 240px; padding: 6px; display: none; background: var(--bg-glass); border: 1px solid var(--border-light); border-radius: var(--radius-md); box-shadow: var(--shadow-xl); backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px); }
        .message-context-menu.show { display: block; }
        .message-menu-item { width: 100%; min-height: 34px; padding: 8px 10px; border: none; border-radius: var(--radius-sm); background: transparent; color: var(--text-main); font: inherit; font-size: 13px; font-weight: 600; text-align: left; cursor: pointer; }
        .message-menu-item:hover:not(:disabled) { background: var(--primary); color: var(--text-inverse); }
        .message-menu-item.danger { color: var(--danger); }
        .message-menu-item.danger:hover:not(:disabled) { background: var(--danger); color: var(--text-inverse); }
        .message-menu-item:disabled { opacity: 0.45; cursor: not-allowed; }
        .summary-selection-menu { position: absolute; z-index: 10004; display: none; flex-wrap: wrap; align-items: center; gap: 6px; max-width: calc(100% - 16px); padding: 7px; background: var(--bg-glass); border: 1px solid var(--border-light); border-radius: var(--radius-md); box-shadow: var(--shadow-xl); backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px); }
        .summary-selection-menu.show { display: flex; }
        .summary-selection-item { min-height: 32px; padding: 7px 11px; border: none; border-radius: var(--radius-sm); background: var(--bg-card); color: var(--text-main); font: inherit; font-size: 12px; font-weight: 700; cursor: pointer; white-space: nowrap; box-shadow: inset 0 0 0 1px var(--border-light); transition: all var(--transition-fast); }
        .summary-selection-item:hover { background: var(--primary); color: var(--text-inverse); box-shadow: inset 0 0 0 1px transparent; }
        .bubble-ai code { background: var(--bg-hover); padding: 2px 6px; border-radius: 4px; font-family: 'JetBrains Mono', monospace; font-size: 0.85em; }
        .bubble-ai .thinking-block { margin: -6px -8px 12px; border-radius: var(--radius-sm); }
        .bubble-ai .thinking-block:last-child { margin-bottom: -6px; }
        .bubble-ai .thinking-header { padding: 8px 12px; }
        .bubble-ai .thinking-preview { padding: 0 12px 10px; font-size: 11px; }
        .bubble-ai .thinking-content-inner { padding: 10px 12px 12px; font-size: 11px; max-height: 300px; }
        .scroll-buttons { position: absolute; right: 10px; display: flex; flex-direction: column; gap: 8px; z-index: 10; transition: all var(--transition-normal); }
        .scroll-buttons.top-area { top: 10px; }
        .scroll-buttons.bottom-area { bottom: 10px; }
        .scroll-btn { width: 36px; height: 36px; border-radius: var(--radius-full); background: var(--bg-card); border: 1px solid var(--border-light); box-shadow: var(--shadow-md); cursor: pointer; display: flex; align-items: center; justify-content: center; color: var(--text-sec); transition: all var(--transition-fast); opacity: 0; transform: scale(0.8); pointer-events: none; }
        .scroll-btn.visible { opacity: 1; transform: scale(1); pointer-events: auto; }
        .scroll-btn:hover { background: var(--primary); color: var(--text-inverse); border-color: var(--primary); box-shadow: var(--shadow-glow); transform: scale(1.1); }
        .scroll-btn.generating { background: var(--primary-gradient); color: var(--text-inverse); border-color: var(--primary); box-shadow: var(--shadow-glow); animation: pulse-btn 1.5s ease-in-out infinite; }
        .scroll-btn.generating::after { content: '新内容'; position: absolute; right: 42px; background: var(--primary-gradient); color: white; font-size: 10px; font-weight: 600; padding: 4px 10px; border-radius: 12px; white-space: nowrap; box-shadow: var(--shadow-md); animation: fadeIn 0.3s ease; }
        @keyframes pulse-btn { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.08); } }
        @keyframes fadeIn { from { opacity: 0; transform: translateX(10px); } to { opacity: 1; transform: translateX(0); } }
        .scroll-btn svg { width: 18px; height: 18px; fill: currentColor; }
        .chat-input-area { border-top: 1px solid var(--border-light); padding: 18px 0 0; flex-shrink: 0; background: linear-gradient(to top, var(--bg-base), transparent); }
        .chat-input-row { display: flex; gap: 14px; align-items: flex-end; }
        .chat-input { flex: 1; min-height: 52px; max-height: 140px; border-radius: var(--radius-xl); padding: 16px 22px; resize: none; border: 2px solid var(--border-light); font-size: 14px; line-height: 1.5; transition: all var(--transition-fast); }
        .chat-input:focus { border-color: var(--primary); box-shadow: 0 0 0 4px rgba(201, 100, 66, 0.12); }
        .chat-input:disabled { opacity: 0.6; cursor: not-allowed; background: var(--bg-setting); }
        .chat-input::placeholder { color: var(--text-muted); font-style: italic; }
        .thinking-block { margin-bottom: 16px; border-radius: var(--radius-md); overflow: hidden; background: linear-gradient(135deg, rgba(201, 100, 66, 0.05) 0%, rgba(201, 100, 66, 0.02) 100%); border: 1px solid rgba(201, 100, 66, 0.12); transition: all var(--transition-normal); }
        .thinking-block:hover { border-color: rgba(201, 100, 66, 0.22); box-shadow: 0 2px 12px rgba(201, 100, 66, 0.06); }
        .thinking-header { display: flex; align-items: center; justify-content: space-between; padding: 10px 14px; cursor: pointer; user-select: none; transition: background var(--transition-fast); }
        .thinking-header:hover { background: rgba(201, 100, 66, 0.05); }
        .thinking-header-left { display: flex; align-items: center; gap: 8px; }
        .thinking-icon { width: 24px; height: 24px; border-radius: 6px; background: var(--primary-gradient); display: flex; align-items: center; justify-content: center; font-size: 12px; box-shadow: var(--shadow-sm); flex-shrink: 0; }
        .thinking-title { font-size: 12px; font-weight: 600; color: var(--primary-dark); }
        .thinking-status { font-size: 10px; color: var(--text-muted); background: rgba(201, 100, 66, 0.1); padding: 2px 8px; border-radius: 10px; margin-left: 6px; }
        .thinking-block.streaming .thinking-status { background: var(--primary); color: white; animation: status-pulse 1.2s ease-in-out infinite; }
        @keyframes status-pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.6; } }
        .thinking-toggle { width: 22px; height: 22px; border-radius: 50%; background: rgba(201, 100, 66, 0.08); display: flex; align-items: center; justify-content: center; transition: all var(--transition-fast); flex-shrink: 0; }
        .thinking-toggle:hover { background: rgba(201, 100, 66, 0.15); }
        .thinking-toggle svg { width: 12px; height: 12px; fill: var(--primary); transition: transform var(--transition-normal); }
        .thinking-block.expanded .thinking-toggle svg { transform: rotate(180deg); }
        .thinking-preview { padding: 0 14px 12px; font-size: 12px; line-height: 1.5; color: var(--text-muted); max-height: 4.5em; overflow: hidden; position: relative; }
        .thinking-preview p { margin: 0 0 4px; font-size: 12px; }
        .thinking-preview p:last-child { margin-bottom: 0; }
        .thinking-preview::after { content: ''; position: absolute; bottom: 0; left: 0; right: 0; height: 24px; background: linear-gradient(to bottom, transparent, rgba(253, 250, 247, 0.98)); pointer-events: none; }
        .thinking-block.expanded .thinking-preview { display: none; }
        .thinking-content { max-height: 0; overflow: hidden; transition: max-height 0.4s cubic-bezier(0.4, 0, 0.2, 1); }
        .thinking-block.expanded .thinking-content { max-height: 5000px; }
        .thinking-content-inner { padding: 12px 14px 14px; font-size: 12px; line-height: 1.7; color: var(--text-sec); border-top: 1px dashed rgba(201, 100, 66, 0.12); max-height: 400px; overflow-y: auto; }
        .thinking-content-inner p { margin-bottom: 8px; font-size: 12px; }
        .thinking-content-inner p:last-child { margin-bottom: 0; }
        .thinking-content-inner h1, .thinking-content-inner h2, .thinking-content-inner h3 { font-size: 13px; margin: 10px 0 6px; color: var(--primary-dark); }
        .thinking-content-inner ul, .thinking-content-inner ol { padding-left: 18px; margin: 6px 0; }
        .thinking-content-inner li { margin-bottom: 4px; font-size: 12px; }
        .thinking-content-inner code { font-family: 'JetBrains Mono', monospace; font-size: 11px; background: rgba(201, 100, 66, 0.08); padding: 1px 5px; border-radius: 3px; }
        .thinking-content-inner pre { background: rgba(45, 37, 32, 0.9); padding: 10px; border-radius: 6px; overflow-x: auto; font-size: 11px; }
        .thinking-content-inner pre code { background: none; padding: 0; }
        .thinking-block.streaming .thinking-icon { animation: pulse-glow 1.5s ease-in-out infinite; }
        @keyframes pulse-glow { 0%, 100% { box-shadow: var(--shadow-sm); } 50% { box-shadow: 0 0 10px var(--primary-glow); } }
        :host(.dark-theme) .thinking-block { background: linear-gradient(135deg, rgba(224, 125, 92, 0.06) 0%, rgba(224, 125, 92, 0.02) 100%); border-color: rgba(224, 125, 92, 0.15); }
        :host(.dark-theme) .thinking-header:hover { background: rgba(224, 125, 92, 0.06); }
        :host(.dark-theme) .thinking-title { color: var(--primary-light); }
        :host(.dark-theme) .thinking-toggle { background: rgba(224, 125, 92, 0.12); }
        :host(.dark-theme) .thinking-content-inner { border-top-color: rgba(224, 125, 92, 0.15); }
        :host(.dark-theme) .thinking-preview::after { background: linear-gradient(to bottom, transparent, rgba(37, 34, 32, 0.98)); }
        :host(.dark-theme) .content-area::-webkit-scrollbar-track { background: rgba(224, 125, 92, 0.05); }
        :host(.dark-theme) .result-box::-webkit-scrollbar-thumb { background: rgba(184, 169, 157, 0.25); }
        :host(.dark-theme) .result-box::-webkit-scrollbar-thumb:hover { background: rgba(184, 169, 157, 0.4); }
        :host(.dark-theme) .chat-messages::-webkit-scrollbar-thumb { background: rgba(184, 169, 157, 0.2); }
        :host(.dark-theme) .chat-messages::-webkit-scrollbar-thumb:hover { background: rgba(184, 169, 157, 0.35); }
        :host(.dark-theme) .thinking-content-inner::-webkit-scrollbar-thumb { background: rgba(224, 125, 92, 0.2); }
        :host(.dark-theme) .thinking-content-inner::-webkit-scrollbar-thumb:hover { background: rgba(224, 125, 92, 0.35); }
        .result-box pre code, .bubble-ai pre code, .thinking-content-inner pre code { white-space: pre-wrap !important; word-break: break-word !important; overflow-wrap: break-word !important; }
        .result-box pre, .bubble-ai pre, .thinking-content-inner pre { white-space: pre-wrap !important; word-break: break-word !important; overflow-wrap: break-word !important; overflow-x: hidden !important; max-width: 100% !important; box-sizing: border-box !important; }
        .result-box, .bubble-ai, .thinking-content-inner, .result-box p, .bubble-ai p, .thinking-content-inner p { word-break: break-word !important; overflow-wrap: break-word !important; white-space: normal !important; hyphens: auto; overflow-x: hidden !important; max-width: 100% !important; }
        .result-box a, .bubble-ai a, .thinking-content-inner a { word-break: break-all !important; overflow-wrap: break-word !important; hyphens: auto; }
        .result-box, .bubble-ai, .thinking-content-inner { box-sizing: border-box !important; width: 100% !important; }
        .send-btn { width: 52px; height: 52px; border-radius: var(--radius-full); padding: 0; flex-shrink: 0; display: flex; align-items: center; justify-content: center; background: var(--primary-gradient); border: none; cursor: pointer; transition: all var(--transition-normal); box-shadow: var(--shadow-glow); }
        .send-btn:hover { transform: scale(1.08) rotate(5deg); box-shadow: 0 8px 30px var(--primary-glow); }
        .send-btn:active { transform: scale(0.95); }
        .send-btn:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }
        .send-btn svg { width: 22px; height: 22px; fill: white; margin-left: 3px; filter: drop-shadow(0 1px 2px rgba(0,0,0,0.2)); }
        .settings-page { background: var(--bg-setting); min-height: 100%; padding: 24px; box-sizing: border-box; }
        .settings-group { background: var(--bg-card); border-radius: var(--radius-lg); overflow: hidden; margin-bottom: 24px; box-shadow: var(--shadow-sm); border: 1px solid var(--border-light); }
        .settings-group-title { font-size: 11px; color: var(--primary); text-transform: uppercase; padding: 20px 20px 10px; font-weight: 700; letter-spacing: 0.1em; display: flex; align-items: center; gap: 8px; }
        .settings-group-title::before { content: ''; width: 4px; height: 14px; background: var(--primary-gradient); border-radius: 2px; }
        .setting-item { padding: 18px 20px; border-bottom: 1px solid var(--border-light); transition: background var(--transition-fast); }
        .setting-item:last-child { border-bottom: none; }
        .setting-item:hover { background: var(--bg-hover); }
        .setting-label { font-size: 14px; font-weight: 600; color: var(--text-main); margin-bottom: 6px; display: block; }
        .setting-desc { font-size: 12px; color: var(--text-sec); margin-bottom: 12px; line-height: 1.6; }
        .setting-item-row { display: flex; justify-content: space-between; align-items: center; }
        .setting-item-row .setting-info { flex: 1; margin-right: 16px; }
        .setting-item-row .setting-label { margin-bottom: 4px; }
        .setting-item-row .setting-desc { margin-bottom: 0; }
        .api-profile-row { display: flex; flex-direction: column; gap: 10px; align-items: stretch; }
        .api-profile-list { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 8px; }
        .api-profile-card { min-height: 58px; padding: 10px 12px; border: 1.5px solid var(--border-light); border-radius: var(--radius-sm); background: var(--bg-card); color: var(--text-main); text-align: left; font: inherit; cursor: pointer; transition: all var(--transition-fast); overflow: hidden; }
        .api-profile-card:hover, .api-profile-card:focus { border-color: var(--primary); background: var(--bg-hover); outline: none; }
        .api-profile-card[aria-selected="true"] { border-color: var(--primary); box-shadow: 0 0 0 2px rgba(201, 100, 66, 0.14); background: var(--bg-hover); }
        .api-profile-card-title { display: block; font-size: 13px; font-weight: 700; line-height: 1.35; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .api-profile-card-meta { display: block; margin-top: 4px; font-size: 11px; color: var(--text-sec); line-height: 1.35; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .api-profile-actions { display: flex; gap: 6px; flex: 0 0 auto; }
        .api-profile-actions .btn-xs { min-width: 38px; padding: 0 10px; height: 40px; }
        .api-profile-summary { margin-top: 10px; margin-bottom: 0; overflow-wrap: anywhere; }
        .model-input-row { display: flex; gap: 10px; align-items: center; }
        .model-input-row input { flex: 1; min-width: 0; }
        .model-fetch-btn { flex: 0 0 auto; padding: 0 14px; height: 48px; }
        .model-picker-overlay { position: absolute; inset: 0; z-index: 10002; display: none; align-items: center; justify-content: center; padding: 22px; background: rgba(45, 37, 32, 0.42); backdrop-filter: blur(6px); -webkit-backdrop-filter: blur(6px); }
        .model-picker-overlay.show { display: flex; }
        .model-picker-dialog { width: 100%; max-width: 380px; max-height: 72vh; display: flex; flex-direction: column; background: var(--bg-card); border: 1px solid var(--border-light); border-radius: var(--radius-lg); box-shadow: var(--shadow-xl); overflow: hidden; }
        .model-picker-header { display: flex; align-items: center; justify-content: space-between; padding: 16px 18px; border-bottom: 1px solid var(--border-light); }
        .model-picker-title { font-size: 14px; font-weight: 700; color: var(--text-main); }
        .model-picker-status { padding: 12px 18px; color: var(--text-sec); font-size: 12px; line-height: 1.5; border-bottom: 1px solid var(--border-light); }
        .model-picker-status.error { color: var(--danger); }
        .model-picker-list { flex: 1; min-height: 120px; overflow-y: auto; padding: 8px; }
        .model-option { width: 100%; padding: 10px 12px; border: none; border-radius: var(--radius-sm); background: transparent; color: var(--text-main); text-align: left; font: inherit; font-size: 13px; cursor: pointer; transition: background var(--transition-fast), color var(--transition-fast); overflow-wrap: anywhere; }
        .model-option:hover { background: var(--bg-hover); color: var(--primary); }
        .model-picker-actions { display: flex; gap: 8px; justify-content: flex-end; padding: 12px 18px 16px; border-top: 1px solid var(--border-light); }
        .toggle-switch { position: relative; width: 52px; height: 28px; flex-shrink: 0; }
        .toggle-switch input { opacity: 0; width: 0; height: 0; position: absolute; }
        .toggle-slider { position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0; background: var(--border-medium); border-radius: var(--radius-full); transition: all var(--transition-normal); }
        .toggle-slider::before { content: ''; position: absolute; height: 22px; width: 22px; left: 3px; bottom: 3px; background: white; border-radius: 50%; transition: all var(--transition-normal); box-shadow: var(--shadow-sm); }
        .toggle-switch input:checked + .toggle-slider { background: var(--primary-gradient); box-shadow: var(--shadow-glow); }
        .toggle-switch input:checked + .toggle-slider::before { transform: translateX(24px); }
        .toggle-switch input:focus + .toggle-slider { box-shadow: 0 0 0 3px rgba(201, 100, 66, 0.2); }
        .spinner { width: 20px; height: 20px; border: 2.5px solid rgba(255,255,255,0.25); border-top-color: #fff; border-radius: 50%; animation: spin 0.7s linear infinite; display: none; }
        .btn.loading .spinner { display: inline-block; }
        .btn.loading .btn-text { display: none; }
        @keyframes spin { to { transform: rotate(360deg); } }
        .thinking { display: flex; gap: 5px; padding: 8px 0; }
        .thinking-dot { width: 8px; height: 8px; background: var(--primary); border-radius: 50%; animation: thinking 1.4s ease-in-out infinite; }
        .thinking-dot:nth-child(2) { animation-delay: 0.2s; }
        .thinking-dot:nth-child(3) { animation-delay: 0.4s; }
        @keyframes thinking { 0%, 80%, 100% { transform: scale(0.6); opacity: 0.4; } 40% { transform: scale(1); opacity: 1; } }
        .tip-text { text-align: center; color: var(--text-muted); font-size: 14px; padding: 50px 24px; line-height: 2; }
        .tip-text strong { color: var(--primary); }
        .tip-text .tip-icon { font-size: 48px; display: block; margin-bottom: 16px; opacity: 0.7; }
        .hidden { display: none !important; }
        .content-area::-webkit-scrollbar { width: 6px; }
        .content-area::-webkit-scrollbar-track { background: rgba(201, 100, 66, 0.05); border-radius: 3px; }
        .content-area::-webkit-scrollbar-thumb { background: linear-gradient(180deg, var(--primary-light), var(--primary)); border-radius: 3px; }
        .content-area::-webkit-scrollbar-thumb:hover { background: linear-gradient(180deg, var(--primary), var(--primary-dark)); }
        .chat-messages::-webkit-scrollbar { width: 5px; }
        .chat-messages::-webkit-scrollbar-track { background: transparent; }
        .chat-messages::-webkit-scrollbar-thumb { background: rgba(156, 139, 128, 0.25); border-radius: 3px; }
        .chat-messages::-webkit-scrollbar-thumb:hover { background: rgba(156, 139, 128, 0.45); }
        input[type="number"] { -moz-appearance: textfield; }
        input[type="number"]::-webkit-outer-spin-button, input[type="number"]::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }
        .range-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px; }
        .range-buttons { display: flex; gap: 8px; }
        .range-inputs { display: flex; gap: 14px; align-items: center; }
        .range-inputs input { flex: 1; }
        .range-separator { color: var(--text-muted); font-size: 18px; font-weight: 300; }
        .shortcut-hint { display: flex; align-items: center; gap: 8px; font-size: 11px; color: var(--text-muted); margin-top: 12px; }
        .kbd { display: inline-flex; padding: 3px 7px; background: var(--bg-card); border: 1px solid var(--border-light); border-radius: 5px; font-family: 'JetBrains Mono', monospace; font-size: 10px; box-shadow: var(--shadow-sm); }
        .toast { position: absolute; bottom: 20px; left: 50%; transform: translateX(-50%) translateY(20px); background: var(--text-main); color: var(--text-inverse); padding: 12px 20px; border-radius: var(--radius-md); font-size: 12px; font-weight: 500; box-shadow: var(--shadow-lg); z-index: 10000; opacity: 0; pointer-events: none; transition: all var(--transition-normal); display: flex; align-items: center; gap: 8px; max-width: 90%; text-align: center; }
        .toast.show { transform: translateX(-50%) translateY(0); opacity: 1; }
        .toast.error { background: var(--danger); }
            `;
        },

        render() {
            const arrowLeft = `<svg viewBox="0 0 24 24"><path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"/></svg>`;
            const sendIcon = `<svg viewBox="0 0 24 24"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>`;
            const arrowUpIcon = `<svg viewBox="0 0 24 24"><path d="M7.41 15.41L12 10.83l4.59 4.58L18 14l-6-6-6 6z"/></svg>`;
            const arrowDownIcon = `<svg viewBox="0 0 24 24"><path d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6z"/></svg>`;

            const html = `
                <!-- 悬浮按钮 -->
                <div id="toggle-btn" title="拖动改变位置，点击展开/关闭 (Ctrl+Shift+S)">${arrowLeft}</div>
                <!-- 侧边栏 -->
                <div class="sidebar-panel" id="sidebar">
                    <div class="resize-handle" id="resizer"></div>
                    <div class="toast" id="toast"></div>
                    <div class="model-picker-overlay" id="model-picker-modal" aria-hidden="true">
                        <div class="model-picker-dialog" role="dialog" aria-modal="true" aria-labelledby="model-picker-title">
                            <div class="model-picker-header">
                                <div class="model-picker-title" id="model-picker-title">选择模型</div>
                                <button class="icon-btn" id="btn-close-model-picker" data-tooltip="关闭">✕</button>
                            </div>
                            <div class="model-picker-status" id="model-picker-status">填写 API 地址和 API Key 后获取模型列表。</div>
                            <div class="model-picker-list" id="model-picker-list"></div>
                            <div class="model-picker-actions">
                                <button class="btn-xs" id="btn-refresh-models">重新获取</button>
                                <button class="btn-xs" id="btn-cancel-model-picker">取消</button>
                            </div>
                        </div>
                    </div>
                    <!-- Header -->
                    <div class="header">
                        <div class="header-title">
                            <div class="header-title-icon">🧠</div>
                            智能总结
                        </div>
                        <div class="header-actions">
                            <button class="icon-btn" id="btn-theme" data-tooltip="切换主题">🌙</button>
                            <button class="icon-btn" id="btn-close" data-tooltip="关闭">✕</button>
                        </div>
                    </div>
                    <!-- Tab 导航 -->
                    <div class="tab-bar">
                        <div class="tab-item active" data-tab="summary"><span>📝 总结</span></div>
                        <div class="tab-item" data-tab="chat"><span>💬 对话</span></div>
                        <div class="tab-item" data-tab="export"><span>📦 导出</span></div>
                        <div class="tab-item" data-tab="settings"><span>⚙️ 设置</span></div>
                    </div>
                    <!-- 内容区 -->
                    <div class="content-area">
                        <!-- 总结页面 -->
                        <div id="page-summary" class="view-page active">
                            <div class="form-group">
                                <div class="range-header">
                                    <label class="form-label" style="margin:0;">楼层范围</label>
                                    <div class="range-buttons">
                                        <button class="btn-xs" id="range-all">全部</button>
                                        <button class="btn-xs" id="range-recent">最近<span id="recent-count">50</span></button>
                                    </div>
                                </div>
                                <div class="range-inputs">
                                    <input type="number" id="inp-start" placeholder="起始楼层" min="1">
                                    <span class="range-separator">→</span>
                                    <input type="number" id="inp-end" placeholder="结束楼层" min="1">
                                </div>
                            </div>
                            <button class="btn" id="btn-summary">
                                <div class="spinner"></div>
                                <span class="btn-text">✨ 开始智能总结</span>
                            </button>
                            <button class="btn-xs" id="btn-refresh-summary-cache" style="margin-top:8px;width:100%;">重新获取楼层</button>
                            <div id="summary-result" class="result-box empty">
                                <div class="tip-text">
                                    <span class="tip-icon">🤖</span>
                                    点击「开始智能总结」后，<br>AI 将分析帖子内容并生成摘要<br><br>
                                    💡 总结完成后可切换到<strong>「对话」</strong>继续追问
                                </div>
                            </div>
                            <div class="shortcut-hint">
                                <span class="kbd">Ctrl</span>+<span class="kbd">Shift</span>+<span class="kbd">S</span> 快速打开
                            </div>
                        </div>
                        <!-- 对话页面 -->
                        <div id="page-chat" class="view-page">
                            <div class="chat-container">
                                <div class="chat-toolbar">
                                    <div class="chat-toolbar-title">
                                        对话记录
                                        <span class="msg-count" id="msg-count">0</span>
                                    </div>
                                    <button class="btn-clear" id="btn-clear-chat" title="清空对话">
                                        🗑️ 清空
                                    </button>
                                </div>
                                <div class="chat-messages-wrapper">
                                    <div class="scroll-buttons top-area">
                                        <button class="scroll-btn" id="btn-scroll-top" title="滚动到顶部">${arrowUpIcon}</button>
                                    </div>
                                    <div class="chat-messages" id="chat-messages">
                                        <div id="chat-list" class="chat-list"></div>
                                        <div id="chat-empty" class="tip-text">
                                            <span class="tip-icon">💬</span>
                                            请先在<strong>「总结」</strong>页面生成内容摘要，<br>然后即可基于上下文进行对话
                                        </div>
                                    </div>
                                    <div class="scroll-buttons bottom-area">
                                        <button class="scroll-btn" id="btn-scroll-bottom" title="滚动到底部">${arrowDownIcon}</button>
                                    </div>
                                </div>
                                <div class="chat-input-area">
                                    <div class="chat-input-row">
                                        <textarea id="chat-input" class="chat-input" placeholder="输入你的问题... (Enter 发送)" rows="1"></textarea>
                                        <button class="send-btn" id="btn-send" title="发送消息">${sendIcon}</button>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <!-- 导出页面 -->
                        <div id="page-export" class="view-page">
                            <div class="form-group">
                                <label class="form-label">导出类型</label>
                                <select id="export-type">
                                    <option value="html">HTML 离线导出</option>
                                    <option value="ai-text">AI 文本导出</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <div class="range-header">
                                    <label class="form-label" style="margin:0;">导出范围</label>
                                    <div class="range-buttons">
                                        <button class="btn-xs" id="export-range-all">全部</button>
                                        <button class="btn-xs" id="export-range-recent">最近<span id="export-recent-count">50</span></button>
                                    </div>
                                </div>
                                <div class="range-inputs">
                                    <input type="number" id="export-start" placeholder="起始楼层" min="1">
                                    <span class="range-separator">→</span>
                                    <input type="number" id="export-end" placeholder="结束楼层" min="1">
                                </div>
                            </div>
                            <div id="html-export-options" class="form-group">
                                <label class="form-label">HTML 导出选项</label>
                                <div class="setting-item-row" style="margin-bottom:12px;">
                                    <div class="setting-info">
                                        <label class="setting-label" style="font-size:13px;">离线图片</label>
                                        <div class="setting-desc" style="font-size:11px;">将图片转为 base64 嵌入</div>
                                    </div>
                                    <label class="toggle-switch">
                                        <input type="checkbox" id="export-offline-images" checked>
                                        <span class="toggle-slider"></span>
                                    </label>
                                </div>
                                <label class="setting-label" style="font-size:13px;margin-bottom:8px;">主题选择</label>
                                <select id="export-theme">
                                    <option value="light">浅色主题</option>
                                    <option value="dark">深色主题</option>
                                </select>
                            </div>
                            <div id="ai-text-options" class="form-group" style="display:none;">
                                <label class="form-label">AI 文本选项</label>
                                <div class="setting-item-row" style="margin-bottom:12px;">
                                    <div class="setting-info">
                                        <label class="setting-label" style="font-size:13px;">包含头部信息</label>
                                        <div class="setting-desc" style="font-size:11px;">标题、作者、时间等</div>
                                    </div>
                                    <label class="toggle-switch">
                                        <input type="checkbox" id="export-ai-header" checked>
                                        <span class="toggle-slider"></span>
                                    </label>
                                </div>
                                <div class="setting-item-row" style="margin-bottom:12px;">
                                    <div class="setting-info">
                                        <label class="setting-label" style="font-size:13px;">包含图片链接</label>
                                        <div class="setting-desc" style="font-size:11px;">保留图片 URL</div>
                                    </div>
                                    <label class="toggle-switch">
                                        <input type="checkbox" id="export-ai-images" checked>
                                        <span class="toggle-slider"></span>
                                    </label>
                                </div>
                                <div class="setting-item-row">
                                    <div class="setting-info">
                                        <label class="setting-label" style="font-size:13px;">包含引用块</label>
                                        <div class="setting-desc" style="font-size:11px;">保留引用内容</div>
                                    </div>
                                    <label class="toggle-switch">
                                        <input type="checkbox" id="export-ai-quotes" checked>
                                        <span class="toggle-slider"></span>
                                    </label>
                                </div>
                            </div>
                            <button class="btn" id="btn-export">
                                <div class="spinner"></div>
                                <span class="btn-text">📦 开始导出</span>
                            </button>
                            <div id="export-status" class="result-box empty" style="margin-top:16px;min-height:100px;">
                                <div class="tip-text">
                                    <span class="tip-icon">📦</span>
                                    选择导出类型和范围后，<br>点击「开始导出」即可下载文件
                                </div>
                            </div>
                        </div>
                        <!-- 设置页面 -->
                        <div id="page-settings" class="view-page settings-page">
                            <div class="settings-group">
                                <div class="settings-group-title">API 配置</div>
                                <div class="setting-item">
                                    <label class="setting-label">当前配置</label>
                                    <div class="api-profile-row">
                                        <div id="cfg-profile-list" class="api-profile-list" role="listbox" aria-label="选择 API 配置"></div>
                                        <div class="api-profile-actions">
                                            <button type="button" class="btn-xs" id="btn-api-profile-add" title="新增配置">新增</button>
                                            <button type="button" class="btn-xs" id="btn-api-profile-copy" title="复制当前配置">复制</button>
                                            <button type="button" class="btn-xs" id="btn-api-profile-delete" title="删除当前配置">删除</button>
                                        </div>
                                    </div>
                                    <div class="setting-desc api-profile-summary" id="api-profile-summary">点击配置即可切换，编辑后会自动保存。</div>
                                </div>
                                <div class="setting-item">
                                    <label class="setting-label">配置名称</label>
                                    <input type="text" id="cfg-profile-name" placeholder="例如：DeepSeek / OpenAI / 本地代理">
                                </div>
                                <div class="setting-item">
                                    <label class="setting-label">API 地址</label>
                                    <input type="text" id="cfg-url" placeholder="https://api.deepseek.com/v1/chat/completions">
                                </div>
                                <div class="setting-item">
                                    <label class="setting-label">API Key</label>
                                    <input type="password" id="cfg-key" placeholder="sk-...">
                                </div>
                                <div class="setting-item">
                                    <label class="setting-label">模型名称</label>
                                    <div class="model-input-row">
                                        <input type="text" id="cfg-model" placeholder="deepseek-chat">
                                        <button type="button" class="btn-xs model-fetch-btn" id="btn-fetch-models">获取模型列表</button>
                                    </div>
                                    <div class="setting-desc">可从接口返回列表中选择，也可以手动输入模型名称。</div>
                                </div>
                            </div>
                            <div class="settings-group">
                                <div class="settings-group-title">提示词配置</div>
                                <div class="setting-item">
                                    <label class="setting-label">总结提示词</label>
                                    <div class="setting-desc">用于生成帖子摘要时的系统指令</div>
                                    <textarea id="cfg-prompt-sum" rows="4"></textarea>
                                </div>
                                <div class="setting-item">
                                    <label class="setting-label">对话提示词</label>
                                    <div class="setting-desc">用于后续追问时的系统指令</div>
                                    <textarea id="cfg-prompt-chat" rows="4"></textarea>
                                </div>
                            </div>
                            <div class="settings-group">
                                <div class="settings-group-title">高级设置</div>
                                <div class="setting-item setting-item-row">
                                    <div class="setting-info">
                                        <label class="setting-label">快捷楼层数</label>
                                        <div class="setting-desc">"最近N楼"按钮的楼层数量</div>
                                    </div>
                                    <input type="number" id="cfg-recent-floors" min="10" max="500" style="width:80px; text-align:center; padding:8px 12px;">
                                </div>
                                <div class="setting-item setting-item-row">
                                    <div class="setting-info">
                                        <label class="setting-label">流式输出</label>
                                        <div class="setting-desc">开启后内容会逐字显示，关闭则等待完成后一次性显示</div>
                                    </div>
                                    <label class="toggle-switch">
                                        <input type="checkbox" id="cfg-stream" checked>
                                        <span class="toggle-slider"></span>
                                    </label>
                                </div>
                                <div class="setting-item setting-item-row">
                                    <div class="setting-info">
                                        <label class="setting-label">自动滚动</label>
                                        <div class="setting-desc">生成内容时自动滚动到最新位置（正文和思考内容）</div>
                                    </div>
                                    <label class="toggle-switch">
                                        <input type="checkbox" id="cfg-autoscroll" checked>
                                        <span class="toggle-slider"></span>
                                    </label>
                                </div>
                            </div>
                            <button class="btn" id="btn-save">💾 保存设置</button>
                        </div>
                    </div>
                    ${this.getMessageContextMenuHtml()}
                    ${this.getSummarySelectionMenuHtml()}
                </div>
            `;
            this.uiManager.shadow.innerHTML += html;
        },

        //
        // 3. 事件绑定与处理
        //
        bindEvents() {
            const Q = this.uiManager.Q.bind(this.uiManager);
            const btn = Q('#toggle-btn');

            this.addManagedListener(this.uiManager.shadow, 'click', (e) => {
                const inlineAction = this.getClosestElement(e.target, '[data-chat-action]');
                if (inlineAction) {
                    e.preventDefault();
                    const messageId = inlineAction.dataset.messageId;
                    const action = inlineAction.dataset.chatAction;
                    this.handleMessageMenuAction(action, messageId);
                    return;
                }

                const menuAction = this.getClosestElement(e.target, '[data-message-menu-action]');
                if (menuAction) {
                    e.preventDefault();
                    this.handleMessageMenuAction(menuAction.dataset.messageMenuAction, this.currentMessageMenuId);
                    return;
                }

                const summarySelectionAction = this.getClosestElement(e.target, '[data-summary-selection-action]');
                if (summarySelectionAction) {
                    e.preventDefault();
                    this.handleSummarySelectionAction(summarySelectionAction.dataset.summarySelectionAction);
                    return;
                }

                const toggle = this.getClosestElement(e.target, '[data-thinking-toggle]');
                if (toggle) {
                    const block = toggle.closest('[data-thinking-block]');
                    if (block) block.classList.toggle('expanded');
                }
            });

            let isDrag = false, hasMoved = false, startX, startY, startRect;
            let pendingDragEvent = null;
            let dragFrameId = null;
            const applyDragMove = () => {
                dragFrameId = null;
                if (!isDrag || !pendingDragEvent) return;
                const e = pendingDragEvent;
                pendingDragEvent = null;
                const dx = e.clientX - startX;
                const dy = e.clientY - startY;
                if (Math.abs(dx) > 5 || Math.abs(dy) > 5) hasMoved = true;
                if (!this.isOpen && hasMoved) {
                    btn.style.left = `${startRect.left + dx}px`;
                    btn.style.top = `${startRect.top + dy}px`;
                    btn.style.right = 'auto';
                    btn.className = 'btn-floating';
                }
            };
            this.addManagedListener(btn, 'mousedown', (e) => {
                isDrag = true; hasMoved = false;
                startX = e.clientX; startY = e.clientY;
                startRect = btn.getBoundingClientRect();
                pendingDragEvent = null;
                if (!this.isOpen) btn.style.transition = 'none';
                btn.style.cursor = 'grabbing';
                e.preventDefault();
            });

            this.addManagedListener(window, 'mousemove', (e) => {
                if (!isDrag) return;
                pendingDragEvent = e;
                if (!dragFrameId) {
                    dragFrameId = this.requestManagedFrame(applyDragMove);
                }
            }, { passive: true });

            this.addManagedListener(window, 'mouseup', () => {
                if (!isDrag) return;
                if (dragFrameId) {
                    this.cancelManagedFrame(dragFrameId);
                    applyDragMove();
                }
                isDrag = false;
                pendingDragEvent = null;
                btn.style.cursor = 'grab';
                btn.style.transition = '';

                if (hasMoved && !this.isOpen) {
                    const btnRect = btn.getBoundingClientRect();
                    this.side = (btnRect.left + btnRect.width / 2) < window.innerWidth / 2 ? 'left' : 'right';
                    let newTop = Math.max(10, Math.min(btnRect.top, window.innerHeight - 60));
                    this.btnPos = { side: this.side, top: `${newTop}px` };
                    GM_setValue(this.getStyleStorageKey('btnPos'), this.btnPos);
                    btn.style.top = `${newTop}px`;
                    this.applySideState();
                } else if (!hasMoved) {
                    this.toggleSidebar();
                }
            });

            Q('#btn-close').onclick = () => this.toggleSidebar();
            Q('#btn-theme').onclick = () => this.toggleTheme();

            this.addManagedListener(Q('.tab-bar'), 'click', (e) => {
                const tab = this.getClosestElement(e.target, '.tab-item');
                if (tab) this.switchTab(tab.dataset.tab);
            });

            let isResizing = false;
            let pendingResizeEvent = null;
            let resizeFrameId = null;
            const applyResizeMove = () => {
                resizeFrameId = null;
                if (!isResizing || !pendingResizeEvent) return;
                const e = pendingResizeEvent;
                pendingResizeEvent = null;
                let newW = this.side === 'right' ? (window.innerWidth - e.clientX) : e.clientX;
                if (newW > 320 && newW < 700) {
                    this.sidebarWidth = newW;
                    this.uiManager.host.style.setProperty('--sidebar-width', `${newW}px`);
                    if (this.isOpen) {
                        this.squeezeBody(true);
                        this.updateButtonPosition(false);
                    }
                }
            };
            this.addManagedListener(Q('#resizer'), 'mousedown', (e) => {
                isResizing = true;
                pendingResizeEvent = null;
                document.body.style.cursor = 'col-resize';
                Q('#sidebar').style.transition = 'none';
                document.body.style.transition = 'none';
                e.preventDefault();
            });

            this.addManagedListener(window, 'mousemove', (e) => {
                if (!isResizing) return;
                pendingResizeEvent = e;
                if (!resizeFrameId) {
                    resizeFrameId = this.requestManagedFrame(applyResizeMove);
                }
            }, { passive: true });

            this.addManagedListener(window, 'mouseup', () => {
                if (isResizing) {
                    if (resizeFrameId) {
                        this.cancelManagedFrame(resizeFrameId);
                        applyResizeMove();
                    }
                    isResizing = false;
                    pendingResizeEvent = null;
                    document.body.style.cursor = '';
                    Q('#sidebar').style.transition = '';
                    document.body.style.transition = 'margin 0.35s cubic-bezier(0.4, 0, 0.2, 1)';
                    GM_setValue(this.getStyleStorageKey('sidebarWidth'), this.sidebarWidth);
                }
            });

            Q('#range-all').onclick = () => this.setRange('all');
            Q('#range-recent').onclick = () => this.setRange('recent');
            ['#inp-start', '#inp-end'].forEach((selector) => {
                const input = Q(selector);
                if (input) this.addManagedListener(input, 'input', () => { this.rangeMode = 'manual'; });
            });
            Q('#btn-summary').onclick = () => this.doSummary();
            Q('#btn-refresh-summary-cache').onclick = () => this.refreshSummaryCache();
            Q('#btn-send').onclick = () => this.doChat();
            Q('#chat-input').onkeydown = (e) => {
                if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); this.doChat(); }
            };
            Q('#chat-input').addEventListener('input', (e) => {
                const el = e.target;
                el.style.height = 'auto';
                el.style.height = Math.min(el.scrollHeight, 140) + 'px';
            });
            Q('#btn-clear-chat').onclick = () => this.clearChat();
            Q('#btn-scroll-top').onclick = () => this.scrollToTop();
            Q('#btn-scroll-bottom').onclick = () => this.forceScrollToBottom();
            this.bindMessageContextMenu();
            this.bindSummarySelectionMenu();

            const chatMessages = Q('#chat-messages');
            let lastScrollTop = 0;
            let chatScrollFrameId = null;
            this.addManagedListener(chatMessages, 'scroll', () => {
                if (chatScrollFrameId) return;
                chatScrollFrameId = this.requestManagedFrame(() => {
                    chatScrollFrameId = null;
                    this.closeMessageContextMenu();
                    const currentScrollTop = chatMessages.scrollTop;
                    const isNearBottom = (chatMessages.scrollHeight - currentScrollTop - chatMessages.clientHeight) < 80;
                    if (this.isGenerating && !this.isProgrammaticScroll) {
                        this.userScrolledUp = currentScrollTop < lastScrollTop - 10 ? true : (isNearBottom ? false : this.userScrolledUp);
                    }
                    lastScrollTop = currentScrollTop;
                    this.updateScrollButtons();
                });
            }, { passive: true });

            this.addManagedListener(Q('#cfg-profile-list'), 'click', (e) => {
                const card = this.getClosestElement(e.target, '.api-profile-card');
                if (card?.dataset?.profileId) this.handleApiProfileSelect(card.dataset.profileId);
            });
            this.addManagedListener(Q('#cfg-profile-list'), 'keydown', (e) => {
                if (e.key !== 'Enter' && e.key !== ' ') return;
                const card = this.getClosestElement(e.target, '.api-profile-card');
                if (!card?.dataset?.profileId) return;
                e.preventDefault();
                this.handleApiProfileSelect(card.dataset.profileId);
            });
            this.addManagedListener(Q('#cfg-profile-name'), 'input', () => this.handleApiProfileNameInput());
            ['#cfg-url', '#cfg-key', '#cfg-model'].forEach((selector) => {
                const input = Q(selector);
                if (!input) return;
                this.addManagedListener(input, 'input', () => this.handleApiProfileFieldInput());
                this.addManagedListener(input, 'blur', () => this.flushApiProfilePersist({ render: true, fill: false }));
            });
            Q('#btn-api-profile-add').onclick = () => this.addApiProfile();
            Q('#btn-api-profile-copy').onclick = () => this.copyApiProfile();
            Q('#btn-api-profile-delete').onclick = () => this.deleteApiProfile();

            Q('#btn-save').onclick = () => {
                const apiState = this.flushApiProfilePersist({ render: true, fill: true });
                this.fillApiFormFromProfile(apiState.activeProfile);
                GM_setValue('prompt_sum', Q('#cfg-prompt-sum').value);
                GM_setValue('prompt_chat', Q('#cfg-prompt-chat').value);
                const recentFloors = Math.max(10, Math.min(500, parseInt(Q('#cfg-recent-floors').value) || 50));
                GM_setValue('recentFloors', recentFloors);
                Q('#cfg-recent-floors').value = recentFloors;
                Q('#recent-count').textContent = recentFloors;
                Q('#export-recent-count').textContent = recentFloors;
                GM_setValue('useStream', Q('#cfg-stream').checked);
                GM_setValue('autoScroll', Q('#cfg-autoscroll').checked);
                this.showToast('设置已保存', 'success');
                this.switchTab('summary');
            };

            Q('#btn-fetch-models').onclick = () => this.openModelPicker();
            Q('#btn-refresh-models').onclick = () => this.loadModelList();
            Q('#btn-close-model-picker').onclick = () => this.closeModelPicker();
            Q('#btn-cancel-model-picker').onclick = () => this.closeModelPicker();

            this.addManagedListener(Q('#model-picker-modal'), 'click', (e) => {
                if (e.target?.id === 'model-picker-modal') this.closeModelPicker();
            });

            this.addManagedListener(Q('#model-picker-list'), 'click', (e) => {
                const option = this.getClosestElement(e.target, '.model-option');
                if (!option) return;
                Q('#cfg-model').value = option.dataset.model || option.textContent.trim();
                this.handleApiProfileFieldInput();
                this.flushApiProfilePersist({ render: true, fill: false });
                this.closeModelPicker();
                this.showToast('已选择模型', 'success');
            });

            // 导出功能事件绑定
            Q('#export-type').onchange = (e) => {
                const isHtml = e.target.value === 'html';
                Q('#html-export-options').style.display = isHtml ? 'block' : 'none';
                Q('#ai-text-options').style.display = isHtml ? 'none' : 'block';
            };
            Q('#export-range-all').onclick = () => this.setExportRange('all');
            Q('#export-range-recent').onclick = () => this.setExportRange('recent');
            ['#export-start', '#export-end'].forEach((selector) => {
                const input = Q(selector);
                if (input) this.addManagedListener(input, 'input', () => { this.exportRangeMode = 'manual'; });
            });
            Q('#btn-export').onclick = () => this.doExport();
        },

        getActiveApiProfileIndex() {
            const profiles = Core.normalizeApiProfiles(this.apiProfiles);
            this.apiProfiles = profiles;
            let index = profiles.findIndex((profile) => profile.id === this.activeApiProfileId);
            if (index < 0) {
                index = 0;
                this.activeApiProfileId = profiles[0].id;
            }
            return index;
        },

        syncCurrentApiFormToActiveProfile() {
            const Q = this.uiManager.Q.bind(this.uiManager);
            if (!Array.isArray(this.apiProfiles) || this.apiProfiles.length === 0) {
                const state = Core.loadApiProfileState();
                this.apiProfiles = state.profiles;
                this.activeApiProfileId = state.activeId;
            }

            const index = this.getActiveApiProfileIndex();
            const current = this.apiProfiles[index] || Core.normalizeApiProfile({}, index);
            const nextProfile = Core.normalizeApiProfile({
                ...current,
                name: Q('#cfg-profile-name')?.value.trim(),
                apiUrl: Q('#cfg-url')?.value.trim(),
                apiKey: Q('#cfg-key')?.value.trim(),
                model: Q('#cfg-model')?.value.trim()
            }, index);

            this.apiProfiles[index] = nextProfile;
            this.activeApiProfileId = nextProfile.id;
            return nextProfile;
        },

        renderApiProfileList() {
            const Q = this.uiManager.Q.bind(this.uiManager);
            const list = Q('#cfg-profile-list');
            if (!list) return;

            this.apiProfiles = Core.normalizeApiProfiles(this.apiProfiles);
            if (!this.apiProfiles.some((profile) => profile.id === this.activeApiProfileId)) {
                this.activeApiProfileId = this.apiProfiles[0].id;
            }

            list.innerHTML = '';
            this.apiProfiles.forEach((profile, index) => {
                const card = document.createElement('button');
                const selected = profile.id === this.activeApiProfileId;
                const host = Core.getApiProfileHost(profile.apiUrl) || '自定义接口';
                const model = String(profile.model || CONFIG.defaultModel).trim() || CONFIG.defaultModel;
                card.type = 'button';
                card.className = 'api-profile-card';
                card.dataset.profileId = profile.id;
                card.setAttribute('role', 'option');
                card.setAttribute('aria-selected', selected ? 'true' : 'false');
                card.tabIndex = selected ? 0 : -1;
                card.innerHTML = `
                    <span class="api-profile-card-title">${Core.escapeHtml(Core.inferApiProfileName(profile, index))}</span>
                    <span class="api-profile-card-meta">${Core.escapeHtml(model)} · ${Core.escapeHtml(host)}</span>
                `;
                list.appendChild(card);
            });
            this.updateApiProfileActionState();
            this.refreshApiProfileSummary();
        },

        renderApiProfileSelect() {
            return this.renderApiProfileList();
        },

        fillApiFormFromProfile(profile) {
            const Q = this.uiManager.Q.bind(this.uiManager);
            const index = this.getActiveApiProfileIndex();
            const normalized = Core.normalizeApiProfile(profile || this.apiProfiles[index], index);
            Q('#cfg-profile-name').value = normalized.name;
            Q('#cfg-url').value = normalized.apiUrl;
            Q('#cfg-key').value = normalized.apiKey;
            Q('#cfg-model').value = normalized.model;
            this.refreshApiProfileSummary();
        },

        refreshApiProfileSummary() {
            const summary = this.uiManager.Q('#api-profile-summary');
            if (!summary) return;
            const index = this.getActiveApiProfileIndex();
            const profile = this.apiProfiles[index];
            summary.textContent = `${Core.getApiProfileOptionLabel(profile, index)}。点击配置立即切换；API 地址、Key 和模型会自动保存。`;
        },

        updateApiProfileActionState() {
            const deleteBtn = this.uiManager.Q('#btn-api-profile-delete');
            if (deleteBtn) deleteBtn.disabled = this.apiProfiles.length <= 1;
        },

        loadApiProfileStateToUi() {
            const state = Core.loadApiProfileState();
            this.apiProfiles = state.profiles;
            this.activeApiProfileId = state.activeId;
            this.renderApiProfileList();
            this.fillApiFormFromProfile(Core.findApiProfile(this.apiProfiles, this.activeApiProfileId));
        },

        persistApiProfileState(options = {}) {
            const apiState = Core.saveApiProfileState(this.apiProfiles, this.activeApiProfileId);
            this.apiProfiles = apiState.profiles;
            this.activeApiProfileId = apiState.activeId;
            if (options.render !== false) this.renderApiProfileList();
            if (options.fill === true) this.fillApiFormFromProfile(apiState.activeProfile);
            return apiState;
        },

        queueApiProfilePersist() {
            this.clearManagedTimeout(this.apiProfilePersistTimerId);
            this.apiProfilePersistTimerId = this.setManagedTimeout(() => {
                this.apiProfilePersistTimerId = null;
                this.syncCurrentApiFormToActiveProfile();
                this.persistApiProfileState({ render: true, fill: false });
            }, 450);
        },

        flushApiProfilePersist(options = {}) {
            this.clearManagedTimeout(this.apiProfilePersistTimerId);
            this.apiProfilePersistTimerId = null;
            this.syncCurrentApiFormToActiveProfile();
            return this.persistApiProfileState(options);
        },

        handleApiProfileSelect(nextId) {
            this.flushApiProfilePersist({ render: false, fill: false });
            this.syncCurrentApiFormToActiveProfile();
            if (!this.apiProfiles.some((profile) => profile.id === nextId)) return;
            this.activeApiProfileId = nextId;
            const apiState = this.persistApiProfileState({ render: true, fill: false });
            this.fillApiFormFromProfile(Core.findApiProfile(apiState.profiles, apiState.activeId));
            this.showToast('已切换 API 配置', 'success');
        },

        handleApiProfileNameInput() {
            this.handleApiProfileFieldInput();
        },

        handleApiProfileFieldInput() {
            this.syncCurrentApiFormToActiveProfile();
            this.renderApiProfileList();
            this.queueApiProfilePersist();
        },

        addApiProfile() {
            this.flushApiProfilePersist({ render: false, fill: false });
            const profile = Core.normalizeApiProfile({
                id: Core.createApiProfileId(),
                name: `配置 ${this.apiProfiles.length + 1}`,
                apiUrl: CONFIG.defaultApiUrl,
                apiKey: '',
                model: CONFIG.defaultModel
            }, this.apiProfiles.length);
            this.apiProfiles.push(profile);
            this.activeApiProfileId = profile.id;
            const apiState = this.persistApiProfileState({ render: true, fill: false });
            this.fillApiFormFromProfile(Core.findApiProfile(apiState.profiles, apiState.activeId));
            this.showToast('已新增 API 配置', 'success');
        },

        copyApiProfile() {
            const current = this.flushApiProfilePersist({ render: false, fill: false }).activeProfile;
            const index = this.getActiveApiProfileIndex();
            const profile = Core.normalizeApiProfile({
                ...current,
                id: Core.createApiProfileId(),
                name: `${current.name || '配置'} 副本`
            }, index + 1);
            this.apiProfiles.splice(index + 1, 0, profile);
            this.activeApiProfileId = profile.id;
            const apiState = this.persistApiProfileState({ render: true, fill: false });
            this.fillApiFormFromProfile(Core.findApiProfile(apiState.profiles, apiState.activeId));
            this.showToast('已复制 API 配置', 'success');
        },

        deleteApiProfile() {
            if (!Array.isArray(this.apiProfiles) || this.apiProfiles.length <= 1) {
                this.showToast('至少保留一个 API 配置', 'error');
                return;
            }
            this.flushApiProfilePersist({ render: false, fill: false });
            const index = this.getActiveApiProfileIndex();
            const ok = window.confirm?.('删除当前 API 配置？') ?? true;
            if (!ok) return;
            this.apiProfiles.splice(index, 1);
            const nextIndex = Math.max(0, Math.min(index, this.apiProfiles.length - 1));
            this.activeApiProfileId = this.apiProfiles[nextIndex].id;
            const apiState = this.persistApiProfileState({ render: true, fill: false });
            this.fillApiFormFromProfile(Core.findApiProfile(apiState.profiles, apiState.activeId));
            this.showToast('已删除 API 配置', 'success');
        },

        bindKeyboardShortcuts() {
            this.addManagedListener(document, 'keydown', (e) => {
                if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 's') { e.preventDefault(); this.toggleSidebar(); }
                if (e.key === 'Escape' && this.isOpen) {
                    if (this.currentSummarySelection) {
                        this.closeSummarySelectionMenu();
                        return;
                    }
                    if (this.currentMessageMenuId) {
                        this.closeMessageContextMenu();
                        return;
                    }
                    if (this.editingMessageId) {
                        this.cancelEditMessage();
                        return;
                    }
                    const modal = this.uiManager.Q('#model-picker-modal');
                    if (modal?.classList.contains('show')) {
                        this.closeModelPicker();
                        return;
                    }
                    this.toggleSidebar();
                }
            });
        },

        //
        // 4. 状态与UI更新
        //
        restoreState() {
            const Q = this.uiManager.Q.bind(this.uiManager);
            this.uiManager.host.style.setProperty('--sidebar-width', `${this.sidebarWidth}px`);
            const btn = Q('#toggle-btn');
            btn.style.top = this.btnPos.top;
            this.applySideState();
            if (this.isDarkTheme) {
                this.uiManager.host.classList.add('dark-theme');
                Q('#btn-theme').textContent = '☀️';
            }

            this.loadApiProfileStateToUi();
            Q('#cfg-prompt-sum').value = GM_getValue('prompt_sum', '请总结以下论坛帖子内容。使用 Markdown 格式，条理清晰，重点突出主要观点、争议点和结论。适当使用标题、列表和引用来组织内容。');
            Q('#cfg-prompt-chat').value = GM_getValue('prompt_chat', '你是一个帖子阅读助手。基于上文中的帖子内容，回答用户的问题。回答要准确、简洁，必要时引用原文。');
            const recentFloors = GM_getValue('recentFloors', 50);
            Q('#cfg-recent-floors').value = recentFloors;
            Q('#recent-count').textContent = recentFloors;
            Q('#export-recent-count').textContent = recentFloors;
            Q('#cfg-stream').checked = GM_getValue('useStream', true);
            Q('#cfg-autoscroll').checked = GM_getValue('autoScroll', true);
        },

        applySideState() {
            const Q = this.uiManager.Q.bind(this.uiManager);
            const btn = Q('#toggle-btn');
            const sidebar = Q('#sidebar');
            const resizer = Q('#resizer');
            const arrowLeft = `<svg viewBox="0 0 24 24"><path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"/></svg>`;
            const arrowRight = `<svg viewBox="0 0 24 24"><path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6z"/></svg>`;

            btn.style.left = ''; btn.style.right = '';

            if (this.side === 'left') {
                sidebar.className = 'sidebar-panel panel-left' + (this.isOpen ? ' open' : '');
                resizer.className = 'resize-handle handle-left';
                btn.className = 'btn-snap-left' + (this.isOpen ? ' arrow-flip' : '');
                btn.innerHTML = arrowRight;
            } else {
                sidebar.className = 'sidebar-panel panel-right' + (this.isOpen ? ' open' : '');
                resizer.className = 'resize-handle handle-right';
                btn.className = 'btn-snap-right' + (this.isOpen ? ' arrow-flip' : '');
                btn.innerHTML = arrowLeft;
            }
            this.updateButtonPosition();
        },

        updateButtonPosition(useTransition = true) {
            const Q = this.uiManager.Q.bind(this.uiManager);
            const btn = Q('#toggle-btn');
            if (!useTransition) btn.style.transition = 'none'; else btn.style.transition = '';
            if (this.side === 'left') {
                btn.style.right = 'auto';
                btn.style.left = this.isOpen ? `${this.sidebarWidth}px` : '0';
            } else {
                btn.style.left = 'auto';
                btn.style.right = this.isOpen ? `${this.sidebarWidth}px` : '0';
            }
            if (!useTransition) {
                btn.offsetHeight;
                this.requestManagedFrame(() => { btn.style.transition = ''; });
            }
        },

        toggleSidebar() {
            this.isOpen = !this.isOpen;
            const Q = this.uiManager.Q.bind(this.uiManager);
            Q('#sidebar').classList.toggle('open', this.isOpen);
            Q('#toggle-btn').classList.toggle('arrow-flip', this.isOpen);
            this.squeezeBody(this.isOpen);
            if (this.isOpen) this.initRangeInputs();
            this.updateButtonPosition();
        },

        squeezeBody(active) {
            const body = document.body;
            body.style.transition = 'margin 0.35s cubic-bezier(0.4, 0, 0.2, 1)';
            if (!active) {
                body.style.marginLeft = ''; body.style.marginRight = '';
            } else {
                if (this.side === 'left') {
                    body.style.marginLeft = `${this.sidebarWidth}px`; body.style.marginRight = '';
                } else {
                    body.style.marginRight = `${this.sidebarWidth}px`; body.style.marginLeft = '';
                }
            }
        },

        switchTab(tabName) {
            const Q = this.uiManager.Q.bind(this.uiManager);
            this.closeMessageContextMenu?.();
            this.closeSummarySelectionMenu?.();
            Q('.tab-bar').querySelectorAll('.tab-item').forEach(t => t.classList.toggle('active', t.dataset.tab === tabName));
            Q('.content-area').querySelectorAll('.view-page').forEach(p => p.classList.toggle('active', p.id === `page-${tabName}`));
            this.currentTab = tabName;
            if (tabName === 'chat') this.setManagedTimeout(() => this.updateScrollButtons(), 100);
        },

        toggleTheme() {
            const Q = this.uiManager.Q.bind(this.uiManager);
            this.isDarkTheme = !this.isDarkTheme;
            GM_setValue(this.getStyleStorageKey('isDarkTheme'), this.isDarkTheme);
            this.uiManager.host.classList.toggle('dark-theme', this.isDarkTheme);
            Q('#btn-theme').textContent = this.isDarkTheme ? '☀️' : '🌙';
        },

        setLoading(btnId, isLoading) {
            const Q = this.uiManager.Q.bind(this.uiManager);
            const btn = Q(btnId);
            this.isGenerating = isLoading;
            btn.disabled = isLoading;
            btn.classList.toggle('loading', isLoading);
            if (btnId === '#btn-send') {
                const input = Q('#chat-input');
                if (input) {
                    input.disabled = isLoading;
                    input.placeholder = isLoading ? '正在生成回复...' : '输入你的问题... (Enter 发送)';
                }
            }
        },

        updateChatInputMode() {
            const input = this.uiManager.Q('#chat-input');
            const sendBtn = this.uiManager.Q('#btn-send');
            if (!input) return;
            if (this.editingMessageId) {
                input.placeholder = '正在编辑消息，Enter 保存，Esc 取消';
                sendBtn?.classList.add('editing');
                return;
            }
            input.placeholder = this.isGenerating ? '正在生成回复...' : '输入你的问题... (Enter 发送)';
            sendBtn?.classList.remove('editing');
        },

        //
        // 5. 核心功能交互
        //
        createEmptyChatSession() {
            return {
                context: null,
                baseMessages: [],
                visibleMessages: []
            };
        },

        createMessageId() {
            const random = Math.random().toString(36).slice(2, 8);
            return `msg_${Date.now().toString(36)}_${random}`;
        },

        createVisibleMessage(role, content, overrides = {}) {
            const now = Date.now();
            return {
                id: overrides.id || this.createMessageId(),
                role,
                content: `${content ?? ''}`,
                rawContent: `${overrides.rawContent ?? content ?? ''}`,
                status: overrides.status || 'done',
                errorKind: overrides.errorKind || null,
                errorMessage: overrides.errorMessage || '',
                excludeFromApi: overrides.excludeFromApi === true,
                regenerateFromUserId: overrides.regenerateFromUserId || null,
                createdAt: overrides.createdAt || now,
                updatedAt: now
            };
        },

        hasChatContext() {
            return Array.isArray(this.chatSession?.baseMessages) && this.chatSession.baseMessages.length > 0;
        },

        setChatContext({ topicId, start, end, postContent, summaryRawText, summaryContent, coverageReport }) {
            const promptChat = GM_getValue('prompt_chat', '');
            this.chatSession = {
                context: {
                    topicId,
                    range: { start, end },
                    promptChat,
                    postContent,
                    summary: summaryContent,
                    coverageReport,
                    createdAt: Date.now()
                },
                baseMessages: [
                    { role: 'system', content: promptChat },
                    { role: 'user', content: `以下是帖子内容供你参考:\n${postContent}` },
                    { role: 'assistant', content: summaryContent }
                ],
                visibleMessages: []
            };
            this.chatHistory = [...this.chatSession.baseMessages];
            this.lastSummary = summaryRawText;
            this.postContent = postContent;
            this.closeMessageContextMenu?.();
        },

        clearChatContext() {
            this.chatSession = this.createEmptyChatSession();
            this.chatHistory = [];
            this.lastSummary = '';
            this.postContent = '';
            this.editingMessageId = null;
            this.editingDraftBefore = '';
            this.closeMessageContextMenu?.();
        },

        syncLegacyChatHistory() {
            const visibleMessages = this.chatSession.visibleMessages
                .filter(message => message.status === 'done')
                .map(message => Core.toOpenAiMessage(message))
                .filter(Boolean);
            this.chatHistory = [...this.chatSession.baseMessages, ...visibleMessages];
        },

        findVisibleMessage(messageId) {
            return this.chatSession.visibleMessages.find(message => message.id === messageId) || null;
        },

        findVisibleMessageIndex(messageId) {
            return this.chatSession.visibleMessages.findIndex(message => message.id === messageId);
        },

        getBubbleElement(messageId) {
            const list = this.uiManager.Q('#chat-list');
            if (!list) return null;
            return Array.from(list.querySelectorAll('[data-message-id]'))
                .find(el => el.dataset.messageId === messageId) || null;
        },

        getClosestElement(target, selector) {
            const element = target?.nodeType === 1 ? target : target?.parentElement;
            return element?.closest?.(selector) || null;
        },

        getVisibleMessagesForApi({ throughMessageId = null, beforeMessageId = null, includeExcludedMessageId = null } = {}) {
            let messages = this.chatSession.visibleMessages
                .filter(message => message.status === 'done' || message.id === includeExcludedMessageId);

            if (beforeMessageId) {
                const index = messages.findIndex(message => message.id === beforeMessageId);
                if (index >= 0) messages = messages.slice(0, index);
            } else if (throughMessageId) {
                const index = messages.findIndex(message => message.id === throughMessageId);
                if (index >= 0) messages = messages.slice(0, index + 1);
            }

            return messages
                .filter(message => !message.excludeFromApi || message.id === includeExcludedMessageId)
                .map(message => Core.toOpenAiMessage(message))
                .filter(Boolean);
        },

        buildChatApiMessages(options = {}) {
            return Core.sanitizeMessagesForApi([
                ...this.chatSession.baseMessages,
                ...this.getVisibleMessagesForApi(options)
            ]);
        },

        appendVisibleMessage(message) {
            this.chatSession.visibleMessages.push(message);
            this.syncLegacyChatHistory();
            this.updateMessageCount();
            return message;
        },

        removeVisibleMessagesFrom(index) {
            if (index < 0) return [];
            const removed = this.chatSession.visibleMessages.splice(index);
            this.syncLegacyChatHistory();
            this.updateMessageCount();
            return removed;
        },

        setVisibleMessage(messageId, patch) {
            const message = this.findVisibleMessage(messageId);
            if (!message) return null;
            Object.assign(message, patch, { updatedAt: Date.now() });
            this.syncLegacyChatHistory();
            this.updateMessageCount();
            return message;
        },

        renderChatMessages() {
            const Q = this.uiManager.Q.bind(this.uiManager);
            const list = Q('#chat-list');
            list.innerHTML = '';
            this.chatSession.visibleMessages.forEach(message => this.addBubble(message));

            const empty = Q('#chat-empty');
            if (this.chatSession.visibleMessages.length > 0) {
                empty.classList.add('hidden');
            } else {
                empty.classList.remove('hidden');
            }
            this.updateMessageCount();
            this.updateScrollButtons();
        },

        getAssistantForUser(messageId) {
            const index = this.findVisibleMessageIndex(messageId);
            if (index < 0) return null;
            const next = this.chatSession.visibleMessages[index + 1];
            return next?.role === 'assistant' ? next : null;
        },

        getUserForAssistant(messageId) {
            const index = this.findVisibleMessageIndex(messageId);
            if (index <= 0) return null;
            for (let i = index - 1; i >= 0; i -= 1) {
                const message = this.chatSession.visibleMessages[i];
                if (message.role === 'user') return message;
            }
            return null;
        },

        removeVisibleMessagesAfter(messageId, { includeTarget = false } = {}) {
            const index = this.findVisibleMessageIndex(messageId);
            if (index < 0) return [];
            const start = includeTarget ? index : index + 1;
            const removed = this.chatSession.visibleMessages.splice(start);
            this.syncLegacyChatHistory();
            this.updateMessageCount();
            return removed;
        },

        async requestAssistantForUser(userMessage, { assistantMessage = null } = {}) {
            const Q = this.uiManager.Q.bind(this.uiManager);
            if (!userMessage || userMessage.role !== 'user') return;
            if (this.isGenerating) return;

            Q('#chat-empty').classList.add('hidden');
            this.userScrolledUp = false;

            const targetAssistant = assistantMessage || this.appendVisibleMessage(this.createVisibleMessage('assistant', '', {
                status: 'streaming',
                excludeFromApi: true,
                regenerateFromUserId: userMessage.id
            }));
            this.setVisibleMessage(targetAssistant.id, {
                content: '',
                rawContent: '',
                status: 'streaming',
                errorKind: null,
                errorMessage: '',
                excludeFromApi: true,
                regenerateFromUserId: userMessage.id
            });
            this.renderChatMessages();
            const msgDiv = this.getBubbleElement(targetAssistant.id);

            const requestSeq = ++this.chatRequestSeq;
            let aiText = '';
            this.setLoading('#btn-send', true);

            const messages = this.buildChatApiMessages({
                throughMessageId: userMessage.id,
                includeExcludedMessageId: userMessage.id
            });

            try {
                await Core.streamChat(messages,
                    (chunk) => {
                        if (requestSeq !== this.chatRequestSeq) return;
                        aiText += chunk;
                        this.setVisibleMessage(targetAssistant.id, {
                            rawContent: aiText,
                            status: 'streaming'
                        });
                        const bubble = this.getBubbleElement(targetAssistant.id);
                        if (bubble) this.scheduleBubbleRender(targetAssistant.id, bubble, () => aiText);
                    },
                    () => {
                        if (requestSeq !== this.chatRequestSeq) return;
                        this.cancelBubbleRender(targetAssistant.id);
                        const classified = Core.classifyAiOutput(aiText);
                        if (classified.kind === 'success') {
                            this.setVisibleMessage(userMessage.id, { excludeFromApi: false });
                            this.setVisibleMessage(targetAssistant.id, {
                                content: classified.content,
                                rawContent: aiText,
                                status: 'done',
                                errorKind: null,
                                errorMessage: '',
                                excludeFromApi: false,
                                regenerateFromUserId: userMessage.id
                            });
                            const bubble = this.getBubbleElement(targetAssistant.id);
                            if (bubble) this.updateBubble(bubble, aiText, false);
                        } else {
                            const reason = classified.kind === 'thinking_only'
                                ? 'AI 只返回了思考过程，没有生成正文。'
                                : 'AI 返回了空内容。';
                            this.setVisibleMessage(userMessage.id, { excludeFromApi: true });
                            this.setVisibleMessage(targetAssistant.id, {
                                content: '',
                                rawContent: aiText,
                                status: 'error',
                                errorKind: classified.kind,
                                errorMessage: reason,
                                excludeFromApi: true,
                                regenerateFromUserId: userMessage.id
                            });
                            const bubble = this.getBubbleElement(targetAssistant.id);
                            if (bubble) this.renderBubbleContent(bubble, this.findVisibleMessage(targetAssistant.id));
                            this.showToast('回复失败: ' + reason, 'error');
                        }
                    },
                    (err) => {
                        if (requestSeq !== this.chatRequestSeq) return;
                        this.cancelBubbleRender(targetAssistant.id);
                        this.setVisibleMessage(userMessage.id, { excludeFromApi: true });
                        this.setVisibleMessage(targetAssistant.id, {
                            content: '',
                            rawContent: aiText,
                            status: 'error',
                            errorKind: 'request_failed',
                            errorMessage: err,
                            excludeFromApi: true,
                            regenerateFromUserId: userMessage.id
                        });
                        const bubble = this.getBubbleElement(targetAssistant.id);
                        if (bubble) this.renderBubbleContent(bubble, this.findVisibleMessage(targetAssistant.id));
                        this.showToast('回复失败: ' + err, 'error');
                    }
                );
            } finally {
                if (requestSeq === this.chatRequestSeq) {
                    this.setLoading('#btn-send', false);
                    this.updateChatInputMode();
                    this.userScrolledUp = false;
                    this.updateScrollButtons();
                }
            }

            if (msgDiv) this.scrollToBottom();
        },

        getMessageCopyText(message) {
            if (!message) return '';
            if (message.role === 'assistant') {
                const parsed = Core.parseThinkingContent(message.rawContent || message.content);
                return parsed.content || message.content || '';
            }
            return message.content || '';
        },

        renderChatErrorContent(message) {
            const title = message.errorKind === 'thinking_only'
                ? 'AI 只返回了思考过程'
                : message.errorKind === 'empty_response'
                    ? 'AI 返回了空内容'
                    : 'AI 回复失败';
            const detail = message.errorMessage ? `<div class="bubble-error-detail">${Core.escapeHtml(message.errorMessage)}</div>` : '';
            return `
                <div class="bubble-error-title">${Core.escapeHtml(title)}</div>
                ${detail}
                <div class="bubble-error-actions">
                    <button type="button" class="bubble-inline-action" data-chat-action="regenerate" data-message-id="${Core.escapeHtml(message.id)}">重新生成</button>
                    <button type="button" class="bubble-inline-action" data-chat-action="delete" data-message-id="${Core.escapeHtml(message.id)}">删除</button>
                </div>
            `;
        },

        renderBubbleContent(div, message) {
            const roleClass = message.role === 'assistant' ? 'ai' : 'user';
            div.className = `bubble bubble-${roleClass}`;
            div.classList.toggle('bubble-streaming', message.status === 'streaming');
            div.classList.toggle('bubble-error', message.status === 'error');
            div.classList.toggle('is-editing', message.id === this.editingMessageId);
            div.dataset.messageId = message.id;
            div.dataset.role = message.role;
            div.__rawMessageText = message.rawContent || message.content || '';

            if (message.role === 'user') {
                div.textContent = message.content ?? '';
                return;
            }

            if (message.status === 'error') {
                div.innerHTML = this.renderChatErrorContent(message);
                return;
            }

            if (message.status === 'streaming' && !message.rawContent) {
                div.innerHTML = `<div class="thinking"><div class="thinking-dot"></div><div class="thinking-dot"></div><div class="thinking-dot"></div></div>`;
                return;
            }

            div.innerHTML = this.renderWithThinking(message.rawContent || message.content, message.status === 'streaming');
        },

        bindMessageContextMenu() {
            const Q = this.uiManager.Q.bind(this.uiManager);
            const list = Q('#chat-list');
            const menu = Q('#message-context-menu');
            if (!list || !menu) return;

            this.addManagedListener(list, 'contextmenu', (e) => {
                const bubble = this.getClosestElement(e.target, '.bubble[data-message-id]');
                if (!bubble) return;
                const selection = window.getSelection?.();
                if (selection && selection.toString().trim()) return;
                e.preventDefault();
                this.openMessageContextMenu(e, bubble.dataset.messageId);
            });

            this.addManagedListener(menu, 'contextmenu', (e) => e.preventDefault());
            this.addManagedListener(document, 'pointerdown', (e) => {
                if (!this.currentMessageMenuId) return;
                const path = e.composedPath?.() || [];
                if (path.includes(menu)) return;
                this.closeMessageContextMenu();
            }, true);
            const closeMessageMenuOnFrame = this.createFrameThrottledHandler(() => this.closeMessageContextMenu());
            this.addManagedListener(window, 'resize', closeMessageMenuOnFrame);
            this.addManagedListener(window, 'scroll', closeMessageMenuOnFrame, true);
        },

        bindSummarySelectionMenu() {
            const Q = this.uiManager.Q.bind(this.uiManager);
            const resultBox = Q('#summary-result');
            const menu = Q('#summary-selection-menu');
            if (!resultBox || !menu) return;

            const scheduleOpen = () => {
                this.clearManagedTimeout(this.summarySelectionOpenTimerId);
                const requestSeq = (this.summarySelectionRequestSeq || 0) + 1;
                this.summarySelectionRequestSeq = requestSeq;
                this.summarySelectionOpenTimerId = this.setManagedTimeout(() => {
                    this.summarySelectionOpenTimerId = null;
                    if (requestSeq !== this.summarySelectionRequestSeq) return;
                    const selectionState = this.getSummarySelectionState();
                    if (selectionState) {
                        this.openSummarySelectionMenu(selectionState);
                    } else {
                        this.closeSummarySelectionMenu();
                    }
                }, 40);
            };

            this.addManagedListener(resultBox, 'mouseup', scheduleOpen);
            this.addManagedListener(resultBox, 'keyup', scheduleOpen);
            this.addManagedListener(resultBox, 'touchend', scheduleOpen);
            const closeSummarySelectionOnFrame = this.createFrameThrottledHandler(() => this.closeSummarySelectionMenu());
            this.addManagedListener(resultBox, 'scroll', closeSummarySelectionOnFrame, { passive: true });
            this.addManagedListener(menu, 'mousedown', (e) => e.preventDefault());
            this.addManagedListener(menu, 'pointerdown', (e) => e.preventDefault());
            this.addManagedListener(document, 'pointerdown', (e) => {
                if (!this.currentSummarySelection) return;
                const path = e.composedPath?.() || [];
                if (path.includes(menu)) return;
                this.closeSummarySelectionMenu();
            }, true);
            this.addManagedListener(window, 'resize', closeSummarySelectionOnFrame);
            this.addManagedListener(window, 'scroll', closeSummarySelectionOnFrame, true);
        },

        getCurrentSelection() {
            return this.uiManager.shadow?.getSelection?.() || window.getSelection?.() || null;
        },

        clearCurrentSelection() {
            const selections = [
                this.uiManager.shadow?.getSelection?.(),
                window.getSelection?.()
            ].filter(Boolean);
            const seen = new Set();
            selections.forEach((selection) => {
                if (seen.has(selection) || typeof selection.removeAllRanges !== 'function') return;
                seen.add(selection);
                selection.removeAllRanges();
            });
        },

        getSummarySelectionState() {
            const Q = this.uiManager.Q.bind(this.uiManager);
            const resultBox = Q('#summary-result');
            if (!resultBox || this.currentTab !== 'summary' || !this.hasChatContext()) return null;

            const selection = this.getCurrentSelection();
            if (!selection || selection.rangeCount === 0 || selection.isCollapsed) return null;
            if (!Core.isSummarySelectionTextUseful(selection.toString())) return null;

            const range = selection.getRangeAt(0);
            if (!this.isSummarySelectionRangeAllowed(range, resultBox)) return null;

            const rect = this.getSelectionAnchorRect(range);
            if (!rect) return null;

            const normalized = Core.normalizeSummarySelectionText(selection.toString());
            return {
                text: normalized.text,
                truncated: normalized.truncated,
                rect: {
                    left: rect.left,
                    right: rect.right,
                    top: rect.top,
                    bottom: rect.bottom,
                    width: rect.width,
                    height: rect.height
                }
            };
        },

        isSummarySelectionRangeAllowed(range, resultBox) {
            if (!range || !resultBox) return false;
            const startNode = range.startContainer?.nodeType === 1 ? range.startContainer : range.startContainer?.parentElement;
            const endNode = range.endContainer?.nodeType === 1 ? range.endContainer : range.endContainer?.parentElement;
            const commonNode = range.commonAncestorContainer?.nodeType === 1
                ? range.commonAncestorContainer
                : range.commonAncestorContainer?.parentElement;
            if (!startNode || !endNode || !commonNode) return false;
            if (!resultBox.contains(startNode) || !resultBox.contains(endNode) || !resultBox.contains(commonNode)) return false;

            const excludedSelectors = [
                '.result-actions',
                '#btn-copy-summary',
                '.summary-coverage',
                '.thinking-header',
                '[data-thinking-toggle]',
                '#summary-selection-menu',
                '.summary-selection-menu'
            ];
            return !excludedSelectors.some((selector) => (
                this.getClosestElement(startNode, selector)
                || this.getClosestElement(endNode, selector)
                || this.getClosestElement(commonNode, selector)
            ));
        },

        getSelectionAnchorRect(range) {
            const rects = Array.from(range.getClientRects?.() || [])
                .filter((rect) => rect && rect.width > 0 && rect.height > 0);
            if (rects.length > 0) return rects[Math.floor((rects.length - 1) / 2)];
            const rect = range.getBoundingClientRect?.();
            if (rect && rect.width > 0 && rect.height > 0) return rect;
            return null;
        },

        openSummarySelectionMenu(selectionState) {
            const menu = this.uiManager.Q('#summary-selection-menu');
            if (!menu || !selectionState?.text) return;
            this.closeMessageContextMenu?.();
            this.currentSummarySelection = selectionState;
            menu.classList.add('show');
            menu.setAttribute('aria-hidden', 'false');
            this.positionSummarySelectionMenu(menu, selectionState.rect);
        },

        positionSummarySelectionMenu(menu, anchorRect) {
            const sidebar = this.uiManager.Q('#sidebar');
            if (!sidebar || !anchorRect) return;
            menu.style.visibility = 'hidden';
            menu.style.left = '0px';
            menu.style.top = '0px';

            const gap = 8;
            const sidebarRect = sidebar.getBoundingClientRect();
            const maxWidth = Math.max(180, sidebarRect.width - gap * 2);
            menu.style.maxWidth = `${maxWidth}px`;

            const menuW = Math.min(menu.offsetWidth || 260, maxWidth);
            const menuH = menu.offsetHeight || 46;
            const centerX = anchorRect.left + anchorRect.width / 2 - sidebarRect.left;
            const aboveY = anchorRect.top - sidebarRect.top - menuH - gap;
            const belowY = anchorRect.bottom - sidebarRect.top + gap;
            const minX = gap;
            const maxX = Math.max(minX, sidebarRect.width - menuW - gap);
            const minY = gap;
            const maxY = Math.max(minY, sidebarRect.height - menuH - gap);
            const x = Math.max(minX, Math.min(centerX - menuW / 2, maxX));
            const preferredY = aboveY >= minY ? aboveY : belowY;
            const y = Math.max(minY, Math.min(preferredY, maxY));

            menu.style.left = `${x}px`;
            menu.style.top = `${y}px`;
            menu.style.visibility = '';
        },

        closeSummarySelectionMenu() {
            this.summarySelectionRequestSeq = (this.summarySelectionRequestSeq || 0) + 1;
            this.clearManagedTimeout(this.summarySelectionOpenTimerId);
            this.summarySelectionOpenTimerId = null;
            const menu = this.uiManager.Q('#summary-selection-menu');
            if (menu) {
                menu.classList.remove('show');
                menu.setAttribute('aria-hidden', 'true');
            }
            this.currentSummarySelection = null;
        },

        openMessageContextMenu(event, messageId) {
            const Q = this.uiManager.Q.bind(this.uiManager);
            const menu = Q('#message-context-menu');
            const message = this.findVisibleMessage(messageId);
            if (!menu || !message) return;

            this.currentMessageMenuId = messageId;
            const canMutate = !this.isGenerating && message.status !== 'streaming';
            menu.querySelectorAll('[data-message-menu-action]').forEach((button) => {
                const action = button.dataset.messageMenuAction;
                let disabled = false;
                if (action === 'copy') disabled = !this.getMessageCopyText(message).trim();
                if (action === 'edit') disabled = !canMutate || (message.role === 'assistant' && message.status !== 'done');
                if (action === 'regenerate') disabled = !canMutate || !this.getRegenerateUserMessage(message);
                if (action === 'delete') disabled = !canMutate;
                button.disabled = disabled;
            });

            menu.classList.add('show');
            menu.setAttribute('aria-hidden', 'false');
            this.positionMessageContextMenu(menu, event);
        },

        positionMessageContextMenu(menu, event) {
            const sidebar = this.uiManager.Q('#sidebar');
            if (!sidebar) return;
            menu.style.visibility = 'hidden';
            menu.style.left = '0px';
            menu.style.top = '0px';

            const gap = 8;
            const sidebarRect = sidebar.getBoundingClientRect();
            const maxWidth = Math.max(120, Math.min(240, sidebarRect.width - gap * 2));
            menu.style.maxWidth = `${maxWidth}px`;

            const menuW = Math.min(menu.offsetWidth || 160, maxWidth);
            const menuH = menu.offsetHeight || 150;
            const minX = gap;
            const maxX = Math.max(minX, sidebarRect.width - menuW - gap);
            const minY = gap;
            const maxY = Math.max(minY, sidebarRect.height - menuH - gap);
            const localX = event.clientX - sidebarRect.left;
            const localY = event.clientY - sidebarRect.top;
            const x = Math.max(minX, Math.min(localX, maxX));
            const y = Math.max(minY, Math.min(localY, maxY));

            menu.style.left = `${x}px`;
            menu.style.top = `${y}px`;
            menu.style.visibility = '';
        },

        closeMessageContextMenu() {
            const menu = this.uiManager.Q('#message-context-menu');
            if (menu) {
                menu.classList.remove('show');
                menu.setAttribute('aria-hidden', 'true');
            }
            this.currentMessageMenuId = null;
        },

        handleMessageMenuAction(action, messageId) {
            if (!action || !messageId) return;
            if (action === 'copy') return this.copyMessage(messageId);
            if (action === 'edit') return this.startEditMessage(messageId);
            if (action === 'regenerate') return this.regenerateMessage(messageId);
            if (action === 'delete') return this.deleteMessage(messageId);
        },

        async handleSummarySelectionAction(action) {
            const selection = this.currentSummarySelection;
            if (!selection?.text) return;
            if (!this.hasChatContext()) {
                this.closeSummarySelectionMenu();
                return this.showToast('请先完成总结', 'error');
            }
            if (this.editingMessageId) {
                this.closeSummarySelectionMenu();
                return this.showToast('正在编辑消息，请先完成或取消编辑', 'error');
            }

            const promptSpec = Core.buildSummarySelectionPrompt(action, selection.text);
            if (!promptSpec.prompt.trim()) {
                this.closeSummarySelectionMenu();
                return this.showToast('选区内容为空', 'error');
            }

            const input = this.uiManager.Q('#chat-input');
            const hasDraft = !!input?.value.trim();
            const shouldAutoSend = promptSpec.autoSend && !this.isGenerating && !hasDraft;
            this.closeSummarySelectionMenu();
            this.clearCurrentSelection();
            this.switchTab('chat');
            this.fillChatInputWithSelectionPrompt(promptSpec.prompt);
            if (selection.truncated || promptSpec.truncated) {
                this.showToast('选区较长，已截取前 2000 字');
            } else if (promptSpec.autoSend && hasDraft) {
                this.showToast('已有输入草稿，已追加选区内容');
            } else if (!shouldAutoSend) {
                this.showToast('已带入对话输入框');
            }

            if (promptSpec.autoSend && this.isGenerating) {
                this.showToast('当前正在生成，已先填入输入框');
                return;
            }
            if (shouldAutoSend) await this.doChat();
        },

        fillChatInputWithSelectionPrompt(prompt) {
            const input = this.uiManager.Q('#chat-input');
            if (!input) return;
            const current = input.value.trim();
            input.value = current
                ? `${current}\n\n---\n${prompt}`
                : prompt;
            input.style.height = 'auto';
            input.style.height = Math.min(input.scrollHeight, 140) + 'px';
            input.focus();
        },

        copyMessage(messageId) {
            const message = this.findVisibleMessage(messageId);
            const text = this.getMessageCopyText(message);
            if (!text.trim()) return this.showToast('没有可复制的内容', 'error');
            this.copyToClipboard(text);
            this.closeMessageContextMenu();
        },

        startEditMessage(messageId) {
            if (this.isGenerating) return this.showToast('生成中不能编辑消息', 'error');
            const message = this.findVisibleMessage(messageId);
            if (!message || message.status === 'streaming') return;
            if (message.role === 'assistant' && message.status !== 'done') return this.showToast('失败回复不能直接编辑，请重新生成', 'error');

            const input = this.uiManager.Q('#chat-input');
            this.closeMessageContextMenu();
            this.editingMessageId = messageId;
            this.editingDraftBefore = input.value;
            input.value = message.role === 'assistant' ? (message.content || '') : (message.content || '');
            input.style.height = 'auto';
            input.style.height = Math.min(input.scrollHeight, 140) + 'px';
            this.renderChatMessages();
            this.updateChatInputMode();
            input.focus();
            this.showToast('编辑后按 Enter 保存，Esc 取消');
        },

        async confirmEditMessage() {
            const input = this.uiManager.Q('#chat-input');
            const message = this.findVisibleMessage(this.editingMessageId);
            if (!message) return this.cancelEditMessage();

            const nextContent = input.value.trim();
            if (!nextContent) return this.showToast('编辑内容不能为空', 'error');
            if (this.isGenerating) return;

            const messageId = message.id;
            const isUser = message.role === 'user';
            this.setVisibleMessage(messageId, {
                content: nextContent,
                rawContent: nextContent,
                status: 'done',
                errorKind: null,
                errorMessage: '',
                excludeFromApi: isUser
            });
            this.removeVisibleMessagesAfter(messageId);

            this.editingMessageId = null;
            this.editingDraftBefore = '';
            input.value = '';
            input.style.height = 'auto';
            this.updateChatInputMode();
            this.renderChatMessages();

            if (isUser) {
                await this.requestAssistantForUser(this.findVisibleMessage(messageId));
            } else {
                this.showToast('已更新回复内容');
            }
        },

        cancelEditMessage() {
            const input = this.uiManager.Q('#chat-input');
            if (input) {
                input.value = this.editingDraftBefore || '';
                input.style.height = 'auto';
                input.style.height = Math.min(input.scrollHeight, 140) + 'px';
            }
            this.editingMessageId = null;
            this.editingDraftBefore = '';
            this.updateChatInputMode();
            this.renderChatMessages();
        },

        getRegenerateUserMessage(message) {
            if (!message) return null;
            if (message.role === 'user') return message;
            if (message.regenerateFromUserId) {
                const source = this.findVisibleMessage(message.regenerateFromUserId);
                if (source?.role === 'user') return source;
            }
            return this.getUserForAssistant(message.id);
        },

        async regenerateMessage(messageId) {
            if (this.isGenerating) return this.showToast('生成中不能重新生成', 'error');
            const message = this.findVisibleMessage(messageId);
            const userMessage = this.getRegenerateUserMessage(message);
            if (!message || !userMessage) return this.showToast('未找到可重新生成的问题', 'error');

            this.closeMessageContextMenu();
            if (message.role === 'assistant') {
                this.removeVisibleMessagesAfter(message.id, { includeTarget: true });
            } else {
                this.removeVisibleMessagesAfter(message.id);
            }
            this.renderChatMessages();
            await this.requestAssistantForUser(userMessage);
        },

        deleteMessage(messageId) {
            if (this.isGenerating) return this.showToast('生成中不能删除消息', 'error');
            const message = this.findVisibleMessage(messageId);
            if (!message) return;

            this.closeMessageContextMenu();
            if (this.editingMessageId === messageId) this.cancelEditMessage();
            if (message.role === 'assistant') {
                const userMessage = this.getUserForAssistant(message.id);
                if (userMessage) this.setVisibleMessage(userMessage.id, { excludeFromApi: true });
            }
            this.removeVisibleMessagesAfter(messageId, { includeTarget: true });
            this.renderChatMessages();
            if (this.chatSession.visibleMessages.length === 0) {
                const empty = this.uiManager.Q('#chat-empty');
                empty.classList.remove('hidden');
                empty.innerHTML = '<span class="tip-icon">💬</span>对话已清空<br>可以继续基于帖子内容提问';
            }
            this.showToast('消息已删除');
        },

        refreshSummaryCache() {
            const Q = this.uiManager.Q.bind(this.uiManager);
            const tid = Core.getTopicId();
            const start = Q('#inp-start').value;
            const end = Q('#inp-end').value;

            if (!tid) return this.showToast('未检测到帖子ID', 'error');
            if (!start || !end || parseInt(start) > parseInt(end)) {
                Core.clearTopicDataCache(tid);
                this.forceRefreshDialogueCache = true;
                return this.showToast('下次总结将重新获取楼层内容', 'success');
            }

            Core.clearDialogueCache(tid, parseInt(start), parseInt(end));
            Core.clearTopicDataCache(tid);
            this.forceRefreshDialogueCache = true;
            this.showToast('下次总结将重新获取楼层内容', 'success');
        },

        async doSummary() {
            const Q = this.uiManager.Q.bind(this.uiManager);
            const tid = Core.getTopicId();
            let start = parseInt(Q('#inp-start').value, 10);
            let end = parseInt(Q('#inp-end').value, 10);
            if (!tid) return this.showToast('未检测到帖子ID', 'error');
            if (!start) {
                start = 1;
                Q('#inp-start').value = start;
            }
            if (!end) {
                try {
                    end = await this.getRangeUpperBound({ forceRefresh: true, allowDomFallback: false });
                } catch (e) {
                    return this.showToast(`获取最新楼层失败: ${e.message || e}`, 'error');
                }
                if (end) Q('#inp-end').value = end;
            }
            if (!start || !end || start > end) return this.showToast('楼层范围无效', 'error');

            this.clearChatContext();
            Q('#chat-list').innerHTML = '';
            Q('#chat-empty').classList.remove('hidden');
            Q('#chat-empty').innerHTML = '<span class="tip-icon">💬</span>请先完成本次总结，<br>然后即可基于新上下文进行对话';
            this.updateMessageCount();
            this.setLoading('#btn-summary', true);
            const resultBox = Q('#summary-result');
            resultBox.classList.remove('empty');
            resultBox.innerHTML = `<div style="display:flex;align-items:center;gap:10px;"><div class="thinking"><div class="thinking-dot"></div><div class="thinking-dot"></div><div class="thinking-dot"></div></div>正在获取帖子内容...</div>`;

            try {
                const forceRefresh = this.forceRefreshDialogueCache === true;
                this.forceRefreshDialogueCache = false;
                const { text, cacheHit, cacheEntry, rangeMapping } = await Core.fetchDialoguesCached(tid, start, end, (progress) => {
                    resultBox.innerHTML = `<div style="display:flex;align-items:center;gap:10px;"><div class="thinking"><div class="thinking-dot"></div><div class="thinking-dot"></div><div class="thinking-dot"></div></div>${Core.getFetchProgressText(progress, '帖子内容')}</div>`;
                }, {
                    forceRefresh
                });
                if (!text) throw new Error('未获取到内容');
                this.postContent = text;
                const coverageReport = Core.buildSummaryCoverageReport({
                    topicId: tid,
                    start,
                    end,
                    cacheHit,
                    cacheEntry,
                    rangeMapping
                });
                resultBox.innerHTML = `<div style="display:flex;align-items:center;gap:10px;"><div class="thinking"><div class="thinking-dot"></div><div class="thinking-dot"></div><div class="thinking-dot"></div></div>${cacheHit ? '已复用楼层缓存，AI 正在重新分析中...' : 'AI 正在分析中...'}</div>`;

                const messages = [
                    { role: 'system', content: GM_getValue('prompt_sum', '') },
                    { role: 'user', content: `帖子内容:\n${text}` }
                ];

                let aiText = '';
                await Core.streamChat(messages,
                    (chunk) => {
                        aiText += chunk;
                        this.scheduleSummaryRender(resultBox, () => aiText);
                    },
                    () => {
                        this.cancelSummaryRender();
                        const classified = Core.classifyAiOutput(aiText);
                        if (classified.kind !== 'success') {
                            const reason = classified.kind === 'thinking_only'
                                ? 'AI 只返回了思考过程，没有生成摘要正文。'
                                : 'AI 返回了空内容。';
                            this.setLoading('#btn-summary', false);
                            resultBox.innerHTML = `
                                <div style="color:var(--danger)">❌ 错误: ${Core.escapeHtml(reason)}可直接重试 AI</div>
                                ${classified.thinking ? `<details class="summary-coverage"><summary>查看思考片段</summary><pre>${Core.escapeHtml(classified.thinking.slice(0, 2000))}</pre></details>` : ''}
                            `;
                            this.showToast('总结失败: ' + reason, 'error');
                            return;
                        }
                        this.setLoading('#btn-summary', false);
                        this.updateResultBox(resultBox, aiText, false, coverageReport);
                        this.setChatContext({
                            topicId: tid,
                            start,
                            end,
                            postContent: text,
                            summaryRawText: aiText,
                            summaryContent: classified.content,
                            coverageReport
                        });
                        this.renderChatMessages();
                        Q('#chat-empty').classList.remove('hidden');
                        Q('#chat-empty').innerHTML = '<span class="tip-icon">✅</span>总结已完成！<br>现在可以基于帖子内容进行对话';
                    },
                    (err) => {
                        this.cancelSummaryRender();
                        resultBox.innerHTML = `<div style="color:var(--danger)">❌ 错误: ${Core.escapeHtml(err)}</div>`;
                        this.setLoading('#btn-summary', false);
                        this.showToast('总结失败: ' + err, 'error');
                    }
                );
            } catch (e) {
                resultBox.innerHTML = `<div style="color:var(--danger)">❌ 错误: ${Core.escapeHtml(e.message)}</div>`;
                this.setLoading('#btn-summary', false);
            }
        },

        async doChat() {
            const Q = this.uiManager.Q.bind(this.uiManager);
            if (this.isGenerating) return;
            if (this.editingMessageId) return this.confirmEditMessage();
            if (!this.hasChatContext()) return this.showToast('请先生成总结', 'error');

            const input = Q('#chat-input');
            const txt = input.value.trim();
            if (!txt) return;

            input.value = '';
            input.style.height = 'auto';
            Q('#chat-empty').classList.add('hidden');
            this.userScrolledUp = false;

            const userMessage = this.appendVisibleMessage(this.createVisibleMessage('user', txt, { excludeFromApi: true }));
            this.renderChatMessages();
            await this.requestAssistantForUser(userMessage);
        },

        //
        // 6. 辅助/工具方法
        //
        async getRangeUpperBound(options = {}) {
            const tid = Core.getTopicId();
            if (!tid) return Core.getReplyCount();

            try {
                const bounds = await Core.getTopicBounds(tid, {
                    forceRefresh: options.forceRefresh === true,
                    allowDomFallback: options.allowDomFallback !== false
                });
                if (bounds.highestPostNumber > 0) {
                    this.rangeBoundsTopicId = tid;
                    this.rangeBoundsLastRefreshAt = Date.now();
                    return bounds.highestPostNumber;
                }
                if (options.allowDomFallback === false) {
                    throw new Error('未获取到主题最高楼层');
                }
                return Core.getReplyCount();
            } catch (e) {
                if (options.allowDomFallback === false) {
                    console.warn('[Linux.do 智能总结] 获取主题最高楼层失败:', e);
                    throw e;
                }
                console.warn('[Linux.do 智能总结] 获取主题最高楼层失败，使用页面时间线计数兜底:', e);
                return Core.getReplyCount();
            }
        },

        async initRangeInputs() {
            const Q = this.uiManager.Q.bind(this.uiManager);
            const start = Q('#inp-start'), end = Q('#inp-end');
            const tid = Core.getTopicId();
            if (!start.value) start.value = 1;
            const isBoundsStale = Date.now() - this.rangeBoundsLastRefreshAt > Core.topicDataCachePolicy.ttlMs;
            const shouldRefresh = !end.value || this.rangeBoundsTopicId !== tid || (isBoundsStale && this.rangeMode !== 'manual');
            if (!shouldRefresh) return;

            const requestSeq = ++this.rangeRequestSeq;
            const max = await this.getRangeUpperBound({ forceRefresh: false, allowDomFallback: true });
            if (requestSeq !== this.rangeRequestSeq || tid !== Core.getTopicId()) return;
            if (max && (!end.value || this.rangeMode !== 'manual')) end.value = max;
        },

        setRangeButtonsLoading(scope, isLoading) {
            const Q = this.uiManager.Q.bind(this.uiManager);
            const selectors = scope === 'export'
                ? ['#export-range-all', '#export-range-recent']
                : ['#range-all', '#range-recent'];
            selectors.forEach((selector) => {
                const btn = Q(selector);
                if (!btn) return;
                if (isLoading) {
                    if (!btn.dataset.originalHtml) btn.dataset.originalHtml = btn.innerHTML;
                    btn.disabled = true;
                    btn.classList.add('loading');
                    btn.textContent = '获取中';
                } else {
                    btn.disabled = false;
                    btn.classList.remove('loading');
                    if (btn.dataset.originalHtml) {
                        btn.innerHTML = btn.dataset.originalHtml;
                        delete btn.dataset.originalHtml;
                    }
                }
            });
        },

        async setRange(type) {
            const Q = this.uiManager.Q.bind(this.uiManager);
            const tid = Core.getTopicId();
            const requestSeq = ++this.rangeRequestSeq;
            this.setRangeButtonsLoading('summary', true);
            try {
                const max = await this.getRangeUpperBound({ forceRefresh: true, allowDomFallback: false });
                if (requestSeq !== this.rangeRequestSeq || tid !== Core.getTopicId()) return;
                if (!max) return this.showToast('未获取到最高楼层', 'error');
                Q('#inp-end').value = max;
                const recentFloors = GM_getValue('recentFloors', 50);
                Q('#inp-start').value = type === 'all' ? 1 : Math.max(1, max - recentFloors + 1);
                this.rangeMode = type;
                this.showToast('已获取最新楼层范围', 'success');
            } catch (e) {
                if (requestSeq === this.rangeRequestSeq) {
                    this.showToast(`获取最新楼层失败: ${e.message || e}`, 'error');
                }
            } finally {
                if (requestSeq === this.rangeRequestSeq) this.setRangeButtonsLoading('summary', false);
            }
        },

        updateResultBox(resultBox, text, isStreaming, coverageReport = null) {
            const Q = this.uiManager.Q.bind(this.uiManager);
            if (isStreaming) this.closeSummarySelectionMenu?.();
            const currentBlock = resultBox.querySelector('[data-thinking-block]');
            const isExpanded = currentBlock?.classList.contains('expanded') || false;

            const contentHTML = this.renderWithThinking(text, isStreaming, isExpanded);
            const coverageHTML = !isStreaming ? Core.renderSummaryCoverageReport(coverageReport) : '';
            resultBox.innerHTML = `
                <div class="result-actions">
                    <button class="result-action-btn" id="btn-copy-summary">📋 复制</button>
                </div>
            ` + contentHTML + coverageHTML;

            const copyBtn = Q('#btn-copy-summary');
            if (copyBtn) {
                copyBtn.onclick = () => {
                    this.copyToClipboard(Core.parseThinkingContent(text).content);
                    copyBtn.classList.add('copied');
                    copyBtn.textContent = '✓ 已复制';
                    this.setManagedTimeout(() => {
                        copyBtn.classList.remove('copied');
                        copyBtn.textContent = '📋 复制';
                    }, 2000);
                };
            }
            if (GM_getValue('autoScroll', true)) {
                this.setManagedTimeout(() => {
                    resultBox.scrollTop = resultBox.scrollHeight;
                    const thinkingInner = resultBox.querySelector('.thinking-content-inner');
                    if (thinkingInner && isExpanded) {
                        thinkingInner.scrollTop = thinkingInner.scrollHeight;
                    }
                }, 0);
            }
        },

        updateBubble(bubbleDiv, text, isStreaming) {
            const currentBlock = bubbleDiv.querySelector('[data-thinking-block]');
            const isExpanded = currentBlock?.classList.contains('expanded') || false;
            const messageId = bubbleDiv.dataset.messageId;
            const message = messageId ? this.findVisibleMessage(messageId) : null;
            if (message) {
                bubbleDiv.__rawMessageText = text ?? '';
                message.rawContent = text ?? '';
                if (message.status !== 'error') {
                    const roleClass = message.role === 'assistant' ? 'ai' : 'user';
                    bubbleDiv.className = `bubble bubble-${roleClass}`;
                    bubbleDiv.classList.toggle('bubble-streaming', isStreaming);
                    bubbleDiv.classList.toggle('bubble-error', false);
                    bubbleDiv.innerHTML = this.renderWithThinking(text, isStreaming, isExpanded);
                } else {
                    this.renderBubbleContent(bubbleDiv, message);
                }
            } else {
                bubbleDiv.innerHTML = this.renderWithThinking(text, isStreaming, isExpanded);
            }
            if (GM_getValue('autoScroll', true) && isExpanded) {
                this.setManagedTimeout(() => {
                    const thinkingInner = bubbleDiv.querySelector('.thinking-content-inner');
                    if (thinkingInner) thinkingInner.scrollTop = thinkingInner.scrollHeight;
                }, 0);
            }
        },

        addBubble(messageOrRole, text) {
            const Q = this.uiManager.Q.bind(this.uiManager);
            const message = typeof messageOrRole === 'object'
                ? messageOrRole
                : this.createVisibleMessage(messageOrRole === 'ai' ? 'assistant' : messageOrRole, text);
            const div = document.createElement('div');
            this.renderBubbleContent(div, message);
            Q('#chat-list').appendChild(div);
            this.scrollToBottom();
            return div;
        },

        renderWithThinking(text, isStreaming = false, keepExpanded = false) {
            const { thinking, content } = Core.parseThinkingContent(text);
            const arrowIcon = `<svg viewBox="0 0 24 24"><path d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6z"/></svg>`;
            let html = '';
            if (thinking) {
                const charCount = thinking.length;
                const streamingClass = isStreaming ? ' streaming' : '';
                const expandedClass = keepExpanded ? ' expanded' : '';
                const statusText = isStreaming ? '思考中...' : `${charCount} 字`;
                const previewText = thinking.split('\n').filter(l => l.trim()).slice(-4).join('\n').slice(-150);
                const thinkingHtml = Core.renderMarkdown(thinking);
                const previewHtml = Core.renderMarkdown(previewText);
                html += `<div class="thinking-block${streamingClass}${expandedClass}" data-thinking-block>
                             <div class="thinking-header" data-thinking-toggle>
                                 <div class="thinking-header-left">
                                     <div class="thinking-icon">🧠</div><span class="thinking-title">思考过程</span>
                                     <span class="thinking-status">${statusText}</span>
                                 </div>
                                 <div class="thinking-toggle">${arrowIcon}</div>
                             </div>
                             <div class="thinking-preview">${previewHtml}</div>
                             <div class="thinking-content"><div class="thinking-content-inner">${thinkingHtml}</div></div>
                         </div>`;
            }
            if (content) {
                html += Core.renderMarkdown(content);
            }
            return html;
        },

        showToast(message, type = '') {
            const Q = this.uiManager.Q.bind(this.uiManager);
            const toast = Q('#toast');
            toast.textContent = message;
            toast.className = 'toast' + (type ? ` ${type}` : '');
            this.requestManagedFrame(() => toast.classList.add('show'));
            this.setManagedTimeout(() => toast.classList.remove('show'), 2500);
        },

        copyToClipboard(text) {
            GM_setClipboard(text, 'text');
            this.showToast('已复制到剪贴板');
        },

        openModelPicker() {
            const Q = this.uiManager.Q.bind(this.uiManager);
            this.closeMessageContextMenu?.();
            this.closeSummarySelectionMenu?.();
            const modal = Q('#model-picker-modal');
            modal.classList.add('show');
            modal.setAttribute('aria-hidden', 'false');
            this.loadModelList();
        },

        closeModelPicker() {
            const modal = this.uiManager.Q('#model-picker-modal');
            if (!modal) return;
            modal.classList.remove('show');
            modal.setAttribute('aria-hidden', 'true');
        },

        setModelPickerStatus(message, type = '') {
            const status = this.uiManager.Q('#model-picker-status');
            if (!status) return;
            status.textContent = message;
            status.className = 'model-picker-status' + (type ? ` ${type}` : '');
        },

        renderModelOptions(models) {
            const list = this.uiManager.Q('#model-picker-list');
            list.innerHTML = '';
            models.forEach((model) => {
                const btn = document.createElement('button');
                btn.type = 'button';
                btn.className = 'model-option';
                btn.dataset.model = model;
                btn.textContent = model;
                list.appendChild(btn);
            });
        },

        async loadModelList() {
            const Q = this.uiManager.Q.bind(this.uiManager);
            const btn = Q('#btn-refresh-models');
            const fetchBtn = Q('#btn-fetch-models');
            const list = Q('#model-picker-list');
            const apiUrl = Q('#cfg-url').value.trim();
            const apiKey = Q('#cfg-key').value.trim();

            list.innerHTML = '';
            this.setModelPickerStatus('正在获取模型列表...');
            if (btn) btn.disabled = true;
            if (fetchBtn) fetchBtn.disabled = true;

            try {
                const { models, url } = await Core.fetchModelList(apiUrl, apiKey);
                this.renderModelOptions(models);
                this.setModelPickerStatus(`已从 ${url} 获取 ${models.length} 个模型。`);
            } catch (e) {
                this.setModelPickerStatus(e.message || '获取模型列表失败', 'error');
            } finally {
                if (btn) btn.disabled = false;
                if (fetchBtn) fetchBtn.disabled = false;
            }
        },

        updateScrollButtons() {
            const Q = this.uiManager.Q.bind(this.uiManager);
            const el = Q('#chat-messages');
            const showTop = el.scrollTop > 50;
            const showBottom = (el.scrollHeight - el.scrollTop - el.clientHeight) > 50;
            Q('#btn-scroll-top').classList.toggle('visible', showTop);
            Q('#btn-scroll-bottom').classList.toggle('visible', showBottom || (this.isGenerating && this.userScrolledUp));
            Q('#btn-scroll-bottom').classList.toggle('generating', this.isGenerating && this.userScrolledUp);
        },

        scrollToTop() { this.uiManager.Q('#chat-messages').scrollTo({ top: 0, behavior: 'smooth' }); },

        scrollToBottom(force = false) {
            if (!force && (!GM_getValue('autoScroll', true) || this.userScrolledUp)) return this.updateScrollButtons();
            const el = this.uiManager.Q('#chat-messages');
            this.isProgrammaticScroll = true;
            this.setManagedTimeout(() => {
                el.scrollTop = el.scrollHeight;
                this.setManagedTimeout(() => { this.isProgrammaticScroll = false; this.updateScrollButtons(); }, 50);
            }, 0);
        },

        forceScrollToBottom() {
            this.userScrolledUp = false;
            this.scrollToBottom(true);
        },

        clearChat() {
            if (!this.hasChatContext()) return;
            if (!this.chatSession.visibleMessages.length) return;
            if (this.isGenerating) return this.showToast('生成中不能清空对话', 'error');
            if (confirm('确定要清空所有对话记录吗？\n（总结上下文将保留）')) {
                this.closeMessageContextMenu();
                this.editingMessageId = null;
                this.editingDraftBefore = '';
                this.chatSession.visibleMessages = [];
                this.syncLegacyChatHistory();
                this.renderChatMessages();
                const emptyDiv = this.uiManager.Q('#chat-empty');
                emptyDiv.classList.remove('hidden');
                emptyDiv.innerHTML = '<span class="tip-icon">💬</span>对话已清空<br>可以继续基于帖子内容提问';
                this.updateChatInputMode();
                this.showToast('对话已清空');
            }
        },

        updateMessageCount() {
            const count = this.chatSession?.visibleMessages?.filter(message => message.role === 'user').length || 0;
            this.userMessageCount = count;
            this.uiManager.Q('#msg-count').textContent = count;
        },

        // 导出功能相关方法
        async setExportRange(type) {
            const Q = this.uiManager.Q.bind(this.uiManager);
            const tid = Core.getTopicId();
            const requestSeq = ++this.exportRangeRequestSeq;
            this.setRangeButtonsLoading('export', true);
            try {
                const max = await this.getRangeUpperBound({ forceRefresh: true, allowDomFallback: false });
                if (requestSeq !== this.exportRangeRequestSeq || tid !== Core.getTopicId()) return;
                if (!max) return this.showToast('未获取到最高楼层', 'error');
                Q('#export-end').value = max;
                const recentFloors = GM_getValue('recentFloors', 50);
                Q('#export-start').value = type === 'all' ? 1 : Math.max(1, max - recentFloors + 1);
                this.exportRangeMode = type;
                this.showToast('已获取最新导出范围', 'success');
            } catch (e) {
                if (requestSeq === this.exportRangeRequestSeq) {
                    this.showToast(`获取最新楼层失败: ${e.message || e}`, 'error');
                }
            } finally {
                if (requestSeq === this.exportRangeRequestSeq) this.setRangeButtonsLoading('export', false);
            }
        },

        async doExport() {
            const Q = this.uiManager.Q.bind(this.uiManager);
            const tid = Core.getTopicId();
            const exportType = Q('#export-type').value;
            let start = parseInt(Q('#export-start').value, 10);
            let end = parseInt(Q('#export-end').value, 10);

            if (!tid) return this.showToast('未检测到帖子ID', 'error');
            if (!start) {
                start = 1;
                Q('#export-start').value = start;
            }
            if (!end) {
                try {
                    end = await this.getRangeUpperBound({ forceRefresh: true, allowDomFallback: false });
                } catch (e) {
                    return this.showToast(`获取最新楼层失败: ${e.message || e}`, 'error');
                }
                if (end) Q('#export-end').value = end;
            }
            if (!start || !end || start > end) return this.showToast('楼层范围无效', 'error');

            this.setLoading('#btn-export', true);
            const statusBox = Q('#export-status');
            statusBox.classList.remove('empty');
            statusBox.innerHTML = `<div style="display:flex;align-items:center;gap:10px;"><div class="thinking"><div class="thinking-dot"></div><div class="thinking-dot"></div><div class="thinking-dot"></div></div>正在获取帖子数据...</div>`;

            try {
                const { topicData, posts: allPosts, rangeMapping } = await Core.fetchTopicPosts(tid, start, end, (progress) => {
                    statusBox.innerHTML = `<div style="display:flex;align-items:center;gap:10px;"><div class="thinking"><div class="thinking-dot"></div><div class="thinking-dot"></div><div class="thinking-dot"></div></div>${Core.getFetchProgressText(progress, '帖子数据')}</div>`;
                });

                if (allPosts.length === 0) throw new Error('未获取到可导出的帖子内容');
                const mappingText = rangeMapping?.fallbackUsed
                    ? `，已回看 ${rangeMapping.lookBehindIds} 个索引校准范围`
                    : '';
                statusBox.innerHTML = `<div style="display:flex;align-items:center;gap:10px;"><div class="thinking"><div class="thinking-dot"></div><div class="thinking-dot"></div><div class="thinking-dot"></div></div>正在处理 ${allPosts.length} 条可见回复${mappingText}...</div>`;

                if (exportType === 'html') {
                    await this.exportAsHtml(topicData, allPosts, statusBox);
                } else {
                    await this.exportAsAiText(topicData, allPosts, statusBox);
                }

                this.setLoading('#btn-export', false);
            } catch (e) {
                statusBox.innerHTML = `<div style="color:var(--danger)">❌ 导出失败: ${e.message}</div>`;
                this.setLoading('#btn-export', false);
                this.showToast('导出失败: ' + e.message, 'error');
            }
        },

        async exportAsHtml(topicData, posts, statusBox) {
            const Q = this.uiManager.Q.bind(this.uiManager);
            const offlineImages = Q('#export-offline-images').checked;
            const theme = Q('#export-theme').value;

            statusBox.innerHTML = `<div style="display:flex;align-items:center;gap:10px;"><div class="thinking"><div class="thinking-dot"></div><div class="thinking-dot"></div><div class="thinking-dot"></div></div>正在生成 HTML...</div>`;

            const title = Core.escapeHtml(topicData.title);
            const author = Core.escapeHtml(topicData.details?.created_by?.username || '未知');
            const createTime = new Date(topicData.created_at).toLocaleString('zh-CN');

            let postsHtml = '';
            const postsByPostNumber = Core.createPostsByPostNumber(posts);
            for (const post of posts) {
                const userName = Core.escapeHtml(post.name || post.username);
                const username = Core.escapeHtml(post.username);
                const postTime = new Date(post.created_at).toLocaleString('zh-CN');
                const replyRelationHtml = Core.formatReplyRelationHtml(post, postsByPostNumber);
                const boostsHtml = Core.formatBoostsHtml(post);
                let content = post.cooked;

                // 处理图片
                if (offlineImages && Core.postHasImage(post)) {
                    statusBox.innerHTML = `<div style="display:flex;align-items:center;gap:10px;"><div class="thinking"><div class="thinking-dot"></div><div class="thinking-dot"></div><div class="thinking-dot"></div></div>正在处理第 ${post.post_number} 楼的图片...</div>`;

                    const imgRegex = /<img[^>]+src="([^"]+)"[^>]*>/gi;
                    const matches = [...content.matchAll(imgRegex)];

                    for (const match of matches) {
                        try {
                            const imgUrl = Core.absoluteUrl(match[1]);
                            const response = await fetch(imgUrl);
                            const blob = await response.blob();
                            const base64 = await new Promise((resolve) => {
                                const reader = new FileReader();
                                reader.onloadend = () => resolve(reader.result);
                                reader.readAsDataURL(blob);
                            });
                            content = content.replace(match[1], base64);
                        } catch (e) {
                            console.warn('图片转换失败:', match[1], e);
                        }
                    }
                }

                content = Core.sanitizeExportHtml(content);

                postsHtml += `
                    <div class="post" id="post-${post.post_number}">
                        <div class="post-header">
                            <div class="post-author">
                                <strong>${userName}</strong>
                                <span class="username">@${username}</span>
                            </div>
                            <div class="post-meta">
                                <span class="post-number">#${post.post_number}</span>
                                ${replyRelationHtml}
                                <span class="post-time">${postTime}</span>
                            </div>
                        </div>
                        <div class="post-content">${content}</div>
                        ${boostsHtml}
                    </div>
                `;
            }

            const themeColors = theme === 'dark' ? {
                bg: '#1a1a1a',
                card: '#2d2d2d',
                text: '#e0e0e0',
                textSec: '#b0b0b0',
                border: '#404040',
                primary: '#E3A043'
            } : {
                bg: '#f5f5f5',
                card: '#ffffff',
                text: '#333333',
                textSec: '#666666',
                border: '#e0e0e0',
                primary: '#E3A043'
            };

            const html = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title} - Linux.do</title>
    <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: ${themeColors.bg}; color: ${themeColors.text}; line-height: 1.6; padding: 20px; }
        .container { max-width: 900px; margin: 0 auto; }
        .header { background: ${themeColors.card}; padding: 30px; border-radius: 8px; margin-bottom: 20px; border: 1px solid ${themeColors.border}; }
        .header h1 { font-size: 28px; margin-bottom: 15px; color: ${themeColors.text}; }
        .header-meta { color: ${themeColors.textSec}; font-size: 14px; }
        .post { background: ${themeColors.card}; padding: 20px; border-radius: 8px; margin-bottom: 15px; border: 1px solid ${themeColors.border}; }
        .post-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; padding-bottom: 10px; border-bottom: 1px solid ${themeColors.border}; }
        .post-author strong { color: ${themeColors.text}; font-size: 16px; }
        .username { color: ${themeColors.textSec}; font-size: 14px; margin-left: 8px; }
        .post-meta { color: ${themeColors.textSec}; font-size: 13px; }
        .post-number { color: ${themeColors.primary}; font-weight: 600; margin-right: 10px; }
        .reply-relation { color: ${themeColors.primary}; margin-right: 10px; text-decoration: none; }
        .reply-relation-missing { color: ${themeColors.textSec}; }
        .post-content { color: ${themeColors.text}; }
        .post-boosts { margin-top: 14px; padding-top: 12px; border-top: 1px solid ${themeColors.border}; color: ${themeColors.textSec}; font-size: 13px; }
        .boosts-title { color: ${themeColors.primary}; font-weight: 600; margin-bottom: 8px; }
        .post-boosts ul { list-style: none; padding: 0; margin: 0; }
        .post-boosts li { margin: 6px 0; }
        .boost-author { color: ${themeColors.text}; font-weight: 600; margin-right: 6px; }
        .boost-text { color: ${themeColors.textSec}; }
        .boost-more { color: ${themeColors.textSec}; font-style: italic; }
        .post-content img { max-width: 100%; height: auto; border-radius: 4px; margin: 10px 0; }
        .post-content pre { background: ${theme === 'dark' ? '#1e1e1e' : '#f5f5f5'}; padding: 15px; border-radius: 4px; overflow-x: auto; }
        .post-content code { font-family: 'Courier New', monospace; }
        .post-content blockquote { border-left: 3px solid ${themeColors.primary}; padding-left: 15px; margin: 10px 0; color: ${themeColors.textSec}; }
        .footer { text-align: center; color: ${themeColors.textSec}; margin-top: 30px; font-size: 13px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>${title}</h1>
            <div class="header-meta">
                作者: ${author} | 创建时间: ${createTime} | 共 ${posts.length} 条回复
            </div>
        </div>
        ${postsHtml}
        <div class="footer">
            导出自 Linux.do | 导出时间: ${new Date().toLocaleString('zh-CN')}
        </div>
    </div>
</body>
</html>`;

            const filename = `${title.replace(/[<>:"/\\|?*]/g, '_')}_${posts[0].post_number}-${posts[posts.length-1].post_number}.html`;
            Core.downloadFile(html, filename, 'text/html');

            statusBox.innerHTML = `<div style="color:var(--success)">✅ HTML 文件已导出！<br><small>文件名: ${filename}</small></div>`;
            this.showToast('HTML 导出成功');
        },

        async exportAsAiText(topicData, posts, statusBox) {
            const Q = this.uiManager.Q.bind(this.uiManager);
            const includeHeader = Q('#export-ai-header').checked;
            const includeImages = Q('#export-ai-images').checked;
            const includeQuotes = Q('#export-ai-quotes').checked;

            statusBox.innerHTML = `<div style="display:flex;align-items:center;gap:10px;"><div class="thinking"><div class="thinking-dot"></div><div class="thinking-dot"></div><div class="thinking-dot"></div></div>正在生成 AI 文本...</div>`;

            let text = '';

            if (includeHeader) {
                text += `标题: ${topicData.title}\n`;
                text += `作者: ${topicData.details?.created_by?.username || '未知'}\n`;
                text += `创建时间: ${new Date(topicData.created_at).toLocaleString('zh-CN')}\n`;
                text += `回复数: ${posts.length}\n`;
                text += `\n${'='.repeat(50)}\n\n`;
            }

            const postsByPostNumber = Core.createPostsByPostNumber(posts);
            for (const post of posts) {
                const userName = post.name || post.username;
                const username = post.username;
                const postTime = new Date(post.created_at).toLocaleString('zh-CN');
                const replyRelationInline = Core.formatReplyRelationInline(post, postsByPostNumber);

                text += `[${post.post_number}楼] ${userName}（@${username}）${replyRelationInline}\n`;
                text += `时间: ${postTime}\n\n`;

                const boostsText = Core.formatBoostsText(post, { atPrefix: true });
                if (boostsText) {
                    text += boostsText + '\n\n';
                }

                const content = Core.cookedToAiText(post.cooked, { includeImages, includeQuotes });
                text += content + '\n\n';
                text += '-'.repeat(50) + '\n\n';
            }

            const filename = `${topicData.title.replace(/[<>:"/\\|?*]/g, '_')}_${posts[0].post_number}-${posts[posts.length-1].post_number}.txt`;
            Core.downloadFile(text, filename, 'text/plain');

            statusBox.innerHTML = `<div style="color:var(--success)">✅ AI 文本已导出！<br><small>文件名: ${filename}</small></div>`;
            this.showToast('AI 文本导出成功');
        }
    });

    // -------------------------------------------------
    // UI 风格 2: 原生风格
    // -------------------------------------------------
    UIRegistry.register('style2', {
        name: 'LinuxDO沉浸风格',
        styleKey: 'style2',
        ICONS: {
            brain: `<svg viewBox="0 0 24 24"><path d="M12 2a10 10 0 0 1 10 10c0 5.52-4.48 10-10 10S2 17.52 2 12 6.48 2 12 2zm0 2a8 8 0 1 0 0 16 8 8 0 0 0 0-16zm1 11a1 1 0 1 1 0 2 1 1 0 0 1 0-2zm0-7a1 1 0 0 1 0 2 1 1 0 0 1 0-2zm-2 7a1 1 0 1 1 0 2 1 1 0 0 1 0-2zm0-7a1 1 0 0 1 0 2 1 1 0 0 1 0-2z" fill="currentColor"/></svg>`,
            summary: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>`,
            chat: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>`,
            settings: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>`,
            moon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>`,
            sun: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>`,
            close: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>`,
            trash: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>`,
            copy: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>`,
            sparkles: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/></svg>`,
            arrowLeft: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>`,
            arrowRight: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>`,
            arrowUp: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="19" x2="12" y2="5"></line><polyline points="5 12 12 5 19 12"></polyline></svg>`,
            arrowDown: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><polyline points="19 12 12 19 5 12"></polyline></svg>`,
            send: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>`,
            robot: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="10" rx="2"></rect><circle cx="12" cy="5" r="2"></circle><path d="M12 7v4"></path><line x1="8" y1="16" x2="8" y2="16"></line><line x1="16" y1="16" x2="16" y2="16"></line></svg>`,
            check: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>`
        },

        init(uiManager) {
            this.uiManager = uiManager;
            this.isOpen = false;
            this._cleanupFns = [];
            this._timerIds = new Set();
            this._frameIds = new Set();
            this.streamingRenderDelayMs = 80;
            this.summaryRenderTask = null;
            this.bubbleRenderTasks = new Map();
            this.scrollButtonsFrame = null;
            this.btnPos = GM_getValue(this.getStyleStorageKey('btnPos'), { side: 'right', top: '50%' });
            this.side = this.btnPos.side;
            this.sidebarWidth = GM_getValue(this.getStyleStorageKey('sidebarWidth'), 420);
            this.isDarkTheme = GM_getValue(this.getStyleStorageKey('isDarkTheme'), false);
            this.chatHistory = [];
            this.chatSession = this.createEmptyChatSession();
            this.editingMessageId = null;
            this.editingDraftBefore = '';
            this.currentMessageMenuId = null;
            this.currentSummarySelection = null;
            this.summarySelectionOpenTimerId = null;
            this.summarySelectionRequestSeq = 0;
            this.chatRequestSeq = 0;
            this.postContent = '';
            this.lastSummary = '';
            this.forceRefreshDialogueCache = false;
            this.isGenerating = false;
            this.currentTab = 'summary';
            this.userMessageCount = 0;
            this.userScrolledUp = false;
            this.isProgrammaticScroll = false;
            this.apiProfiles = [];
            this.activeApiProfileId = '';
            this.apiProfilePersistTimerId = null;
            this.rangeRequestSeq = 0;
            this.exportRangeRequestSeq = 0;
            this.rangeMode = 'manual';
            this.exportRangeMode = 'manual';
            this.rangeBoundsTopicId = '';
            this.rangeBoundsLastRefreshAt = 0;
            this.render();
            this.restoreState();
            this.bindEvents();
            this.bindKeyboardShortcuts();
        },

        destroy: UIRegistry.get('style1').destroy,
        getStyleStorageKey: UIRegistry.get('style1').getStyleStorageKey,
        addManagedListener: UIRegistry.get('style1').addManagedListener,
        setManagedTimeout: UIRegistry.get('style1').setManagedTimeout,
        clearManagedTimeout: UIRegistry.get('style1').clearManagedTimeout,
        requestManagedFrame: UIRegistry.get('style1').requestManagedFrame,
        cancelManagedFrame: UIRegistry.get('style1').cancelManagedFrame,
        createFrameThrottledHandler: UIRegistry.get('style1').createFrameThrottledHandler,
        scheduleSummaryRender: UIRegistry.get('style1').scheduleSummaryRender,
        cancelSummaryRender: UIRegistry.get('style1').cancelSummaryRender,
        scheduleBubbleRender: UIRegistry.get('style1').scheduleBubbleRender,
        cancelBubbleRender: UIRegistry.get('style1').cancelBubbleRender,
        resetGlobalUiState: UIRegistry.get('style1').resetGlobalUiState,

        getStyles() {
            return `
            :host { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; --brand-gold: #E3A043; --brand-gold-hover: #d48f35; --primary: #222222; --primary-hover: #000000; --primary-light: #f0f0f0; --success: #2d9d78; --success-light: #d1fae5; --danger: #d93025; --danger-light: #fef2f2; --warning: #f2c04d; --bg-base: #F9FAFB; --bg-card: #FFFFFF; --bg-glass: rgba(255, 255, 255, 0.95); --bg-glass-dark: rgba(255, 255, 255, 0.98); --bg-hover: #F2F2F2; --bg-active: #E5E7EB; --bg-setting: #F9FAFB; --bg-input: #FFFFFF; --border-light: #E5E7EB; --border-medium: #D1D5DB; --shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05); --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.08), 0 2px 4px -1px rgba(0, 0, 0, 0.04); --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.08), 0 4px 6px -2px rgba(0, 0, 0, 0.04); --shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04); --shadow-glow: 0 0 0 1px rgba(0,0,0,0.05); --text-main: #111827; --text-sec: #4B5563; --text-muted: #9CA3AF; --text-inverse: #FFFFFF; --sidebar-width: 420px; --btn-size: 42px; --radius-sm: 4px; --radius-md: 6px; --radius-lg: 8px; --radius-xl: 12px; --radius-full: 9999px; --transition-fast: 0.15s ease; --transition-normal: 0.25s ease; --transition-slow: 0.35s ease; }
            :host(.dark-theme) { --primary: #E3A043; --primary-hover: #ffb85c; --primary-light: #2D2D2D; --bg-base: #111111; --bg-card: #1E1E1E; --bg-glass: rgba(30, 30, 30, 0.95); --bg-glass-dark: rgba(20, 20, 20, 0.98); --bg-hover: #2D2D2D; --bg-active: #374151; --bg-setting: #111111; --bg-input: #2D2D2D; --border-light: #374151; --border-medium: #4B5563; --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.5); --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.5); --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.5); --shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.5); --text-main: #F3F4F6; --text-sec: #D1D5DB; --text-muted: #6B7280; --text-inverse: #111827; }
            * { box-sizing: border-box; }
            .sidebar-panel { position: fixed; top: 0; bottom: 0; width: var(--sidebar-width); background: var(--bg-card); box-shadow: var(--shadow-xl); z-index: 9998; display: flex; flex-direction: column; transition: transform var(--transition-slow); border: 1px solid var(--border-light); }
            .panel-left { left: 0; border-left: none; transform: translateX(-100%); }
            .panel-left.open { transform: translateX(0); }
            .panel-right { right: 0; border-right: none; transform: translateX(100%); }
            .panel-right.open { transform: translateX(0); }
            #toggle-btn { position: fixed; width: var(--btn-size); height: var(--btn-size); background: var(--bg-card); color: var(--text-sec); box-shadow: var(--shadow-md); z-index: 9999; cursor: grab; display: flex; align-items: center; justify-content: center; user-select: none; transition: all var(--transition-normal); border: 1px solid var(--border-light); outline: none; }
            #toggle-btn:hover { background: var(--bg-hover); color: var(--brand-gold); transform: scale(1.05); }
            #toggle-btn:active { cursor: grabbing; transform: scale(0.96); }
            #toggle-btn svg { width: 20px; height: 20px; fill: none; stroke: currentColor; }
            .btn-snap-left { border-radius: 0 var(--radius-md) var(--radius-md) 0; border-left: none; }
            .btn-snap-right { border-radius: var(--radius-md) 0 0 var(--radius-md); border-right: none; }
            .btn-floating { border-radius: 50%; box-shadow: var(--shadow-lg); }
            .resize-handle { position: absolute; top: 0; bottom: 0; width: 4px; cursor: col-resize; z-index: 10001; background: transparent; transition: background var(--transition-fast); }
            .resize-handle:hover { background: var(--brand-gold); }
            .handle-left { right: -2px; } .handle-right { left: -2px; }
            .header { padding: 16px 20px; border-bottom: 1px solid var(--border-light); display: flex; justify-content: space-between; align-items: center; background: var(--bg-card); flex-shrink: 0; }
            .header-title { font-size: 16px; font-weight: 600; color: var(--text-main); display: flex; align-items: center; gap: 10px; }
            .header-title-icon { color: var(--brand-gold); display: flex; align-items: center; justify-content: center; }
            .header-title-icon svg { width: 22px; height: 22px; }
            .header-actions { display: flex; gap: 4px; }
            .icon-btn { background: transparent; border: none; cursor: pointer; padding: 8px; border-radius: var(--radius-sm); color: var(--text-muted); transition: all var(--transition-fast); display: flex; align-items: center; justify-content: center; position: relative; }
            .icon-btn svg { width: 18px; height: 18px; }
            .icon-btn:hover { background: var(--bg-hover); color: var(--text-main); }
            .icon-btn[data-tooltip]::after { content: attr(data-tooltip); position: absolute; bottom: -30px; left: 50%; transform: translateX(-50%); background: #333; color: white; padding: 4px 8px; border-radius: 4px; font-size: 11px; white-space: nowrap; opacity: 0; pointer-events: none; transition: opacity var(--transition-fast); z-index: 100; }
            .icon-btn[data-tooltip]:hover::after { opacity: 1; }
            .tab-bar { display: flex; padding: 0 16px; gap: 24px; border-bottom: 1px solid var(--border-light); background: var(--bg-card); flex-shrink: 0; }
            .tab-item { padding: 14px 4px; text-align: center; font-size: 14px; font-weight: 500; color: var(--text-sec); cursor: pointer; border-bottom: 2px solid transparent; transition: all var(--transition-fast); display: flex; align-items: center; gap: 6px; }
            .tab-item svg { width: 16px; height: 16px; opacity: 0.8; }
            .tab-item:hover { color: var(--text-main); }
            .tab-item.active { color: var(--brand-gold); border-bottom-color: var(--brand-gold); font-weight: 600; }
            .tab-item.active svg { opacity: 1; stroke-width: 2.5; }
            .content-area { flex: 1; overflow-y: auto; position: relative; background: var(--bg-base); }
            .view-page { padding: 20px; display: none; animation: fadeIn 0.2s ease; }
            .view-page.active { display: block; }
            @keyframes fadeIn { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: translateY(0); } }
            .form-group { margin-bottom: 20px; }
            .form-label { display: block; font-size: 12px; color: var(--text-sec); margin-bottom: 8px; font-weight: 600; }
            input, textarea, select { width: 100%; padding: 10px 12px; border: 1px solid var(--border-medium); border-radius: var(--radius-md); font-size: 14px; font-family: inherit; background: var(--bg-input); color: var(--text-main); box-sizing: border-box; transition: all var(--transition-fast); }
            input:focus, textarea:focus { outline: none; border-color: var(--brand-gold); box-shadow: 0 0 0 2px rgba(227, 160, 67, 0.15); }
            input::placeholder, textarea::placeholder { color: var(--text-muted); }
            textarea { resize: vertical; min-height: 100px; line-height: 1.6; }
            .btn { width: 100%; padding: 10px 16px; border: none; border-radius: var(--radius-md); background: var(--primary); color: var(--text-inverse); font-weight: 600; font-size: 14px; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px; transition: all var(--transition-normal); box-shadow: var(--shadow-sm); }
            .btn svg { width: 16px; height: 16px; }
            .btn:hover { background: var(--primary-hover); transform: translateY(-1px); box-shadow: var(--shadow-md); }
            .btn:active { transform: translateY(0); }
            .btn:disabled { opacity: 0.6; cursor: not-allowed; transform: none; box-shadow: none; }
            :host(.dark-theme) .btn { color: #111; }
            .btn-xs { padding: 4px 10px; font-size: 12px; background: var(--bg-card); color: var(--text-sec); border-radius: var(--radius-sm); border: 1px solid var(--border-medium); cursor: pointer; white-space: nowrap; transition: all var(--transition-fast); }
            .btn-xs:hover { color: var(--brand-gold); border-color: var(--brand-gold); }
            .btn-xs:disabled, .btn-xs.loading { opacity: 0.62; cursor: wait; transform: none; }
            .result-box { margin-top: 16px; padding: 16px; background: var(--bg-card); border: 1px solid var(--border-light); border-radius: var(--radius-lg); font-size: 14px; line-height: 1.7; color: var(--text-main); min-height: 150px; max-height: calc(100vh - 350px); overflow-y: auto; overflow-x: hidden; word-break: break-word; overflow-wrap: break-word; white-space: normal; width: 100%; box-sizing: border-box; position: relative; }
            .result-box.empty { display: flex; align-items: center; justify-content: center; background: var(--bg-base); }
            .summary-coverage { margin-top: 16px; padding: 12px 14px; border: 1px solid var(--border-light); border-radius: var(--radius-md); background: var(--bg-hover); color: var(--text-sec); font-size: 12px; line-height: 1.6; }
            .summary-coverage summary { cursor: pointer; color: var(--text-main); font-weight: 600; }
            .summary-coverage dl { display: grid; grid-template-columns: max-content 1fr; gap: 6px 10px; margin: 10px 0 0; }
            .summary-coverage dt { color: var(--text-sec); font-weight: 600; }
            .summary-coverage dd { margin: 0; color: var(--text-main); overflow-wrap: anywhere; }
            .summary-coverage .coverage-warning { color: var(--danger); }
            .result-actions { position: absolute; top: 10px; right: 10px; opacity: 0; transition: opacity var(--transition-fast); }
            .result-box:hover .result-actions { opacity: 1; }
            .result-action-btn { padding: 4px 10px; font-size: 12px; background: var(--bg-card); color: var(--text-sec); border: 1px solid var(--border-light); border-radius: var(--radius-sm); cursor: pointer; display: flex; align-items: center; gap: 4px; box-shadow: var(--shadow-sm); }
            .result-action-btn:hover { border-color: var(--brand-gold); color: var(--brand-gold); }
            .result-action-btn.copied { border-color: var(--success); color: var(--success); }
            .result-action-btn svg { width: 12px; height: 12px; }
            .result-box h1, .result-box h2, .result-box h3 { margin: 16px 0 8px; font-weight: 600; color: var(--text-main); }
            .result-box h1 { font-size: 1.4em; }
            .result-box h2 { font-size: 1.2em; border-bottom: 1px solid var(--border-light); padding-bottom: 6px; }
            .result-box h3 { font-size: 1.1em; color: var(--text-sec); }
            .result-box p { margin-bottom: 10px; }
            .result-box ul, .result-box ol { padding-left: 20px; margin: 10px 0; }
            .result-box li { margin-bottom: 6px; }
            .result-box li::marker { color: var(--brand-gold); }
            .result-box code, .bubble-ai code, .thinking-content code, .result-box pre code, .bubble-ai pre code, .thinking-content pre code { font-family: 'JetBrains Mono', 'Fira Code', ui-monospace, SFMono-Regular, Menlo, Consolas, 'Liberation Mono', monospace !important; font-size: 13px !important; line-height: 1.5 !important; font-variant-ligatures: none; letter-spacing: 0; }
            .result-box code, .bubble-ai code, .thinking-content code:not(pre code) { background: var(--bg-hover); padding: 2px 6px; border-radius: 4px; color: var(--text-main); border: 1px solid var(--border-medium); word-break: break-all; overflow-wrap: break-word; max-width: 100%; display: inline-block; margin: 0 2px; }
            :host(.dark-theme) .result-box code, :host(.dark-theme) .bubble-ai code, :host(.dark-theme) .thinking-content code:not(pre code) { background: rgba(255,255,255,0.1); color: #e0e0e0; border-color: rgba(255,255,255,0.2); }
            .result-box pre, .bubble-ai pre, .thinking-content-inner pre { background: var(--bg-card); padding: 16px !important; margin: 12px 0 !important; border-radius: var(--radius-md); border: 1px solid var(--border-medium); overflow-x: auto; overflow-y: auto; color: var(--text-main); white-space: pre-wrap !important; word-break: break-all; word-wrap: break-word; tab-size: 4; max-width: 100%; box-sizing: border-box; font-size: 13px !important; line-height: 1.5 !important; }
            :host(.dark-theme) .result-box pre, :host(.dark-theme) .bubble-ai pre, :host(.dark-theme) .thinking-content-inner pre { background: #1e1e1e; color: #d4d4d4; border-color: #404040; }
            .result-box pre::-webkit-scrollbar, .bubble-ai pre::-webkit-scrollbar, .thinking-content-inner pre::-webkit-scrollbar { width: 8px; height: 8px; }
            .result-box pre::-webkit-scrollbar-track, .bubble-ai pre::-webkit-scrollbar-track, .thinking-content-inner pre::-webkit-scrollbar-track { background: rgba(0,0,0,0.1); border-radius: 4px; }
            .result-box pre::-webkit-scrollbar-thumb, .bubble-ai pre::-webkit-scrollbar-thumb, .thinking-content-inner pre::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.3); border-radius: 4px; }
            :host(.dark-theme) .result-box pre::-webkit-scrollbar-thumb, :host(.dark-theme) .bubble-ai pre::-webkit-scrollbar-thumb, :host(.dark-theme) .thinking-content-inner pre::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.3); }
            .result-box pre code { background: none; color: inherit; padding: 0; border: none; }
            .result-box blockquote { border-left: 3px solid var(--brand-gold); margin: 12px 0; padding: 6px 16px; color: var(--text-sec); background: var(--bg-hover); font-style: italic; }
            .result-box a { color: var(--brand-gold); text-decoration: none; border-bottom: 1px solid transparent; }
            .result-box a:hover { border-bottom-color: var(--brand-gold); }
            .result-box strong { color: var(--text-main); font-weight: 600; }
            .chat-container { display: flex; flex-direction: column; height: 100%; position: relative; }
            .chat-toolbar { display: flex; justify-content: space-between; align-items: center; padding-bottom: 12px; border-bottom: 1px solid var(--border-light); margin-bottom: 12px; }
            .chat-toolbar-title { font-size: 13px; color: var(--text-sec); font-weight: 600; display: flex; align-items: center; gap: 8px; }
            .msg-count { background: var(--bg-active); color: var(--text-sec); font-size: 11px; padding: 2px 8px; border-radius: 10px; font-weight: normal; }
            .btn-clear { padding: 6px 12px; font-size: 12px; background: transparent; color: var(--danger); border-radius: var(--radius-sm); border: none; cursor: pointer; display: flex; align-items: center; gap: 5px; }
            .btn-clear:hover { background: var(--danger-light); }
            .btn-clear svg { width: 14px; height: 14px; }
            .chat-messages-wrapper { flex: 1; position: relative; overflow: hidden; }
            .chat-messages { height: 100%; overflow-y: auto; padding: 10px 0; }
            .chat-list { display: flex; flex-direction: column; gap: 16px; }
            .bubble { padding: 12px 16px; border-radius: var(--radius-lg); font-size: 14px; line-height: 1.6; max-width: 90%; word-break: break-word; overflow-wrap: break-word; white-space: normal; overflow-x: hidden; box-shadow: var(--shadow-sm); position: relative; box-sizing: border-box; }
            .bubble-user { align-self: flex-end; background: var(--primary); color: var(--text-inverse); border-bottom-right-radius: 2px; }
            :host(.dark-theme) .bubble-user { color: #111; }
            .bubble-ai { align-self: flex-start; background: var(--bg-card); border: 1px solid var(--border-light); color: var(--text-main); border-bottom-left-radius: 2px; }
            .bubble-ai h1, .bubble-ai h2 { font-size: 1.1em; margin: 8px 0; }
            .bubble.is-editing { outline: 2px solid var(--brand-gold); outline-offset: 3px; }
            .bubble-error { border-color: var(--danger) !important; background: var(--danger-light) !important; color: var(--text-main) !important; }
            .bubble-error-title { font-weight: 600; color: var(--danger); margin-bottom: 6px; }
            .bubble-error-detail { color: var(--text-sec); font-size: 12px; line-height: 1.6; margin-bottom: 10px; }
            .bubble-error-actions { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 10px; }
            .bubble-inline-action { padding: 6px 10px; border: 1px solid var(--border-light); border-radius: var(--radius-sm); background: var(--bg-card); color: var(--text-main); font: inherit; font-size: 12px; cursor: pointer; }
            .bubble-inline-action:hover { border-color: var(--brand-gold); color: var(--brand-gold); background: var(--bg-hover); }
            .message-context-menu { position: absolute; z-index: 10003; min-width: 150px; max-width: 240px; padding: 6px; display: none; background: var(--bg-card); border: 1px solid var(--border-light); border-radius: var(--radius-md); box-shadow: var(--shadow-xl); }
            .message-context-menu.show { display: block; }
            .message-menu-item { width: 100%; min-height: 34px; padding: 8px 10px; border: none; border-radius: var(--radius-sm); background: transparent; color: var(--text-main); font: inherit; font-size: 13px; font-weight: 500; text-align: left; cursor: pointer; }
            .message-menu-item:hover:not(:disabled) { background: var(--bg-hover); color: var(--brand-gold); }
            .message-menu-item.danger { color: var(--danger); }
            .message-menu-item.danger:hover:not(:disabled) { background: var(--danger-light); color: var(--danger); }
            .message-menu-item:disabled { opacity: 0.45; cursor: not-allowed; }
            .summary-selection-menu { position: absolute; z-index: 10004; display: none; flex-wrap: wrap; align-items: center; gap: 6px; max-width: calc(100% - 16px); padding: 7px; background: var(--bg-card); border: 1px solid var(--border-light); border-radius: var(--radius-md); box-shadow: var(--shadow-xl); }
            .summary-selection-menu.show { display: flex; }
            .summary-selection-item { min-height: 32px; padding: 7px 11px; border: none; border-radius: var(--radius-sm); background: var(--bg-hover); color: var(--text-main); font: inherit; font-size: 12px; font-weight: 600; cursor: pointer; white-space: nowrap; box-shadow: inset 0 0 0 1px var(--border-light); transition: all var(--transition-fast); }
            .summary-selection-item:hover { background: var(--primary); color: var(--text-inverse); box-shadow: inset 0 0 0 1px transparent; }
            .thinking-block { margin: 4px 0 10px; border-radius: var(--radius-md); background: var(--bg-setting); border: 1px solid var(--border-light); overflow: hidden; }
            .thinking-header { display: flex; align-items: center; justify-content: space-between; padding: 8px 12px; cursor: pointer; user-select: none; transition: background var(--transition-fast); }
            .thinking-header:hover { background: rgba(0,0,0,0.03); }
            .thinking-header-left { display: flex; align-items: center; gap: 8px; }
            .thinking-icon { width: 16px; height: 16px; display: flex; align-items: center; justify-content: center; color: var(--text-muted); }
            .thinking-icon svg { width: 14px; height: 14px; }
            .thinking-title { font-size: 12px; font-weight: 600; color: var(--text-sec); }
            .thinking-status { font-size: 10px; color: var(--text-muted); background: rgba(0,0,0,0.05); padding: 1px 6px; border-radius: 4px; }
            .thinking-toggle { width: 18px; height: 18px; display: flex; align-items: center; justify-content: center; color: var(--text-muted); }
            .thinking-toggle svg { width: 12px; height: 12px; transition: transform 0.2s; }
            .thinking-block.expanded .thinking-toggle svg { transform: rotate(180deg); }
            .thinking-preview { padding: 0 12px 8px; font-size: 11px; color: var(--text-muted); line-height: 1.4; max-height: 3.5em; overflow: hidden; word-break: break-word; overflow-wrap: break-word; white-space: normal; }
            .thinking-content { max-height: 0; overflow: hidden; transition: max-height 0.3s cubic-bezier(0.4, 0, 0.2, 1); }
            .thinking-block.expanded .thinking-content { max-height: 5000px; }
            .thinking-content-inner { padding: 10px 12px; font-size: 12px; color: var(--text-sec); border-top: 1px dashed var(--border-medium); background: var(--bg-card); word-break: break-word; overflow-wrap: break-word; white-space: normal; overflow-x: hidden; width: 100%; box-sizing: border-box; }
            .scroll-buttons { position: absolute; right: 10px; z-index: 10; }
            .scroll-buttons.top-area { top: 10px; }
            .scroll-buttons.bottom-area { bottom: 10px; }
            .scroll-btn { width: 32px; height: 32px; border-radius: 50%; background: var(--bg-card); border: 1px solid var(--border-light); box-shadow: var(--shadow-md); cursor: pointer; display: flex; align-items: center; justify-content: center; color: var(--text-sec); opacity: 0; transform: scale(0.8); pointer-events: none; transition: all var(--transition-fast); }
            .scroll-btn.visible { opacity: 1; transform: scale(1); pointer-events: auto; }
            .scroll-btn:hover { color: var(--brand-gold); border-color: var(--brand-gold); }
            .scroll-btn svg { width: 16px; height: 16px; }
            .chat-input-area { border-top: 1px solid var(--border-light); padding: 16px 0 0; flex-shrink: 0; }
            .chat-input-row { display: flex; gap: 10px; align-items: flex-end; }
            .chat-input { flex: 1; min-height: 44px; max-height: 120px; border-radius: 22px; padding: 10px 18px; resize: none; border: 1px solid var(--border-medium); font-size: 14px; line-height: 1.5; }
            .chat-input:focus { border-color: var(--brand-gold); }
            .send-btn { width: 44px; height: 44px; border-radius: 50%; padding: 0; flex-shrink: 0; display: flex; align-items: center; justify-content: center; background: var(--primary); border: none; cursor: pointer; transition: all var(--transition-fast); }
            .send-btn svg { width: 20px; height: 20px; fill: none; stroke: var(--text-inverse); }
            :host(.dark-theme) .send-btn svg { stroke: #111; }
            .send-btn:hover { transform: scale(1.05); }
            .send-btn:disabled { opacity: 0.5; cursor: not-allowed; }
            .settings-page { background: var(--bg-setting); min-height: 100%; padding: 20px; }
            .settings-group { background: var(--bg-card); border-radius: var(--radius-lg); overflow: hidden; margin-bottom: 20px; box-shadow: var(--shadow-sm); border: 1px solid var(--border-light); }
            .settings-group-title { font-size: 11px; color: var(--text-muted); text-transform: uppercase; padding: 16px 20px 8px; font-weight: 700; letter-spacing: 0.05em; }
            .setting-item { padding: 14px 20px; border-bottom: 1px solid var(--border-light); }
            .setting-item:last-child { border-bottom: none; }
            .setting-label { font-size: 14px; font-weight: 500; color: var(--text-main); margin-bottom: 4px; display: block; }
            .setting-desc { font-size: 12px; color: var(--text-sec); margin-bottom: 10px; }
            .setting-item-row { display: flex; justify-content: space-between; align-items: center; }
            .setting-item-row .setting-info { flex: 1; margin-right: 16px; }
            .api-profile-row { display: flex; flex-direction: column; gap: 8px; align-items: stretch; }
            .api-profile-list { display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 8px; }
            .api-profile-card { min-height: 52px; padding: 9px 10px; border: 1px solid var(--border-medium); border-radius: var(--radius-sm); background: var(--bg-card); color: var(--text-main); text-align: left; font: inherit; cursor: pointer; transition: all var(--transition-fast); overflow: hidden; }
            .api-profile-card:hover, .api-profile-card:focus { border-color: var(--brand-gold); background: var(--bg-hover); outline: none; }
            .api-profile-card[aria-selected="true"] { border-color: var(--brand-gold); box-shadow: 0 0 0 2px rgba(227, 160, 67, 0.14); background: var(--bg-hover); }
            .api-profile-card-title { display: block; font-size: 13px; font-weight: 600; line-height: 1.35; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
            .api-profile-card-meta { display: block; margin-top: 3px; font-size: 11px; color: var(--text-sec); line-height: 1.35; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
            .api-profile-actions { display: flex; gap: 6px; flex: 0 0 auto; }
            .api-profile-actions .btn-xs { min-width: 34px; padding: 0 8px; height: 36px; }
            .api-profile-summary { margin-top: 8px; margin-bottom: 0; overflow-wrap: anywhere; }
            .model-input-row { display: flex; gap: 8px; align-items: center; }
            .model-input-row input { flex: 1; min-width: 0; }
            .model-fetch-btn { flex: 0 0 auto; padding: 0 10px; height: 40px; }
            .model-picker-overlay { position: absolute; inset: 0; z-index: 10002; display: none; align-items: center; justify-content: center; padding: 20px; background: rgba(17, 24, 39, 0.38); backdrop-filter: blur(5px); -webkit-backdrop-filter: blur(5px); }
            .model-picker-overlay.show { display: flex; }
            .model-picker-dialog { width: 100%; max-width: 360px; max-height: 72vh; display: flex; flex-direction: column; background: var(--bg-card); border: 1px solid var(--border-light); border-radius: var(--radius-lg); box-shadow: var(--shadow-xl); overflow: hidden; }
            .model-picker-header { display: flex; align-items: center; justify-content: space-between; padding: 14px 16px; border-bottom: 1px solid var(--border-light); }
            .model-picker-title { font-size: 14px; font-weight: 600; color: var(--text-main); }
            .model-picker-status { padding: 10px 16px; color: var(--text-sec); font-size: 12px; line-height: 1.5; border-bottom: 1px solid var(--border-light); }
            .model-picker-status.error { color: var(--danger); }
            .model-picker-list { flex: 1; min-height: 120px; overflow-y: auto; padding: 8px; }
            .model-option { width: 100%; padding: 9px 10px; border: none; border-radius: var(--radius-sm); background: transparent; color: var(--text-main); text-align: left; font: inherit; font-size: 13px; cursor: pointer; overflow-wrap: anywhere; }
            .model-option:hover { background: var(--bg-hover); color: var(--brand-gold); }
            .model-picker-actions { display: flex; gap: 8px; justify-content: flex-end; padding: 12px 16px 14px; border-top: 1px solid var(--border-light); }
            .toggle-switch { position: relative; width: 44px; height: 24px; flex-shrink: 0; }
            .toggle-switch input { opacity: 0; width: 0; height: 0; position: absolute; }
            .toggle-slider { position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0; background: var(--border-medium); border-radius: 24px; transition: .3s; }
            .toggle-slider::before { content: ''; position: absolute; height: 18px; width: 18px; left: 3px; bottom: 3px; background: white; border-radius: 50%; transition: .3s; box-shadow: 0 1px 2px rgba(0,0,0,0.2); }
            .toggle-switch input:checked + .toggle-slider { background: var(--brand-gold); }
            .toggle-switch input:checked + .toggle-slider::before { transform: translateX(20px); }
            .spinner { width: 16px; height: 16px; border: 2px solid rgba(255,255,255,0.3); border-top-color: #fff; border-radius: 50%; animation: spin 0.8s linear infinite; display: none; }
            .btn.loading .spinner { display: inline-block; }
            .btn.loading .btn-text { display: none; }
            @keyframes spin { to { transform: rotate(360deg); } }
            .thinking { display: flex; gap: 4px; padding: 4px 0; }
            .thinking-dot { width: 6px; height: 6px; background: var(--text-muted); border-radius: 50%; animation: thinking 1.4s ease-in-out infinite; }
            .thinking-dot:nth-child(2) { animation-delay: 0.2s; }
            .thinking-dot:nth-child(3) { animation-delay: 0.4s; }
            @keyframes thinking { 0%, 80%, 100% { transform: scale(0.6); opacity: 0.4; } 40% { transform: scale(1); opacity: 1; } }
            .tip-text { text-align: center; color: var(--text-muted); font-size: 13px; padding: 40px 20px; line-height: 1.8; }
            .tip-text strong { color: var(--text-main); }
            .tip-icon { display: block; margin-bottom: 12px; color: var(--border-medium); }
            .tip-icon svg { width: 40px; height: 40px; }
            .hidden { display: none !important; }
            ::-webkit-scrollbar { width: 6px; height: 6px; }
            ::-webkit-scrollbar-track { background: transparent; }
            ::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.1); border-radius: 3px; }
            ::-webkit-scrollbar-thumb:hover { background: rgba(0,0,0,0.2); }
            :host(.dark-theme) ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); }
            input[type="number"] { -moz-appearance: textfield; }
            input[type="number"]::-webkit-outer-spin-button, input[type="number"]::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }
            .range-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }
            .range-buttons { display: flex; gap: 6px; }
            .range-inputs { display: flex; gap: 10px; align-items: center; }
            .range-inputs input { flex: 1; text-align: center; }
            .range-separator { color: var(--text-muted); }
            .shortcut-hint { display: flex; align-items: center; justify-content: center; gap: 6px; font-size: 11px; color: var(--text-muted); margin-top: 16px; }
            .kbd { display: inline-flex; padding: 2px 5px; background: var(--bg-card); border: 1px solid var(--border-medium); border-radius: 4px; font-family: ui-monospace, monospace; font-size: 10px; }
            .toast { position: absolute; bottom: 20px; left: 50%; transform: translateX(-50%) translateY(10px); background: #333; color: white; padding: 8px 16px; border-radius: 4px; font-size: 13px; font-weight: 500; box-shadow: var(--shadow-lg); z-index: 10000; opacity: 0; pointer-events: none; transition: all 0.2s; display: flex; align-items: center; gap: 8px; }
            .toast.show { transform: translateX(-50%) translateY(0); opacity: 1; }
            .toast.error { background: var(--danger); }
            `;
        },

        render() {
            const html = `
                <div id="toggle-btn" title="拖动改变位置，点击展开/关闭 (Ctrl+Shift+S)">${this.ICONS.arrowLeft}</div>
                <div class="sidebar-panel" id="sidebar">
                    <div class="resize-handle" id="resizer"></div>
                    <div class="toast" id="toast"></div>
                    <div class="model-picker-overlay" id="model-picker-modal" aria-hidden="true">
                        <div class="model-picker-dialog" role="dialog" aria-modal="true" aria-labelledby="model-picker-title">
                            <div class="model-picker-header">
                                <div class="model-picker-title" id="model-picker-title">选择模型</div>
                                <button class="icon-btn" id="btn-close-model-picker" data-tooltip="关闭">${this.ICONS.close}</button>
                            </div>
                            <div class="model-picker-status" id="model-picker-status">填写 API 地址和 API Key 后获取模型列表。</div>
                            <div class="model-picker-list" id="model-picker-list"></div>
                            <div class="model-picker-actions">
                                <button class="btn-xs" id="btn-refresh-models">重新获取</button>
                                <button class="btn-xs" id="btn-cancel-model-picker">取消</button>
                            </div>
                        </div>
                    </div>
                    <div class="header">
                        <div class="header-title">
                            <div class="header-title-icon">${this.ICONS.brain}</div>
                            智能总结
                        </div>
                        <div class="header-actions">
                            <button class="icon-btn" id="btn-theme" data-tooltip="切换主题">${this.ICONS.moon}</button>
                            <button class="icon-btn" id="btn-close" data-tooltip="关闭">${this.ICONS.close}</button>
                        </div>
                    </div>
                    <div class="tab-bar">
                        <div class="tab-item active" data-tab="summary">${this.ICONS.summary}<span>总结</span></div>
                        <div class="tab-item" data-tab="chat">${this.ICONS.chat}<span>对话</span></div>
                        <div class="tab-item" data-tab="export">📦<span>导出</span></div>
                        <div class="tab-item" data-tab="settings">${this.ICONS.settings}<span>设置</span></div>
                    </div>
                    <div class="content-area">
                        <div id="page-summary" class="view-page active">
                             <div class="form-group">
                                 <div class="range-header">
                                     <label class="form-label" style="margin:0;">楼层范围</label>
                                     <div class="range-buttons">
                                         <button class="btn-xs" id="range-all">全部</button>
                                         <button class="btn-xs" id="range-recent">最近<span id="recent-count">50</span></button>
                                     </div>
                                 </div>
                                 <div class="range-inputs">
                                     <input type="number" id="inp-start" placeholder="起始" min="1">
                                     <span class="range-separator">→</span>
                                     <input type="number" id="inp-end" placeholder="结束" min="1">
                                 </div>
                             </div>
                             <button class="btn" id="btn-summary">
                                 <div class="spinner"></div>
                                 <span class="btn-text" style="display:flex;align-items:center;gap:6px;">${this.ICONS.sparkles} 开始智能总结</span>
                             </button>
                             <button class="btn-xs" id="btn-refresh-summary-cache" style="margin-top:8px;width:100%;">重新获取楼层</button>
                             <div id="summary-result" class="result-box empty">
                                 <div class="tip-text">
                                     <span class="tip-icon">${this.ICONS.robot}</span>
                                     点击「开始智能总结」后，<br>AI 将分析帖子内容并生成摘要<br><br>
                                     💡 总结完成后可切换到<strong>「对话」</strong>继续追问
                                 </div>
                             </div>
                             <div class="shortcut-hint">
                                 <span class="kbd">Ctrl</span>+<span class="kbd">Shift</span>+<span class="kbd">S</span> 快速打开
                             </div>
                        </div>
                        <div id="page-chat" class="view-page">
                            <div class="chat-container">
                                 <div class="chat-toolbar">
                                     <div class="chat-toolbar-title">
                                         对话记录
                                         <span class="msg-count" id="msg-count">0</span>
                                     </div>
                                     <button class="btn-clear" id="btn-clear-chat" title="清空对话">
                                         ${this.ICONS.trash} 清空
                                     </button>
                                 </div>
                                 <div class="chat-messages-wrapper">
                                     <div class="scroll-buttons top-area"><button class="scroll-btn" id="btn-scroll-top" title="滚动到顶部">${this.ICONS.arrowUp}</button></div>
                                     <div class="chat-messages" id="chat-messages">
                                         <div id="chat-list" class="chat-list"></div>
                                         <div id="chat-empty" class="tip-text">
                                             <span class="tip-icon">${this.ICONS.chat}</span>
                                             请先在<strong>「总结」</strong>页面生成内容摘要，<br>然后即可基于上下文进行对话
                                         </div>
                                     </div>
                                     <div class="scroll-buttons bottom-area"><button class="scroll-btn" id="btn-scroll-bottom" title="滚动到底部">${this.ICONS.arrowDown}</button></div>
                                 </div>
                                 <div class="chat-input-area">
                                     <div class="chat-input-row">
                                         <textarea id="chat-input" class="chat-input" placeholder="输入你的问题... (Enter 发送)" rows="1"></textarea>
                                         <button class="send-btn" id="btn-send" title="发送消息">${this.ICONS.send}</button>
                                     </div>
                                 </div>
                            </div>
                        </div>
                        <!-- 导出页面 -->
                        <div id="page-export" class="view-page">
                            <div class="form-group">
                                <label class="form-label">导出类型</label>
                                <select id="export-type">
                                    <option value="html">HTML 离线导出</option>
                                    <option value="ai-text">AI 文本导出</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <div class="range-header">
                                    <label class="form-label" style="margin:0;">导出范围</label>
                                    <div class="range-buttons">
                                        <button class="btn-xs" id="export-range-all">全部</button>
                                        <button class="btn-xs" id="export-range-recent">最近<span id="export-recent-count">50</span></button>
                                    </div>
                                </div>
                                <div class="range-inputs">
                                    <input type="number" id="export-start" placeholder="起始" min="1">
                                    <span class="range-separator">→</span>
                                    <input type="number" id="export-end" placeholder="结束" min="1">
                                </div>
                            </div>
                            <div id="html-export-options" class="form-group">
                                <label class="form-label">HTML 导出选项</label>
                                <div class="setting-item-row" style="margin-bottom:12px;">
                                    <div class="setting-info">
                                        <label class="setting-label">离线图片</label>
                                        <div class="setting-desc">将图片转为 base64 嵌入</div>
                                    </div>
                                    <label class="toggle-switch">
                                        <input type="checkbox" id="export-offline-images" checked>
                                        <span class="toggle-slider"></span>
                                    </label>
                                </div>
                                <label class="setting-label" style="margin-bottom:8px;">主题选择</label>
                                <select id="export-theme">
                                    <option value="light">浅色主题</option>
                                    <option value="dark">深色主题</option>
                                </select>
                            </div>
                            <div id="ai-text-options" class="form-group" style="display:none;">
                                <label class="form-label">AI 文本选项</label>
                                <div class="setting-item-row" style="margin-bottom:12px;">
                                    <div class="setting-info">
                                        <label class="setting-label">包含头部信息</label>
                                        <div class="setting-desc">标题、作者、时间等</div>
                                    </div>
                                    <label class="toggle-switch">
                                        <input type="checkbox" id="export-ai-header" checked>
                                        <span class="toggle-slider"></span>
                                    </label>
                                </div>
                                <div class="setting-item-row" style="margin-bottom:12px;">
                                    <div class="setting-info">
                                        <label class="setting-label">包含图片链接</label>
                                        <div class="setting-desc">保留图片 URL</div>
                                    </div>
                                    <label class="toggle-switch">
                                        <input type="checkbox" id="export-ai-images" checked>
                                        <span class="toggle-slider"></span>
                                    </label>
                                </div>
                                <div class="setting-item-row">
                                    <div class="setting-info">
                                        <label class="setting-label">包含引用块</label>
                                        <div class="setting-desc">保留引用内容</div>
                                    </div>
                                    <label class="toggle-switch">
                                        <input type="checkbox" id="export-ai-quotes" checked>
                                        <span class="toggle-slider"></span>
                                    </label>
                                </div>
                            </div>
                            <button class="btn" id="btn-export">
                                <div class="spinner"></div>
                                <span class="btn-text">📦 开始导出</span>
                            </button>
                            <div id="export-status" class="result-box empty" style="margin-top:16px;min-height:100px;">
                                <div class="tip-text">
                                    <span class="tip-icon">📦</span>
                                    选择导出类型和范围后，<br>点击「开始导出」即可下载文件
                                </div>
                            </div>
                        </div>
                        <div id="page-settings" class="view-page settings-page">
                             <div class="settings-group">
                                 <div class="settings-group-title">API 配置</div>
                                 <div class="setting-item"><label class="setting-label">当前配置</label><div class="api-profile-row"><div id="cfg-profile-list" class="api-profile-list" role="listbox" aria-label="选择 API 配置"></div><div class="api-profile-actions"><button type="button" class="btn-xs" id="btn-api-profile-add" title="新增配置">新增</button><button type="button" class="btn-xs" id="btn-api-profile-copy" title="复制当前配置">复制</button><button type="button" class="btn-xs" id="btn-api-profile-delete" title="删除当前配置">删除</button></div></div><div class="setting-desc api-profile-summary" id="api-profile-summary">点击配置即可切换，编辑后会自动保存。</div></div>
                                 <div class="setting-item"><label class="setting-label">配置名称</label><input type="text" id="cfg-profile-name" placeholder="例如：DeepSeek / OpenAI / 本地代理"></div>
                                 <div class="setting-item"><label class="setting-label">API 地址</label><input type="text" id="cfg-url" placeholder="https://api.openai.com/v1/chat/completions"></div>
                                 <div class="setting-item"><label class="setting-label">API Key</label><input type="password" id="cfg-key" placeholder="sk-..."></div>
                                 <div class="setting-item"><label class="setting-label">模型名称</label><div class="model-input-row"><input type="text" id="cfg-model" placeholder="deepseek-chat"><button type="button" class="btn-xs model-fetch-btn" id="btn-fetch-models">获取模型列表</button></div><div class="setting-desc">可从接口返回列表中选择，也可以手动输入模型名称。</div></div>
                             </div>
                             <div class="settings-group">
                                 <div class="settings-group-title">提示词配置</div>
                                 <div class="setting-item"><label class="setting-label">总结提示词</label><div class="setting-desc">用于生成帖子摘要时的系统指令</div><textarea id="cfg-prompt-sum" rows="4"></textarea></div>
                                 <div class="setting-item"><label class="setting-label">对话提示词</label><div class="setting-desc">用于后续追问时的系统指令</div><textarea id="cfg-prompt-chat" rows="4"></textarea></div>
                             </div>
                             <div class="settings-group">
                                 <div class="settings-group-title">高级设置</div>
                                 <div class="setting-item setting-item-row">
                                     <div class="setting-info"><label class="setting-label">快捷楼层数</label><div class="setting-desc">"最近N楼"按钮的楼层数量</div></div>
                                     <input type="number" id="cfg-recent-floors" min="10" max="500" style="width:80px; text-align:center; padding:6px 10px;">
                                 </div>
                                 <div class="setting-item setting-item-row">
                                     <div class="setting-info"><label class="setting-label">流式输出</label><div class="setting-desc">开启后内容会逐字显示，关闭则等待完成后一次性显示</div></div>
                                     <label class="toggle-switch"><input type="checkbox" id="cfg-stream" checked><span class="toggle-slider"></span></label>
                                 </div>
                                 <div class="setting-item setting-item-row">
                                     <div class="setting-info"><label class="setting-label">自动滚动</label><div class="setting-desc">生成内容时自动滚动到最新位置</div></div>
                                     <label class="toggle-switch"><input type="checkbox" id="cfg-autoscroll" checked><span class="toggle-slider"></span></label>
                                 </div>
                             </div>
                             <button class="btn" id="btn-save">${this.ICONS.check} 保存设置</button>
                        </div>
                    </div>
                    ${this.getMessageContextMenuHtml()}
                    ${this.getSummarySelectionMenuHtml()}
                </div>`;
            this.uiManager.shadow.innerHTML += html;
        },

        getMessageContextMenuHtml: UIRegistry.get('style1').getMessageContextMenuHtml,
        getSummarySelectionMenuHtml: UIRegistry.get('style1').getSummarySelectionMenuHtml,
        bindEvents: UIRegistry.get('style1').bindEvents,
        bindKeyboardShortcuts: UIRegistry.get('style1').bindKeyboardShortcuts,
        getActiveApiProfileIndex: UIRegistry.get('style1').getActiveApiProfileIndex,
        syncCurrentApiFormToActiveProfile: UIRegistry.get('style1').syncCurrentApiFormToActiveProfile,
        renderApiProfileList: UIRegistry.get('style1').renderApiProfileList,
        renderApiProfileSelect: UIRegistry.get('style1').renderApiProfileSelect,
        fillApiFormFromProfile: UIRegistry.get('style1').fillApiFormFromProfile,
        refreshApiProfileSummary: UIRegistry.get('style1').refreshApiProfileSummary,
        updateApiProfileActionState: UIRegistry.get('style1').updateApiProfileActionState,
        loadApiProfileStateToUi: UIRegistry.get('style1').loadApiProfileStateToUi,
        persistApiProfileState: UIRegistry.get('style1').persistApiProfileState,
        queueApiProfilePersist: UIRegistry.get('style1').queueApiProfilePersist,
        flushApiProfilePersist: UIRegistry.get('style1').flushApiProfilePersist,
        handleApiProfileSelect: UIRegistry.get('style1').handleApiProfileSelect,
        handleApiProfileNameInput: UIRegistry.get('style1').handleApiProfileNameInput,
        handleApiProfileFieldInput: UIRegistry.get('style1').handleApiProfileFieldInput,
        addApiProfile: UIRegistry.get('style1').addApiProfile,
        copyApiProfile: UIRegistry.get('style1').copyApiProfile,
        deleteApiProfile: UIRegistry.get('style1').deleteApiProfile,
        restoreState() {
            const Q = this.uiManager.Q.bind(this.uiManager);
            this.uiManager.host.style.setProperty('--sidebar-width', `${this.sidebarWidth}px`);
            const btn = Q('#toggle-btn');
            btn.style.top = this.btnPos.top;
            this.applySideState();
            if (this.isDarkTheme) {
                this.uiManager.host.classList.add('dark-theme');
                Q('#btn-theme').innerHTML = this.ICONS.sun;
            } else {
                Q('#btn-theme').innerHTML = this.ICONS.moon;
            }

            this.loadApiProfileStateToUi();
            Q('#cfg-prompt-sum').value = GM_getValue('prompt_sum', '请总结以下论坛帖子内容。使用 Markdown 格式，条理清晰，重点突出主要观点、争议点和结论。适当使用标题、列表和引用来组织内容。');
            Q('#cfg-prompt-chat').value = GM_getValue('prompt_chat', '你是一个帖子阅读助手。基于上文中的帖子内容，回答用户的问题。回答要准确、简洁，必要时引用原文。');
            const recentFloors = GM_getValue('recentFloors', 50);
            Q('#cfg-recent-floors').value = recentFloors;
            Q('#recent-count').textContent = recentFloors;
            Q('#export-recent-count').textContent = recentFloors;
            Q('#cfg-stream').checked = GM_getValue('useStream', true);
            Q('#cfg-autoscroll').checked = GM_getValue('autoScroll', true);
        },
        applySideState() {
            const Q = this.uiManager.Q.bind(this.uiManager);
            const btn = Q('#toggle-btn');
            const sidebar = Q('#sidebar');
            const resizer = Q('#resizer');
            btn.style.left = ''; btn.style.right = '';

            if (this.side === 'left') {
                sidebar.className = 'sidebar-panel panel-left' + (this.isOpen ? ' open' : '');
                resizer.className = 'resize-handle handle-left';
                btn.className = 'btn-snap-left' + (this.isOpen ? ' arrow-flip' : '');
                btn.innerHTML = this.ICONS.arrowRight;
            } else {
                sidebar.className = 'sidebar-panel panel-right' + (this.isOpen ? ' open' : '');
                resizer.className = 'resize-handle handle-right';
                btn.className = 'btn-snap-right' + (this.isOpen ? ' arrow-flip' : '');
                btn.innerHTML = this.ICONS.arrowLeft;
            }
            this.updateButtonPosition();
        },
        updateButtonPosition: UIRegistry.get('style1').updateButtonPosition,
        toggleSidebar: UIRegistry.get('style1').toggleSidebar,
        squeezeBody: UIRegistry.get('style1').squeezeBody,
        switchTab: UIRegistry.get('style1').switchTab,
        toggleTheme() {
            const Q = this.uiManager.Q.bind(this.uiManager);
            this.isDarkTheme = !this.isDarkTheme;
            GM_setValue(this.getStyleStorageKey('isDarkTheme'), this.isDarkTheme);
            this.uiManager.host.classList.toggle('dark-theme', this.isDarkTheme);
            Q('#btn-theme').innerHTML = this.isDarkTheme ? this.ICONS.sun : this.ICONS.moon;
        },
        setLoading: UIRegistry.get('style1').setLoading,
        updateChatInputMode: UIRegistry.get('style1').updateChatInputMode,
        createEmptyChatSession: UIRegistry.get('style1').createEmptyChatSession,
        createMessageId: UIRegistry.get('style1').createMessageId,
        createVisibleMessage: UIRegistry.get('style1').createVisibleMessage,
        hasChatContext: UIRegistry.get('style1').hasChatContext,
        setChatContext: UIRegistry.get('style1').setChatContext,
        clearChatContext: UIRegistry.get('style1').clearChatContext,
        syncLegacyChatHistory: UIRegistry.get('style1').syncLegacyChatHistory,
        findVisibleMessage: UIRegistry.get('style1').findVisibleMessage,
        findVisibleMessageIndex: UIRegistry.get('style1').findVisibleMessageIndex,
        getBubbleElement: UIRegistry.get('style1').getBubbleElement,
        getClosestElement: UIRegistry.get('style1').getClosestElement,
        getVisibleMessagesForApi: UIRegistry.get('style1').getVisibleMessagesForApi,
        buildChatApiMessages: UIRegistry.get('style1').buildChatApiMessages,
        appendVisibleMessage: UIRegistry.get('style1').appendVisibleMessage,
        removeVisibleMessagesFrom: UIRegistry.get('style1').removeVisibleMessagesFrom,
        setVisibleMessage: UIRegistry.get('style1').setVisibleMessage,
        renderChatMessages: UIRegistry.get('style1').renderChatMessages,
        getAssistantForUser: UIRegistry.get('style1').getAssistantForUser,
        getUserForAssistant: UIRegistry.get('style1').getUserForAssistant,
        removeVisibleMessagesAfter: UIRegistry.get('style1').removeVisibleMessagesAfter,
        requestAssistantForUser: UIRegistry.get('style1').requestAssistantForUser,
        getMessageCopyText: UIRegistry.get('style1').getMessageCopyText,
        renderChatErrorContent: UIRegistry.get('style1').renderChatErrorContent,
        renderBubbleContent: UIRegistry.get('style1').renderBubbleContent,
        bindMessageContextMenu: UIRegistry.get('style1').bindMessageContextMenu,
        bindSummarySelectionMenu: UIRegistry.get('style1').bindSummarySelectionMenu,
        getCurrentSelection: UIRegistry.get('style1').getCurrentSelection,
        clearCurrentSelection: UIRegistry.get('style1').clearCurrentSelection,
        getSummarySelectionState: UIRegistry.get('style1').getSummarySelectionState,
        isSummarySelectionRangeAllowed: UIRegistry.get('style1').isSummarySelectionRangeAllowed,
        getSelectionAnchorRect: UIRegistry.get('style1').getSelectionAnchorRect,
        openSummarySelectionMenu: UIRegistry.get('style1').openSummarySelectionMenu,
        positionSummarySelectionMenu: UIRegistry.get('style1').positionSummarySelectionMenu,
        closeSummarySelectionMenu: UIRegistry.get('style1').closeSummarySelectionMenu,
        openMessageContextMenu: UIRegistry.get('style1').openMessageContextMenu,
        positionMessageContextMenu: UIRegistry.get('style1').positionMessageContextMenu,
        closeMessageContextMenu: UIRegistry.get('style1').closeMessageContextMenu,
        handleMessageMenuAction: UIRegistry.get('style1').handleMessageMenuAction,
        handleSummarySelectionAction: UIRegistry.get('style1').handleSummarySelectionAction,
        fillChatInputWithSelectionPrompt: UIRegistry.get('style1').fillChatInputWithSelectionPrompt,
        copyMessage: UIRegistry.get('style1').copyMessage,
        startEditMessage: UIRegistry.get('style1').startEditMessage,
        confirmEditMessage: UIRegistry.get('style1').confirmEditMessage,
        cancelEditMessage: UIRegistry.get('style1').cancelEditMessage,
        getRegenerateUserMessage: UIRegistry.get('style1').getRegenerateUserMessage,
        regenerateMessage: UIRegistry.get('style1').regenerateMessage,
        deleteMessage: UIRegistry.get('style1').deleteMessage,
        refreshSummaryCache: UIRegistry.get('style1').refreshSummaryCache,
        doSummary: UIRegistry.get('style1').doSummary,
        doChat: UIRegistry.get('style1').doChat,
        getRangeUpperBound: UIRegistry.get('style1').getRangeUpperBound,
        initRangeInputs: UIRegistry.get('style1').initRangeInputs,
        setRangeButtonsLoading: UIRegistry.get('style1').setRangeButtonsLoading,
        setRange: UIRegistry.get('style1').setRange,
        updateResultBox(resultBox, text, isStreaming, coverageReport = null) {
            const Q = this.uiManager.Q.bind(this.uiManager);
            if (isStreaming) this.closeSummarySelectionMenu?.();
            const currentBlock = resultBox.querySelector('[data-thinking-block]');
            const isExpanded = currentBlock?.classList.contains('expanded') || false;
            const contentHTML = this.renderWithThinking(text, isStreaming, isExpanded);
            const coverageHTML = !isStreaming ? Core.renderSummaryCoverageReport(coverageReport) : '';
            resultBox.innerHTML = `
                <div class="result-actions">
                    <button class="result-action-btn" id="btn-copy-summary">${this.ICONS.copy} 复制</button>
                </div>
            ` + contentHTML + coverageHTML;

            const copyBtn = Q('#btn-copy-summary');
            if (copyBtn) {
                copyBtn.onclick = () => {
                    this.copyToClipboard(Core.parseThinkingContent(text).content);
                    copyBtn.classList.add('copied');
                    copyBtn.innerHTML = `${this.ICONS.check} 已复制`;
                    this.setManagedTimeout(() => {
                        copyBtn.classList.remove('copied');
                        copyBtn.innerHTML = `${this.ICONS.copy} 复制`;
                    }, 2000);
                };
            }
            if (GM_getValue('autoScroll', true)) {
                this.setManagedTimeout(() => {
                    resultBox.scrollTop = resultBox.scrollHeight;
                    const thinkingInner = resultBox.querySelector('.thinking-content-inner');
                    if (thinkingInner && isExpanded) {
                        thinkingInner.scrollTop = thinkingInner.scrollHeight;
                    }
                }, 0);
            }
        },
        updateBubble: UIRegistry.get('style1').updateBubble,
        addBubble: UIRegistry.get('style1').addBubble,
        renderWithThinking(text, isStreaming = false, keepExpanded = false) {
            const { thinking, content } = Core.parseThinkingContent(text);
            let html = '';
            if (thinking) {
                const charCount = thinking.length;
                const streamingClass = isStreaming ? ' streaming' : '';
                const expandedClass = keepExpanded ? ' expanded' : '';
                const statusText = isStreaming ? '思考中...' : `${charCount} 字符`;
                const previewText = thinking.split('\n').filter(l => l.trim()).slice(-4).join('\n').slice(-150);
                const thinkingHtml = Core.renderMarkdown(thinking);
                const previewHtml = Core.renderMarkdown(previewText);
                html += `<div class="thinking-block${streamingClass}${expandedClass}" data-thinking-block>
                             <div class="thinking-header" data-thinking-toggle>
                                 <div class="thinking-header-left">
                                     <div class="thinking-icon">${this.ICONS.brain}</div><span class="thinking-title">思考过程</span>
                                     <span class="thinking-status">${statusText}</span>
                                 </div>
                                 <div class="thinking-toggle">${this.ICONS.arrowDown}</div>
                             </div>
                             <div class="thinking-preview">${previewHtml}</div>
                             <div class="thinking-content"><div class="thinking-content-inner">${thinkingHtml}</div></div>
                         </div>`;
            }
            if (content) {
                html += Core.renderMarkdown(content);
            }
            return html;
        },
        showToast: UIRegistry.get('style1').showToast,
        copyToClipboard: UIRegistry.get('style1').copyToClipboard,
        openModelPicker: UIRegistry.get('style1').openModelPicker,
        closeModelPicker: UIRegistry.get('style1').closeModelPicker,
        setModelPickerStatus: UIRegistry.get('style1').setModelPickerStatus,
        renderModelOptions: UIRegistry.get('style1').renderModelOptions,
        loadModelList: UIRegistry.get('style1').loadModelList,
        updateScrollButtons: UIRegistry.get('style1').updateScrollButtons,
        scrollToTop: UIRegistry.get('style1').scrollToTop,
        scrollToBottom: UIRegistry.get('style1').scrollToBottom,
        forceScrollToBottom: UIRegistry.get('style1').forceScrollToBottom,
        clearChat: UIRegistry.get('style1').clearChat,
        updateMessageCount: UIRegistry.get('style1').updateMessageCount,
        setExportRange: UIRegistry.get('style1').setExportRange,
        doExport: UIRegistry.get('style1').doExport,
        exportAsHtml: UIRegistry.get('style1').exportAsHtml,
        exportAsAiText: UIRegistry.get('style1').exportAsAiText
    });


    // =================================================================================
    // 5. UI 管理器 (UI MANAGER)
    //    负责处理UI切换、状态管理和与核心逻辑的交互。
    // =================================================================================
    class UIManager {
        constructor() {
            this.currentUI = null;
            this.host = null;
            this.shadow = null;
            this.init();
        }

        init() {
            // 从GM存储中读取用户选择，若无则使用默认
            const savedStyle = GM_getValue(CONFIG.storageKey, CONFIG.defaultUI);
            this.loadUI(savedStyle);
            this.registerMenuCommands();
        }

        loadUI(styleName) {
            if (this.currentUI && typeof this.currentUI.destroy === 'function') {
                this.currentUI.destroy();
            }
            if (this.host) {
                document.body.removeChild(this.host);
            }

            const uiObject = UIRegistry.get(styleName);
            if (!uiObject) {
                console.error(`UI Style "${styleName}" not found.`);
                return;
            }

            // 创建 Shadow DOM host
            this.host = document.createElement('div');
            this.host.id = `ld-summary-pro-${styleName}`;
            document.body.appendChild(this.host);
            this.shadow = this.host.attachShadow({ mode: 'open' });

            this.currentUI = uiObject;
            GM_setValue(CONFIG.storageKey, styleName);

            // 注入样式并初始化UI
            const styleEl = document.createElement('style');
            styleEl.textContent = this.currentUI.getStyles();
            this.shadow.appendChild(styleEl);

            // 将管理器实例传递给UI模块，以便UI可以调用管理器的公共方法
            this.currentUI.init(this);
        }

        destroy() {
            if (this.currentUI && typeof this.currentUI.destroy === 'function') {
                this.currentUI.destroy();
            }
            this.currentUI = null;
            this.shadow = null;
            if (this.host?.parentNode) {
                this.host.parentNode.removeChild(this.host);
            }
            this.host = null;
        }

        registerMenuCommands() {
            if (UIManager.menuCommandsRegistered) return;
            const styles = UIRegistry.getAllNames();
            styles.forEach(styleName => {
                const styleObject = UIRegistry.get(styleName);
                GM_registerMenuCommand(`切换到 ${styleObject.name || styleName}`, () => {
                    if (!activeUIManager) {
                        if (!Core.isTopicPage()) {
                            window.alert?.('请在 Linux.do 主题页使用智能总结。');
                            return;
                        }
                        activeUIManager = new UIManager();
                    }
                    activeUIManager.loadUI(styleName);
                });
            });
            UIManager.menuCommandsRegistered = true;
        }

        // 公共方法，供UI模块调用
        Q(selector) {
            return this.shadow.querySelector(selector);
        }
    }


    // =================================================================================
    // 6. 主执行入口 (MAIN ENTRY POINT)
    // =================================================================================
    let activeUIManager = null;
    let activeTopicId = null;
    let routeBootstrapCleanup = null;

    const syncTopicPageUi = () => {
        if (Core.isTopicPage()) {
            const topicId = Core.getTopicId();
            if (!activeUIManager) {
                activeTopicId = topicId;
                activeUIManager = new UIManager();
            } else if (topicId && activeTopicId && topicId !== activeTopicId) {
                activeUIManager.destroy();
                activeTopicId = topicId;
                activeUIManager = new UIManager();
            }
            return;
        }

        if (activeUIManager) {
            activeUIManager.destroy();
            activeUIManager = null;
        }
        activeTopicId = null;
    };

    const installTopicRouteBootstrap = () => {
        if (routeBootstrapCleanup) return;

        let scheduled = false;
        const scheduleBootCheck = () => {
            if (scheduled) return;
            scheduled = true;
            setTimeout(() => {
                scheduled = false;
                syncTopicPageUi();
            }, 0);
        };

        const originalPushState = history.pushState;
        const originalReplaceState = history.replaceState;

        const patchedPushState = function (...args) {
            const result = originalPushState.apply(this, args);
            scheduleBootCheck();
            return result;
        };
        const patchedReplaceState = function (...args) {
            const result = originalReplaceState.apply(this, args);
            scheduleBootCheck();
            return result;
        };
        history.pushState = patchedPushState;
        history.replaceState = patchedReplaceState;
        window.addEventListener('popstate', scheduleBootCheck);
        window.addEventListener('hashchange', scheduleBootCheck);

        routeBootstrapCleanup = () => {
            if (history.pushState === patchedPushState) history.pushState = originalPushState;
            if (history.replaceState === patchedReplaceState) history.replaceState = originalReplaceState;
            window.removeEventListener('popstate', scheduleBootCheck);
            window.removeEventListener('hashchange', scheduleBootCheck);
        };
    };

    const start = () => {
        syncTopicPageUi();
        installTopicRouteBootstrap();
    };

    if (document.readyState === 'loading') {
        window.addEventListener('DOMContentLoaded', start, { once: true });
    } else {
        start();
    }

})();
