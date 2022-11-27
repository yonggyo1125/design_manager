const { logger } = require('../../library/common');
const { SearchRankJobStat, Sequelize : { Op } } = require('..');
const Pagination = require('../../library/pagination');

const searchRankJobStatDao = {
    _total : 0, // 전체 회원 수 
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
     * 작업통계 목록 
     * 
     * @param {int} page 페이지 번호
     * @param {int} limit 1페이지당 레코드 수 
     * @param {Object} req 
     */
    async gets(page, limit ,req, search) {
        page = page || 1;
        limit = limit || 20;
        const offset = (page - 1) * limit;
        const where = {};
        /** 검색 처리 S */
        if (search.sdate) {
            const sdate = search.sdate.replace(/-/g, "");
            where.date = { [Op.gte] : sdate };
        }

        if (search.edate) {
            const edate = search.edate.replace(/-/g, "");
            if (search.sdate) {
                where.date[Op.lte] = edate;
            } else {
                where.date = { [Op.lte] : edate };
            }
        }

        if (search.keyword) {
            where.keyword = { [Op.substring] : search.keyword.trim() };
        }
        /** 검색 처리 E */
        try {
            const list = await  SearchRankJobStat.findAll({
                order : [['date' ,'DESC'], ['keyword', 'ASC']],
                limit,
                offset,
                where,
                raw : true,
            });

            /** 총 작업 통계 수 */
            this.total = await SearchRankJobStat.count({ where });

            /** 페이징 처리  */
            if (req) {
                this.pagination = new Pagination(req, page, this.total).getPages();
            }
            
            for await (li of list) {
                if (li.rankingJson) {
                    if (typeof li.rankingJson == 'string') {
                        li.rankingJson = JSON.parse(li.rankingJson);
                    }
                } else {
                    li.rankingJson = [];
                }
            }
            
            return list;
        } catch (err) {
            logger(err);
            return false;
        }
    }
};

module.exports = searchRankJobStatDao;