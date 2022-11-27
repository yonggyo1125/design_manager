const Exception = require('../../exception');

class KakaoAlimTalkUpdateException extends Exception {
    constructor(...params) {
        if (params.length == 0 || !params[0]) {
            params.push("템플릿 수정에 실패하였습니다.");
        }
        super(...params);
    }
}

module.exports = KakaoAlimTalkUpdateException;