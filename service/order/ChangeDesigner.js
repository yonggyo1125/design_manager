const orderDao = require('../../models/order/dao');
/**
 * 디자이너 변경
 * 
 * @param {*} idOrderItem 
 * @param {*} idDesigner 
 */
module.exports = async (idOrderItem, idDesigner) => {

    if (!idOrderItem) {
        throw new Error("필수 항목 누락(idOrderItem)");
    }
    idDesigner = idDesigner || 0; 
    const result = await orderDao.changeDesigner(idOrderItem, idDesigner);
    if (!result) {
        throw new Error("디자이너 변경에 실패하였습니다.");
    }

};