
const root = require("../rootFolder");
const chalk = require("chalk");
const spawn = require("cross-spawn");
const Spinner = require("./spinner");


module.exports = () => new Promise((res, rej) => {
    const spinner = new Spinner();
    spinner.start();

    let resolved = false;
    const process = spawn("npm install -g archie-the-architect", "", { cwd: root });

    process.on("close", (code) => {
        spinner.stop();
        if (code === 0) {
            console.log(chalk.yellow.bold("Update was successful, archie will use the new version next time he's run"));
        } else {
            console.log(chalk.red.bold("Update failed, please try again later"));
        }
        if (!resolved) {
            res();
            resolved = true;
        }
    });
});