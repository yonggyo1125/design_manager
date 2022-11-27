const Exception = require('../../exception');

class PaymentResultNotFoundException extends Exception {
    constructor(...params) {
        if (params.length == 0 || !params[0]) {
            params.push("등록되지 않은 결제내역 입니다.");
        }
        
        super(...params);
    }
}

module.exports = PaymentResultNotFoundException;