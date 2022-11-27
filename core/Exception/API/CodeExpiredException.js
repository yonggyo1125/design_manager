const Exception = require('../../exception');
const { get : getCode } = require('./statusCodes');

class CodeExpiredException extends Exception {
    constructor(...params) {
        if (params.length == 0 || !params[0]) {
            params.push(getCode(1110));
        }
        
        super(...params);

        this.status = 400;
        this.code = 1110;
        
    }
}

module.exports = CodeExpiredException;