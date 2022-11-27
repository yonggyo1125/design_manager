const Exception = require('../../exception');

/**
 * 관리레벨 등록 예외
 * 
 */
class LevelRegisterException extends Exception {
    constructor(...params) {
        if (params.length == 0 || !params[0]) {
            params.push('관리레벨 등록에 실패하였습니다.');
        }

        super(...params);
    }
}

module.exports = LevelRegisterException;