const orderDao = require("../../models/order/dao");

/**
 * 작업 정보 업데이트 
 * 
 */
module.exports = async (data) => {
    if (!data.idOrderItem) {
        throw new Error("잘못된 접근입니다.");
    }

    const result = await orderDao.updateWorkInfo(data.idOrderItem, data);
    if (!result) {
        throw new Error("작업 수정에 실패하였습니다.");
    }
};