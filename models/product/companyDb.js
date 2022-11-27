const Sequelize = require('sequelize');

module.exports = class Company extends Sequelize.Model {
    static init(sequelize) {
        return super.init({
            companyNm : { // 거래처명
                type : Sequelize.STRING(60),
                allowNull : false,
                unique : true,
            },
            businessNo : { // 사업자번호 
                type : Sequelize.STRING(30),
            },
            ownerNm : { // 대표자명
                type : Sequelize.STRING(30),
            },
            ownerPhone : { // 연락처
                type : Sequelize.STRING(11),
            },
            staffNm : { // 담당자명
                type : Sequelize.STRING(30),
            },
            staffPhone : { // 담당자 연락처
                type : Sequelize.STRING(11),
            }, 
            companyAddress : { // 회사주소 
                type : Sequelize.STRING(200),
            },
            memo : { // 메모
                type : Sequelize.STRING,
            }
        }, {
            sequelize,
            paranoid : true,
            timestamps : true,
            modelName : "Company",
            tableName : "companies",
            charset : "utf8mb4",
            collate : "utf8mb4_general_ci",
        });
    }

    static associate(db) {
        db.Company.hasMany(db.ProductItem, { foreignKey : 'idCompany', onDelete : 'RESTRICT', sourceKey : 'id' });
    }
}