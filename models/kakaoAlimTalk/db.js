const Sequelize = require('sequelize');

/**
 * 카카오 알림톡 전송 기록 
 * 
 */
module.exports = class KakaoAlimTalkHistory extends Sequelize.Model {
    static init(sequelize) {
        return super.init({
            msgIdx : {
                type : Sequelize.BIGINT.UNSIGNED,
                primaryKey : true,
                allowNull : false,
            },
            tmpltCode : { // 템플릿 코드
                type : Sequelize.STRING(40),
                allowNull : false,
            },
            tmpltNm : { // 템플릿명
                type : Sequelize.STRING(100),
                allowNull : false,
            },
            message : { // 템플릿 내용
                type : Sequelize.TEXT,
                allowNull : false,
            },
            recipient :  { // 수신자 전화번호
                type : Sequelize.STRING(20),
                allowNull : false,
            },
            biztalkUid :  { // 비즈톡에서 부여한 메시지 ID
                type : Sequelize.STRING(60),
            },
            responseCode  : {  // 비즈톡 G/W 접수결과 코드
                type : Sequelize.STRING(10),
            },
            resultCode  : { // 메시지 전송 결과
                type : Sequelize.STRING(10),
            },
            requestAt  : { // 벤더사 -> 수신자 발송 요청 시간
                type : Sequelize.DATE,
            },
            receivedAt : { // 벤더사 결과 수신 시간
                type : Sequelize.DATE,
            },
            bsid : { // 메시지 전송에 사용한 BS ID
                type : Sequelize.STRING(100),
            },
            sendType  : { // 발송 메시지 타입 구분 (K:카카오)
                type : Sequelize.CHAR(1),
            },
            orderNo : { // 주문번호
                type : Sequelize.BIGINT.UNSIGNED,
            }
        }, {
            sequelize,
            paranoid : true,
            timestamps : true,
            modelName : "KakaoAlimTalkHistory",
            tableName : "kakaoAlimTalkHistories",
            charset : "utf8mb4",
            collate : "utf8mb4_general_ci",
            indexes : [
                { unique : false, fields : ['tmpltCode']},
                { unique : false, fields : ['orderNo'] }
            ],
        });
    }

    static associate(db) {

    }
} 