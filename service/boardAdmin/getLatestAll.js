const getLatest = require("../board/getLatest");
const boardDao = require("../../models/board/boardDao");

/**
 * 전체 게시판에 최신 게시글 노출
 * 
 */
module.exports = async (limit) => {
    const boards = await boardDao.gets(1, "all");
    if (!boards && boards.length == 0) {
        return false;
    }

    const data = [];
    limit = limit || 10;

    for await (const board of boards) {
        const list = await getLatest(board.id, limit);
        data.push({
            id : board.id,
            title : board.title,
            list,
        });
    }
    
    return data;
};