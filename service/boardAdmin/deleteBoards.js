const boardDao = require('../../models/board/boardDao');

/**
 * 게시판 설정 목록 삭제 
 * 
 * @param {*} req 
 */
module.exports = async (req) => {
    const ids = req.body.id;
    if (!ids) {
        throw new Error("삭제할 게시판을 선택하세요.");
    }

    await boardDao.delete(ids);
};