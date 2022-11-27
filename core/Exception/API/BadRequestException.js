const Exception = require('../../exception');
const { get : getCode } = require('./statusCodes');

class BadRequestException extends Exception {
    constructor(...params) {
        if (params.length == 0 || !params[0]) {
            params.push(getCode(400));
        }

        super(...params);
        
        this.status = 400;
        this.code = 400;
    }
}

module.exports = BadRequestException;