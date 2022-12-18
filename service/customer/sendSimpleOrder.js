const kakaoAlimTalkApi = require("../../service/kakaoAlimTalk/api");

/**
 * 간편 주문서 전송 
 * 
 * @param {*} mobile 
 * @returns 
 */
module.exports = async (mobile, name, host) => {
    if (!mobile || mobile.trim() == "") {
        return false;
    }
    name = name || "고객";
    mobile = mobile.replace(/\D/g, "");
    const url = host + "/simple";
    const data = {
        customerNm : name,
        url,
    };
    const result = await kakaoAlimTalkApi.send("sendSimpleOrder", mobile, data);   
    return result;  
};