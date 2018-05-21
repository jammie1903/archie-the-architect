const exists = require("./exists");
const UserError = require("../utils/userError");
const getTasks = require("./getTasks");

const path = require("path");
const callLocation = process.cwd();
const colors = ["green", "blue", "yellow", "magenta", "cyan", "gray", "white"];
const defaultSymlinkDirectories = "src,dist";

module.exports = (allAargs) => {

    const command = (allAargs.command || "npm start").trim();
    const commandIndex = command.indexOf(" ");
    
    const commandGlobal = commandIndex === -1 ? command : command.substring(0, commandIndex);
    const commandArgsGlobal = commandIndex === -1 ? [] : command.substring(commandIndex).trim().split(/\s+/);
    const awaitGlobal = allAargs.await || false;
    const symlinkGlobal = allAargs.symlink || false;

    const duplicateArray = allAargs.folders.reduce((acc, d) => {
        const name = d.substring(d.lastIndexOf(path.sep) + 1);
        acc[name] = acc[name] ? acc[name] + 1 : 1;
        return acc;
    }, {})

    return allAargs.folders.map((d, i) => {

        const location = callLocation + path.sep + d;
        if(!exists(location, false)) {
            let errorMessage = `No directory was found for '${d}', double check your current directory/folder names and try again`
            if(allAargs.folders.length === 1 && getTasks().indexOf(d) !== -1) {
                errorMessage += `\nDid you mean to run the task '${d}'? if so, use the command 'run-task'`;
            }
            throw new UserError(errorMessage);
        }

        let buildCommandRaw = allAargs[`command[${i}]`];
        let buildCommand, buildCommandArgs;
        if (typeof buildCommandRaw !== "undefined") {
            buildCommandRaw = buildCommandRaw.trim();
            const buildCommandIndex = buildCommandRaw.indexOf(" ");
            buildCommand = buildCommandIndex === -1 ? buildCommandRaw : buildCommandRaw.substring(0, buildCommandIndex);
            buildCommandArgs = buildCommandIndex === -1 ? [] : buildCommandRaw.substring(buildCommandIndex).trim().split(/\s+/);
        } else {
            buildCommand = commandGlobal;
            buildCommandArgs = commandArgsGlobal
        }

        const awaitBuild = allAargs[`await[${i}]`];

        const symlinkBuild = allAargs[`symlink[${i}]`];

        let symlink = typeof symlinkBuild !== 'undefined' ? symlinkBuild : symlinkGlobal;
        if(symlink === true) {
            symlink = defaultSymlinkDirectories;
        }

        return {
            location,
            displayName: duplicateArray[d.substring(d.lastIndexOf(path.sep) + 1)] > 1 ? d : d.substring(d.lastIndexOf(path.sep) + 1),
            command: buildCommand,
            commandArgs: buildCommandArgs,
            color: colors[i % colors.length],
            await: typeof awaitBuild !== 'undefined' ? awaitBuild : awaitGlobal,
            symlink: symlink && symlink.split(",").map(s => s.trim()),
        }
    });
}
