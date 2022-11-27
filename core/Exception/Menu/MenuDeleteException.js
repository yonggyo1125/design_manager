const Exception = require('../../exception');

/** 
 * 메뉴 삭제 예외
 * 
*/
class MenuDeleteException extends Exception {
    constructor(...params) {
        if (params.length == 0 || !params[0]) {
            params.push('메뉴 삭제에 실패하였습니다.');
        }
        
        super(...params);
    }
}

module.exports = MenuDeleteException;