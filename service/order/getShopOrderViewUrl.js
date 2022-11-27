const { OrderInfo } = require("../../models");

/**
 * API 연동 쇼핑몰 주문상세 URL 조회
 *
 * @param {*} orderNo 
 */
module.exports = async (orderNo) => {
    if (!orderNo) {
        return false;
    }

    const data = await OrderInfo.findByPk(orderNo, {
        attributes : ["shopOrderViewUrl"],
        raw : true,
    });
    
    if (!data || !data.shopOrderViewUrl || data.shopOrderViewUrl.trim() == "") {
        return false;
    }

    return data.shopOrderViewUrl;
};