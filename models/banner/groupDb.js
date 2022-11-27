const Sequelize = require('sequelize');

module.exports = class BannerGroup extends Sequelize.Model {
    static init(sequelize) {
        return super.init({
            groupCd : { // 그룹 코드 
                type : Sequelize.BIGINT.UNSIGNED,
                allowNull : false,
                unique: true,
            },
            groupNm : { // 그룹 명
                type : Sequelize.STRING(60),
                allowNull : false,
                unique: true,
            },
        }, {
            sequelize,
            paranoid : false,
            timestamps : true,
            modelName : "BannerGroup",
            tableName : "bannerGroups",
            charset : "utf8mb4",
            collate : "utf8mb4_general_ci",
        });
    }

    static associate(db) {
        db.BannerGroup.hasMany(db.Banner, { foreignKey : "idBannerGroups", sourceKey : "id" });
    }
} 