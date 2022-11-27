const Exception = require('../../exception');

/**
 *  등록되지 않은 주문상태 예외 
 * 
 */
class OrderStatusNotFoundException extends Exception {
    constructor(...params) {
        if (params.length == 0 || !params[0]) {
            params.push("등록되지 않은 주문 처리상태입니다.");
        }

        super(...params);
    }
}

module.exports = OrderStatusNotFoundException;