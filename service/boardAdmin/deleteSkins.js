const boardDao = require('../../models/board/boardDao');
const deleteSkinDir = require('./deleteSkinDir');
/**
 * 스킨 목록 삭제 
 * 
 * @param {*} req 
 */
module.exports = async (req) => {
    const data = req.body;
    let ids = data.id;
    if (!ids) {
        throw new Error("수정할 스킨을 선택하세요.");
    }

    await boardDao.deleteSkins(ids);

    /** 스킨 폴더 삭제 */
    await deleteSkinDir(ids);
};