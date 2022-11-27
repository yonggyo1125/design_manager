const { getException, logger } = require("../../library/common");
const APIKeyIssueException = getException("API/APIKeyIssueException");
const APIKeyCancelException = getException("API/APIKeyCancelException");
const { v4 : uuidv4 } = require('uuid');
const { ApiKey, Manager, Sequelize : { Op } } = require('../index');
const Pagination = require('../../library/pagination');

/**
 * API키 발급관련 
 * 
 */
const keyDao = {
    _total : 0, // 전체 발급 수  
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
     * API 키 발급
     * @param int id  관리자번
     * @param String domain 도메인 
     * 
     * @return Boolean|Object - 발급실패시 false, 성공시 발급받은 API키 정보
     * @throws APIKeyIssueException
     */
    async issue(id, domain, redirectURL) {
        if (!id) {
            throw new APIKeyIssueException("잘못된 접근입니다.");
        }

         if (!domain) {
             throw new APIKeyIssueException("도메인을 입력하세요.");
         }

         if (!redirectURL) {
            throw new APIKeyIssueException("REDIRECT URL을 입력하세요.");
        }
        
        try {
            const apikey = await ApiKey.create({        
                                    domain,
                                    restKey : uuidv4(),
                                    javaScriptKey : uuidv4(),
                                    clientSecret : uuidv4(),
                                    redirectURL,
                                    idManager : id,            
            });
           
            return apikey;
        } catch (err) {
            logger(err);
            return false;
        }
    },
    /**
     * 발급취소
     * 
     * @param int|Array ids 발급번호 
     * @return Boolean 취소 성공여부
     * @throws APIKeyCancelException 
     */
    async cancel(ids) {
        if (!ids || (ids instanceof Array && ids.length == 0)) {
            throw new APIKeyCancelException("API키 발급번호 누락되었습니다.");
        }

        if (!(ids instanceof Array)) {
            ids = [ids];
        }

        const result = await ApiKey.destroy({ 
           where : {
                id : {
                    [Op.in] : ids,
                }
            }
        });

    
        return (result > 0)?true:false;
    },
    /**
     * 발급 목록 
     * 
     * @param int page 
     * @param int limit 
     * @param Object req 
     */
    async gets(page, limit, search, req) {
        page = page || 1;
        limit = limit || 20;
        offset = (page - 1) * limit;
        const where = search || {};
   

        const apikeys = await ApiKey.findAll({
                            include : [{ 
                                model : Manager,
                                attributes : ['managerId', 'managerNm'],
                            }],
                            where,
                            order : [['id', 'DESC']],
                            limit,
                            offset,
                            raw : true,

        });

        /** 총 API키 발급 갯수 */
        this.total = await ApiKey.count({
            model : Manager,
            where,
        });

        /** 페이징  */
        if (req) {
            this.pagination = new Pagination(req, page, this.total).getPages();
        }

        return apikeys;
    },
    /**
     * 발급 키 정보
     * 
     * @param {String} key 발급 키 
     * @param {type}  rest - restKey, javascript - JavaScriptKey
     */
    async get(key, type) {
        try {
            type = type || "rest";
            const where = {};
            if (type == 'javascript') {
                where.javaScriptKey = key;
            } else {
                where.restKey = key;
            }

            const data = await ApiKey.findOne({ 
                where, 
                raw : true
            });
            
            if (!data) {
                return false;
            }

            return data;
        } catch (err) {
            logger(err);
            return false;
        }
    }
};

module.exports = keyDao;