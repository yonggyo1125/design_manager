const Exception = require('../../exception');

class PaymentUpdateException extends Exception {
    constructor(...params) {
        if (params.length == 0 || !params[0]) {
            params.push("결제 수정에 실패하였습니다.");
        }

        super(...params);
    }
}

module.exports = PaymentUpdateException;