const Sequelize = require('sequelize');

module.exports = class BoardSize extends Sequelize.Model {
    static init(sequelize) {
        return super.init({
            sizeNm : { // 설정이름
                type : Sequelize.STRING(30),
                allowNull : false,
            },
            sizeDirection : { // 사이즈 방향
                type : Sequelize.ENUM('portrait', 'landscape'), 
                allowNull : false,
                defaultValue : 'portrait', 
            },
            sizeType : { // 사이즈 종류
                type : Sequelize.STRING(20),
                allowNull : false,
            },
            width : { // 사이즈 너비
                type : Sequelize.INTEGER,
                defaultValue : 0,
            },
            height : { // 사이즈 높이
                type : Sequelize.INTEGER,
                defaultValue : 0,
            }
        }, {
            sequelize,
            paranoid : false,
            timestamps : false,
            modelName : "BoardSize",
            tableName : "boardSizes", 
            charset :  "utf8mb4",
            collate : "utf8mb4_general_ci",           
        });
    }

    static associate(db) {

    }
}