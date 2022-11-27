const { apply } = require('../../models/order/designerChangeDao');
/**
 * 디자이너 변경 신청
 *
 * @param {*} req 
 */
module.exports = async (req) => {
    
    let ids = req.body.idOrderItem || req.query.idOrderItem;
    if (!ids) {
        throw new Error("수정할 품목을 선택하세요.");
    }

    const result = await apply(ids);
    if (!result) {
        throw new Error("디자이너 변경에 실패하였습니다.");
    }

};