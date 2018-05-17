const fs = require("fs");

module.exports = (path, isFile = true) => {
    try {
        return fs.statSync(path)[isFile ? "isFile" : "isDirectory"]();
    } catch (e) {
        return false;
    }
}