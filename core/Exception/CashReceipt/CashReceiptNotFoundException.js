const Exception = require('../../exception');

/**
 * 현금영수증 발급 기록 조회 예외
 * 
 */
class CashReceiptNotFoundException extends Exception {
    constructor(...params) {
        if (params.length == 0 || !params[0]) {
            params.push("현금영수증 발급기록 조회에 실패하였습니다.");
        }

        super(...params);
    }
}

module.exports = CashReceiptNotFoundException;