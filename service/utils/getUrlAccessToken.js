const { TransientAccess, Sequelize : { Op } } = require("../../models");

/**
 * URL 접근 토큰 조회
 * 
 * @param {*} token 
 * @param {*} url 
 */
module.exports = async (token, url) => {
    if (!token || !url) {
        return false;
    }

    const data = await TransientAccess.findOne({ 
        where : {
            token, 
            url,
            expiredAt : { [Op.gt] : new Date() }
        },
        raw : true 
    });
    
    if (!data) {
        return false;
    }

    return data;
}