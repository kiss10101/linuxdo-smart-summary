export const summarySelectionCore = {
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
};
