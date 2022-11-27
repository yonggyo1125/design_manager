const Sequelize = require('sequelize');

module.exports = class Banner extends Sequelize.Model {
    static init(sequelize) {
        return super.init({
            gid : { // 그룹 ID 
                type : Sequelize.STRING(30),
                allowNull : false,
            },
            bannerLink : {  // 배너 링크 주소 
                type : Sequelize.STRING(255),
            },
            bannerTarget : {
                type : Sequelize.ENUM('self', '_blank'),
                allowNull : false,
                defaultValue : "self",
            },
            bannerAlt : { // 배너 이미지 설명
                type : Sequelize.STRING(255),
            },
            isShow : { // 배너 이미지 노출 여부
                type : Sequelize.BOOLEAN,
                allowNull : false,
                defaultValue : false,
            }
        }, {
            sequelize,
            paranoid : false,
            timestamps : true,
            modelName : "Banner",
            tableName : "banners",
            charset : "utf8mb4",
            collate : "utf8mb4_general_ci",
        });
    }

    static associate(db) {
        db.Banner.belongsTo(db.BannerGroup, { foreignKey : "idBannerGroups", targetKey : "id"});
    }  
}