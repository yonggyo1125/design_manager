const Exception = require('../../exception');

/**
 * 관리레벨 삭제 예외
 * 
 */
class LevelDeleteException extends Exception {
    constructor(...params) {
        if (params.length == 0 || !params[0]) {
            params.push("관리레벨 수정에 실패하였습니다.");
        }

        super(...params);
    }
}

module.exports = LevelDeleteException;