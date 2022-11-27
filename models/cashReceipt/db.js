const Sequelize = require('sequelize');

/**
 * 현금영수증 발급 기록 
 * 
 */
module.exports = class CashReceipt extends Sequelize.Model {
    static init(sequelize) {
        return super.init({
            goodName : { // 상품명
                type : Sequelize.STRING(80),
                allowNull : false,
            },  
            buyerName : { // 구매자명 
                type : Sequelize.STRING(80),
                allowNull : false,
            },
            buyerEmail : { // 구매자 이메일 주소
                type : Sequelize.STRING(60),
                allowNull : false,
            },
            pgResultCode : { // PG 결과 코드 
                type : Sequelize.STRING(20),
                allowNull : false,
            },
            pgResultMessage : { // PG 결과 메세지 
                type : Sequelize.STRING(255),
            },
            pgTransactionId  : { // PG 거래 ID
                type : Sequelize.STRING(60),
            },
            pgApproveDate : { // PG 승인일자
                type : Sequelize.STRING(20),
            },
            pgApproveTime : { // PG 승인시간
                type : Sequelize.STRING(20),
            },
            pgApproveCode : { // 현금영수증 발급결과 코드 
                type : Sequelize.STRING(40),
            }, 
            pgApproveNo : { // 현금영수증 발급결과 코드
                type : Sequelize.STRING(40),
            }, 
            pgApprovePrice : { // 현금영수증 발급금액
                type : Sequelize.INTEGER.UNSIGNED,
                allowNull : false,
                defaultValue : 0,
            },
            pgApproveSupplyPrice : {  // 공급가액
                type : Sequelize.INTEGER.UNSIGNED,
                allowNull : false,
                defaultValue : 0,
            },
            pgApproveTax :  { // 부가세 
                type : Sequelize.INTEGER.UNSIGNED,
                allowNull : false,
                defaultValue : 0,
            },
            pgApproveSrvcPrice :  { // 봉사료 
                type : Sequelize.INTEGER.UNSIGNED,
                allowNull : false,
                defaultValue : 0,
            },
            pgApproveUseOpt : {  // false - 소득공제, true - 지출증빙
                type : Sequelize.BOOLEAN,
                allowNull : false,
                defaultValue : false,
            },
            orderNo : { // 주문번호
                type : Sequelize.BIGINT.UNSIGNED,
            }
        }, {
            sequelize,
            paranoid : true,
            timestamps : true,
            modelName : "CashReceipt",
            tableName : "cashReceipts",
            charset : "utf8mb4",
            collate : "utf8mb4_general_ci",
        });
    }

    static associate(db) {
        db.CashReceipt.belongsTo(db.Manager, { foreignKey : 'idManager', targetKey : 'id' });
    }   
}