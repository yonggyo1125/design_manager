const { SearchRankJobV2, Manager } = require('..');
const { logger } = require('../../library/common');
const Pagination = require('../../library/pagination');

/**
 *  검색순위 향상 DAO V2
 * 
 */
const searchRankJobDaoV2 = {
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
     * 작업등록
     * 
     * @param {Object} data
     * @returns {Boolean}
     */
      async add(data) {
        if (!data) {
            return false;
        }

        try {
            const result = await SearchRankJobV2.create({
                keyword : data.keyword.trim(),
                idManager : data.idManager,
            });

            if (!result) {
                return false;
            }

            return true;
        } catch (err) {
            logger(err);
            return false;
        }
    },
    /**
     * 작업목록 
     * 
     * @param {int} page 페이지 번호
     * @param {int} limit 1페이지당 레코드 수 
     * @param {Object} req 
     */
     async gets(page, limit, req) {
        page = page || 1;
        limit = limit || 20;
        const offset = (page - 1) * limit;
        const where = {};

        try {
            const list = await SearchRankJobV2.findAll({
                include : [{
                    model : Manager,
                    attributes : ['managerNm', 'managerId'],
                }],
                order : [['id', 'DESC']],
                limit, 
                offset,
                where,
                raw : true,
            });

            /** 총 작업 수 */
            this.total = await SearchRankJobV2.count({ where });

            /** 페이징 처리 */
            if (req) {
                this.pagination = new Pagination(req, page, this.total).getPages();
            } 

            for await (li of list) {
                li.keyword = li.keyword.split("\r\n");
            }
            
            return list;
        } catch (err) {
            logger(err);
            return false;
        }
    },
    /**
     * 작업목록 수정 
     * 
     * @param {Object} data
     */
     async updates(data) {
        if (!data || !data.id)  {
            return false;
        }

        let ids = data.id;
        if (!(ids instanceof Array)) {
            ids = [ids];
        }

        try {
            for await (id of ids) {
                await SearchRankJobV2.update({ 
                    isUse : (data[`isUse_${id}`] == '1')?true:false,
                }, { 
                    where : { id }
                });
            }

            return true;
        } catch (err) {
            logger(err);
            return false;
        }
    },
    /**
     * 작업목록 삭제
     * 
     * @param {Object} data
     */
     async deletes(data) {
        if (!data || !data.id)  {
            return false;
        }

        let ids = data.id;
        if (!(ids instanceof Array)) {
            ids = [ids];
        }

        try {
            for await (id of ids) {
                await SearchRankJobV2.destroy({
                    where : { id },
                });
            }
        } catch (err) {
            logger(err);
            return false;
        }
    }
};

module.exports = searchRankJobDaoV2;