const chalk = require("chalk");
const UserError = require("./userError");
const packageJson = require("../../package.json");

module.exports = function(error) {
    if(error instanceof UserError) {
        console.error(chalk.red.bold(error.message));
    } else {
        console.error(chalk.red.bold(`An unexpected error occured, if this coninues, please raise an issue at ${packageJson.repository.url}`));
        console.error(error);
    }
}