const boardDao = require('../../models/board/boardDao');
const createNewSkin = require('./createNewSkin');
/**
 * 스킨 등록, 수정 
 * 
 * @param {*} req 
 */
module.exports = async (req) => {

    const data = req.body;
    /** 유효성 검사 S */
    const required = {
        id : "스킨 ID를 입력하세요",
        skinNm : "스킨명을 입력하세요.",
        skinType : "스킨 종류를 선택하세요.",        
    };

    for (const key in required) {
        if (!data[key] || data[key].trim() == "") {
            throw new Error(required[key]);
        }
    }
    /** 유효성 검사 E */

    /** 스킨 저장 처리 */
    await boardDao.saveSkin(data);

    /** 스킨 생성 처리 */
    await createNewSkin(data.id, data.skinType);

};