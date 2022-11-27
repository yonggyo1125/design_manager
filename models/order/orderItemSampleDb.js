const Sequelize = require('sequelize');

/**
 * 주문 상품 샘플 정보
 * 
 */
module.exports = class OrderItemSample extends Sequelize.Model {
    static init (sequelize) {
        return super.init({
            itemCd : { // 샘플번호 
                type : Sequelize.STRING(30),
                allowNull : false,
            },
            itemNm : { // 샘플명 
                type : Sequelize.STRING(100),
            },
            downloadLink : { // 샘플 이미지 다운로드 링크 
                type : Sequelize.STRING(255),
            },
            aiDownloadLink : { // 샘플 ai 파일 다운로드 링크 
                type : Sequelize.STRING(255),
            },
        }, {
            sequelize,
            paranoid : true,
            timestamps : true,
            modelName : "OrderItemSample",
            tableName : "orderItemSamples",
            charset : "utf8mb4",
            collate : "utf8mb4_general_ci",
        });
    }

    static associate(db) {
        db.OrderItemSample.belongsTo(db.OrderItem, { foreignKey : 'idOrderItem', targetKey : 'id'});
    }
}