const { getException } = require('../../library/common');
const SearchRankJobRegisterException = getException('SearchRankJob/SearchRankJobRegisterException');
const SearchRankJobUpdateException = getException("SearchRankJob/SearchRankJobUpdateException");
const SearchRankJobDeleteException = getException("SearchRankJob/SearchRankJobDeleteException");

const searchRankJobDao = require('../../models/searchRankJob/dao');
const searchRankJobDaoV2 = require('../../models/searchRankJob/daoV2');
/**
 * 검색순위 향상 Service
 * 
 */
const searchRankJobService = {
    /**
     * 작업 등록
     * 
     * @param {req}
     * @throws {SearchRankJobRegisterException}
     */
    async add(req) {
        const data = req.body;
        // 유효성 검사 
        this.validator(data); 

        await searchRankJobDao.add(data);
    },
    /**
     * 작업등록 V2
     * 
     * @param {req}
     * @throws {SearchRankJobRegisterException}
     */
    async addV2(req) {
        const data = req.body;
        // 유효성 검사 
        this.validator(data); 

        await searchRankJobDaoV2.add(data);
    },
    /**
     * 유효성 검사
     * 
     * @param {Object} data
     * @throws {SearchRankJobRegisterException}
     */
    validator(data) {
        if (!data.keyword || data.keyword.trim() == "") {
            throw new SearchRankJobRegisterException("타겟 키워드를 입력하세요.");
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

        const list = await searchRankJobDao.gets(page, limit, req);
        const pagination = searchRankJobDao.pagination;
        const total = searchRankJobDao.total;

        return { list, pagination, total };
    },
    /**
     * 작업목록 
     * 
     * @param {int} page 페이지 번호
     * @param {int} limit 1페이지당 레코드 수 
     * @param {Object} req 
     */
     async getsV2(page, limit, req) {

        const list = await searchRankJobDaoV2.gets(page, limit, req);
        const pagination = searchRankJobDao.pagination;
        const total = searchRankJobDao.total;

        return { list, pagination, total };
    },
    /**
     * 작업 목록 수정 
     * 
     * @param {Object} req
     * @throws {SearchRankJobUpdateException}
     */
    async updates(req) {
        const data = req.body;
        if (!data) {
            throw new SearchRankJobUpdateException("잘못된 접근입니다.");
        }

        const ids = data.id;
        if (!ids) {
            throw new SearchRankJobUpdateException("수정할 작업을 선택하세요.");
        }

       await searchRankJobDao.updates(data);
    },
    async updatesV2(req) {
        const data = req.body;
        if (!data) {
            throw new SearchRankJobUpdateException("잘못된 접근입니다.");
        }

        const ids = data.id;
        if (!ids) {
            throw new SearchRankJobUpdateException("수정할 작업을 선택하세요.");
        }

       await searchRankJobDaoV2.updates(data);
    },
    /**
     * 작업 목록 삭제 
     * 
     * @param {Object} req
     * @throws {SearchRankJobDeleteException}
     */
    async deletes(req) {
        const data = req.body;
        if (!data) {
            throw new SearchRankJobUpdateException("잘못된 접근입니다.");
        }

        const ids = data.id;
        if (!ids) {
            throw new SearchRankJobUpdateException("삭제할 작업을 선택하세요.");
        }

        await searchRankJobDao.deletes(data);
    },
    /**
     * 작업 목록 삭제 
     * 
     * @param {Object} req
     * @throws {SearchRankJobDeleteException}
     */
     async deletesV2(req) {
        const data = req.body;
        if (!data) {
            throw new SearchRankJobUpdateException("잘못된 접근입니다.");
        }

        const ids = data.id;
        if (!ids) {
            throw new SearchRankJobUpdateException("삭제할 작업을 선택하세요.");
        }

        await searchRankJobDaoV2.deletes(data);
    }
};

module.exports = searchRankJobService;