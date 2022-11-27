const Sequelize = require('sequelize');

module.exports = class FileInfo extends Sequelize.Model {
    static init(sequelize) {    
        return super.init({
            gid : { // 그룹 ID 
                type : Sequelize.STRING(40),
                allowNull : false,
            },
            fileName : { // 파일명 
                type : Sequelize.STRING(100),
                allowNull : false,
            },
            fileType : { // 파일 형식
                type : Sequelize.STRING(150),
                allowNull : false,
            },
            isSuccess : { // 파일 처리 완료 여부 
                type : Sequelize.BOOLEAN,
                allowNull : false,
                defaultValue : false,
            },
            channel : {
                type : Sequelize.STRING(50),
                allowNull : false,
                defaultValue : "본사",
            },
            idManager : {
                type : Sequelize.INTEGER,
            },
        }, {
            sequelize,
            paranoid : false,
            timestamps: true,
            modelName : "FileInfo",
            tableName : "fileInfos",
            charset : "utf8mb4",
            collate : "utf8mb4_general_ci",
        });
    }

    static associate(db) {

    }
}