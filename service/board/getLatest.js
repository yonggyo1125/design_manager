const boardDataDao = require('../../models/board/boardDataDao');

/**
 * 최신 게시글 조회
 * 
 */
module.exports = async (id, limit) => {
    limit = limit || 10;
    const list = await boardDataDao.gets(id, 1, limit);
    return list;

};  