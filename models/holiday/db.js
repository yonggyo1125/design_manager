const Sequelize = require('sequelize');

module.exports = class Holiday extends Sequelize.Model {
    static init(sequelize) {
        return super.init({
            stamp : { // 일자 
                type : Sequelize.BIGINT.UNSIGNED,
                allowNull : false,
                unique : true,
            },
            isHoliday : { // 일자별 배송 휴무일 여부 
                type : Sequelize.BOOLEAN,
                allowNull : false,
                defaultValue : false,
            },
            isCsHoliday : { // 일자별 상담 휴무일 여부 
                type : Sequelize.BOOLEAN,
                allowNull : false,
                defaultValue : false,
            },
            memo : { // 배송 메모
                type : Sequelize.STRING(60),
            },
        }, {
            sequelize,
            paranoid : false,
            timestamps : false,
            modelName : "Holiday",
            tableName : "holidays",
            charset : "utf8mb4",
            collate : "utf8mb4_general_ci",
            indexes : [
                { unique: false, fields : ['stamp', 'isHoliday']},
                { unique: false, fields : ['stamp', 'isCsHoliday']}
            ],
        });
    }

    static associate(db) {

    }
}