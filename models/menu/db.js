const Sequelize = require('sequelize');

module.exports = class Menu extends Sequelize.Model {
    static init(sequelize) {
        return super.init({
            type : { // 메뉴 타입
                type : Sequelize.STRING(30),
                allowNull : false,
            },
            title : { // 메뉴명
                type : Sequelize.STRING(60),
                allowNull : false,
            },
            url : { // 메뉴 URL 
                type : Sequelize.STRING(100),
                allowNull : false,
            },
            parentId : { // 부모 ID 
                type : Sequelize.INTEGER.UNSIGNED, 
                allowNull : false,
                defaultValue : 0,
            },
            listOrder : { // 진열순서
                type : Sequelize.INTEGER,
                allowNull : false,
                defaultValue : 0,
            },
            isUse : { // 사용여부
                type : Sequelize.BOOLEAN,
                allowNull : false,
                defaultValue : false,
            },
            accessLevel : { // 접속가능 관리레벨
                type : Sequelize.JSON,
            },
            subUrls : { // 동일 매칭 하위 URL
                type : Sequelize.TEXT,
            }
        }, {
            sequelize,
            paranoid : false,
            timestamps : true,
            modelName : "Menu",
            tableName : "menus",
            charset : "utf8mb4",
            collate : "utf8mb4_general_ci",
        });
    }

    static associate(db) {

    }
}