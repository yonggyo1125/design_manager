const Exception = require('../../exception');

/**
 * 등록되지 않은 주문 예외
 * 
 */
class OrderUpdateNotAuthorizedException extends Exception {
    constructor(...params) {
        if (params.length == 0 || !params[0]) {
            params.push("주문서 수정권한이 없습니다.");
        }

        super(...params);
    }
}

module.exports = OrderUpdateNotAuthorizedException;