const Sequelize = require('sequelize');

module.exports = class ApiCode extends Sequelize.Model {
    static init(sequelize) {
        return super.init({
            code : { // 인증 코드
                type : Sequelize.UUID,
                primaryKey : true,
            },
            apiKey : { // API 키
                type : Sequelize.UUID,
                allowNull : false,
            },
            expiredAt : { // 키 만료 일시 
                type : Sequelize.DATE,
                allowNull : false,
            }
        }, {
            sequelize,
            paranoid : false,
            timestamps : true,
            modelName : "ApiCode",
            tableName : "apiCodes",
            charset : "utf8mb4",
            collate : "utf8mb4_general_ci",
        });
    }

    static associate(db) {

    }
} 