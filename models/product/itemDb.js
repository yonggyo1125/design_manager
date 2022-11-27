const Sequelize = require('sequelize');

module.exports = class ProductItem extends Sequelize.Model {
    static init (sequelize) {
        return super.init({
            itemType : { // 품목구분(head - 본사, branch - 지사, company - 거래처)
                type : Sequelize.ENUM('head', 'branch', 'company'),
                allowNull : false,
                defaultValue : 'head',
            },
            itemCode : { // 품목코드 
                type : Sequelize.STRING(20),
                allowNull : false,
            },
            itemNm : { // 품목명
                type : Sequelize.STRING(60),
            },
            provider : { // 구입처
                type : Sequelize.STRING(40),
            },
            providerPrice : { // 예상구입가
                type : Sequelize.INTEGER.UNSIGNED,
                allowNull : false,
                defaultValue : 0,
            },
            itemPrice : { // 판매원가
                type : Sequelize.INTEGER.UNSIGNED,
                allowNull : false,
                defaultValue : 0,
            },
            texture : { // 재질
                type : Sequelize.STRING(60),
            },
            itemSize : { // 사이즈 
                type : Sequelize.STRING(60),
            },
            itemSaleUnit : { // 판매단위
                type : Sequelize.INTEGER.UNSIGNED,
                allowNull : false,
                defaultValue : 1,
            },
            stockType : { // 재고구분 yard - 길이(yard), ea - 수량(매/본)
                type : Sequelize.ENUM('yard', 'ea'),
                defaultValue : 'ea',
            },
            useStock : { // 재고 차감 사용여부, false - 무제한  
                type : Sequelize.BOOLEAN,
                defaultValue : false,
            },
            memo : {  // 특이사항 
                type : Sequelize.TEXT,
            },
            designAmPm : { // 디자인 시안 확정시간(오전/오후)
                type : Sequelize.ENUM('am', 'pm'),
                allowNull : false,
                defaultValue : 'pm',
            },
            designHour : { // 디자인 시안 확정시간
                type : Sequelize.TINYINT.UNSIGNED,
                allowNull : false,
                defaultValue : 0,
            },
            deliveryAddDay : { // 출고일 기준
                type : Sequelize.TINYINT.UNSIGNED,
                allowNull : false,
                defaultValue : 1,
            },
            deliveryHour : { // 출고 시간 기준
                type : Sequelize.TINYINT.UNSIGNED,
                allowNull : false,
                defaultValue : 0,
            },
            idOptions : { // 기본옵션
                type : Sequelize.STRING(100),
            },
            idSubOptions : { // 추가옵션
                type : Sequelize.STRING(100),
            },
            idTextOptions : { // 텍스트 옵션
                type : Sequelize.STRING(100),
            },
            listOrder : { // 진열 가중치 
                type : Sequelize.INTEGER,
                defaultValue : 0,
            },
            idSizeConfig : { // 사이즈 계산기 설정
                type : Sequelize.INTEGER,
            },
            idDeliveryPolicies : { // 품목별 배송정책
                type : Sequelize.STRING(100),
            }
        }, {
            sequelize,
            paranoid : true,
            timestamps : true,
            modelName : "ProductItem",
            tableName : "productItems",
            charset: "utf8mb4",
            collate : "utf8mb4_general_ci",
        });
    }

    static associate(db) {
        db.ProductItem.belongsTo(db.ProductCategory, { foreignKey : 'idProductCategory', targetKey : 'id' });

        db.ProductItem.belongsTo(db.Company, { foreignKey : 'idCompany', targetKey : 'id'});

        db.ProductItem.hasMany(db.ProductItemStock, { foreignKey : "idProductItem", sourceKey : "id"});
       
    }
}