const managerDao = require('../../models/manager/dao');
/**
 * 상당사 목록 조회
 * 
 */
module.exports = async () => {
    const csAgents = await managerDao.getManagers("cs");
    return csAgents;
};