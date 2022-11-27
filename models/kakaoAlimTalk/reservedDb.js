const Sequelize = require('sequelize');

/**
 * 예약 전송 목록
 * 
 */
module.exports = class KakaoAlimTalkReserved extends Sequelize.Model { 
    static init(sequelize) {
        return super.init({
            tmpltCode : {
                type : Sequelize.STRING(60),
                allowNull : false,
            },
            cellPhone : {
                type : Sequelize.STRING(11),
                allowNull : false,
            },
            replaceCodeData : {
                type : Sequelize.JSON,
                allowNull : false,
            },
            orderNo : {
                type : Sequelize.BIGINT,
            },
            holidayType : {
                type : Sequelize.ENUM('cs', 'delivery'),
                defaultValue : 'cs',
            },
            isSent : {
                type : Sequelize.BOOLEAN,
                defaultValue : false,
            },
        }, {
            sequelize,
            timestamps : true,
            modelName : "KakaoAlimTalkReserved",
            tableName : "kakaoAlimTalkReserveds",
            charset : "utf8mb4",
            collate : "utf8mb4_general_ci",
            indexes : [
                { unique : false, fields : ['tmpltCode'] },
                { unique : false, fields : ['cellPhone'] },
                { unique : false, fields : ['isSent'] },
            ],
            
        });
    }

    static associate(db) {

    }
}