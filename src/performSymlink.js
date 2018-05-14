const path = require("path");
const fs = require("fs");
const exists = require("./exists");
const symlinkDir = require('symlink-dir');
const chalk = require("chalk");

function link(src, dest, coloredSrc, coloredDest) {
    return symlinkDir(src, dest)
        .then(result => console.log(`${result.reused ? "Symlink already existed between" : "Created symlink between"} ${coloredSrc} and ${coloredDest}`))
        .catch(err => console.error(chalk.red(`Error occured whilst attempting to symlink ${coloredSrc} to ${coloredDest}`, err)));
}

module.exports = (index, config) => {
    const entry = config[index];

    const packageJson = path.join(entry.location, "package.json");
    let projectName;
    if (exists(packageJson)) {
        try {
            projectName = JSON.parse(fs.readFileSync(packageJson, 'utf8')).name;
            if (!projectName) {
                console.error(`Could not read package name from package.json for ${chalk[entry.color](entry.displayName)}, symlinks will not be created`);
                return;
            }
        } catch (e) {
            console.error(`Could not find package.json for ${chalk[entry.color](entry.displayName)}, symlinks will not be created`, e);
            return;
        }
    }

    console.log(`Creating symlinks for ${chalk[entry.color](entry.displayName)}`);

    const linkableFolders = entry.symlink
        .filter(folderName => exists(path.join(entry.location, folderName), false));

    let promise = Promise.resolve();

    if (linkableFolders.length) {
        let dependancyFound = false;
        for (let i = index + 1; i < config.length; i++) {
            const moduleLocation = path.join(config[i].location, "node_modules", projectName);
            if (exists(moduleLocation, false)) {
                dependancyFound = true;
                linkableFolders.forEach(folderName => {
                    promise = promise.then(() => {
                        const src = path.join(entry.location, folderName);
                        const dest = path.join(moduleLocation, folderName);
                        const coloredSrc = chalk[entry.color](src);
                        const coloredDest = chalk[config[i].color](dest);
                        let res;
                        try {
                            res = fs.lstatSync(dest);
                        } catch (e) {
                            return link(src, dest, coloredSrc, coloredDest);
                        }
                        try {
                            if (res.isSymbolicLink() && path.resolve(src) === path.resolve(fs.readlinkSync(dest))) {
                                console.log(`Symlink already existed between ${coloredSrc} and ${coloredDest}`);
                                return;
                            } else {
                                console.log(`File or folder already existed at ${coloredDest}, deleting file`);
                                try {
                                    fs.unlinkSync(dest);
                                } catch (e) {
                                    console.log(`File at ${coloredDest} could not be deleted`, e);
                                    return;
                                }
                                console.log("File deleted");
                                return link(src, dest, coloredSrc, coloredDest);
                            }
                        } catch (e) {
                            console.error(`An error occured whilst trying to symlink ${coloredSrc} to ${coloredDest}`, e);
                        }
                    })

                });
            }
        }
        if (!dependancyFound) {
            console.log(`No dependant projects found for ${chalk[entry.color](entry.displayName)}`);
        }
    } else {
        console.log(`No linkable folders found for ${chalk[entry.color](entry.displayName)}`);
    }

    return promise;
};
