const Sequelize = require('sequelize');

module.exports = class SizeConfigDelivery extends Sequelize.Model {
    static init(sequelize) {
        return super.init({
            configNm : { // 설정 이름
                type : Sequelize.STRING(30),
                allowNull : false,
            },
            sizeType : { // 사이즈 타입
                type : Sequelize.ENUM("width", "height", "width_height"),
                allowNull : false,
                defaultValue : "width",
            },
            size : { // 기준 사이즈
                type : Sequelize.INTEGER,
                defaultValue : 0,
            }, 
            addPrice : { // 추가 배송비
                type : Sequelize.INTEGER,
                defaultValue : 0,
            }
        }, {
            sequelize,
            paranoid : false,
            timestamps : true,
            modelName : "SizeConfigDelivery",
            tableName : "sizeConfigDeliveries",
            charset : "utf8mb4",
            collate : "utf8mb4_general_ci",
        });
    }

    static associate(db) {

    }
}