const Exception = require('../../exception');

class KakaoAlimTalkNotFoundException extends Exception {
    constructor(...params) {
        if (params.length == 0 || !params[0]) {
            params.push("템플릿 등록에 실패하였습니다.");
        }

        super(...params);
    }
}

module.exports = KakaoAlimTalkNotFoundException;