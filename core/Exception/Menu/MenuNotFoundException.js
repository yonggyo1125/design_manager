const Exception = require('../../exception');

/** 
 * 메뉴 없음 예외
 * 
*/
class MenuNotFoundException extends Exception {
    constructor(...params) {
        if (params.length == 0 || !params[0]) {
            params.push('등록되지 않은 메뉴 입니다.');
        }
        
        super(...params);
    }
}

module.exports = MenuNotFoundException;