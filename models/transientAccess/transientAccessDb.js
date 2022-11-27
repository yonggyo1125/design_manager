const Sequelize = require('sequelize');

/**
 * 임시 접속 코드 발급
 * 
 */
module.exports = class TransientAccess extends Sequelize.Model {
    static init(sequelize) {
        return super.init({
            token : { // 접근 토큰
                type : Sequelize.UUID,
                primaryKey : true,
            },
            url : { // 접근 허용 URL 
                type : Sequelize.STRING(100),
                allowNull : false,
            },
            expiredAt : { // 토큰 만료 일시 
                type : Sequelize.DATE,
                allowNull : false,
            }
        }, {
            sequelize,
            paranoid : false,
            timestamps : true,
            modelName : "TransientAccess",
            tableName : "transientAccesses",
            charset : "utf8mb4",
            collate : "utf8mb4_general_ci",
            indexes : [
                { unique : false, fields : ['url']},
                { unique : false, fields : ['expiredAt']}
            ],
        });
    }

    static associate(db) {

    }
}