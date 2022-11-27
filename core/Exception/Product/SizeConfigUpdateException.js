const Exception = require('../../exception');

/**
 * 사이즈 설정 수정 예외
 * 
 */
class SizeConfigUpdateException extends Exception {
    constructor(...params) {
        if (params.length == 0 || !params[0]) {
            params.push("사이즈 설정 수정에 실패하였습니다.");
        }

        super(...params);
    }
}

module.exports = SizeConfigUpdateException;