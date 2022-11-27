const Exception = require('../../exception');

/** 
 * 메뉴 수정 예외
 * 
*/
class MenuUpdateException extends Exception {
    constructor(...params) {
        if (params.length == 0 || !params[0]) {
            params.push('메뉴 수정에 실패하였습니다.');
        }
        
        super(...params);
    }
}

module.exports = MenuUpdateException;