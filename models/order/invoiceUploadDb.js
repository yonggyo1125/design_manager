const Sequelize = require('sequelize');

/**
 * 운송장 업로드 데이터 저장 DB
 * 
 */
module.exports = class InvoiceUpload extends Sequelize.Model {
    static init (sequelize) {
        return super.init({
            bundleCodeForUpdate : {
                type : Sequelize.STRING(50),
                allowNull : false,
            },
            invoiceNo : {
                type : Sequelize.STRING(40),
                allowNull : false,
            },  
            excelData : {
                type : Sequelize.JSON,
            },
            fileName : {
                type : Sequelize.STRING(100),
                allowNull : false,
            },
            isDone : { // 처리 완료 여부
                type : Sequelize.BOOLEAN,
                defaultValue : false,
            }
        }, {
            sequelize,
            timestamps : true,
            modelName : "InvoiceUpload",
            tableName : "invoiceUploads",
            charset : "utf8mb4",
            collate : "utf8mb4_general_ci",
        });
        
    }

    static associate(db) {
        db.InvoiceUpload.belongsTo(db.Manager, { foreignKey : 'idManager', targetKey : 'id'});
    }
};