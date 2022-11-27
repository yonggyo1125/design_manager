const boardTemplateDao = require("../../models/board/boardTemplateDao");

/**
 * 게시글 양식  저장
 * 
 * @param {*} req 
 */
module.exports = async (req) => {
    const data = req.body;
    if (!data.title || data.title.trim() == "") {
        throw new Error("양식명을 입력하세요.");
    }

    if (!data.content || data.content.trim() == "") {
        throw new Error("내용을 입력하세요.");
    }

    if (data.mode == 'update' && !data.id) {
        throw new Error("잘못된 접근입니다.");
    }
    
    await boardTemplateDao.save(data);
};