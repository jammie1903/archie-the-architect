const fs = require("fs");
const storageFolder = require("../rootFolder")

module.exports = function getTasks() {
    return fs.readdirSync(storageFolder)
        .filter(file => file.endsWith(".json"))
        .map(file => file.substring(0, file.length - 5));
}
