const Exception = require('../../exception');

/** 
 * 메뉴 등록 예외
 * 
*/
class MenuRegisterException extends Exception {
    constructor(...params) {
        if (params.length == 0 || !params[0]) {
            params.push('메뉴 등록에 실패하였습니다.');
        }
        
        super(...params);
    }
}

module.exports = MenuRegisterException;