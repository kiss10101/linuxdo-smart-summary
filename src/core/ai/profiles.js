import { CONFIG } from '../../config.js';

export const apiProfileCore = {
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

    getActiveApiProfileSnapshot(profile = null) {
        const activeProfile = profile || this.getActiveApiProfile();
        const apiUrl = activeProfile?.apiUrl || CONFIG.defaultApiUrl;
        const model = activeProfile?.model || CONFIG.defaultModel;
        const sourceConfig = {
            id: String(activeProfile?.id || '').trim(),
            name: this.inferApiProfileName(activeProfile || {}, 0),
            model,
            apiHost: this.getApiProfileHost(apiUrl),
            capturedAt: Date.now()
        };
        sourceConfig.label = [sourceConfig.name, sourceConfig.model, sourceConfig.apiHost]
            .filter(Boolean)
            .join(' · ');
        return sourceConfig;
    },

    normalizeAiSourceConfig(sourceConfig = null) {
        if (!sourceConfig || typeof sourceConfig !== 'object') return null;
        const normalized = {
            id: String(sourceConfig.id || '').trim(),
            name: String(sourceConfig.name || '').trim(),
            model: String(sourceConfig.model || '').trim(),
            apiHost: String(sourceConfig.apiHost || '').trim(),
            capturedAt: Number(sourceConfig.capturedAt) || Date.now()
        };
        normalized.label = String(sourceConfig.label || '').trim()
            || [normalized.name, normalized.model, normalized.apiHost].filter(Boolean).join(' · ');
        return normalized.label ? normalized : null;
    },

    renderAiSourceConfigText(sourceConfig = null) {
        const normalized = this.normalizeAiSourceConfig(sourceConfig);
        if (!normalized) return '';
        return normalized.label;
    },

    renderAiSourceMeta(sourceConfig = null, options = {}) {
        const text = this.renderAiSourceConfigText(sourceConfig);
        if (!text) return '';
        const label = options.label || '本次 AI';
        const className = options.className || 'ai-source-meta';
        return `<div class="${this.escapeHtml(className)}">${this.escapeHtml(label)}：${this.escapeHtml(text)}</div>`;
    },
};
