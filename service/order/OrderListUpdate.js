const { updates } = require('../../models/order/dao');
/**
 * 주문 목록 일괄 업데이트
 * 
 * @param {*} req 
 */
module.exports = async (req) => {
    await updates(req);
};