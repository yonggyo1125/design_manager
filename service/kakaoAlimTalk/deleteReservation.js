const reservationDao = require("../../models/kakaoAlimTalk/reservationDao");
module.exports = async (ids) => {
    if (!ids) {
        throw new Error("삭제할 설정을 선택하세요.");
    }

    await reservationDao.delete(ids);

};