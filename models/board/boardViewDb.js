const Sequelize = require('sequelize');


module.exports = class BoardView extends Sequelize.Model {
    static init(sequelize) {
        return super.init({
            idBoardData : { // 게시글 번호
                type : Sequelize.INTEGER.UNSIGNED,
                primaryKey : true,
                allowNull : false,
            },
            uid : { // 사용자별 UID
                type : Sequelize.STRING(50),
                primaryKey : true,
                allowNull : false,
            }
        }, {
            sequelize,
            timestamps : false,
            modelName : "BoardView",
            tableName : "boardViews",
            charset : "utf8mb4",
            collate : "utf8mb4_general_ci",
        });
    }

    static associate(db) {

    }
}