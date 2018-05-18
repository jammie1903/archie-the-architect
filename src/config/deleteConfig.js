const path = require("path");
const fs = require("fs");
const UserError = require("../utils/userError");
const storageFolder = require("../rootFolder");

module.exports = function deleteConfig(task) {
    const filename = path.join(storageFolder, task + ".json");
    try {
        fs.unlinkSync(filename);
    } catch (e) {
        throw new UserError(`Could not delete "${task}", it may be being used elsewhere.`);
    }
}
