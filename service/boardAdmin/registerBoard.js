const boardDao = require('../../models/board/boardDao');

/**
 * 게시판 등록
 * 
 * @param {*} req 
 */
module.exports = async (req) => {
    const data = req.body;
    /** 유효성 검사 S */
    const required = {
        id : "게시판 ID를 입력하세요",
        title : "게시판명을 입력하세요",
        skin : "게시판 스킨을 선택하세요.",
    };

    for (const key in required) {
        if (!data[key] || data[key].trim() == "") {
            throw new Error(required[key]);
        }
    }
    /** 유효성 검사 E */

    // 게시판 설정 저장
    const result = await boardDao.save(data);

    if (!result) {
        const msg = '게시판 설정 저장에 실패하였습니다.'; 
        throw new Error(msg);
    }
};