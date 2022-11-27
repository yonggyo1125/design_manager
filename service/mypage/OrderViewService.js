const orderDao = require("../../models/order/dao");
const designDraftDao = require("../../models/order/designDraftDao");
const draftDraftDao = require('../../models/order/designDraftDao');

/**
 * 고객쪽 주문 조회
 * 
 * 인증받은 휴대전화 번호와 일치하는 주문만 조회 가능
 * 
 * @param {bigint} orderNo 
 * @param {object} req 
 */
module.exports = async (orderNo, req) => {

    const cellPhone = req.session.guestCellPhone;
    if (!orderNo || (!cellPhone && !req.passCheckAccess)) {
        throw new Error("잘못된 접근입니다.");
    }

    const data = await orderDao.get(orderNo);
    if (!data) {
        throw new Error("등록되지 않은 주문입니다.");
    }

    if (data.orderCellPhone != cellPhone && !req.passCheckAccess) {
        throw new Error("본인이 주문한 주문서만 확인하실 수 있습니다.");
    }

    if (req.passCheckAccess) {
        req.session.guestCellPhone = data.orderCellPhone;
    }

    return data;
};