const Sequelize = require('sequelize');

module.exports = class SimpleOrder extends Sequelize.Model {
    static init (sequelize) {
        return super.init({
            orderNm : { // 주문자명 
                type: Sequelize.STRING(30),
                allowNull: false,
            },
            cellPhone : {
                type : Sequelize.STRING(15),
                allowNull : false,
            },
            zonecode : { // 우편번호
                type : Sequelize.STRING(10),
                allowNull : false,
            },
            address : { // 주소 
                type : Sequelize.STRING(100),
                allowNull : false,
            },
            addressSub : { // 나머지 주소
                type : Sequelize.STRING(100),
            },
            productNm : {  // 주문상품 
                type : Sequelize.STRING(100),
            },
            orderMemo : { // 요청사항
                type : Sequelize.TEXT,
            }
        }, {
            sequelize,
            paranoid : true,
            timestamps : true,
            modelName : "SimpleOrder",
            tableName : "simpleOrders",
            charset: "utf8mb4",
            collate: "utf8mb4_general_ci",
        });
    }

    static associate(db) {

    }
};