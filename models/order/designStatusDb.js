const Sequelize = require('sequelize');

/**
 * 디자인 처리상태 설정
 * 
 */
module.exports = class DesignStatus extends Sequelize.Model {
    static init (sequelize) {
        return super.init({
            statusCd : {
                type : Sequelize.STRING(20), // 처리상태 코드
                allowNull : false,
                primaryKey : true,
            },
            statusNm : {
                type : Sequelize.STRING(30),
                allowNull : false,
            },
            guideMessage : { // 고객 안내 메세지
                type : Sequelize.STRING(100),
            },
            designerChangePossible : { // 디자이너 변경 요청 가능 여부
                type : Sequelize.BOOLEAN,
                defaultValue : false,
            },
            isUse : { // 사용 여부
                type : Sequelize.BOOLEAN,
                allowNull : false,
                defaultValue : false,
            },
            listOrder : { // 진열 가중치 
                type : Sequelize.INTEGER,
                defaultValue : 0,
            },
            tmpltCode : { // 템플릿 코드
                type : Sequelize.STRING(40),
            },
            designerChangedTmpltCode : { // 디자이너 변경시 템플릿 코드
                type : Sequelize.STRING(40),
            },
        }, {
            sequelize,
            paranoid : false,
            timestamps : true,
            modelName : "DesignStatus",
            tableName : "designStatuses",
            charset : "utf8mb4",
            collate : "utf8mb4_general_ci"
        });
    }

    static associate(db) {

    }
}