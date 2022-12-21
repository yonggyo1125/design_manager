const Sequelize = require('sequelize');

/**
 * 주문 상품 정보
 * 
 */
module.exports = class OrderItem extends Sequelize.Model {
    static init (sequelize) {
        return super.init({
            itemUid : {
                type : Sequelize.STRING(30),
                allowNull : false,
            },
            itemCode : { // 품목코드 
                type : Sequelize.STRING(20), 
            },
            itemNm : { // 품목명
                type : Sequelize.STRING(60),
                allowNull : false,
            },
            itemNmSub : { // 서브 품목명 
                type : Sequelize.STRING(60),
            },
            itemSizeWidth : { // 사이즈(너비),
                type : Sequelize.INTEGER.UNSIGNED,
                allowNull : false,
                defaultValue : 0,
            },
            itemSizeHeight : { // 사이즈(높이),
                type : Sequelize.INTEGER.UNSIGNED,
                allowNull : false,
                defaultValue : 0,
            },
            itemText : { // 문구 
                type : Sequelize.STRING(255),
            },
            itemFont : { // 폰트 
                type : Sequelize.STRING(255),
            },
            providerPrice : { // 구입가
                type : Sequelize.INTEGER.UNSIGNED,
                defaultValue : 0,
            },
            itemPrice : { // 판매원가
                type : Sequelize.INTEGER.UNSIGNED,
                allowNull : false,
                defaultValue : 0,
            },
            basicOptionPrice : { // 기본옵션 총합
                type : Sequelize.INTEGER,
                allowNull : false,
                defaultValue : 0,
            },
            subOptionPrice : { // 추가옵션 총합 
                type : Sequelize.INTEGER,
                allowNull : false,
                defaultValue : 0,
            },
            textOptionPrice : { // 텍스트옵션 총합
                type : Sequelize.INTEGER,
                allowNull : false,
                defaultValue : 0,
            },
            itemDiscount : { // 할인금액
                type : Sequelize.INTEGER.UNSIGNED,
                allowNull : false,
                defaultValue : 0,
            },
            itemDiscountVat : { // 할인금액 부가세
                type : Sequelize.INTEGER.UNSIGNED,
                allowNull : false,
                defaultValue : 0,
            },
            itemAdjust : { // 금액조정
                type : Sequelize.INTEGER,
                allowNull : false,
                defaultValue : 0,
            },
            itemCnt : { // 판매수량
                type : Sequelize.INTEGER.UNSIGNED,
                allowNull : false,
                defaultValue : 1,
            },
            itemMemo : { // 요청사항
                type : Sequelize.STRING(255),
            },
            itemTotalPrice : { // 품목별 총합
                type : Sequelize.INTEGER.UNSIGNED,
                allowNull : false,
                defaultValue : 0,
            },
            itemTotalPriceVat : { // 품목별 총합 부가세
                type : Sequelize.INTEGER.UNSIGNED,
                allowNull : false,
                defaultValue : 0,
            },
            deliveryChargeType : { // 배송료 구분(pre - 선불, post - 후불)
                type : Sequelize.ENUM('pre', 'post'),
                allowNull : false,
                defaultValue : "pre",
            },
            idDeliveryPolicy : { // 배송조건
                type : Sequelize.INTEGER,
            },
            deliveryType : { // 배송방식
                type : Sequelize.ENUM('parcel', 'cargo', 'quick', 'visit'),
                defaultValue : "parcel",
            },
            deliveryPolicy : { // 주문 시점 배송 조건 데이터
                type : Sequelize.JSON,
            },
            deliveryCompany : { // 배송업체
                type : Sequelize.STRING(30),
            },
            deliveryInvoice : { // 운송장번호 
                type : Sequelize.STRING(30)
            },
            preferredDeliveryReleasedDate : { // 출고희망일
                type : Sequelize.DATE,
            },
            deliveryReleasedDate : { // 출고일 
                type : Sequelize.DATE,
            },
            deliveryBundleCode : { // 묶음 배송 코드 
                type : Sequelize.STRING(30),
            },
            deliveryCharge : { //배송비 
                type : Sequelize.INTEGER.UNSIGNED,
                allowNull : false,
                defaultValue : 0,
            },
            deliveryChargeVat : { // 배송비 부가세
                type : Sequelize.INTEGER.UNSIGNED,
                allowNull : false,
                defaultValue : 0,
            },
            addDeliveryCharge : { // 추가 배송비
                type : Sequelize.INTEGER.UNSIGNED,
                defaultValue : 0,
            },
            addDeliveryChargeVat : { // 추가 배송비 부가세
                type : Sequelize.INTEGER.UNSIGNED,
                defaultValue : 0,
            },
            receiverNm : { // 수령인/업체명
                type : Sequelize.STRING(30),
            },
            receiverCellPhone : { // 수령인 휴대전화
                type : Sequelize.STRING(15),
            },
            receiverZonecode : {
                type : Sequelize.STRING(10), // 배송 우편번호
            },
            receiverAddress : { // 배송 주소 
                type : Sequelize.STRING(100),
            },
            receiverAddressSub : { // 배송 주소(나머지)
                type : Sequelize.STRING(100),
            },
            packageDelivery : { // 뮦음배송(package), 개별 배송(each) 여부 
                type : Sequelize.ENUM("package", "each"),
                allowNull : false,
                defaultValue : "package",
            },
            deliveryMemo : { // 배송메세지
                type : Sequelize.STRING(255),
            },
            designStatus : { // 디자인 상태 
                type : Sequelize.STRING(30),
                allowNull : false,
            },
            optionCds : { // 선택한 기본옵션코드
                type : Sequelize.STRING(150),
            },
            optionInfo : { // 선택한 기본옵션 정보
                type : Sequelize.JSON
            },
            subOptionCds : { // 선택한 추가옵션
                type : Sequelize.STRING(1000),
            },
            subOptionCdsCnt : { // 선택한 추가옵션 갯수
                type : Sequelize.STRING(1000),
            },
            subOptionInfo : { // 선택한 추가옵션 정보
                type : Sequelize.JSON
            },
            textOptionCds : { // 선택한 텍스트옵션
                type : Sequelize.STRING(1000),
            },
            textOptionInfo : { // 선택한 텍스트옵션 정보
                type : Sequelize.JSON
            },
            textOptionTexts : { // 입력한 텍스트
                type : Sequelize.JSON,
            },
            workStatus : { // 작업자 진행상황 (READY - 마감예정, DONE - 마감완료)
                type : Sequelize.ENUM('READY', 'DONE'),
                defaultValue : 'READY',
            },
            workFileName : { // 서버 등록 파일명
                type : Sequelize.STRING(255),
            },
            workMemo : { // 작업자 전달사항 
                type : Sequelize.STRING(255),
            },
            boardSizeType : { // 보드형 사이즈 방향
                type : Sequelize.ENUM('portrait', 'landscape'),
                defaultValue : 'portrait',
            },
            boardSize : { // 보드형 사이즈
                type : Sequelize.STRING(20),
                defaultValue : "direct",
            },
            itemShopSno : { // 쇼핑몰 품주 번호
                type : Sequelize.STRING(60),
            },
            fileLinks : { // 외부 첨부 파일 링크 
                type : Sequelize.TEXT,
            }
        }, {
            sequelize,
            paranoid : true,
            timestamps : true,
            modelName : "OrderItem",
            tableName : "orderItems",
            charset : "utf8mb4",
            collate : "utf8mb4_general_ci",
            indexes : [
                { unique : true, fields : ['itemUid'] },
                { unique : false, fields : ['idDeliveryPolicy']},
                { unique : false, fields : ['deliveryType'] },
                { unique : false, fields : ['deliveryReleasedDate'] },
                { unique : false, fields : ['createdAt'] },
                { unique : false, fields : ['designStatus'] },
            ],
        });
    }

    static associate(db) {
        db.OrderItem.hasMany(db.OrderItemSample, { foreignKey : 'idOrderItem', sourceKey : 'id'});

        db.OrderItem.belongsTo(db.OrderInfo, { foreignKey : 'orderNo', targetKey : 'orderNo'});

        db.OrderItem.belongsTo(db.ProductItem, { foreignKey : 'idProductItem', targetKey : 'id'});

        db.OrderItem.belongsTo(db.Manager, { foreignKey : "idDesigner", targetKey : 'id'});        
    }
}