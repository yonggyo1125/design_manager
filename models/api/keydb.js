const Sequelize = require('sequelize');

module.exports = class ApiKey extends Sequelize.Model {
    static init(sequelize) {
        return super.init({ 
            domain : {
                type : Sequelize.STRING(60),
                allowNull: false,
            },
            restKey : {
                type : Sequelize.UUID,
                allowNull : false,
            },
            javaScriptKey : {
                type : Sequelize.UUID,
                allowNull : false,
            },
            clientSecret : {
                type : Sequelize.UUID,
                allowNull : false,
            },
            redirectURL : {
                type : Sequelize.STRING(255),
                allowNull : false,
            },
        }, {
            sequelize,
            timestamps : true,
            modelName : "ApiKey",
            tableName : "apikeys",
            charset : "utf8mb4",
            collate : "utf8mb4_general_ci"
        });
    }

    static associate(db) {
        db.ApiKey.belongsTo(db.Manager, { foreignKey : 'idManager', targetKey : 'id' });
    }
}