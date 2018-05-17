const path = require("path");
const fs = require("fs");
const exists = require("./exists");
const storageFolder = require("../rootFolder")

module.exports = function loadConfig(task) {
    const filename = path.join(storageFolder, task + ".json");
    if (exists(filename)) {
        try {
            return JSON.parse(fs.readFileSync(filename, "utf8"));
        } catch (e) {
            console.error(`The config file for "${task}" is invalid: ${e.message}`);
        }
    } else {
        console.error(`could not find task "${task}"`);
    }
}
