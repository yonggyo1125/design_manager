const Exception = require('../../exception');

class SearchRankJobUpdateException extends Exception {
    constructor(...params) {
        if (params.length == 0 || !params[0]) {
            params.push('작업 수정에 실패하였습니다.');
        }
        
        super(...params);
    }
}

module.exports = SearchRankJobUpdateException;