const Exception = require('../../exception');

class PaymentCancelException extends Exception {
    constructor(...params) {
        if (params.length == 0 || !params[0]) {
            params.push('결제 취소에 실패하였습니다.');
        }
        
        super(...params);
    }
}

module.exports = PaymentCancelException;