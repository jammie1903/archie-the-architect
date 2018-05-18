
const chalk = require('chalk');
const inquirer = require('inquirer');

module.exports.confirm = (message) => {
    return inquirer.prompt([{
        type: 'input',
        name: 'question',
        message: chalk.yellow(message),
        validate: function (q) {
            return q && ["y", "n"].indexOf(q.toLowerCase()) !== -1
        },
        suffix: chalk.yellow(" [y/n]:")
    }]).then(answers => {
        return answers.question.toLowerCase() === "y";
    });
}

module.exports.select = (message, choices) => {
    return inquirer.prompt([{
        type: 'list',
        name: 'select',
        pageSize: 8, 
        message: chalk.yellow(message),
        choices,
    }]).then(answers => {
        return answers.select;
    });
}
