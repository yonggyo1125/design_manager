const Exception = require('../../exception');

/**
 * 현금영수증 발급 예외 
 * 
 */
class CashReceiptIssueException extends Exception {
    constructor(...params) {
        if (params.length == 0 || !params[0]) {
            params.push("현금영수증 발급에 실패하였습니다.");
        }
        
        super(...params); 
    }
}

module.exports = CashReceiptIssueException;