const Sequelize = require('sequelize');

/**
 * 배송업체 정보 
 * 
 */
module.exports = class DeliveryCompany extends Sequelize.Model {
    static init (sequelize) {
        return super.init({
            companyNm : { // 배송업체명 
                type : Sequelize.STRING(40),
                allowNull: false,
                primaryKey : true,
            },
            invoiceUrl : { // 배송조회 URL,
                type : Sequelize.STRING(255),
            },
            type : { // 배송방식(parcel - 택배배송, cargo - 화물배송, visit - 방문수령, )
                type : Sequelize.ENUM('parcel', 'cargo', 'visit', 'quick'),
                allowNull : false,
                defaultValue : 'parcel',
            },
            isUse : { // 사용여부 
                type : Sequelize.BOOLEAN,
                allowNull : false,
                defaultValue : false,
            },
            listOrder : { // 진열가중치 
                type : Sequelize.INTEGER,
                allowNull : false,
                defaultValue : 0,
            }
        }, {
            sequelize,
            paranoid : false,
            timestamps : true,
            modelName : "DeliveryCompany",
            tableName : "deliveryCompanies",
            charset : "utf8mb4",
            collate : "utf8mb4_general_ci",
        });
    }

    static associate(db) {

    }
}