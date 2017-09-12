exports.setStore = function(name, content) {
    if (!name) return;
    if (typeof content !== 'string') {
        content = JSON.stringify(content);
    }
    window.localStorage.setItem(name, content);
}

/**
 * 获取localStorage
 */
exports.getStore=function(name) {
    if (!name) return;
    return window.localStorage.getItem(name);
}