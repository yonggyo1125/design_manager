const Sequelize = require('sequelize');

module.exports = class Level extends Sequelize.Model {
    static init(sequelize) {
        return super.init({
            level : { // 레벨 
                type : Sequelize.INTEGER.UNSIGNED,
                primaryKey : true,
                allowNull : false,
            },
            levelNm : { // 관리명
                type : Sequelize.STRING(60),
                allowNull : false,
            },
            roles : { // 역할
                type : Sequelize.JSON,
                allowNull : false,
            }
        }, {
            sequelize,
            paranoid : false,
            timestamps : false,
            modelName : "Level", 
            tableName : "levels",
            charset : "utf8mb4",
            collate : "utf8mb4_general_ci",
        });
    }

    static associate(db) {
        db.Level.hasMany(db.Manager, { foreignKey : 'managerLv', sourceKey : 'level' });
    }
}