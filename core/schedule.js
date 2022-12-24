const schedule = require('node-schedule');
const kakaoAlimTalkApi =  require('../service/kakaoAlimTalk/api');
/**
 * 스케줄링 
 * 
 */
// 1분에 한번씩 실행
module.exports = (req, res, next) => {
    schedule.scheduleJob('0 */10 * * * *', () => {
      // 카카오 알림톡 전송 결과 업데이트 
      kakaoAlimTalkApi.updateSendResults();
    });

    schedule.scheduleJob('0 */20 * * * *', () => {
      kakaoAlimTalkApi.sendReserveds();
    });
    
    next();
};