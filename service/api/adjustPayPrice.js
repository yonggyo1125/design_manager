const orderDao = require("../../models/order/dao");
const { OrderItem } = require('../../models');
/**
 * 쇼핑몰 결제 금액과 디자인관리자 계산 금액과 일치 하지 않는 경우 금액 조정 처리
 * 
 */
module.exports = async (orderNo) => {
    const data = await orderDao.get(orderNo);
    // API 반영 주문이 아니거나 쇼핑몰 총 결제금액과 디자인관리자 금액과 일치하는 경우는 건너뛰기
    if (!data || !data.shopOrderNo || data.shopTotalPayPrice == data.totalPayPrice) {
        return;
    }

    const gap = data.shopTotalPayPrice - data.totalPayPrice;
    let leftOver = gap;
    const items = data.items;
    for (let i = 0; i < items.length; i++) {
        const item = items[i];
        const total = item.itemTotalPrice - item.itemDiscount + item.deliveryCharge;
        let itemAdjust = 0;
        if (i == items.length - 1) {
            itemAdjust = Math.abs(leftOver);
        } else {
            itemAdjust = Math.round(Math.abs(gap) * (total / data.totalPayPrice));
        }

        if (gap > 0) {
            leftOver -= itemAdjust;
        } else {
            leftOver += itemAdjust;
            itemAdjust *= -1;
        }
        
        
        const itemTotalPrice = total + itemAdjust;
        const itemTotalPriceVat = (itemTotalPrice > 0)?Math.round(itemTotalPrice - itemTotalPrice / 1.1):0;

        await OrderItem.update({
            itemAdjust,
            itemTotalPrice,
            itemTotalPriceVat,
        }, { where : { id : item.id }});
    }
};