const Sequelize = require("sequelize");

module.exports = class ProductCategory extends Sequelize.Model {
    static init(sequelize) {
        return super.init({
            cateType : { // 분류구분 (sale - 판매, material - 자재, etc - 기타)
                type : Sequelize.ENUM('sale', 'material', 'etc'),
                allowNull : false,
                defaultValue : 'sale',
            },
            cateCd : { // 분류코드
                type : Sequelize.STRING(20),
                unique : true,
                allowNull : false,
            },
            cateNm : { // 분류명
                type : Sequelize.STRING(30),
                allowNull : false,
            },
            listOrder : { // 진열 가중치
                type : Sequelize.INTEGER,
                defaultValue : 0,
            },
            bannerGroupCd : { // 배너 그룹 코드 
                type : Sequelize.STRING(30),
            },
            idProductGuide : { // 사용방법안내
                type : Sequelize.INTEGER.UNSIGNED,
            }
        }, {
            sequelize,
            paranoid : true,
            timestamps : true,
            modelName : "ProductCategory",
            tableName : "productCategories",
            charset : "utf8mb4",
            collate : "utf8mb4_general_ci",
        });
    }

    static associate(db) {
        db.ProductCategory.hasMany(db.ProductItem, { foreignKey : 'idProductCategory', onDelete : 'RESTRICT', sourceKey : 'id'});

        db.ProductCategory.belongsTo(db.SizeConfig, { foreignKey : 'idSizeConfig', targetKey : 'id' });
    }
}