const Sequelize = require("sequelize");

/**
 * 검색 순위 로그 기록
 * 
 */
module.exports = class SearchRankLog extends Sequelize.Model {
    static init(sequelize) {
        return super.init({
            jobType : {
                type : Sequelize.ENUM('START', 'DONE'),
                allowNull : false,
                defaultValue : "START",
            },
            keyword : {
                type : Sequelize.STRING(100),
                allowNull : false,
            },
            deviceType : {
                type : Sequelize.ENUM("PC", "Mobile"),
                allowNull : false,
                defaultValue : "PC",
            }
        }, {
            sequelize,
            paranoid : false, 
            timestamps : true,
            modelName : "SearchRankLog",
            tableName : "SearchRankLog",
            charset : "utf8mb4",
            collate : "utf8mb4_general_ci",
        })
    }

    static associate(db) {

    }
};