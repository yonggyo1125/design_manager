const Sequelize = require('sequelize');

/**
 * 텍스트옵션 항목
 * 
 */
module.exports = class ProductTextOptionItem extends Sequelize.Model {
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
            maxLength : { // 입력제한 글자수
                type : Sequelize.INTEGER,
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
            modelName : "ProductTextOptionItem",
            tableName : "productTextOptionItems",
            charset : "utf8mb4",
            collate : "utf8mb4_general_ci",
        });
    }

    static associate(db) {
        db.ProductTextOptionItem.belongsTo(db.ProductTextOption, { foreignKey : 'idProductTextOption', target : 'id' });
    }
};