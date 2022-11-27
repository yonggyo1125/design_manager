const Sequelize = require('sequelize');

/**
 * 기본옵션 항목
 * 
 */
module.exports = class ProductOptionItem extends Sequelize.Model {
    static init(sequelize) {
        return super.init({
            optionCd : { // 옵션 코드
                type : Sequelize.STRING(40),
                allowNull : false,
                primaryKey : true,
            },
            optionNm : { // 옵션명
                type : Sequelize.STRING(40),
                allowNull : false,
            },
            addPrice : { // 추가비용
                type : Sequelize.INTEGER,
                allowNull : false,
                defaultValue : 0,
            },
            isUse : { // 사용여부
                type : Sequelize.BOOLEAN,
                allowNull : false,
                defaultValue : false,
            },
            listOrder : { // 진열가중치
                type : Sequelize.INTEGER,
                defaultValue : 0,
            },
        }, {
            sequelize,
            paranoid : false,
            timestamps : true,
            modelName : "ProductOptionItem",
            tableName : "productOptionItems",
            charset : "utf8mb4",
            collate : "utf8mb4_general_ci",
        })
    }

    static associate(db) {
        db.ProductOptionItem.belongsTo(db.ProductOption, { foreignKey : 'idProductOption', targetKey : 'id' });
    }
}