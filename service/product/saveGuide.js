const guideDao = require('../../models/product/guideDao');

/**
 * 사용방법 안내 저장
 * @param {*} req 
 */
module.exports = async (req) => {
    const data = req.body;
    if (!data.title || data.title.trim() == "") {
        throw new Error("안내명을 입력하세요.");
    }

    if (!data.gid) {
        throw new Error("잘못된 접근입니다.");
    }

    if (data.mode == 'update') {
        if (!data.id) {
            throw new Error("잘못된 접근입니다.");
        }
    }

    await guideDao.save(data);
};