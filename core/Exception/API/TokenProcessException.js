const Exception = require('../../exception');
const { get : getCode } = require('./statusCodes');

class TokenProcessException extends Exception {
    constructor(...params) {
        if (params.length == 0 || !params[0]) {
            params.push(getCode(1130));
        }
        
        super(...params);

        this.status = 417;
        this.code = 1130;

    }
}

module.exports = TokenProcessException;