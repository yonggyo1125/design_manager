const { alert } = require("../library/common");

/**
 * 관리자 관련 유효성 검사 
 * 
 */
module.exports = {
    /**
     * 관리자 레벨별 접근 가능 여부 체크 
     * 
     */
    managerAuth(managerLv)  {
        return (req, res, next) => {
            next();
        };
    },
    /**
     * 비회원만 접속 여부 체크 
     * 
     */
    guestOnly(req, res, next) {
        if (req.isLogin) {
            return alert("접근 권한이 없습니다.", res, -1);
        }
        next();
    },
    /**
     * 관리자만 접속 여부 체크 
     *  
     */
    managerOnly(req, res, next) {
        if (!req.isLogin) {
            const url = "/manager/login?requestURL=" + encodeURIComponent(req.requestURL);
            return alert("접근 권한이 없습니다.", res, url);
        }
        next();
    }
};