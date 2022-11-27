const Exception = require('../../exception');

class SearchRankJobRegisterException extends Exception {
    constructor(...params) {
        if (params.length == 0 || !params[0]) {
            params.push("작업등록에 실패하였습니다.");
        }

        super(...params);
    }
}

module.exports = SearchRankJobRegisterException;