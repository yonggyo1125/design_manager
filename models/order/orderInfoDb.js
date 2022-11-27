const Sequelize = require('sequelize');

/**
 * 주문 정보 
 * 
 */
module.exports = class OrderInfo extends Sequelize.Model {
    static init (sequelize) {
        return super.init({
            orderNo : { // 주문번호 
                type : Sequelize.BIGINT.UNSIGNED,
                primaryKey : true,
            },
            shopOrderNo : { // 쇼핑몰 주문번호
                type : Sequelize.STRING(45)
            },
            channel : { // 유입경로
                type : Sequelize.STRING(50),
                allowNull : false,
                defaultValue : "본사",
            },
            orderStatus : { // 처리상태
                type : Sequelize.STRING(30),
                allowNull : false,
            },
            orderNm : { // 주문자명
                type : Sequelize.STRING(30),
                allowNull : false,
            },
            ordererType : { // 주문자 구분(private - 일반, company - 사업자)
                type : Sequelize.ENUM('private', 'company'),
                allowNull : false,
                defaultValue : "private",
            },
            companyNm : { // 업체명
                type : Sequelize.STRING(50),
            },
            orderCellPhone : { // 주문자 연락처 
                type : Sequelize.STRING(11),
                allowNull : false,
            },
            deliveryChargeType : { // 배송료 구분(pre - 선불, post - 후불)
                type : Sequelize.ENUM('pre', 'post'),
                allowNull : false,
                defaultValue : "pre",
            },
            idDeliveryPolicy : { // 배송조건 
               type : Sequelize.INTEGER.UNSIGNED,
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
                type : Sequelize.STRING(30),
            },
            preferredDeliveryReleasedDate : { // 출고희망일
                type : Sequelize.DATE,
            },
            deliveryReleasedDate : { // 출고일
                type : Sequelize.DATE,
            },
            
            deliveryCharge : { // 배송비
                type : Sequelize.INTEGER.UNSIGNED,
                allowNull : false,
                defaultValue : 0,
            },
            deliveryChargeVat : { // 배송비 부가세
                type : Sequelize.INTEGER.UNSIGNED,
                allowNull : false,
                defaultValue : 0,
            },
            receiverNm : { // 수령인/업체명
                type : Sequelize.STRING(30),
            },
            receiverCellPhone : { // 수령인 휴대전화
                type : Sequelize.STRING(11),
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
            deliveryMemo : { // 배송메세지
                type : Sequelize.STRING(255),
            },
            receiptType : { // 증빙자료 유형(tax, cash, estimate)
                type: Sequelize.STRING(30),
            },
            taxReceiptBusinessNo : { // 세금계산서(사업자 등록번호)
                type : Sequelize.STRING(20),
            },
            taxReceiptCompanyNm : { // 세금계산서(업체명/대표자명)
                type : Sequelize.STRING(50),
            },
            taxReceiptEmail : { // 세금계산서(담당자 E-mail)
                type : Sequelize.STRING(100),
            },
            businessCertFileId : { // 사업자 등록증 파일 id 
                type : Sequelize.INTEGER.UNSIGNED,
            },
            cashReceiptType : { // 현금영수증 발급 유형
                type : Sequelize.ENUM('jumin', 'cellPhone', 'businessNo', 'none'),
                defaultValue : "none",
            },
            cashReceiptNo : {  // 현금영수증 발급 신청 번호(주문번호, 휴대전화번호, 사업자 등록번호)
                type : Sequelize.STRING(20),
            },
            payType : {
                type : Sequelize.ENUM('lbt', 'card'),
                allowNull: false,
                defaultValue : "lbt",
            },
            depositor : { // 무통장 입금명
                type : Sequelize.STRING(30),
            },
            itemsTotalPrice : { // 상품총합
                type : Sequelize.INTEGER.UNSIGNED,
                allowNull : false,
                defaultValue : 0,
            },
            totalDiscount : { // 할인총합
                type : Sequelize.INTEGER.UNSIGNED,
                allowNull : false,
                defaultValue : 0,
            },
            totalDeliveryCharge : { // 배송비 총합
                type : Sequelize.INTEGER.UNSIGNED,
                allowNull : false,
                defaultValue : 0,
            },
            totalAddDeliveryCharge : { // 추가 배송비 총합
                type : Sequelize.INTEGER.UNSIGNED,
                defaultValue : 0,
            },
            totalVat : { // 부가세 총합
                type : Sequelize.INTEGER.UNSIGNED,
                allowNull : false,
                defaultValue : 0,
            },
            totalPayPrice : { // 결제금액 총합
                type : Sequelize.INTEGER.UNSIGNED,
                allowNull : false,
                defaultValue : 0,
            },
            shopTotalPayPrice : { // 쇼핑몰 총 결제금액
                type : Sequelize.INTEGER.UNSIGNED,
                defaultValue : 0,
            },
            shopOrderViewUrl : { // API 요청 쇼핑몰 결제 상세 URL 
                type : Sequelize.STRING(255),
            },
            shopName : { // API 요청 쇼핑몰명
                type : Sequelize.STRING(60),
            },
            memo : { // 관리자 메모
                type : Sequelize.TEXT,
            }
        }, {
            sequelize,
            paranoid : true,
            timestamps : true,
            modelName : "OrderInfo",
            tableName : "orderInfos",
            charset : "utf8mb4",
            collate : "utf8mb4_general_ci",
            indexes : [
                { unique : false, fields : ['deliveryType'] },
                { unique : false, fields : ['idDeliveryPolicy'] },
                { unique : false, fields : ['orderStatus'] },
                { unique : false, fields : ['createdAt']},
                { unique : false, fields : ['deliveryReleasedDate'] },
                { unique : false, fields: ['shopName'] },
            ],
        });

    }

    static associate(db) {
        db.OrderInfo.hasMany(db.OrderItem, { foreignKey : 'orderNo', sourceKey : 'orderNo'});
        db.OrderInfo.belongsTo(db.Manager, { foreignKey : 'idManager', targetKey : 'id'});
    }
}