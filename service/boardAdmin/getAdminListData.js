const boardDao = require('../../models/board/boardDao');
const boardDataDao = require('../../models/board/boardDataDao');

module.exports = async (req) => {
    const id = req.params.id;
    if (!id) {
        throw new Error("잘못된 접근입니다.");
    }

    const board = await boardDao.get(id);
    if (!board) {
        throw new Error("등록되지 않은 게시판 입니다.");
    }
            
    const search = req.query;
    search.includeDeleted = true; // 삭제된 목록 포함 
    const list = await boardDataDao.gets(id, search.page, search.limit, req, search);
    const pagination = boardDataDao.pagination;
    const total = boardDataDao.total;
    
    const data = {
                board,
                list,
                pagination,
                total
            };

    return data;
};