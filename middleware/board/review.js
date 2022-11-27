const { alert, go } = require('../../library/common');
const orderDao = require('../../models/order/dao');
const { BoardData } = require("../../models");

/**
 * 후기 게시판 체크 
 * 
 * @param {*} req 
 * @param {*} res 
 * @param {*} next 
 */
module.exports = async (req, res, next) => {
    const board = req.board;
    if (!board.isReview) {
        return next();
    }

    try {
        const orderNo = req.query.orderNo;
        const idOrderItem = req.query.idOrderItem;
        if (board.isReviewOrderOnly) {
            if (!orderNo && !idOrderItem) {
                throw new Error("후기를 작성하시려면 상품주문내역이 필요합니다.")
            }

            if (orderNo && !idOrderItem) {
                // 주문 상품 선택 페이지로 이동
                return go(`/board/select_orderItem/${orderNo}`, res);
            }
            
            /** 이미 작성한 후기인지 체크 S */
            const cnt = await BoardData.count({ where : { idOrderItem }});
            if (cnt > 0) {
                throw new Error("이미 작성된 후기입니다.");
            }
            /** 이미 작성한 후기인지 체크 E */

            /** 품주번호가 있는 경우 주문상품 데이터 조회 */
            const orderItem = await orderDao.getOrderItem(idOrderItem);
            if (!orderItem) {
                throw new Error("등록된 주문내역이 없습니다.");
            }

            req.orderItem = res.locals.orderItem = orderItem;

            const orderInfo = await orderDao.getOrderInfo(orderItem.orderNo);
            if (!orderInfo) {
                throw new Error("등록된 주문내역이 없습니다.");
            }

            req.orderInfo = res.locals.orderInfo = orderInfo;
            res.locals.poster = orderInfo.orderNm; 
        }  

    } catch (err) {
        return alert(err.message, res, -1);
    } 
    next();
};