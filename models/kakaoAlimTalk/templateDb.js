const Sequelize = require('sequelize');

/**
 * 카카오 알림톡 템플릿
 * 
 */
module.exports = class KakaoAlimTalkTemplate extends Sequelize.Model {
    static init(sequelize) {
        return super.init({
            tmpltCode : { // 템플릿 코드
                type : Sequelize.STRING(40),
                allowNull : false,
                primaryKey : true,
            },
            tmpltNm : { // 템플릿명
                type : Sequelize.STRING(100),
                allowNull : false,
            },
            messageType : { // 알림톡 유형 
                type : Sequelize.ENUM("AT", "AI"),
                defaultValue : "AT",
                allowNull : false,
            },
            message : { // 템플릿 내용
                type : Sequelize.TEXT,
                allowNull : false,
            },
            buttonType : {
                type : Sequelize.ENUM('none', 'web', 'delivery'),
                defaultValue : "none",
                allowNull : false,
            },
            buttons : { // 버튼명, 버튼 URL 
                type : Sequelize.JSON,
            },
            useReservation : { // 예약전송 사용 여부
                type : Sequelize.BOOLEAN,
                defaultValue : false,
            },
            idSendReservation : { // 예약전송 설정 선택
                type : Sequelize.INTEGER.UNSIGNED,
                defaultValue : 0,
            },
            useAddChannel : { // 채널 추가 사용 여부
                type : Sequelize.BOOLEAN,
                defaultValue : false,
            },
            channelNm : { // 채널명
                type : Sequelize.STRING(60),
            }
        }, {
            sequelize,
            paranoid : false,
            timestamps : true,
            modelName : "KakaoAlimTalkTemplate",
            tableName : "kakaoAlimTalkTemplates",
            charset : "utf8mb4",
            collate : "utf8mb4_general_ci",
            indexes : [
                { unique : false, fields : ['useReservation'] }
            ],
        });
    }

    static associate(db) {
        db.KakaoAlimTalkTemplate.belongsTo(db.Manager, { foreignKey : 'idManager', targetKey : 'id' });
    }
}