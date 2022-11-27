const Sequelize = require('sequelize');

module.exports = class BoardSizeAdd extends Sequelize.Model {
    static init (sequelize) {
        return super.init({
            configNm : { // 설정명
                type : Sequelize.STRING(30),
                allowNull : false,
            },
            minPrice : { // 최소단가 
                type : Sequelize.INTEGER,
                defaultValue : 0,
            },
            addPriceByArea : { // 면적별 추가금액 
                type : Sequelize.STRING(255),
            },
            exceptMinSize : {  // 기본헤베 적용제외
                type : Sequelize.TINYINT,
                defaultValue : 0,
            },
            minSize : {  // 최소면적
                type : Sequelize.INTEGER,
                defaultValue : 0,
            },
            maxSize : { // 최대면적
                type : Sequelize.INTEGER,
                defaultValue : 0,
            },
        }, {
            sequelize,
            paranoid : false,
            timestamps : true,
            modelName : "BoardSizeAdd",
            tableName : "boardSizeAdds",
            charset : "utf8mb4",
            collate : "utf8mb4_general_ci",
        });
    }

    static associate(db) {

    }
}