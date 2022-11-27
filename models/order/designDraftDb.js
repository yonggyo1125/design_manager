const Sequelize = require('sequelize');

/**
 * 디자인 시안 관련
 * 
 */
module.exports = class DesignDraft extends Sequelize.Model {
    static init (sequelize) {
        return super.init({
            draftUid : { // 주문 품목의 itemUid와 동일 
                type : Sequelize.STRING(30),
                primaryKey : true,
                allowNull : false,
            },
            designChoice : { // 확정시안(0 - 미확정, 1 - 시안1, 2 - 시안2, 3 - 시안3)
                type : Sequelize.ENUM('0', '1', '2', '3'),
                allowNull : false,
                defaultValue : "0",
            },
            draftFile1 : { // 시안1 파일 id 
                type : Sequelize.INTEGER.UNSIGNED,
            },
            draftFile2 : { // 시안2 파일 id 
                type : Sequelize.INTEGER.UNSIGNED,
            },
            draftFile3 : { // 시안3 파일 id 
                type : Sequelize.INTEGER.UNSIGNED,
            },
            clientRequest : { // 고객요청내용 
                type : Sequelize.TEXT,
            },
            designerResponse : { // 고객 전달 내용
                type : Sequelize.TEXT,
            },
            confirmDateTime : { // 확정일시
                type : Sequelize.DATE,
            },
        }, {
            sequelize,
            paranoid : false,
            timestamps : true,
            modelName : "DesignDraft",
            tableName : "designDrafts",
            charset : "utf8mb4",
            collate : "utf8mb4_general_ci",
        });
    }

    static associate(db) {
        db.DesignDraft.belongsTo(db.Manager, { foreignKey : 'idManager', targetKey : 'id'});
    }    
}