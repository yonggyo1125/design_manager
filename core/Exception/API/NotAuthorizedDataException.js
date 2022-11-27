const Exception = require('../../exception');
const { get : getCode } = require('./statusCodes');

class NotAuthorizedDataException extends Exception {
    constructor(...params) {
        if (params.length == 0 || !params[0]) {
            params.push(getCode(1160));
        }

        super(...params);

        this.status = 401;
        this.code = 1060;
    }
}

module.exports = NotAuthorizedDataException;