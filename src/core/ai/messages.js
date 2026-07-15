export const aiMessageCore = {
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
};
