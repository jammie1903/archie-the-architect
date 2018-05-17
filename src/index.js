#!/usr/bin/env node

const chalk = require("chalk");
const path = require("path");
const fs = require("fs");
const fse = require("fs-extra");

const storageFolder = require("./rootFolder")
const confirm = require("./confirm");
const exists = require("./config/exists");
const loadConfig = require("./config/loadConfig");
const mapConfig = require("./config/mapConfig");
const runProjects = require("./runProjects");
const highlightJson = require("./config/highlight");
const handleError = require("./utils/handleError");
const getTasks = require("./config/getTasks");

const yargonaut = require("yargonaut")
    .style("green")
    .style("green", "Positionals:")
    .errorsStyle("red.bold");
try {
    require("yargs")
        .command(`run <folders..>`, chalk.yellow("Runs the given projects"), (yargs) => {
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
        }, run)
        .command(`run-task <task>`, chalk.yellow("Runs the given task"), (yargs) => {
            yargs
                .positional("task", {
                    describe: "The task to run",
                    type: "string",
                })
        }, runTask)
        .command(`list-tasks`, chalk.yellow("Prints the currently saved tasks"), (yargs) => { }, listTasks)
        .command(`describe <task>`, chalk.yellow("Shows the given tasks config"), (yargs) => {
            yargs
                .positional("task", {
                    describe: "The task to examine",
                    type: "string",
                })
        }, describe)
        .command(`root`, chalk.yellow("Prints the root folder for saved task configurations"), (yargs) => { }, showRoot)
        .demandCommand(1, 1, chalk.red.bold("You need to specify a command before moving on"))
        .wrap(120)
        .argv;
} catch (e) {
    handleError(e);
}
function run(args) {
    const config = mapConfig(args);

    if (args.saveAs) {
        const filename = path.join(storageFolder, args.saveAs + ".json");
        if (!exists(filename) || confirm(`"${args.saveAs}" already exists, are you sure you want to overrride it?`)) {
            fse.outputFileSync(filename, JSON.stringify(config, null, " "));
            console.log(chalk.yellow.bold(`"${args.saveAs}" saved, use run-task ${args.saveAs} to run this in the future`));
        }
    }

    if (args.dryRun) {
        console.log(highlightJson(config));
        return;
    }

    return runProjects(config)
        .catch(e => handleError(e));
}

function runTask(args) {
    return runProjects(loadConfig(args.task))
        .catch(e => handleError(e));
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