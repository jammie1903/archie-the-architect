const path = require("path");
const homeDirectory = require("home-dir").directory;
module.exports = path.join(homeDirectory, "bin", "archie");
