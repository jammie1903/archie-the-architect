#!/usr/bin/env node

const { checkVersion, setConfig, runUpdate } = require("./utils/globalConfig");
const versionPromise = checkVersion();

const chalk = require("chalk");
const path = require("path");
const fs = require("fs");
const fse = require("fs-extra");

const storageFolder = require("./rootFolder")
const UserError = require("./utils/userError");
const { confirm, select } = require("./utils/input");
const exists = require("./config/exists");
const loadConfig = require("./config/loadConfig");
const mapConfig = require("./config/mapConfig");
const deleteConfig = require("./config/deleteConfig");
const runProjects = require("./runProjects");
const highlightJson = require("./config/highlight");
const handleError = require("./utils/handleError");
const getTasks = require("./config/getTasks");

function start(method) {
    return (args) => {
        versionPromise.then(() => {
            method(args);
        });
    }
}

const yargonaut = require("yargonaut")
    .style("green")
    .style("green", "Positionals:")
    .errorsStyle("red.bold");
try {
    require("yargs")
        .command("run <folders..>", chalk.yellow("Runs the given projects"), (yargs) => {
            yargs
                .positional("folders..", {
                    describe: "The relative folders of the projects to build",
                    type: "string",
                })
                .option("command", {
                    describe: "The command to run for all folders",
                    type: "string",
                    default: "npm start"
                })
                .option("command[i]", {
                    describe: "The command to run for the folder at the given index, overrides the default command",
                    type: "string",
                })
                .option("await", {
                    describe: "If true, all folders will await the completion of the previous folder before starting, " +
                        "if the value is a string, all folders will await the previous folder logging the given string before starting",
                })
                .option("await[i]", {
                    describe: "Await rules for the folder at the given index, overrides the default await option",
                })
                .option("symlink", {
                    describe: "Whether to symlink this project into subsequent projects node-modules. if true, the folders 'src' and 'dist' will be symlinked if found. " +
                        "A comma separated string array can be specified to choose different folders to link",
                })
                .option("symlink[i]", {
                    describe: "Symlink rules for the folder at the given index, overrides the default symlink option",
                })
                .option("dry-run", {
                    describe: "Dont run the specified folders, instead log the generated config to check its correct",
                    type: "boolean",
                })
                .option("save-as", {
                    describe: "Saves the specified config for later use",
                })
        }, start(run))
        .command("run-task [task]", chalk.yellow("Runs the given task"), (yargs) => {
            yargs
                .positional("task", {
                    describe: "The task to run, leave blank to list all tasks for selection",
                    type: "string",
                })
        }, start(runTask))
        .command("delete-task <task>", chalk.yellow("Deletes the given task"), (yargs) => {
            yargs
                .positional("task", {
                    describe: "The task to delete",
                    type: "string",
                })
        }, start(deleteTask))
        .command("list-tasks", chalk.yellow("Prints the currently saved tasks"), (yargs) => { }, start(listTasks))
        .command("describe <task>", chalk.yellow("Shows the given tasks config"), (yargs) => {
            yargs
                .positional("task", {
                    describe: "The task to examine",
                    type: "string",
                })
        }, start(describe))
        .command("config", chalk.yellow("Set global config for archie"), (yargs) => {
            yargs
                .option("prevent-update-checks", {
                    describe: "Prevents archie from checking if its out of date",
                    type: "boolean",
                    default: null
                })
                .option("update-automatically", {
                    describe: "If set, archie will update itself whenever it realises its out of date",
                    type: "boolean",
                    default: null
                })
        }, setConfig)
        .command("root", chalk.yellow("Prints the root folder for saved task configurations"), (yargs) => { }, start(showRoot))
        .command("update", chalk.yellow("Updates archie to the latest version"), (yargs) => { }, runUpdate)
        .demandCommand(1, 1, chalk.red.bold("You need to specify a command before moving on"))
        .wrap(130)
        .argv;
} catch (e) {
    handleError(e);
}

function saveFile(name, filename, config) {
    fse.outputFileSync(filename, JSON.stringify(config, null, " "));
    console.log(chalk.yellow.bold(`"${name}" saved, use run-task ${name} to run this in the future`));
}

function run(args) {
    const config = mapConfig(args);

    let promise = Promise.resolve();

    if (args.saveAs) {
        const filename = path.join(storageFolder, args.saveAs + ".json");

        if (exists(filename)) {
            promise = confirm(`"${args.saveAs}" already exists, are you sure you want to overrride it?`)
                .then(confirmed => {
                    if (confirmed) {
                        saveFile(args.saveAs, filename, config)
                    }
                });
        } else {
            saveFile(args.saveAs, filename, config)
        }
    }

    return promise.then(() => {
        if (args.dryRun) {
            console.log(highlightJson(config));
            return;
        }
        runProjects(config)
    }).catch(e => handleError(e));
}

function runTask(args) {
    let taskPromise;
    if (!args.task) {
        const tasks = getTasks();
        if (!tasks) {
            throw new UserError("Looks like you have no saved tasks, use the --save-as parameter in \"run\" to create one");
        }
        taskPromise = select("Select a task to run", getTasks());
    } else {
        taskPromise = Promise.resolve(args.task);
    }

    return taskPromise
        .then(task => runProjects(loadConfig(task)))
        .catch(e => handleError(e));
}

function deleteTask(args) {
    const filename = path.join(storageFolder, args.task + ".json");
    if (!exists(filename)) {
        throw new UserError(`Could not find task "${args.task}"`);
    } else {
        confirm("Are you sure you want to delete this task?")
            .then(confirmed => {
                if (confirmed) {
                    deleteConfig(args.task);
                    console.log(chalk.yellow.bold(`"${args.task}" has been deleted`));
                }
            })
    }
}

function describe(args) {
    console.log(highlightJson(loadConfig(args.task)));
}

function listTasks() {
    getTasks().forEach(t => console.log(t));
}

function showRoot() {
    console.log(storageFolder);
}
