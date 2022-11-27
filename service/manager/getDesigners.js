const managerDao = require('../../models/manager/dao');
/**
 * 디자이너 목록 조회
 * 
 */
module.exports = async () => {
  const designers = await managerDao.getManagers("designer");

  return designers;
};