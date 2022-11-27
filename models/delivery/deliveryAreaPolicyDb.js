const Sequelize = require('sequelize');

/**
 * 지역별 배송조건 
 * 
 */
module.exports = class DeliveryAreaPolicy extends Sequelize.Model {
    static init(sequelize) {
        return super.init({
            policyNm : { // 지역별 추가배송비명
                type : Sequelize.STRING(40),
                allowNull : false,
            },
            description : {
                type : Sequelize.STRING(100),
            },
        }, {
            sequelize,
            paranoid : true,
            timestamps : true,
            modelName : "DeliveryAreaPolicy",
            tableName : "deliveryAreaPolicies",
            charset : "utf8mb4",
            collate : "utf8mb4_general_ci",
        });
    }

    static associate(db) {
        db.DeliveryAreaPolicy.hasMany(db.DeliveryAreaCharge, { foreignKey : "idDeliveryAreaPolicy", sourceKey : "id"});
    }
}