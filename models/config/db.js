const Sequelize = require('sequelize');

module.exports = class Config extends Sequelize.Model {
    static init(sequelize) {
        return super.init({
            key : { // 설정 키 값
                type : Sequelize.STRING(30),
                allowNull : false,
                primaryKey : true,
            },
            value : { // 설정 값 
                type : Sequelize.JSON,
            },
        }, {
            sequelize,
            paranoid : false,
            timestamps : false,
            ModelName : "Config",
            tableName : "configs",
            charset : "utf8mb4",
            collate : "utf8mb4_general_ci",
        });
    }

    static associate(db) {

    }
}