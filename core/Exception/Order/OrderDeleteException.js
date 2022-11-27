const Exception = require('../../exception');

/**
 * 주문삭제 예외
 * 
 */
class OrderDeleteException extends Exception {
    constructor(...params) {
        if (params.length == 0 || !params[0]) {
            params.push("주문삭제에 실패하였습니다.");
        }

        super(...params);
    }
}

module.exports = OrderDeleteException;
