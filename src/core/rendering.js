export const renderingCore = {
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

    sanitizeFilenamePart(value, fallback = 'Linux.do 主题') {
        const normalized = `${value ?? ''}`
            .replace(/[<>:"/\\|?*\u0000-\u001F]/g, '_')
            .replace(/\s+/g, ' ')
            .trim()
            .slice(0, 160);
        return normalized || fallback;
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

    fallbackSanitizeHtml(html, options = {}) {
        const tpl = document.createElement('template');
        tpl.innerHTML = html || '';

        const forbiddenTags = ['script', 'iframe', 'object', 'embed', 'link', 'style', 'meta'];
        if (options.forbidMedia) {
            forbiddenTags.push('img', 'picture', 'source', 'audio', 'video', 'track', 'form', 'input', 'button', 'select', 'textarea');
        }
        tpl.content.querySelectorAll(forbiddenTags.join(', ')).forEach((el) => el.remove());
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
                if (options.forbidMedia && ['src', 'srcset', 'poster'].includes(name)) {
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

    renderReasoningPreview(text) {
        return this.escapeHtml(`${text ?? ''}`).replace(/\n/g, '<br>');
    },

    renderReasoningMarkdown(text) {
        const source = `${text ?? ''}`;
        const markdownLib = this.getMarked();
        if (!markdownLib) return this.renderReasoningPreview(source);
        const parsedHtml = markdownLib.parse(source);
        const sanitizer = this.getSanitizer();
        const options = {
            FORBID_TAGS: ['img', 'picture', 'source', 'audio', 'video', 'track', 'iframe', 'object', 'embed', 'form', 'input', 'button', 'select', 'textarea', 'link', 'style', 'meta'],
            FORBID_ATTR: ['src', 'srcset', 'poster', 'autoplay', 'controls', 'srcdoc']
        };
        if (sanitizer) return sanitizer.sanitize(parsedHtml, options);
        console.warn('DOMPurify 未加载，推理内容已使用严格的内置回退清理逻辑');
        return this.fallbackSanitizeHtml(parsedHtml, { forbidMedia: true });
    },

    getAiOutputStatusText(output) {
        const state = this.normalizeAiOutputState(output);
        const seconds = this.getAiOutputElapsedSeconds(state);
        const elapsed = seconds ? ` · ${seconds} 秒` : '';
        if (state.phase === 'reasoning') return `正在推理${elapsed}`;
        if (state.phase === 'answering') return `推理摘要${elapsed}`;
        if (state.phase === 'partial') return `输出不完整${elapsed}`;
        if (state.phase === 'stopped') return `已停止${elapsed}`;
        if (state.phase === 'error') return `推理未完成${elapsed}`;
        return `推理完成${elapsed}`;
    },

    renderAiOutputHtml(output, options = {}) {
        const state = this.normalizeAiOutputState(output);
        const reasoning = state.reasoningText.trim();
        const content = state.contentText;
        const warning = state.partial
            ? '<div class="ai-output-partial" role="status">已保留服务商返回的部分内容，结果可能不完整。</div>'
            : '';
        const answer = content.trim()
            ? `<div class="ai-output-answer" data-selection-scope="answer">${this.renderMarkdown(content)}</div>`
            : '';
        if (!reasoning) return `${warning}${answer}`;

        const expansion = options.expansion || 'auto';
        const autoExpanded = state.phase === 'reasoning' && !content.trim();
        const expanded = expansion === 'user-expanded'
            ? true
            : expansion === 'user-collapsed'
                ? false
                : autoExpanded;
        const panelKey = `${options.panelId || 'output'}`.replace(/[^A-Za-z0-9_-]/g, '-');
        const panelId = `reasoning-panel-${panelKey || 'output'}`;
        const streaming = options.isStreaming === true;
        const previewText = reasoning.split('\n').filter(line => line.trim()).slice(-4).join('\n').slice(-180);
        const reasoningHtml = streaming
            ? this.renderReasoningPreview(reasoning)
            : this.renderReasoningMarkdown(reasoning);
        const icon = options.icon || '🧠';
        const arrow = options.arrow || '⌄';
        const panel = `<div class="thinking-block${streaming ? ' streaming' : ''}${expanded ? ' expanded' : ''}" data-thinking-block data-expansion="${expansion}">
            <button type="button" class="thinking-header" data-thinking-toggle aria-expanded="${expanded}" aria-controls="${panelId}">
                <span class="thinking-header-left"><span class="thinking-icon">${icon}</span><span class="thinking-title">服务返回的推理内容</span><span class="thinking-status" aria-live="polite">${this.escapeHtml(this.getAiOutputStatusText(state))}</span></span>
                <span class="thinking-toggle" aria-hidden="true">${arrow}</span>
            </button>
            <div class="thinking-preview">${this.renderReasoningPreview(previewText)}</div>
            <div id="${panelId}" class="thinking-content" role="region" aria-label="服务返回的推理内容" aria-hidden="${!expanded}"${expanded ? '' : ' hidden'}><div class="thinking-content-inner"><div class="thinking-scroll-content">${reasoningHtml}</div></div></div>
        </div>`;
        return `${panel}${warning}${answer}`;
    },

    // 下载文件（优先GM_download，失败则回退到<a download>）
};
