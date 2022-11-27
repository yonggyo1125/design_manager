const Exception = require('../../exception');
const { get : getCode } = require('./statusCodes');

class CodeGenerateException extends Exception {
    constructor(...params) {
        if (params.length == 0 || !params[0]) {
            params.push(getCode(1100));
        }

        super(...params);

        this.status = 500;
        this.code = 1100;
    }
}

module.exports = CodeGenerateException;