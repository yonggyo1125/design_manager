const boardDataDao = require('../../models/board/boardDataDao');


/**
 * 게시글 완전 삭제
 * 
 * @param {*} req 
 */
module.exports = async (req, isForce) => {
    let ids = req.body.id;
    isForce = isForce ? true : false;
    if (!ids) {
        throw new Error("잘못된 접근입니다.");
    }
    
    if (!(ids instanceof Array)) {
        ids = [ids];
    }

    const result = await boardDataDao.delete(ids, isForce);
    if (!result) {
        throw new Error("삭제에 실패하였습니다.");
    }
};