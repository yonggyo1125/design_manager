const Sequelize = require('sequelize');

/**
 * 주문서 추가금액 
 * 
 */
module.exports = class OrderAddPayment extends Sequelize.Model {
    static init(sequelize) {
        return super.init({
            orderNo : { // 주문번호 
                type : Sequelize.BIGINT.UNSIGNED,
                allowNull : false,
            },
            itemNm : { // 추가항목 
                type : Sequelize.STRING(60),
                allowNull : false,
            },
            itemPrice : { // 추가 금액 
                type : Sequelize.INTEGER,
                allowNull : false,
                defaultValue : 0,
            },
            csMemo : { // 상담원 메모 
                type : Sequelize.TEXT,
            }
        }, {
            sequelize,
            paranoid : true,
            timestamps : true,
            modelName : "OrderAddPayment",
            tableName : "orderAddPayments",
            charset : "utf8mb4",
            collate : "utf8mb4_general_ci",
        });
    }

    static associate(db) {
        db.OrderAddPayment.belongsTo(db.Manager, { foreignKey : 'idManager', targetSource : 'id' });
    }  
}