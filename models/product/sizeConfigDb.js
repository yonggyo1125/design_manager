const Sequelize = require('sequelize');

module.exports = class SizeConfig extends Sequelize.Model {
    static init(sequelize) {
        return super.init({
            configNm : { // 설정이름
                type : Sequelize.STRING(30),
                allowNull : false,
            },
            sqmPrice : { // 1헤베 단가
                type : Sequelize.INTEGER, 
                allowNull : false,
                defaultValue : 0,
            },
            sqmPriceB2B : { // 1헤베 단가(사업자)
                type : Sequelize.INTEGER,
                defaultValue : 0,
            },
            minSqm : { // 최소 헤베
                type : Sequelize.INTEGER,
                defaultValue : 0,
            },
            maxSqm : { // 최대 헤베
                type : Sequelize.INTEGER,
                defaultValue : 0,
            },
            basicSize : { // 기본 사이즈
                type : Sequelize.STRING(30),
            },
            maxSize : { // 최대 사이즈
                type : Sequelize.STRING(30),
            },
            sampleSize : { // 샘플 사이즈   
                type : Sequelize.STRING(30),
            },
            boardSizeNm : { // 보드형 사이즈 설정명 
                type : Sequelize.STRING(30),
            }, 
            idBoardSizeAdd : {  // 보드형 사이즈 추가 설정 
                type : Sequelize.INTEGER, 
            },
            idSizeDeliveryConfig : {  // 사이즈별 추가 배송비
                type : Sequelize.INTEGER,
            }, 
            cutUnit : { // 절상, 절사, 반올림 단위 
                type : Sequelize.ENUM('1', '10', '100', '1000'),
                allowNull : false, 
                defaultValue : '1',
            },
            cutType : { // 절사, 절상, 반올림
                type : Sequelize.ENUM('floor', 'ceil', 'round'),
                allowNull : false,
                defaultValue : 'round',
            }
        }, {
            sequelize,
            paranoid : false,
            timestamps : true,
            modelName : "SizeConfig",
            tableName : "sizeConfigs",
            charset :  "utf8mb4",
            collate : "utf8mb4_general_ci",
        });
    }

    static associate(db) {
        db.SizeConfig.hasMany(db.ProductCategory, { foreignKey: 'idSizeConfig', sourceKey : 'id' });
    }
}