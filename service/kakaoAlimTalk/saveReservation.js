const reservationDao = require("../../models/kakaoAlimTalk/reservationDao");

/**
 * 예약설정 저장 처리 
 * 
 * @param {*} req 
 */
module.exports = async (req) => {
    const data = req.body;

    if (!data) {
        throw new Error("잘못된 접근입니다.");
    }

    if (data.mode == 'update' && !data.id) {
        throw new Error("잘못된 접근입니다.");
    }
    
    if (!data.title || data.title.trim() == "") {
        throw new Error("설정명을 입력하세요.");
    }

    if (!data.stime || data.stime.length == 0 || !data.etime || data.etime.length == 0) {
        throw new Error("전송가능시간대를 추가하세요.");
    }


    await reservationDao.save(data);
};