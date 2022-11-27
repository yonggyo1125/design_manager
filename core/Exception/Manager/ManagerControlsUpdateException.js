const Exception = require('../../exception');

/** 
 * 탈퇴,이용제한 처리 예외 
 * 
*/
class ManagerControlsUpdateException extends Exception {
    constructor(...params) {
        if (params.length == 0 || !params[0]) {
            params.push("탈퇴/이용제한 처리에 실패하였습니다.");
        }

        super(...params);
    }
}

module.exports = ManagerControlsUpdateException;