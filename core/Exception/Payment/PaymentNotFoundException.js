const Exception = require('../../exception');

class PaymentNotFoundException extends Exception {
    constructor(...params) {
        if (params.length == 0 || !params[0]) {
            params.push("등록되지 읂은 결제입니다.");
        }

         super(...params);
    }
}

module.exports = PaymentNotFoundException;