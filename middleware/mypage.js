const { alert } = require('../library/common');
const { URL } = require("url");
const getUrlAccessToken = require("../service/utils/getUrlAccessToken");

/** 
 * 마이페이지 관련 권한 체크 
 * 
 */
module.exports = {
    /**
     * 휴대전화번호로 주문이 있는지 체크 진행 여부
     * 
     * @param {*} req 
     * @param {*} res 
     * @param {*} next 
     */
    async guestAuth(req, res, next) {
        req.passCheckAccess  = false;
        const result = await checkAccessToken(req);
        if (result) {
            req.passCheckAccess = true;
            return next();
        }

        if (!req.session.guestCellPhone) {
            return alert("접근 권한이 없습니다.", res, "/mypage");
        }

        next();
    }
};

/**
 * 접속 토큰 체크
 * 
 * @param {*} req 
 */
async function checkAccessToken(req) {
    const requestURL = "http://" + req.host + req.requestURL;
    
    const url = new URL(requestURL);
    const uri = url.pathname;
    const token = req.query.token;
    if (!token) {
        return false;
    }

    const data = await getUrlAccessToken(token, uri);

    return data;

}
