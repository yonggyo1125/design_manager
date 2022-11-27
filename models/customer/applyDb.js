const Sequelize = require('sequelize');

module.exports = class CustomerApply extends Sequelize.Model {
    static init(sequelize) {
        return super.init({
            status : { // 상담진행 상태 - ready(접수), progress(진행 중), done(완료)
                type : Sequelize.ENUM('ready', 'progress', 'done'),
                allowNull : false,
                defaultValue : "ready",
            },
            channel : { // 유입경로
                type : Sequelize.STRING(60), 
                allowNull : false,
            },
            csType : { // 상담종류, tel - 전화상담, kakao - 카카오톡 상담
                type : Sequelize.ENUM('tel','kakao'),
                allowNull : false,
                defaultValue : "tel",
            },
            preferredDate : { // 희망 상담 날짜
                type : Sequelize.DATE,
                allowNull : false,
            },
            preferredTime : { // 희망 상담 시간
                type : Sequelize.TINYINT.UNSIGNED,
                allowNunll : false,
            },
            customerNm : { // 신청자명
                type : Sequelize.STRING(30),
                allowNull : false,
            },
            kakaoId : { // 카카오톡 ID
                type : Sequelize.STRING(60), 
            },
            customerCellPhone : { // 휴대전화번호
                type : Sequelize.STRING(11),
                allowNull : false,
            },
        }, {
            sequelize,
            paranoid : true,
            timestamps : true,
            ModelName : "CustomerApply",
            tableName : "customerApplies",
            charset : "utf8mb4",
            collate : "utf8mb4_general_ci",
        });
    }

    static associate(db) {

    }
}