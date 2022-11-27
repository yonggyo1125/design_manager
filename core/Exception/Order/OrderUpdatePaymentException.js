const Exception = require('../../exception');

/**
 * 주문 추가금액 수정 예외 
 * 
 */
class OrderUpdatePaymentException extends Exception {
    constructor(...params) {
        if (params.length == 0 || !params[0]) {
            params.push("추가금액 수정에 실패하였습니다.");
        }

        super(...params);
    }
}

module.exports = OrderUpdatePaymentException;