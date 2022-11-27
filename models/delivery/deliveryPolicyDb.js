const Sequelize = require('sequelize');

/**
 * 배송조건 
 * 
 */
module.exports = class DeliveryPolicy extends Sequelize.Model {
    static init(sequelize) {
        return super.init({
            policyNm : { // 배송비조건명
                type : Sequelize.STRING(40),
                allowNull : false,
            },
            description : {
                type : Sequelize.STRING(100),
            },
            deliveryType : { // 배송방식
                type : Sequelize.STRING(50),
                allowNull : false,
                defaultValue : "parcel",
            },
            deliveryChargeType : { // 배송비 유형
                type : Sequelize.ENUM('fixed', 'free', 'price', 'count', 'weight'),
                allowNull : false,
                defaultValue : 'fixed',
            },
            deliveryCollectType : { // 배송비 결제방법
                type : Sequelize.ENUM('pre', 'post'),
                allowNull : false,
                defaultValue : 'pre',
            },
            useDeliveryAreaPolicy : { // 지역별 추가배송비 사용여부
                type : Sequelize.BOOLEAN,
                allowNull : false,
                defaultValue : false,
            },
            idDeliveryAreaPolicy : { // 지역별 배송비 정책 
                type : Sequelize.INTEGER,
            },
            deliveryCharge : { // 고정배송비
                type : Sequelize.INTEGER, 
                defaultValue : 0,
            },
            useRangeRepeat : { // 범위 반복 설정 사용
                type : Sequelize.BOOLEAN,
                defaultValue : false,
            },
            rangeDeliveryCharge : { // 구간 배송비 정책
                type : Sequelize.JSON,
            },
            addPriceCargo : { // 화물배송 추가배송비
                type : Sequelize.INTEGER.UNSIGNED,
                defalutValue : 0,
            },
            addPriceQuick : { // 퀵배송 추가배송비
                type : Sequelize.INTEGER.UNSIGNED,
                defaultValue : 0,
            },
        }, {
            sequelize,
            paranoid : true,
            timestamps : true,
            modelName : "DeliveryPolicy",
            tableName : "deliveryPolicies",
            charset : "utf8mb4",
            collate : "utf8mb4_general_ci",
        });
    }

    static associate(db) {

    }
}