const { KakaoAlimTalkReservation, KakaoAlimTalkReserved, Sequelize : { Op }  } = require("..");
const { logger } = require("../../library/common");
const Pagination = require('../../library/pagination');

/**
 * 카카오 알림톡 예약 전송 관련 DAO
 * 
 */
const reservationDao = {
    _total : 0, // 전체 예약 설정 수
    _pagination : "", //  페이지 HTML
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
     * 예약 전송 추가
     * 
     * @param {*} data 
     */
    async save(data) {
        if (!data) {
            return false;
        }

        if (!(data.stime instanceof Array)) {
            data.stime = [data.stime];
        }

        if (!(data.etime instanceof Array)) {
            data.etime = [data.etime];
        }

        const reservations = [];
        for (let i = 0; i < data.stime.length; i++) {
            reservations.push({
                stime : data.stime[i],
                etime : data.etime[i],
            });
        }

        try {
            const commonData = {
                title : data.title,
                isUse : data.isUse == "1" ? true:false,
                holidayType : data.holidayType == 'delivery' ? "delivery" : "cs",
                reservations,
                idManager : data.idManager,
            };

            if (data.mode == 'update') {
                await KakaoAlimTalkReservation.update(commonData, { where : { id : data.id }});
                return true;
            } else {
                data = await KakaoAlimTalkReservation.create(commonData, { raw : true });
                return data;
            }
           
        } catch (err) {
            logger(err);
            return false;
        }
    },
    /**
     * 예약설정 삭제
     * 
     * @param {*} ids 
     */
    async delete(ids) {
        if (!ids) {
            return false;
        }

        if (!(ids instanceof Array)) {
            ids = [ids];
        }

        await KakaoAlimTalkReservation.destroy({ where : { id : { [Op.in] : ids} }});

        return true;
    },
    /** 예약 설정 조회  */
    async get(id) {
        if (!id) {
            return false;
        }

        const data = await KakaoAlimTalkReservation.findByPk(id, { raw : true });
        if (data) {
            if (typeof data.reservations == 'string') {
                data.reservations = JSON.parse(data.reservations);
            }

            const reservations = data.reservations;
            if (reservations && reservations.length > 0) {
                for (const item of reservations) {
                    this.updateReservations(item);
                }
            }
        }

        return data;
    },
    /**
     * 예약 설정 목록
     * 
     * @param {int} page 페이지 번호
     * @param {int} limit 1페이지당 레코드 수 
     * @param {Object} req 
     * @param {Object} search 검색용 쿼리
     */
    async gets(page, limit, req, search) {
        page = page || 1;
        limit = limit || 20;
        limit = limit == 'all' ? limit : Number(limit);
        const offset = (page - 1) * limit;
        const where = {}, andWhere = [], orWhere = [];

        /** 검색 처리 S */
        search = search || {};
        if (andWhere.length > 0) where[Op.and] = andWhere;
        if (orWhere.length > 0) where[Op.or] = orWhere;
        /** 검색 처리 E */

        const params = {
            order : [['id', "DESC"]],
            where,
            raw : true,
        };

        if (limit != 'all') {
            params.limit = limit;
            params.offset = offset;
        }

        const list = await KakaoAlimTalkReservation.findAll(params);
        if (list && list.length > 0) {
            for (const data of list) {
                if (!data.reservations) {
                    continue;
                }

                if (typeof data.reservations == 'string') {
                    data.reservations = JSON.parse(data.reservations);
                }

                for (const item of data.reservations) {
                    this.updateReservations(item);
                }
            }
        }

        if (limit == 'all') {
            return list;
        }

        const total = await KakaoAlimTalkReservation.count({ where });
        this.total = total;
        if (req) {
            this.pagination = new Pagination(req, page, total, null, limit).getPages();
        }

        return list;
    },
    /**
     * 예약 설정 목록
     * 
     * @param {int} page 페이지 번호
     * @param {int} limit 1페이지당 레코드 수 
     * @param {Object} req 
     * @param {Object} search 검색용 쿼리
     */
     async getReserveds(page, limit, req, search) {
        page = page || 1;
        limit = limit || 20;
        limit = limit == 'all' ? limit : Number(limit);
        const offset = (page - 1) * limit;
        const where = { isSent : false }, andWhere = [], orWhere = [];

        /** 검색 처리 S */
        search = search || {};
        if (andWhere.length > 0) where[Op.and] = andWhere;
        if (orWhere.length > 0) where[Op.or] = orWhere;
        /** 검색 처리 E */

        const params = {
            order : [['id', "DESC"]],
            where,
            raw : true,
        };

        if (limit != 'all') {
            params.limit = limit;
            params.offset = offset;
        }

        const list = await KakaoAlimTalkReserved.findAll(params);

        if (limit == 'all') {
            return list;
        }

        const total = await KakaoAlimTalkReserved.count({ where });
        this.total = total;
        if (req) {
            this.pagination = new Pagination(req, page, total, null, limit).getPages();
        }

        return list;
     },
     /**
      * 전송예약 취소
      * 
      * @param {*} ids 
      */
     async cancelReserved(ids) {
        if (!ids) {
            return false;
        }
        
        if (!(ids instanceof Array)) {
            ids = [ids];
        }

        await KakaoAlimTalkReserved.destroy({ where : { id : { [Op.in] : ids }}})
     },
     /**
      * 전송완료 처리
      * 
      * @param {*} id 
      */
     async doneSentReserved(id) {
        if (!id) {
            return false;
        }

        await KakaoAlimTalkReserved.update({ isSent : true }, { where : { id }});
     },
    /**
     * 예약시간 업데이트
     * 
     * @param {*} item 
     */
     updateReservations(item) {
        item.stime = parseInt(item.stime);
        item.etime = parseInt(item.etime);

        const sdate = new Date(item.stime);
        const edate = new Date(item.etime);

        const shour = sdate.getHours();
        const smin = sdate.getMinutes();

        const ehour = edate.getHours();
        const emin = edate.getMinutes();
       
        const today = new Date();
        const todaySdate = new Date(today.getFullYear(), today.getMonth(), today.getDate(), shour, smin, 0);
        const todayEdate = new Date(today.getFullYear(), today.getMonth(), today.getDate(), ehour, emin, 0);
        
        item.todaySdate = todaySdate;
        item.todayEdate = todayEdate;

        const sshour = shour < 10 ? `0${shour}`:shour;
        const ssmin = smin < 10 ? `0${smin}`:smin;
        item.sStr = `${sshour}:${ssmin}`;
        
        const sehour = ehour < 10 ? `0${ehour}`:ehour;
        const semin = emin < 10 ? `0${emin}`:emin;
        item.eStr = `${sehour}:${semin}`;
    }
};


module.exports = reservationDao;