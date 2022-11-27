const { OrderInfo } = require('../../models');
const { validateCellPhone } = require('../../library/common');
/**
 * 회원 휴대전화번호로 주문 목록 조회
 * 
 * @param {object} req 
 */
module.exports = async (req) => {
    /** 휴대전화 번호 유효성 검사 S */
    let cellPhone = req.body.cellPhone || req.query.cellPhone;
    if (!cellPhone || cellPhone.trim() == "") {
        throw new Error("휴대전화 번호를 입력하세요.");
    }

    cellPhone = cellPhone.replace(/\D/g, "");
    if (!validateCellPhone(cellPhone)) {
        throw new Error("휴대전화 번호 형식이 아닙니다.");
    }
    /** 휴대전화번호 유효성 검사 E  */

    const cnt = await OrderInfo.count({
        where : {
            orderCellPhone : cellPhone,
        }
    });

    if (!cnt) {
        throw new Error("조회된 주문이 없습니다.");
    }

    req.session.guestCellPhone = cellPhone;
};