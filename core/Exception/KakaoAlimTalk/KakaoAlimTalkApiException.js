const Exception = require('../../exception');

class KakaoAlimTalkApiException extends Exception {
    constructor(...params) {
        if (params.length == 0 || !params[0]) {
            params.push("알림톡 API 요청에 실패하였습니다.");
        }

        super(...params);
    }
}

module.exports = KakaoAlimTalkApiException;