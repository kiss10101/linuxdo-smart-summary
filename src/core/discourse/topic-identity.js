export const topicIdentityCore = {
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
};
