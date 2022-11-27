const guideDao = require("../../models/product/guideDao");

/**
 * 사용방법 안내 삭제
 * 
 * @param {*} ids 
 */
module.exports = async (ids) => {
    if (!ids) {
        throw new Error("삭제할 사용방법안내를 선택하세요.");
    }

    await guideDao.delete(ids);

};