const { name, version } = require("../../package.json");
const latestVersion = require("latest-version");
const compareVersions = require('compare-versions');
const chalk = require("chalk");

const path = require("path");
const fs = require("fs");
const fse = require("fs-extra");
const exists = require("../config/exists");
const UserError = require("./userError");
const storageFolder = require("../rootFolder");
const runUpdate = require("./runUpdate");

const MILLISECONDS_IN_DAYS = 1000 * 60 * 60 * 24;

const filename = path.join(storageFolder, ".updateConfig");

function loadVersionSettings() {
    if (exists(filename)) {
        try {
            return JSON.parse(fs.readFileSync(filename, "utf8"));
        } catch (e) {
            return {};
        }
    } else {
        return {};
    }
}

const versionSettings = loadVersionSettings();

function saveVersionSettings() {
    fse.outputFileSync(filename, JSON.stringify(versionSettings, null, " "));
}

module.exports.runUpdate = () => {
    versionSettings.lastUpdateCheck = new Date().getTime();
    saveVersionSettings();
    return latestVersion(name).then(v => {
        if (compareVersions(version, v) === -1) {
            process.stdout.write(chalk.yellow.bold("Looks like archie has a new update, installing now... "));
            return runUpdate();
        } else {
            console.log(chalk.yellow.bold("Archie is currently up to date"));
        }
    });
}

module.exports.checkVersion = () => {
    if (versionSettings.preventUpdateChecks) {
        return Promise.resolve(null);
    }
    if (versionSettings.lastUpdateCheck) {
        const today = Math.floor(new Date().getTime() / MILLISECONDS_IN_DAYS);
        const lastUpdate = Math.floor(new Date(versionSettings.lastUpdateCheck).getTime() / MILLISECONDS_IN_DAYS);
        if (lastUpdate >= today) {
            return Promise.resolve(null);
        }
    }
    return latestVersion(name).then(v => {
        versionSettings.lastUpdateCheck = new Date().getTime();
        saveVersionSettings();
        if (compareVersions(version, v) === -1) {
            if (versionSettings.updateAutomatically) {
                process.stdout.write(chalk.yellow.bold("Looks like archie have a new update, installing now... "));
                return runUpdate();
            } else {
                console.log(chalk.yellow.bold("Looks like archie has a new update, if you want archie to update itself, run \"archie update\"\n" +
                    "Archie will only do these update checks once a day, but if you want to prevent them, run \"archie config --prevent-update-checks\""));
            }
        }
    });
}

module.exports.setConfig = (args) => {
    console.log(args);
    let changed = false;
    if (typeof args.preventUpdateChecks === "boolean") {
        console.log(`setting preventUpdateChecks to ${args.preventUpdateChecks}`)
        versionSettings.preventUpdateChecks = args.preventUpdateChecks;
        changed = true;
    }
    if (typeof args.updateAutomatically === "boolean") {
        console.log(`setting updateAutomatically to ${args.updateAutomatically}`)
        versionSettings.updateAutomatically = args.updateAutomatically;
        changed = true;
    }
    if (changed) {
        saveVersionSettings();
    }
}
