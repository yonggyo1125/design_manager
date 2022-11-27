const Sequelize = require('sequelize');

module.exports = class BoardTemplate extends Sequelize.Model {
    static init(sequelize) {
        return super.init({
            title : { // 게시글 양식명 
                type : Sequelize.STRING(60),
                allowNull : false,
            },
            content : { // 게시글 내용  
                type : Sequelize.TEXT,
                allowNull : false,
            }
        }, {
            sequelize,
            timestamps : true,
            modelName : "BoardTemplate",
            tableName : "boardTemplates",
            charset : "utf8mb4",
            collate : "utf8mb4_general_ci",
            indexes : [
                { unique : false, fields : ['title'] },
            ],
        });
    }

    static associate(db) {

    }
}