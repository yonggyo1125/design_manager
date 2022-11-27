const Sequelize = require('sequelize');

module.exports = class CustomerService extends Sequelize.Model {
    static init(sequelize) {
        return super.init({
            gid : { // 그룹 ID 
                type : Sequelize.BIGINT.UNSIGNED,
                allowNull : false,
            },
            channel : { // 상담 채널 
                type : Sequelize.STRING(60),
                allowNull : false,
            },
            category : { // 상담 구분
                type : Sequelize.STRING(30), 
                allowNull : false,
            },
            orderNo : { // 주문번호 
                type : Sequelize.BIGINT.UNSIGNED,
            }, 
            customerNm : { // 고객명 
                type : Sequelize.STRING(60),
                allowNull : false,
            },
            cellPhone : { // 휴대전화번호
                type : Sequelize.STRING(11),
            },
            email : { // 이메일 
                type : Sequelize.STRING(100),
            },
            zonecode : { // 우편번호
                type : Sequelize.STRING(10),
            },
            address : { // 주소
                type : Sequelize.STRING(100),
            },
            addressSub : { // 나머지 주소
                type : Sequelize.STRING(100),
            },
            question : { // 고객 문의 사항
                type : Sequelize.TEXT,
            },
            memo : { // 상담메모 
                type : Sequelize.TEXT,
                allowNull : false,
            },
            productNm : { // 상담상품
                type : Sequelize.STRING(100),
            }
        }, {
            sequelize,
            paranoid : true,
            timestamps : true,
            ModelName : "CustomerService",
            tableName : "customerServices",
            charset : "utf8mb4",
            collate : "utf8mb4_general_ci",
        });
    }

    static associate(db) {
        db.CustomerService.belongsTo(db.Manager, { foreignKey : 'idManager', targetKey : 'id'});
    }
}