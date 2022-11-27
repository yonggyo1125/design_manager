const Exception = require('../../exception');

/**
 * 보드형 사이즈 추가설정 삭제 예외
 * 
 */
class BoardSizeAddDeleteException extends Exception {
    constructor(...params) {
        if (params.length == 0 || !params[0]) {
            params.push("보드형 사이즈 추가설정 삭제에 실패하였습니다.");
        }

        super(...params);
    }
}

module.exports = BoardSizeAddDeleteException;