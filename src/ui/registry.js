export const UIRegistry = {
    _styles: {},
    register(name, styleObject) {
        this._styles[name] = styleObject;
    },
    get(name) {
        return this._styles[name];
    },
    getAllNames() {
        return Object.keys(this._styles);
    }
};
