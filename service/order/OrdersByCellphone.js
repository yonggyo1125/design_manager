const orderDao = require('../../models/order/dao');

/**
 * 휴대전화번호로 주문 조회
 * 
 * @param {String} cellPhone 
 */
module.exports = async (cellPhone, req, limit) => {
    if (!cellPhone || cellPhone.trim() == "") 
        return false;

    cellPhone = cellPhone.trim();
    const page = req.query.page || 1;
    limit = limit || 10;
    const search = req.query;
    search.orderCellPhone = cellPhone;
    const list = await orderDao.gets(page, limit, req, search);
    const total = orderDao.total;
    const pagination = orderDao.pagination;
    return { list, pagination, total, page, limit };
};