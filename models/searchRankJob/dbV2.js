const Sequelize = require('sequelize');

/**
 * 검색순위 작업 V2
 * 
 */
module.exports = class SearchRankJobV2 extends Sequelize.Model {
    static init(sequelize) {
        return super.init({
            keyword : { // 타겟 키워드
                type : Sequelize.TEXT,
                allowNull : false,
            },
            isUse : { // 사용여부
                type : Sequelize.BOOLEAN,
                allowNull : false,
                defaultValue : false,
            }
        }, {
            sequelize,
            paranoid : false,
            timestamps : true,
            modelName : "SearchRankJobV2",
            tableName : "searchRankJobsV2",
            charset : "utf8mb4",
            collate : "utf8mb4_general_ci",
        })
    }

    static associate(db) {
        db.SearchRankJobV2.belongsTo(db.Manager, { foreignKey : 'idManager', targetKey : 'id' });
    }
}
