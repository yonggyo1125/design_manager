const Sequelize = require('sequelize');

/**
 * 기본옵션 분류 
 *  
 */
module.exports = class ProductOption extends Sequelize.Model {
    static init(sequelize) {
        return super.init({
            cateNm : { // 옵션분류명
                type : Sequelize.STRING(40), 
                allowNull : false,
            },
            isUse : { // 사용여부
                type : Sequelize.BOOLEAN,
                allowNull : false,
                defaultValue : false,
            },
            listOrder : { // 진열가중치
                type : Sequelize.INTEGER,
                allowNull : false,
                defaultValue : 0,
            },
        }, {
            sequelize,
            paranoid : false,
            timestamps : true,
            modelName : "ProductOption",
            tableName : "productOptions",
            charset : "utf8mb4",
            collate : "utf8mb4_general_ci",
        });
    }

    static associate(db) {
        db.ProductOption.hasMany(db.ProductOptionItem, { foreignKey : 'idProductOption', sourceKey : 'id' });
        db.ProductOption.belongsTo(db.Manager, { foreignKey : 'idManager', targetKey : 'id'});
    }
}