
const chalk = require('chalk');
const readlineSync = require('readline-sync');

module.exports = (message) => {
    return readlineSync.keyInYN(message + " ");
}