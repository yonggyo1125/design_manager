const Exception = require('../../exception');

class SearchRankJobDeleteException extends Exception {
    constructor(...params) {
        if (params.length == 0 || !params[0]) {
            params.push("작업 삭제에 실패하였습니다.");
        }
        
        super(...params);
    }
}

module.exports = SearchRankJobDeleteException;