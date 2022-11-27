const Exception = require('../../exception');

class PaymentDoneException extends Exception {
    constructor(...params) {
        if (params.length == 0 || !params[0]) {
            params.push("결제 삭제에 실패하였습니다.");
        }
        
        super(...params);
    }
}

module.exports = PaymentDoneException;