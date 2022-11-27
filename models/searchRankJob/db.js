const Sequelize = require('sequelize');

/**
 * 검색 순위 작업 
 */
module.exports = class SearchRankJob extends Sequelize.Model {
    static init(sequelize) {
        return super.init({
            keyword : { // 타겟 키워드 
                type : Sequelize.STRING(120),
                allowNull : false,
            },
            isUse : { // 사용여부
                type : Sequelize.BOOLEAN,
                allowNull : false,
                defaultValue : false,
            },
        }, {
            sequelize,
            paranoid : false,
            timestamps : true,
            modelName : "SearchRankJob",
            tableName : "searchRankJobs",
            charset : "utf8mb4",
            collate : "utf8mb4_general_ci",
        });
    }

    static associate(db) {
        db.SearchRankJob.belongsTo(db.Manager, { foreignKey : 'idManager', targetKey : 'id' });
    }
}