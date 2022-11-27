const { v4 : uuidv4 } = require("uuid");
const { TransientAccess } = require("../../models");
const deleteExpiredUrlAccessToken = require("./deleteExpiredUrlAccessToken");
/**
 * URL 접속 토큰 발급 
 * 
 * @param {*} url  - 접속을 허용할 URL 
 * @param {*} seconds - 접속 가능 유효기간
 */
module.exports = async (url, seconds) => {
    await deleteExpiredUrlAccessToken();
    seconds = seconds || 300; // 기본값은 5분
    const date = new Date();
    date.setSeconds(date.getSeconds() + seconds);
    const token = uuidv4();
    const data = await TransientAccess.create({
        token,
        url,
        expiredAt : date,     
    }, { raw : true });

    return data.token;

};