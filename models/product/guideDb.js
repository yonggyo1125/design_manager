const Sequelize = require('sequelize');

/**
 * 사용방법 안내 
 */
module.exports = class ProductGuide extends Sequelize.Model {
    static init (sequelize) {
        return super.init({
            gid : {
                type : Sequelize.STRING(60),
                allowNull : false,
            },
            title : { // 안내명
                type : Sequelize.STRING(100),
                allowNull : false,
            },
            content : { // 안내문구
                type : Sequelize.TEXT,
            },
        }, {
            sequelize,
            timestamps : true,
            modelName : "ProductGuide",
            tableName : "productGuides",
            charset : "utf8mb4",
            collate : "utf8mb4_general_ci",
            indexes : [{ unique : false, fields : ['gid']}]
        });
    }

    static associate(db) {

    }
}