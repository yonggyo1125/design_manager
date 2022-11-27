const Exception = require('../../exception');

/**
 * 주문 추가금액 취소 예외
 * 
 */
class OrderDeletePaymentException extends Exception {
    constructor(...params) {
        if (params.length == 0 || !params[0]) {
            params.push("추가금액 등록 취소에 실패하였습니다");
        }

        super(...params);
    }
}

module.exports = OrderDeletePaymentException;