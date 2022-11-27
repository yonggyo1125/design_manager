const Sequelize = require('sequelize');

/** 품목 재고 */
module.exports = class ProductItemStock extends Sequelize.Model {
    static init (sequelize) {   
        return super.init({
            amount : {
                type : Sequelize.INTEGER,
                allowNull : false,
            },
            memo : {
                type : Sequelize.STRING(60),
                allowNull : false,
            }
        }, {
            sequelize,
            timestamps : true,
            modelName : "ProductItemStock",
            tableName : "productItemStocks",
            charset : "utf8mb4",
            collate : "utf8mb4_general_ci",
        });
    }

    static associate(db) {
        db.ProductItemStock.belongsTo(db.ProductItem, { foreignKey : "idProductItem", targetKey : "id" })
    }
}