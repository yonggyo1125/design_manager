const Exception = require('../../exception');

/**
 * 관리자 수정 예외
 * 
 */
class ManagerUpdateException extends Exception {
    constructor(...params) {
        if (params.length == 0 || !params[0]) {
            params.push("회원정보 수정에 실패하였습니다.");
        }
        super(...params);
    }
}

module.exports = ManagerUpdateException;