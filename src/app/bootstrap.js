import { Core } from '../core/index.js';
import { UIManager } from '../ui/ui-manager.js';
import { uiRuntime } from './runtime.js';

const clearActiveTopicPrewarmTimer = () => {
    if (!uiRuntime.activeTopicPrewarmTimer) return;
    clearTimeout(uiRuntime.activeTopicPrewarmTimer);
    uiRuntime.activeTopicPrewarmTimer = null;
};

const scheduleActiveTopicPrewarm = (reason = 'route', delayMs = Core.topicDataPrewarmPolicy.routeDelayMs) => {
    const topicId = Core.getTopicId();
    if (!topicId || !Core.isTopicPage()) return;
    clearActiveTopicPrewarmTimer();
    uiRuntime.activeTopicPrewarmTimer = setTimeout(() => {
        uiRuntime.activeTopicPrewarmTimer = null;
        if (!Core.isTopicPage() || Core.getTopicId() !== topicId) return;
        Core.prewarmTopicData(topicId, { reason }).catch((error) => {
            console.warn('[Linux.do 智能总结] 楼层元数据预热失败:', error);
        });
    }, delayMs);
};

const syncTopicPageUi = () => {
    if (Core.isTopicPage()) {
        const topicId = Core.getTopicId();
        if (!uiRuntime.activeUIManager) {
            uiRuntime.activeTopicId = topicId;
            uiRuntime.activeUIManager = new UIManager();
            scheduleActiveTopicPrewarm('route');
        } else if (topicId && uiRuntime.activeTopicId && topicId !== uiRuntime.activeTopicId) {
            const previousTopicId = uiRuntime.activeTopicId;
            uiRuntime.activeTopicId = topicId;
            uiRuntime.activeUIManager.handleTopicRouteChange({ previousTopicId, topicId });
            scheduleActiveTopicPrewarm('route-change');
        }
        return;
    }

    if (uiRuntime.activeUIManager) {
        uiRuntime.activeUIManager.destroy();
        uiRuntime.activeUIManager = null;
    }
    clearActiveTopicPrewarmTimer();
    uiRuntime.activeTopicId = null;
};

const installTopicRouteBootstrap = () => {
    if (uiRuntime.routeBootstrapCleanup) return;

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
    const scheduleResumePrewarm = () => {
        if (document.visibilityState === 'hidden') return;
        scheduleActiveTopicPrewarm('resume', Core.topicDataPrewarmPolicy.resumeDelayMs);
    };
    document.addEventListener('visibilitychange', scheduleResumePrewarm);
    window.addEventListener('focus', scheduleResumePrewarm);
    window.addEventListener('pageshow', scheduleResumePrewarm);

    uiRuntime.routeBootstrapCleanup = () => {
        clearActiveTopicPrewarmTimer();
        if (history.pushState === patchedPushState) history.pushState = originalPushState;
        if (history.replaceState === patchedReplaceState) history.replaceState = originalReplaceState;
        window.removeEventListener('popstate', scheduleBootCheck);
        window.removeEventListener('hashchange', scheduleBootCheck);
        document.removeEventListener('visibilitychange', scheduleResumePrewarm);
        window.removeEventListener('focus', scheduleResumePrewarm);
        window.removeEventListener('pageshow', scheduleResumePrewarm);
    };
};

export const startUserscript = () => {
    syncTopicPageUi();
    installTopicRouteBootstrap();
};
