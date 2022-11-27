const { SearchRankLog, Sequelize : { Op } } = require("..");
const { logger, getUTCDate } = require("../../library/common");
const Pagination = require("../../library/pagination");

/**
 * 검색 처리 로그 DAO
 * 
 */
const searchRankLogDao = {
    _total : 0, // 전체 로그 갯수 
    _pagination : "", // 페이지 HTML 

    set total(total) {
        if (isNaN(total)) total = 0;
        this._total = total;
    },
    get total() {
        return this._total;
    },
    set pagination(pagination) {
        this._pagination = pagination;
    },
    get pagination() {
        return this._pagination;
    },
    /**
     * 작업 처리 목록 
     * 
     * @param {int} page 
     * @param {int} limit 
     * @param {Object} req 
     */
    async gets(page, limit, req) {
        page = page || 1;
        limit = limit || 20;
        const offset = (page - 1) * limit;
        const where = {};
        const search = req.query;
        try {
            /** 검색 처리 S */
            if (search) {
                /** 기간 조회 S */
                if (search.createdSdate && search.createdSdate.trim() != "") { // 시작일 
                    const createdSdate = getUTCDate(search.createdSdate + " 00:00:00");
                    where.createdAt = {
                        [Op.gte] : createdSdate
                    };
                }

                if (search.createdEdate && search.createdEdate.trim() != "") { // 종료일 
                    const createdEdate = getUTCDate(search.createdEdate + " 00:00:00");
                    createdEdate.setDate(createdEdate.getDate() + 1);
                    where.createdAt = where.createdAt || {};
                    where.createdAt[Op.lt] = createdEdate;
                }
                /** 기간 조회 E */

                /** 작업 구분 */
                if (search.jobType) {
                    where.jobType = search.jobType;
                }
                
                /** 장치 구분 */
                if (search.deviceType) {
                    where.deviceType = search.deviceType;
                }

                /** 키워드 검색 */
                if (search.keyword && search.keyword.trim() != "") {
                    where.keyword = { [Op.substring] : search.keyword.trim() };
                }
            }
            /** 검색 처리 E */
            const list = await SearchRankLog.findAll({
                order : [['id', 'DESC']],
                limit,
                offset,
                where,
                raw : true,
            });

            /** 총 로그 수 */
             this.total = await SearchRankLog.count({
                where,
             });
            
             if (req) {
                this.pagination = new Pagination(req, page, this.total, 10, limit).getPages();
            }

            return list;
        } catch (err) {
            logger(err);
            return false;
        }
    }
};

module.exports = searchRankLogDao;