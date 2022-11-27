const Sequelize = require('sequelize');

module.exports = class Skin extends Sequelize.Model {
    static init(sequelize) {
        return super.init({
            id : { // 스킨 ID
                type : Sequelize.STRING(30),
                primaryKey : true,
                allowNull : false,
            },
            skinNm : { // 스킨명
                type : Sequelize.STRING(60),
                allowNull : false,
            },
            skinType : { // 스킨 구분
                type : Sequelize.ENUM('default', 'gallery', 'qna', 'review'),
                defaultValue : 'default',
                allowNull : false,
            }
        }, {
            sequelize,
            timestamps : true,
            modelName : "Skin",
            tableName : "skins",
            charset : "utf8mb4",
            collate : "utf8mb4_general_ci",
        });
    }

    static associate(db) {
        db.Skin.belongsTo(db.Manager, { foreignKey : 'idManager', targetKey : 'id' });
        db.Skin.hasMany(db.Board, { foreignKey : 'skin', sourceKey : 'id' });
    }
}