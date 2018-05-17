const chalk = require("chalk");

module.exports = function highlightJson(json) {
    return JSON.stringify(json, null, " ").replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g, function (match) {
        if (/^"/.test(match)) {
            if (/:$/.test(match)) {
                // key
                return chalk.green(match);
            } else {
                // string
               return chalk.blue(match);
            }
        } else if (/true|false/.test(match)) {
            // boolean
            return chalk.magenta(match);
        } else if (/null/.test(match)) {
            // null
            return chalk.gray(match);
        }
        // number
        return chalk.red(match);
    });
}
