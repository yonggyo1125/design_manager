const guideDao = require('../../models/product/guideDao');

/**
 * 사용방법안내 조회
 * 
 * @param {*} id 
 */
module.exports = async (id) => {
    if (!id) {
        throw new Error("잘못된 접근입니다.");
    }

    const data = await guideDao.get(id);
    if (!data) {
        throw new Error("등록되지 않은 사용방법안내 입니다.");
    }
    
    return data;
};