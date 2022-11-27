const Sequelize = require('sequelize');

/**
 * 디자이너 변경 신청 및 처리 결과 기록
 * 
 */
module.exports = class DesignerChange extends Sequelize.Model {
    static init(sequelize) {
        return super.init({
            orderNo : { // 주문번호
                type : Sequelize.BIGINT,
                allowNull : false,
            },
            idOrderItem : { // 품주번호
                type : Sequelize.INTEGER,
                allowNull : false,
            },
            prevIdDesigner : { // 기존 디자이너
                type : Sequelize.INTEGER,
                allowNull : false,
            },
            nextIdDesigner : { // 변경된 디자이너
                type : Sequelize.INTEGER,
            },
        }, {
            sequelize,
            paranoid : false,
            timestamps : true,
            modelName : "DesignerChange",
            tableName : "designerChanges",
            charset : "utf8mb4",
            collate : "utf8mb4_general_ci",
        });
    }

    static associate(db) {
        db.DesignerChange.belongsTo(db.Manager, { foreignKey : 'idManager', targetKey : 'id'});
    }
};