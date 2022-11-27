const Sequelize = require('sequelize');

/**
 * 결제 상품
 * 
 */
module.exports = class Paymenttem extends Sequelize.Model {
    static init(sequelize) {
        return super.init({
            gid : {  // 그룹 ID 
                type : Sequelize.STRING(45),
            },
            title : { // 결제 항목
                type : Sequelize.STRING(60),
                allowNull : false,
            },
            amount : { // 결제금액 
                type : Sequelize.INTEGER.UNSIGNED,
                allowNull : false,
                defaultValue : 0,
            },
            name : { // 고객명
                type : Sequelize.STRING(30),
                allowNull : false,
            },
            cellPhone : { //  휴대전화번호
                type : Sequelize.STRING(11),
                allowNull : false,
            },
            email : { // 이메일 주소 
                type : Sequelize.STRING(100),
            },
            description : { // 상세 내용
                type : Sequelize.TEXT,
            },
            csMemo : { // 상담원 메모
                type : Sequelize.TEXT,
            },
            payDoneAt : { // PG 처리 완료 시간
                type : Sequelize.DATE,
            },
        }, {
            sequelize,
            paranoid : true,
            timestamps : true,
            modelName : "PaymentItem",
            tableName : "paymentItems",
            charset: "utf8mb4",
            collate : "utf8mb4_general_ci",
        });
    }

    static associate(db) {
        db.PaymentItem.belongsTo(db.Manager, { foreignKey : "idManager", targetKey : 'id'});
        db.PaymentItem.hasMany(db.Payment, { foreignKey : 'idPaymentItem', sourceKey : 'id' });
    }    
}
