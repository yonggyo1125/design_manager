const Exception = require('../../exception');

/**
 * 보드형 사이즈 수정 예외
 * 
 */
class BoardSizeUpdateException extends Exception {
    constructor(...params) {
        if (params.length == 0 || !params[0]) {
            params.push("보드형 사이즈 수정에 실패하였습니다.");
        }

        super(...params);
    }
}

module.exports = BoardSizeUpdateException;