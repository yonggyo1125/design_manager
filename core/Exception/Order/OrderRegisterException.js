const Exception = require('../../exception');

/**
 * 주문등록 예외
 * 
 */
class OrderRegisterException extends Exception {
    constructor(...params) {
        if (params.length == 0 || !params[0]) {
            params.push("주문등록에 실패하였습니다.");
        }

        super(...params);
    }
}

module.exports = OrderRegisterException;