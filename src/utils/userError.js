module.exports = class UserError extends Error {
    constructor(message) {
        super(message);
    }
}