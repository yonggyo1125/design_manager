const { SimpleOrder } = require("../../models");
const Pagination = require('../../library/pagination');

/**
 * 간편주문서 목록 
 * 
 * @param {*} req 
 * @param {*} res 
 */
module.exports = async (req) => {
    let { page, limit } = req.query;
    page = page || 1;
    limit = limit || 20;
    limit = limit == 'all' ? limit : Number(limit);
    const offset = (page - 1) * limit;
    const where = {}, andWhere = [], orWhere = [];

    const search = req.query;
    const params = {
        order: [['createdAt', 'DESC']],
        where,
        raw : true,
    };

    if (limit != 'all') {
        params.limit = limit;
        params.offset = offset;
    }

    const list = await SimpleOrder.findAll(params);
    const total = await SimpleOrder.count({ where });

    const pagination = new Pagination(req, page, total, null, limit).getPages();

    return { list, total, pagination };
};