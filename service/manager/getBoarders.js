const managerDao = require('../../models/manager/dao');
/**
 * 게시판 관리자 목록 조회
 * 
 */
module.exports = async () => {
    const boarders = await managerDao.getManagers("board");
    return boarders;
};