const Sequelize = require('sequelize');

/**
 * 주문 처리상태 
 * 
 */
module.exports = class OrderStatus extends Sequelize.Model {
    static init (sequelize) {
        return super.init({
            statusCd : {
                type : Sequelize.STRING(20), // 처리상태 코드
                allowNull : false,
                primaryKey : true,
            },
            statusNm : {
                type : Sequelize.STRING(30),
                allowNull : false,
            },
            isUse : { // 사용 여부
                type : Sequelize.BOOLEAN,
                allowNull : false,
                defaultValue : false,
            },
            listOrder : { // 진열 가중치 
                type : Sequelize.INTEGER,
                defaultValue : 0,
            },
            setting : { // 기능설정
                type : Sequelize.JSON,
            }
        }, {
            sequelize,
            paranoid : false,
            timestamps : true,
            modelName : "OrderStatus",
            tableName : "orderStatuses",
            charset : "utf8mb4",
            collate : "utf8mb4_general_ci"
        });
    }

    static associate(db) {

    }
}