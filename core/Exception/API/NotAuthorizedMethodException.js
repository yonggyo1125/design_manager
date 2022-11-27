const Exception = require('../../exception');
const { get : getCode } = require('./statusCodes');

class NotAuthorizedMethodException extends Exception {
    constructor(...params) {
        if (params.length == 0 || !params[0]) {
            params.push(getCode(405));
        }
        
        super(...params);
        
        this.status = 405;
        this.code = 405;
    }
}

module.exports = NotAuthorizedMethodException;