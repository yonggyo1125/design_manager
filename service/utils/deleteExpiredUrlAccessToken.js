const { TransientAccess, Sequelize : { Op } } = require("../../models");

/**
 * 만료된 토큰 삭제 처리
 * 
 */
module.exports = async () => {
    const date = new Date();
    await TransientAccess.destroy({
        where : { expiredAt : { [Op.lte] : date } }
    });
};