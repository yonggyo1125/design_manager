const Sequelize = require('sequelize');

/**
 * 결제 기록 
 * 
 */
module.exports = class Payment extends Sequelize.Model {
    static init(sequelize) {
        return super.init({
            status : {
                type : Sequelize.ENUM('request', 'confirm', 'incash',  'cancel', 'failed'),
                defaultValue : "request",
            },
            pg : { // PG 종류 
                type : Sequelize.ENUM('inicis'),
                allowNull : false,
            },
            title : { // 결제 품목 
                type : Sequelize.STRING(255),
                allowNull : false,
            },
            price : { // 결제금액
                type : Sequelize.INTEGER.UNSIGNED,
                allowNull : false,
            },
            name : { // 입금자명
                type : Sequelize.STRING(50),
                allowNull : false,
            },
            cellPhone : { // 휴대전화번호
                type : Sequelize.STRING(11),
                allowNull : false,
            },
            email : { // 이메일
                type : Sequelize.STRING(255),
                allowNull : false,
            }, 
            payMethod : { // 결제방법
                type : Sequelize.STRING(30),
                allowNull : false,
            },
            pgResultCode  : { // PG 결과 코드 
                type : Sequelize.STRING(20),
            },
            pgResultMessage : { // PG 결과 메세지 
                type : Sequelize.STRING(255),
            },
            pgApproveDate : { // PG 승인일자
                type : Sequelize.STRING(20),
            },
            pgApproveTime : { // PG 승인시간
                type : Sequelize.STRING(20),
            },
            pgBankName : {  // 은행명
                type : Sequelize.STRING(50),
            },
            pgLog : { // PG 처리 로그 
                type : Sequelize.TEXT,
            },
            pgDevice : { // PG 실행 환경 
                type : Sequelize.ENUM('PC', 'MOBILE'),
                allowNull : false,
                defaultValue : 'PC',
            },
            pgTransactionId : { // PG 거래 ID
                type : Sequelize.STRING(60),
            },
            VBankAccount : { // 가상계좌 번호
                type : Sequelize.STRING(50),
            },
            refundAcctNum : { // 환불 계좌번호,
                type : Sequelize.STRING(30),
            },
            refundBankCode : {  // 환불 은행코드 
                type : Sequelize.STRING(10),
            },
            refundAcctName : { // 환불계좌 예금주명
                type : Sequelize.STRING(30),
            },
            canceledAt : { // 주문취소  일시
                type : Sequelize.DATE,
            }
        }, {
            sequelize,
            paranoid : true,
            timestamps : true,
            modelName : "Payment",
            tableName : "payments",
            charset : "utf8mb4",
            collate : "utf8mb4_general_ci",
        });
    }

    static associate(db) {
        db.Payment.belongsTo(db.PaymentItem, { foreignKey : 'idPaymentItem', targetKey : 'id' });
    }
}