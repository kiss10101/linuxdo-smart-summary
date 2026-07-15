export const exportCore = {
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
        const core = this;
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
                const full = core.absoluteUrl(src);
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
                const link = core.absoluteUrl(href);
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
                return core.formatDiscourseQuoteForAiText(el.outerHTML, quoteEl?.innerHTML || "", null);
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
        text = core.decodeEntities(text);
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
