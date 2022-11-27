const boardDao = require('../../models/board/boardDao');
/**
 * 스킨 목록 수정 
 * 
 * @param {*} req 
 */
module.exports = async (req) => {
    const data = req.body;
    let ids = data.id;
    if (!ids) {
        throw new Error("수정할 스킨을 선택하세요.");
    }

    if (!(ids instanceof Array)) {
        ids = [ids];
    }

    for await (const id of ids) {
        const upData = {
            id,
            skinNm : data[`skinNm_${id}`]
        };
        await boardDao.saveSkin(upData);
    }   
};