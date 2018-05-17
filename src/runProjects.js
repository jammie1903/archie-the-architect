const chalk = require('chalk');
const spawn = require('cross-spawn');
const performSymlink = require("./performSymlink");
const exists = require("./config/exists");
const UserError = require("./utils/userError");

module.exports = function runProjects(config) {
    console.log("running")
    if (!config) {
        console.log("no config")
        return;
    }

    config.forEach(entry => {
        if(!exists(entry.location, false)) {
            Promise.reject(new UserError(`${d} could not be found, aborting, check your configuration and try again`));
        }
    });

    const longestLength = config.map(s => s.displayName.length).reduce((a, b) => Math.max(a, b));

    let promise = Promise.resolve();
    config.forEach((entry, index) => {

        promise = promise.then(() => new Promise((res, rej) => {
            let resolved = false;

            const padding = " ".repeat(longestLength - entry.displayName.length);
            const prefix = chalk[entry.color].bold(`${padding}${entry.displayName}: `);
            const errorPrefix = prefix + chalk.red.bold("(ERROR) ");

            console.log(`${prefix}Running command "${entry.command} ${entry.commandArgs}"`);
            const process = spawn(entry.command, entry.commandArgs, { cwd: entry.location });


            process.on('error', (err) => {
                console.log(`${errorPrefix}errored with err ${err}`);
                if (!resolved) {
                    res();
                    resolved = true;
                }
            });

            process.on('close', (code) => {
                console.log(`${prefix}exited with code ${code}`);
                if (!resolved) {
                    res();
                    resolved = true;
                }
            });

            process.stdout.on('data', (data) => {
                const dataString = String(data);
                dataString.trim().split("\n").forEach(dataLine => {
                    console.log(prefix + dataLine);
                });
                if (!resolved && typeof entry.await === "string" && dataString.indexOf(entry.await) !== -1) {
                    res();
                    resolved = true;
                }
            });

            process.stderr.on('data', (data) => {
                const dataString = String(data);
                dataString.trim().split("\n").forEach(dataLine => {
                    console.log(errorPrefix + dataLine);
                });
                if (!resolved && typeof entry.await === "string" && dataString.indexOf(entry.await) !== -1) {
                    res();
                    resolved = true;
                }
            });
            if (!entry.await) {
                res();
                resolved = true;
            }
        }));

        if (entry.symlink && index !== config.length - 1) {
            promise = promise.then(() => performSymlink(index, config));
        }
    });
    return promise;
}
