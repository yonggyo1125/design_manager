const Exception = require('../../exception');
const { get : getCode } = require('./statusCodes');

class TokenNotAuthorizedException extends Exception {
    constructor(...params) {
        if (params.length == 0 || !params[0]) {
            params.push(getCode(1140));
        }

        super(...params);

        this.status = 401;
        this.code = 1140;
    }
}

module.exports = TokenNotAuthorizedException;