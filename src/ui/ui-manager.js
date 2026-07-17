import { CONFIG } from '../config.js';
import { Core } from '../core/index.js';
import { uiRuntime } from '../app/runtime.js';
import { UIRegistry } from './registry.js';

export class UIManager {
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

    handleTopicRouteChange(change) {
        if (this.currentUI && typeof this.currentUI.onTopicRouteChange === 'function') {
            this.currentUI.onTopicRouteChange(change);
        }
    }

    registerMenuCommands() {
        if (UIManager.menuCommandsRegistered) return;
        const styles = UIRegistry.getAllNames();
        styles.forEach(styleName => {
            const styleObject = UIRegistry.get(styleName);
            GM_registerMenuCommand(`切换到 ${styleObject.name || styleName}`, () => {
                if (!uiRuntime.activeUIManager) {
                    if (!Core.isTopicPage()) {
                        window.alert?.('请在 Linux.do 主题页使用智能总结。');
                        return;
                    }
                    uiRuntime.activeTopicId = Core.getTopicId();
                    uiRuntime.activeUIManager = new UIManager();
                }
                uiRuntime.activeUIManager.loadUI(styleName);
            });
        });
        UIManager.menuCommandsRegistered = true;
    }

    // 公共方法，供UI模块调用
    Q(selector) {
        return this.shadow.querySelector(selector);
    }
}
