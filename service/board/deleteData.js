const boardDataDao = require('../../models/board/boardDataDao');
const processWebHook = require("../../service/utils/processWebHook");

/**
 * 게시글 또는 댓글 삭제
 * @param {*} req 
 */
module.exports = async (req) => {
    const board = req.board;
    const boardData = req.boardData;
    if (!boardData) {
        throw new Error("잘못된 접근입니다.");
    }
    
    const result = await boardDataDao.delete(boardData.id);
    if (!result) {
        throw new Error("삭제에 실패하였습니다.");
    }

    /** 게시글 웹훅 처리 S */
    if (board.webhookUrlsArr) {
      
        for(const url of board.webhookUrlsArr) {
            const sendData = { mode : "delete", id : boardData.id };
            await processWebHook(url, sendData);
        }
    }
    /** 게시글 웹훅 처리 E */
};