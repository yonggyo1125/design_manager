const Exception = require('../../exception');
const { get : getCode } = require('./statusCodes');

class TokenExpiredException extends Exception {
    constructor(...params) {
        if (params.length == 0 || !params[0]) {
            params.push(getCode(1150));
        }

        super(...params);

        this.status = 401;
        this.code = 1150;
    }
}

module.exports = TokenExpiredException;