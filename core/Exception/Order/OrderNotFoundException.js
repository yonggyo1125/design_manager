const Exception = require('../../exception');

/**
 * 등록되지 않은 주문 예외
 * 
 */
class OrderNotFoundException extends Exception {
    constructor(...params) {
        if (params.length == 0 || !params[0]) {
            params.push("등록되지 않은 주문입니다.");
        }
        
        super(...params);
    }
}

module.exports = OrderNotFoundException;