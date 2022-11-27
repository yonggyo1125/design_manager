const orderDao = require("../../models/order/dao");

/**
 * 주문서별 운송장 조회 URL 추출
 * 
 * @param {*} orderNo 
 */
module.exports = async (orderNo) => {
    if (!orderNo) {
        throw new Error("잘못된 접근입니다.");
    }

   const data = await orderDao.getDeliveryInfo(orderNo);
   if (!data) {
    throw new Error("등록되지 않은 주문입니다.");
   }

   return data;
};