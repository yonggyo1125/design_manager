const managerDao = require("../../models/manager/dao");
const kakaoAlimTalkApi = require("../../service/kakaoAlimTalk/api");

const { getConfig } = require("../../library/common");

module.exports = async (id) => {
    if (!id) {
        return false;
    }

    const customerDao = require("../../models/customer/dao");
 
    const data = await customerDao.getApply(id);
    if (!data) {
        return false;
    }

    const config = await getConfig("csConfig");

    if (!config || config.useSendAlimToAdmin != '1' || !config.apiTmpltCode || !config.alimManagers || config.alimManagers.length == 0) {
        return false;
    }
    
    const managers = await managerDao.getByIds(config.alimManagers);
    if (!managers || managers.length == 0) {
        return false;
    }
    
    for (const manager of managers) {
        let mobile = manager.mobile;
        if (!mobile) continue;
        mobile = mobile.replace(/\D/g, "");

        await kakaoAlimTalkApi.send(config.apiTmpltCode, mobile, data);
    }

    return true;
};