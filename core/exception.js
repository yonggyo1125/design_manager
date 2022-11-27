const commonLib = require("../library/common");
/**
 * 예외 재정의 
 * 
 */
class Exception extends Error {
    constructor(...params) {
        super(...params);

        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, Exception);
        }
        
        /** 로그 처리  */
        commonLib.logger(this);
    }
}

module.exports = Exception;