const statDao = require('../../models/searchRankJob/statDao');

const searchRankStatisticService = {
    /**
     * 작업통계 목록 
     * 
     * @param {int} page 페이지 번호
     * @param {int} limit 1페이지당 레코드 수 
     * @param {Object} req 
     */
    async gets(page, limit ,req, search) {
        const list = await statDao.gets(page, limit, req, search);
        const pagination = statDao.pagination;
        const total = statDao.total;
 
        return { list, pagination, total };
    }
};

module.exports = searchRankStatisticService;