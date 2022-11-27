const Sequelize = require('sequelize');

/**
 * 지역별 배송비
 * 
 */
module.exports = class DeliveryAreaCharge extends Sequelize.Model {
    static init(sequelize) {
        return super.init({ 
            sido : { // 시도 
                type : Sequelize.STRING(40),
                primaryKey : true,
                allowNull : false,
            },
            sigugun : { // 시구군
                type : Sequelize.STRING(40),
                primaryKey : true,
            },
            idDeliveryAreaPolicy : { // 지역별 배송정책 id
                type : Sequelize.INTEGER,
                primaryKey : true,
                allowNull : false,
            },
            addCharge : { // 추가배송비
                type : Sequelize.INTEGER,
                allowNull : false,
                defaultValue : 0,
            }
        }, {
            sequelize,
            paranoid : false,
            timestamps : false,
            modelName : "DeliveryAreaCharge",
            tableName : "deliveryAreaCharges",
            charset : "utf8mb4",
            collate : "utf8mb4_general_ci",
        });
    }

    static associate(db) {
        db.DeliveryAreaCharge.belongsTo(db.DeliveryAreaPolicy, { foreignKey : "idDeliveryAreaPolicy", targetKey : "id"});
    }
}