const Sequelize = require('sequelize');
module.exports =  class ApiToken extends Sequelize.Model {
    static init(sequelize) {
        return super.init({
            apiKey : { // 요청 API Key
                type : Sequelize.UUID,
                primaryKey : true,
                allowNull : false,
            },
            accessToken : { // 접근 토큰
                type : Sequelize.UUID,
                allowNull : false,
            },
            refreshToken : { // 갱신 토큰   
                type : Sequelize.UUID,
                allowNull : false,
            },
            expiredAt : { // 접근코큰의 만료 일시 
                type : Sequelize.DATE,
                allowNull : false,
            },
        }, {
            sequelize,
            paranoid : false,
            timestamps : true,
            modelName : "ApiToken",
            tableName : "apiTokens",
            charset : "utf8mb4",
            collate : "utf8mb4_general_ci",
        })
    }

    static associate(db) {

    }
}