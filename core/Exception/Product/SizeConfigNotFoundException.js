const Exception = require('../../exception');

class SizeConfigNotFoundException extends Exception {
    constructor(...params) {
        if (params.length == 0 || !params[0]) {
            params.push("등록되지 않은 사이즈 설정입니다.");
        }

        super(...params);
    }
}

module.exports = SizeConfigNotFoundException;