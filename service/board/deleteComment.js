const commentDao = require('../../models/board/commentDao');
const processWebHook = require("../../service/utils/processWebHook");

/**
 * 댓글 삭제 
 * 
 * @param {*} id 
 */
module.exports = async (id, req) => {
    if (!id) {
        throw new Error("잘못된 접근입니다.");
    }

    const result = await commentDao.delete(id);
    if (!result) {
        throw new Error("삭제에 실패하였습니다.");
    }

    if (req && req.board) {
        const board = req.board;
        /** 댓글 웹훅 처리 S */
        if (board.webhookUrlsArr) {
            for(const url of board.webhookUrlsArr) {
            
                const sendData = { mode : "delete_comment", id };
                await processWebHook(url, sendData);
            }
        }
        /** 댓글글 웹훅 처리 E */
    }
};