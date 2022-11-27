const { KakaoAlimTalkTemplate, Manager, Sequelize : { Op } } = require('..');
const { logger } = require('../../library/common');
const Pagination = require('../../library/pagination');
const reservationDao = require("./reservationDao");

/**
 * 알림톡 템플릿 관리
 * 
 */
const templateDao = {
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
     * 템플릿 등록 
     * 
     * @param {Object} data
     * @returns {Boolean}
     */
    async add(data) {
        if (!data) {
            return false;
        }

        try {
            const result = await KakaoAlimTalkTemplate.create({
                tmpltCode : data.tmpltCode,
                tmpltNm : data.tmpltNm,
                messageType : data.messageType || "AT",
                message : data.message,
                buttonType : data.buttonType,
                buttons : data.buttons,
                useReservation : data.useReservation == '1' ? true:false,
                idSendReservation : data.idSendReservation || 0,
                useAddChannel : data.useAddChannel == '1' ? true:false,
                channelNm : data.channelNm,
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
     * 템플릿 수정
     * 
     * @param {Object} data
     * @returns {Boolean}
     */
    async update(data) {
        if (!data || !data.tmpltCode) {
            return false;
        }

        try {
            const result = await KakaoAlimTalkTemplate.update({
                tmpltNm : data.tmpltNm,
                messageType : data.messageType || "AT",
                message : data.message,
                buttonType : data.buttonType,
                buttons : data.buttons,
                useReservation : data.useReservation == '1' ? true:false,
                idSendReservation : data.idSendReservation || 0,
                useAddChannel : data.useAddChannel == '1' ? true:false,
                channelNm : data.channelNm,
            }, { where : { tmpltCode : data.tmpltCode }});

            return result[0] > 0;
        } catch (err) {
            logger(err);
            return false;
        }
    },
     /**
     *  템플릿 목록 
     * 
     * @param {int} page 페이지 번호
     * @param {int} limit 1페이지당 레코드 수 
     * @param {Object} req 
     * @param {Object} search
     */
    async gets(page, limit, req, search) {
        try {
            page = page || 1;
            limit = limit == 'all' ? limit : Number(limit);
            const offset = (page - 1) * limit;
            const where = {};
            /** 검색 처리 S */
            if (search) {
                if (search.tmpltCode) {
                    where.tmpltCode = { [Op.substring] : search.tmpltCode.trim() };
                }

                if (search.tmpltNm) {
                    where.tmpltNm = { [Op.substring] : where.tmpltNm.trim() };
                }

            }
            /** 검색 처리 E */
            const params = {
                include : [{
                    model : Manager,
                    attributes : ['managerId', 'managerNm'],
                }],
                order : [['createdAt', 'DESC']],
                where,
                raw : true,
            };

            if (limit != 'all') {
                params.limit = limit;
                params.offset = offset;
            }

            const list = await KakaoAlimTalkTemplate.findAll(params);
            for (const li of list) {
                if (typeof li.buttons == 'string') {
                    li.buttons = JSON.parse(li.buttons);
                }
            }

            if (limit != 'all') {
                /** 총 템플릿 수 */
                this.total = await KakaoAlimTalkTemplate.count({
                    where,
                });

                /** 페이징 처리 */
                if (req) {
                    this.pagination = new Pagination(req, page, this.total).getPages();
                }
            }
            return list;
        } catch (err) {
            logger(err);
            return false;
        }
    },
    /**
    * 템플릿 조회
     * 
     * @param {String} tmpltCode 템플릿코드 
     * @returns {Boolean}
     */
    async get(tmpltCode) {
        if (!tmpltCode) {
            return false;
        }

        try {
            const data = await KakaoAlimTalkTemplate.findByPk(tmpltCode, { raw : true });
            if (!data) {
                return false;
            }

           /** 치환코드 추출 S */
            const set = new Set();
            const replaceCodes =  [];
            const pattern = /#{([^}]+)}/igm;
            let match = null;
            while ((match = pattern.exec(data.message))!= null) {
                set.add(match[1]);
            }
            set.forEach(v => replaceCodes.push(v));
            data.replaceCodes = replaceCodes;
            /** 치환코드 추출 E */
            
            /** 예약전송 설정 조회 S */
            if (data.useReservation && data.idSendReservation) {
                data.reservation = await reservationDao.get(data.idSendReservation);
            }
            /** 예약전송 설정 조회 E */

            /** 버튼 설정 데이터 처리 S */
            if (typeof data.buttons  == 'string') {
                data.buttons = JSON.parse(data.buttons);
            }
            /** 버튼 설정 데이터 처리 E */
            return data;
        } catch (err) {
            logger(err);
            return false;
        }
    },
    /**
     * 템플릿 삭제
     * 
     * @param {String|Array} tmpltCodes
     * @returns {Boolean}
     */
    async delete(tmpltCodes) {
        if (!tmpltCodes) {
            return false;
        }

        if (!(tmpltCodes instanceof Array)) {
            tmpltCodes = [tmpltCodes];
        }

        try {
            await KakaoAlimTalkTemplate.destroy({
                where : {
                    tmpltCode : { [Op.in] : tmpltCodes },
                }
            });

            return true;
        } catch (err) {
            logger(err);
            return false;
        }
    }
};

module.exports = templateDao;