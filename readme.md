# Archie

A command-line tool for running multiple tasks in one window, with some additional utilities

## Installation

Archie is best used globally, so to install, run `npm install -g archie-the-architect`

## Commands

  `run <folders..>`    Runs the given projects

  `run-task <task>`    Runs the given task, leave blank to list all tasks for selection

  `delete-task <task>` Deletes the given task

  `list-tasks`         Prints the currently saved tasks

  `describe <task>`    Shows the given tasks config

  `root`               Prints the root folder for saved task configurations

  `help`               Prints out help for archie as a whole, or for individual tasks

  `config`             Set global config for archie
            
  `update`             Updates archie to the latest version

## Example usage

### Npm installing multiple projects

`archie run folderA folderB folderC --command="npm install"`

The above would run npm install for each specified folder synchronously

### Building multiple dependent projects

`archie run folderA folderB folderC --await --symlink`

The following would run "npm start" in each folder asynchronously (waiting for the previous folder to complete before starting).

Each folder will also attempt to symlink their "src" and "dist" folders to the subsequent folders "node_modules", if the project in said folder is dependent on it.

Note: you could change the symlinked folders by specifying them in the command, e.g. `--symlink="build-folder"`

### Awaiting a given message

Sometimes, you may only want a folder to start building after the previous folder reaches a given point, rather than completing (maybe it never complete e.g. a continuous build command).

Archie can't monitor the underlying process of the running folders, but it can monitor their logs. As such it can watch for specific phrases before moving on to the next folder. e.g.

`archie run folderA folderB --command="gulp watch" --await="Finished 'watch'"`

### Run different commands for specific folders

`archie run folderA folderB folderC --command[1]="gulp"`

The above command will run npm start for folderA and folderC, but gulp for folderB.

You can also do similar for the `await` and `symlink` options.

### Saving run configuration / running a saved configuration

`archie run folderA folderB folderC --save-as="example-task`

The above will save the specified task for later use, it will also be ran, if you wish to prevent this, use `--dry-run`.

To run this task, use the following command

`archie run-task example-task`

The task can be ran from any directory and will use the absolute paths of the specified folders. So, if the above task was saved in the folder `lib`, 
then the built folders will always be 'lib/folderA', 'lib/folderB' and 'lib/folderC'.

### Finding your config files

Config files are stored in json format, and can be edited manually if desired. To find the location of your config files, run the following:

`archie root`