const path = require("path");
const fs = require("fs");
const exists = require("./exists");
const UserError = require("../utils/userError");
const storageFolder = require("../rootFolder")

module.exports = function loadConfig(task) {
    const filename = path.join(storageFolder, task + ".json");
    if (exists(filename)) {
        try {
            return JSON.parse(fs.readFileSync(filename, "utf8"));
        } catch (e) {
            throw new UserError(`The config file for "${task}" is invalid: ${e.message}`);
        }
    } else {
        throw new UserError(`Could not find task "${task}"`);
    }
}
