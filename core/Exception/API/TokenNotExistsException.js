const Exception = require('../../exception');
const { get  : getCode } = require('./statusCodes');

class TokenNotExistsException extends Exception {
    constructor(...params) {
        if (params.length == 0 || !params[0]) {
            params.push(getCode(1120));
        }
        
        super(...params);

        this.status = 400;
        this.code  = 1120;
    }
}

module.exports = TokenNotExistsException;