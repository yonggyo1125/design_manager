const Exception = require('../../exception');

/** 
 * 메뉴 접속권한 예외
 * 
*/
class MenuAccessException extends Exception {
    constructor(...params) {
        if (params.length == 0 || !params[0]) {
            params.push('메뉴 접속권한이  없습니다.');
        }
        
        super(...params);
    }
}

module.exports = MenuNotFoundException;