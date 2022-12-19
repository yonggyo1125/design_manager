const { SimpleOrder, Sequelize : { Op }} = require("../../models");
const Pagination = require('../../library/pagination');
const { getUTCDate } = require("../../library/common");

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
    /** 검색 처리 S */
    // 시작 접수일 
    if (search.sDate) {
        const createSdate = getUTCDate(search.sDate);
        andWhere.push({ createdAt: { [Op.gte] : createSdate }});
    }

    // 종료 접수일
    if (search.eDate) {
        const createEdate = getUTCDate(search.eDate);
        createEdate.setDate(createEdate.getDate() + 1);
        andWhere.push({ createdAt: { [Op.lt] : createEdate }});
    }
    
    /** 키워드 검색 S */
    if (search.sopt && search.skey && search.skey.trim() != "") {
        const sopt = search.sopt;
        let skey = search.skey;
        if (sopt == 'cellPhone') {
            skey = skey.replace(/\D/g, "");
        }
        if (sopt == "all") {
            orWhere.push({ orderNo : { [Op.like] : `%${skey}%`}});
            orWhere.push({ orderNm : { [Op.like] : `%${skey}%`}});
            orWhere.push({ cellPhone : { [Op.like] : `%${skey}%`}});
        } else {
            andWhere.push({[sopt] : { [Op.like] : `%${skey}%` }});
        }
    }
    /** 키워드 검색 E */

    if (andWhere.length > 0) where[Op.and] = andWhere;
    if (orWhere.length > 0) where[Op.or] = orWhere;

    /** 검색 처리 E */
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