const orderDao = require("../../models/order/dao");
const { BoardData } = require("../../models");

module.exports = async (orderNo) => {
    if (!orderNo) {
        throw new Error("잘못된 접근입니다.");
    }
    const items = await orderDao.getOrderItems(orderNo);
    if (!items) {
        throw new Error("주문 정보가 존재하지 않습니다.");
    }

    const data = [];
    for await (const item of items) {
        const cnt = await BoardData.count({ where : { idOrderItem : item.id }});
        if (cnt > 0) continue;
        data.push(item);
    }
    
    return data;
};