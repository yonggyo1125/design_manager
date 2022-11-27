const Exception = require('../../exception');

/**
 * 등록되지 않은 관리자 예외
 * 
 */
class ManagerNotFoundException extends Exception {
    constructor(...params) {
        if (params.length == 0 || !params[0]) {
            params.push("등록되지 않은 관리자 입니다.");
        }
        
        super(...params);
    }
}

module.exports = ManagerNotFoundException;