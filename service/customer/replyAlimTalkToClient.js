const kakaoAlimTalkApi = require("../../service/kakaoAlimTalk/api");
const { getConfig } = require("../../library/common");

module.exports = async (id) => {
    if (!id) {
        return false;
    }

    const customerDao = require("../../models/customer/dao");
    const data = await customerDao.get(id);
    if (!data) {
        return false;
    }

    let mobile = data.cellPhone;
    if (!mobile || mobile.trim() == "") {
        return false;
    }

    mobile = mobile.replace(/\D/g, "");

    const config = await getConfig("csConfig");
    if (!config || config.useReplayAlim != '1' || !config.replyTmpltCode) {
        return false;
    }

    const result = await kakaoAlimTalkApi.send(config.replyTmpltCode, mobile, data);
    
    return result;
};