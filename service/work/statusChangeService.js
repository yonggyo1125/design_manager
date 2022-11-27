const orderDao = require("../../models/order/dao");

/**
 * 작업 상태 변경 
 * 
 */
module.exports = async (idOrderItem, workStatus) => {
    if (!idOrderItem || !workStatus) {
        throw new Error("잘못된 접근입니다.");
    }

    const result = await orderDao.updateWorkStatus(idOrderItem, workStatus);
    if (!result) {
        throw new Error("작업 수정에 실패하였습니다.");
    }
};