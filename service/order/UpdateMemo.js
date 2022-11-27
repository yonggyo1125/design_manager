const { updateMemo, updateItemMemo } = require('../../models/order/dao');

/**
 * 관리자 메모 업데이트
 * 
 * @param {*} req 
 */
module.exports = async (req) => {
    const data = req.body;
    const orderNo = data.orderNo;
    const memo = data.memo;
    const items = data.items;
    if (!orderNo) {
        throw new Error("주문번호 누락(orderNo)");
    }

    await updateMemo(orderNo, memo);

    if (!items || items.length == 0) {
        return;
    }

    for (let item of items) {
        if (!item.idOrderItem) continue;
        await updateItemMemo(item.idOrderItem, item.itemMemo);
    }
};