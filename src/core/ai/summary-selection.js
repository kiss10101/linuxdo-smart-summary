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

        if (action === 'simplify' || action === 'summarize') {
            return {
                action: 'simplify',
                autoSend: true,
                truncated: normalized.truncated,
                prompt: `请只针对下面这段总结内容进行精简。要求：\n1. 用更短、更清晰的表达保留核心含义；\n2. 保留关键实体、原因和结论；\n3. 不扩展到整篇主题，也不要补充原文没有的信息。\n\n选中文本：\n${quote}${truncatedNote}`
            };
        }

        const quoteText = `${rawText ?? ''}`
            .replace(/\r\n?/g, '\n')
            .split('\n')
            .map(line => line.replace(/[\t\f\v ]+/g, ' ').trim())
            .filter(Boolean)
            .join('\n');
        const quoteTruncated = quoteText.length > normalized.maxChars;
        const limitedQuote = quoteTruncated
            ? quoteText.slice(0, normalized.maxChars).trim()
            : quoteText;
        const blockquote = limitedQuote
            .split(/\r?\n/)
            .map(line => `> ${line}`)
            .join('\n');
        const quoteTruncatedNote = quoteTruncated
            ? `\n\n注：原选区较长，已截取前 ${normalized.maxChars} 字。`
            : '';
        return {
            action: 'quote',
            autoSend: false,
            truncated: quoteTruncated,
            prompt: `${blockquote}${quoteTruncatedNote}\n\n`
        };
    },
};
