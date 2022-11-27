const Sequelize = require('sequelize');

module.exports = class KakaoAlimTalkReservation extends Sequelize.Model {
    static init(sequelize) {
        return super.init({
            title : { // 설정명 
                type : Sequelize.STRING(60), 
                allowNull : false,
            },
            isUse : { // 사용여부
                type : Sequelize.BOOLEAN,
                defaultValue : false,
            },
            holidayType : { // 휴무일 구분
                type : Sequelize.ENUM('cs', 'delivery'),
                defaultVale : 'cs',
            },
            reservations : { // 전송가능 시간대
                type : Sequelize.JSON,
                allowNull : false,
            }
        }, {
            sequelize,
            timestamps : true,
            modelName : "KakaoAlimTalkReservation",
            tableName : "kakaoAlimTalkReservations",
            charset : "utf8mb4",
            collate : "utf8mb4_general_ci",
        });
    }

    static associate(db) {
        db.KakaoAlimTalkReservation.belongsTo(db.Manager, { foreignKey : 'idManager', targetKey : 'id' });
    }
}