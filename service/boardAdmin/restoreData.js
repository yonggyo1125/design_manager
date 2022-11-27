const boardDataDao = require("../../models/board/boardDataDao");

/**
 * 게시글 복구
 * 
 * @param {*} ids 
 */
module.exports = async (ids) => {
    if (!ids) {
        throw new Error("잘못된 접근입니다.");
    }

    await boardDataDao.restore(ids);
};