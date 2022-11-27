const reservationDao = require('../../models/kakaoAlimTalk/reservationDao');

/**
 * 전송 예약 취소
 * @param {*} ids 
 */
module.exports = async (ids) => {
    if (!ids) {
        throw new Error("전송예약을 취소할 등록건을 선택하세요.");
    }

    await reservationDao.cancelReserved(ids);
};