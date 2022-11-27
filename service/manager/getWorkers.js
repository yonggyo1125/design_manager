const managerDao = require('../../models/manager/dao')
/**
 * 작업자 목록 조회
 * 
 */
module.exports = async () => {
    const workers = await managerDao.getManagers("worker");
    return workers;
};