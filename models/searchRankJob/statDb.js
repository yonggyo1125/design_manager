const Sequelize = require('sequelize');

/**
 * 검색 순위 작업 통계
 * 
 */
module.exports = class SearchRankJobStat extends Sequelize.Model {
    static init(sequelize) {
        return super.init({
            date : {
                type : Sequelize.INTEGER.UNSIGNED,
                allowNull : false,
                primaryKey : true,
            },
            keyword : {
                type : Sequelize.STRING(60),
                allowNull : false,
                primaryKey : true,
            },
            jobCount : {
                type : Sequelize.INTEGER.UNSIGNED, 
                allowNull : false,
                defaultValue : 1,
            },
            rankingJson : { // 실시간 랭킹
                type : Sequelize.JSON, 
            },
        }, {
            sequelize,
            paranoid : false,
            timestamps : false,
            modelName : "SearchRankJobStat",
            tableName : "searchRankJobStats",
            charset : "utf8mb4",
            collate : "utf8mb4_general_ci",
        })
    }

    static associate(db) {

    }
}