const Exception = require('../exception');

/**
 * 접속권한이 없는 페이지 접속 예외
 * 
 */
class NotAuthorizedException extends Exception {
    constructor(...params) {
        if (params.length == 0 || !params[0]) {
            params.push("접속권한이 없는 페이지에 접속하셨습니다.");
        }

        super(...params);
    }
}

module.exports = NotAuthorizedException;