const boardDataDao = require('../../models/board/boardDataDao');
/**
 * 게시글 목록 조회 
 * 
 * @param {*} req 
 */
module.exports = async (req) => {
    const id = req.params.id || req.query.id;

    if (!id) {
        throw new Error("잘못된 접근입니다.");
    }
    const board = req.board;
    const search = req.query;
    const page = search.page || 1;
    const limit = board.rowsPerPage || 20;
    const list = await boardDataDao.gets(id, page, limit, req, search);

    return {
        list,
        search, 
        page,
        limit,
        pagination : boardDataDao.pagination,
        total : boardDataDao.total,
    }
};