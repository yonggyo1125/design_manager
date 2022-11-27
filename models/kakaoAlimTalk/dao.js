const { KakaoAlimTalkHistory, Sequelize : { Op} } = require('..');
const { logger, getUTCDate } = require('../../library/common');
const Pagination = require('../../library/pagination');
const apiCode = require('../../service/kakaoAlimTalk/apiCode');

/**
 * 카카오 알림톡 전송 기록 
 * 
 */
const kakaoAlimTalkDao = {
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
     *  전송목록 
     * 
     * @param {int} page 페이지 번호
     * @param {int} limit 1페이지당 레코드 수 
     * @param {Object} req 
     * @param {Object} search 검색조건
     */
    async getHistories(page, limit, req, search) {
        page = page || 1;
        limit = limit || 20;
        limit = limit == 'all' ? limit : Number(limit);
        let offset = 0;
        if (limit != 'all') offset = (page - 1) * limit;
        const where = {};
        
        /** 검색 처리 S */
        if (search) {
            /** 발송 요청일 검색 S */
            if (search.requestSdate || search.requestEdate) { 
                where.requestAt = {};
            }

            if (search.requestSdate) {
                const sdate = getUTCDate(search.requestSdate);
                where.requestAt[Op.gte]  = sdate;
            }
           
            if (search.requestEdate) {
                const edate = getUTCDate(search.requestEdate);
                edate.setDate(edate.getDate() + 1);
                where.requestAt[Op.lt]  = edate;
            }
            /** 발송 요청일 검색 E */
            /**  수신자 번호  S */
            if (search.recipient) {
                const recipient = search.recipient.trim().replace(/[^\d]/g, "");
                where.recipient = { [Op.substring] : recipient };
            }
            /**  수신자 번호  E */

            /** 템플릿 코드 S */
            if (search.tmpltCode) {
                where.tmpltCode = { [Op.substring] : search.tmpltCode.trim() };
            }
            /** 템플릿 코드 E */
        }
        /** 검색 처리 E */

        try {
            const list = await KakaoAlimTalkHistory.findAll({
                order : [['createdAt', 'DESC']],
                limit,
                offset, 
                where,
                raw : true,
            });

            /** 총 전송 갯수  */
            this.total = await KakaoAlimTalkHistory.count({ where });

            /** 페이징 처리 */
            if (req) {
                this.pagination = new Pagination(req, page, this.total).getPages();
            }

            for (li of list) {
                li.responseCodeStr = apiCode.getResponseCode(li.responseCode);
                li.resultCodeStr = apiCode.getResultCode(li.resultCode);
            }

            return list;
        } catch (err) {
            logger(err);
            return false;
        }
    }
};

module.exports = kakaoAlimTalkDao;