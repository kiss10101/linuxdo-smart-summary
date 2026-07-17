export const CONFIG = {
    defaultUI: 'style2', // 默认UI风格
    storageKey: 'ld_summary_ui_style', // 用于存储UI选择的键名
    apiProfilesKey: 'apiProfiles',
    activeApiProfileIdKey: 'activeApiProfileId',
    defaultApiUrl: 'https://api.deepseek.com/v1/chat/completions',
    defaultModel: 'deepseek-chat',
    floatingMenuOpacityKey: 'floatingMenuOpacity',
    floatingMenuOpacityDefault: 88,
    floatingMenuOpacityMin: 80,
    floatingMenuOpacityMax: 100,
    floatingMenuOpacityStep: 1,
    configSyncDebounceMs: 50,
    configSyncDirtyRetryMs: 300,
    configSyncKeys: [
        'apiProfiles',
        'activeApiProfileId',
        'apiUrl',
        'apiKey',
        'model',
        'prompt_sum',
        'prompt_chat',
        'recentFloors',
        'useStream',
        'autoScroll',
        'floatingMenuOpacity'
    ],
};
