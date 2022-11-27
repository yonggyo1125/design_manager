const managerDao = require('../../models/manager/dao');
/**
 * 회계 담당자
 * 
 */
module.exports = async () => {
    const accountants = await managerDao.getManagers("accountant");

    return accountants;
};