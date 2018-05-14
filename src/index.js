#!/usr/bin/env node
const chalk = require('chalk');
const spawn = require('cross-spawn');
const path = require("path");
const fs = require("fs");
const fse = require("fs-extra");
const homeDirectory = require('home-dir').directory;

const storageFolder = path.join(homeDirectory, "bin", "run-all");

const allAargs = require("yargs").argv;
const aargs = allAargs._;

const confirm = require("./confirm");
const exists = require("./exists");
const mapConfig = require("./mapConfig");
const performSymlink = require("./performSymlink");

const directories = allAargs._;

let config;
if (directories.length) {
    config = mapConfig(directories, allAargs);

    if (allAargs.saveAs) {
        const filename = path.join(storageFolder, allAargs.saveAs + ".json");
        if (!exists(filename) || confirm(`"${allAargs.saveAs}" already exists, are you sure you want to overrride it?`)) {
            fse.outputFileSync(filename, JSON.stringify(config, null, ' '));
            console.log(chalk.yellow.bold(`"${allAargs.saveAs}" saved, use run-all --task="${allAargs.saveAs}" to run this in the future`));
        }
    }

} else if (allAargs.task) {
    const filename = path.join(storageFolder, allAargs.task + ".json");
    if (exists(filename)) {
        try {
            config = JSON.parse(fs.readFileSync(filename, 'utf8'));
        } catch (e) {
            console.error(`The config file for "${allAargs.task}" is invalid: ${e.message}`);
        }
    } else {
        console.error(`could not find task "${allAargs.task}"`);
    }
} else {
    console.error("please specify at least one directory to build, or specifiy a task to run");
}

if (!config) {
    return;
}

if (allAargs.dryRun) {
    console.log(config);
    return;
}

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

    if(entry.symlink && index !== config.length - 1) {
        promise = promise.then(() => performSymlink(index, config));
    }
});
