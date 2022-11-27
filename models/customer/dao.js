const { getConfig, getToday, getException, validateCellPhone, logger, getLocalDate, getUTCDate, dateFormat, nl2br } = require('../../library/common');
const calendar = require('../../library/calendar');
const { Holiday, CustomerApply, CustomerService, Sequelize, Sequelize : { Op }, Manager } = require('../index');
const Pagination = require('../../library/pagination');

/** 예외 S */
const CustomerApplyException = getException("Customer/CustomerApplyException");
const CustomerApplyUpdateException = getException("Customer/CustomerApplyUpdateException");
const CustomerApplyDeleteException = getException("Customer/CustomerApplyDeleteException");
const CustomerServiceRegisterException = getException("Customer/CustomerServiceRegisterException");
const CustomerServiceUpdateException = getException("Customer/CustomerServiceUpdateException");
const CustomerServiceDeleteException = getException("Customer/CustomerServiceDeleteException");
/** 예외 E */

const fileDao = require('../file/dao');
const excel = require('../../library/excel');
const boardDataDao = require("../board/boardDataDao");

const sendTelCsAlimTalkToAdmin = require("../../service/customer/sendTelCsAlimTalkToAdmin"); // 전화상담 접수 알림톡 전송 
const replyAlimTalkToClient = require("../../service/customer/replyAlimTalkToClient"); // 상담 답변 완료 메세지 전송
const processWebHook = require("../../service/utils/processWebHook"); // 웹훅 처리 

/**
 * 상담 관련 
 * 
 */
const customerDao = {
    _total : 0, // 전체 품목 수
    _pagination : "", // 페이지 HTML,
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
    // 처리상태 
    applyStatus : { 
        ready : "접수",
        progress:  "처리중",
        done : "완료",
    },
    /**
     * 상담 가능 시간대 목록 
     * 
     */
    async getSchedules() {
        const config = await getConfig("csConfig");
        let csShour = config.csShour || 9;
        let csEhour = config.csEhour || 18;
        csShour = Number(csShour);
        csEhour = Number(csEhour);

        let lunchShour = config.lunchShour || 12;
        let lunchEhour = config.lunchEhour || 13;
        lunchShour = Number(lunchShour);
        lunchEhour = Number(lunchEhour);
        if (lunchShour > lunchEhour) {
            lunchEhour = lunchShour;
            lunchShour = config.lunchEhour || 13;
        }
        let hours = [];
        if (csShour <= csEhour) {
            for (let i = csShour; i < csEhour; i++) {
                if (i >= lunchShour && i+1 <= lunchEhour) 
                    continue; 

                hours.push(i);
            }
        } else {
            for (let i = csShour; i < 24; i++) {
                if (i >= lunchShour && i+1 <= lunchEhour) 
                    continue; 
                hours.push(i);
            }

            for (let i = 0; i < csEhour; i++) {
                if (i >= lunchShour && i+1 <= lunchEhour) 
                    continue; 
                hours.push(i);
            }

        }
        const list = [];
        hours.forEach(hour => {
            let period = "";
            let ehour = hour + 1;
            if (ehour > 23) ehour = 0;
            const amPm = (hour < 12)?"오전":"오후";
            if (hour < 12) {
                period = (hour < 10)?`0${hour}:00~`:`${hour}:00 ~ `;
                period += (ehour < 10)?`0${ehour}:00`:`${ehour}:00`;
            } else {
                period = `0${hour - 12}:00~0${ehour - 12}:00`;
            }
            period = amPm + " " + period;
            list.push({
                hour,
                period,
            });
        });
        
        return list;
    },
    /**
     * 상담 분류 
     *
     *  @returns {Array} 
     */
    async getCategories() {
        const config = await getConfig("csConfig");
        const category  = config.csCategory?config.csCategory.split("||"):[];
        return category;
    },
    /**
     * 상담가능 일정이 반영된 달력
     * 
     * @param {int} year 
     * @param {int} month 
     */
    async getCalendar(year, month) {
        const data = calendar.get(year, month);
        const { csHolidayYoils } = await getConfig('csHoliday');
        const today = getToday();
        for await (day of data.days) {
            if (day.stamp < today) {
                day.available = false;
                continue;
            }

            /** 요일 체크  */
            if (csHolidayYoils && csHolidayYoils.length > 0) {
                const yoil = new Date(day.stamp).getDay();
                if (csHolidayYoils.indexOf("" + yoil) != -1) {
                    day.available = false;
                    continue;
                }
            }

            /** 공휴일 체크 */
            const cnt = await Holiday.count({ where : { stamp : day.stamp, isCsHoliday : true }});
            if (cnt > 0) {
                day.available = false;
                continue;  
            }
        }

        return data;
    },
    /**
     * 전화상담 예약 신청 
     * 
     * @param {Object} req 
     * @returns {Boolean|Object}
     * @throws {CustomerApplyException}
     */
    async applyCs(req) {
        const data = req.body;
        this.validateApplyCs(data);

        const customerCellPhone = data.customerCellPhone.replace(/[^\d]/g, "");
        try {
            const result = await CustomerApply.create({
                channel : data.channel,
                csType : data.csType,
                preferredDate : new Date(Number(data.preferredDate)),
                preferredTime : data.preferredTime,
                customerNm : data.customerNm,
                kakaoId : data.kakaoId,
                customerCellPhone,
            });
            if (!result) {
                return false;
            }
            
            // 상담 접수 관리자 알림톡 전송 추가
            await sendTelCsAlimTalkToAdmin(result.id);


            const csConfig = await getConfig("csConfig");
            if (csConfig.telWebHookUrls) {
                const urls = csConfig.telWebHookUrls.trim().split("\n").map(s=>s.replace("\r", ""));
                if (urls) {
                    for await (const url of urls) {
                        await processWebHook(url, data);
                    }
                }
            }

            return result;
        } catch (err) {
            logger(err);
            return false;
        }
    },
    /**
     * 
     * @param {Object} data 
     * @throws {CustomerApplyException}
     */
    validateApplyCs(data) {
        /** 필수 항목 체크 S */
        const required = {
            channel : "유입경로가 누락되었습니다",
            preferredDate : "상담 희망 날짜를 선택하세요.",
            preferredTime : "상담 희망 시간을 선택하세요.",
            customerNm : "신청자명을 입력하세요.",
            customerCellPhone : "연락처를 입력하세요.",
        };

        if (!data.csType) {
            throw new CustomerApplyException("상담 종류를 선택하세요.");
        }

        if (data.csType.indexOf('kakao') != -1) {
            required.kakaoId = "카카오톡ID를 입력하세요.";
        }

        for (key in required) {
            if (!data[key] || (data[key].trim() == "")) {
                throw new CustomerApplyException(required[key]);
            }
        }
        /** 필수 항목 체크 E */

        /** 휴대전화번호 형식 체크 S */
        if (!validateCellPhone(data.customerCellPhone)) {
            throw new CustomerApplyException("휴대전화번호 형식이 아닙니다.");
        }
        /** 휴대전화번호 형식 체크 E */
    },
    /**
     * 상담 신청 목록 
     * 
     * @param {int} page 페이지 번호 
     * @param {int} limit 1페이지당 레코드 수 
     * @param {Object} req 
     */
    async getApplies(page, limit, req) {
        try {
            page = page || 1;
            limit = limit || 20;
            const offset = (page - 1) * limit;
            const where = {};

            /** 검색 처리 S */
            const search = req.query;
            // 상담 희망일
            if (search.sDate) {
                where.preferredDate = { [Op.gte] : getUTCDate(search.sDate) };
            }

            if (search.eDate) {
                where.preferredDate = where.preferredDate || {};
                where.preferredDate[Op.lte] = getUTCDate(search.eDate);
            }
            
            // 유입경로
            if (search.channel) {
                if (!(search.channel instanceof Array)) {
                    search.channel = [search.channel];
                }

                where.channel = { [Op.in] : search.channel };
            }

            // 처리상태
            if (search.status) {
                if (!(search.status instanceof Array)) {
                    search.status = [search.status];
                }

                where.status = { [Op.in] : search.status };
            }

            // 키워드 검색
            if (search.sopt && search.skey) {
                const skey = search.skey.trim();
                switch (search.sopt) {
                    case "customerNm" :  // 이름
                        where.customerNm = { [Op.like] : `%${skey}%` }; 
                        break;
                    case "customerCellPhone" :  // 연락처
                        where.customerCellPhone = { [Op.like] : `%${skey}%` };
                        break;
                    case "kakaoId" : // 카카오ID
                        where.kakaoId = { [Op.like] : `%${skey}%` };
                        break;
                    default : 
                        where[Op.or] = [
                            { customerNm : { [Op.like] : `%${skey}%`}},
                            { customerCellPhone : { [Op.like] : `%${skey}%`}},
                            { kakaoId : { [Op.like] : `%${skey}%`}},
                        ];
                               
                }
            }

            /** 검색 처리 E */

            const list = await CustomerApply.findAll({
                where,
                order: [['id', 'DESC']],
                offset,
                limit,
                raw : true,
            });
            for await (li of list) {
                //li.csType = li.csType.split("||");
                li.preferredDateTime = getLocalDate(li.preferredDate, '%Y.%m.%d') + " ";

                li.preferredDateTime += (li.preferredTime < 10)?`0${li.preferredTime}`:li.preferredTime;
                li.preferredDateTime += "~";
                let preferredETime = li.preferredTime + 1;
                if (preferredETime > 23) preferredETime = 0;
                li.preferredDateTime += (preferredETime < 10)?`0${preferredETime}`:preferredETime;
                li.statusStr = this.applyStatus[li.status];
            }
            
            /** 총 신청 수 */
            this.total = await CustomerApply.count({ where });

            /** 페이징 처리 */
            if (req) {
                this.pagination = new Pagination(req, page, this.total).getPages();
            }

            return list;
        } catch (err) {
            logger(err);
            return false;
        }
    },
    /**
     * 전화상담신청 조회 
     * 
     * @param {int} id 
     * @returns {Boolean}
     */
    async getApply(id) {
        if (!id) {
            return false;
        }

        try {
            const info =  await CustomerApply.findByPk(id, { raw : true });
            if (!info) {
                return false;
            }

            info.preferredDateTime = getLocalDate(info.preferredDate, '%Y.%m.%d') + " ";
            info.preferredDateTime += (info.preferredTime < 10)?`0${info.preferredTime}`:info.preferredTime;
            info.preferredDateTime += "~";
            let preferredETime = info.preferredTime + 1;
            if (preferredETime > 23) preferredETime = 0;
            info.preferredDateTime += (preferredETime < 10)?`0${preferredETime}`:preferredETime;
            info.statusStr = this.applyStatus[info.status];

            return info;
        } catch (err) {
            logger(err);
            return false;
        }
    },
    /**
     * 전화 상담 신청 유입경로 
     * 
     */
    async getApplyChannels() {
        try {
            const channels = await CustomerApply.findAll({
                attributes : [
                    [Sequelize.fn('DISTINCT', Sequelize.col('channel')), 'channel'],
                ],
                raw : true,
            });
            
            return channels.map(v => v.channel);
            
        } catch (err) {
            logger(err);
            return false;
        }
    },
    /**
     * 전화 상담 신청 수정 
     * 
     * @param {Object} req 
     * @throws {CustomerApplyUpdateException}
     */
    async updateApplies(req) {
        const data = req.body;
        let ids = data.id;
        if (!ids) {
            throw new CustomerApplyUpdateException("수정할 신청목록을 선택하세요.");
        }

        if (!(ids instanceof Array)) {
            ids = [ids];
        }

        try {
            for await (id of ids) {
                await CustomerApply.update({
                    status : data[`status_${id}`]
                }, { where : { id }});
            }

            return true;
        } catch (err) {
            logger(err);
            return false;
        }
    },
    /**
     * 전화 상담 신청 삭제 
     * 
     * @param {Object} req 
     * @throws {CustomerApplyDeleteException}
     */
    async deleteApplies(req) {
        const data = req.body;
        let ids = data.id;
        if (!ids) {
            throw new CustomerApplyDeleteException("삭제할 신청목록을 선택하세요.");
        }

        if (!(ids instanceof Array)) {
            ids = [ids];
        }

        try {
            for await (id of ids) {
                await CustomerApply.destroy({
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
     * 상담 등록 
     * 
     * @param {Object} req 
     * @returns {Boolean}
     * @throws {CustomerServiceRegisterException}
     */
    async add(req) {
        const data = req.body;
        const result =  await this._add(data, req);
        return result;
    },
    async _add(data, req) {
      
        this.validate(data, CustomerServiceRegisterException);

        try {
            const cellPhone = data.cellPhone?data.cellPhone.replace(/\D/g, ""):"";
            const params = {
                gid : data.gid,
                channel : data.channel || "본사",
                category : data.category || "",
                orderNo : data.orderNo || 0,
                customerNm : data.customerNm,
                cellPhone,
                email : data.email,
                zonecode : data.zonecode,
                address : data.address,
                addressSub : data.addressSub,
                question : data.question,
                memo : data.memo || "",
                productNm : data.productNm,
                idManager : req.manager.id,
            };

            const result = await CustomerService.create(params);
            if (!result) {
                return false;
            }

            await fileDao.updateDone(data.gid);

            if (data.addAsApply) {
                await this.registerAsBoard(req);
            }

            if (data.replyAlimTalk) {
                await replyAlimTalkToClient(result.id);
            }

            return result;
        } catch (err) {
            logger(err);
            return false;
        }
    },
    /**
     * 상담목록 수정 
     * 
     * @param {Object} req 
     * @throws {CustomerServiceUpdateException}
     */
    async updates(req) {
        const data = req.body;
        if (!data) {
            throw new CustomerServiceUpdateException("잘못된 접근입니다.");
        }
        let ids = data.id;
        if (!ids) {
            throw new CustomerServiceUpdateException("수정할 상담을 선택하세요.");
        }

        if (!(ids instanceof Array)) {
            ids = [ids];
        }
        try {        
            for await (id of ids) {
                await CustomerService.update({
                    category : data[`category_${id}`],
                }, { where : { id }});
            }

            return true;
        } catch (err) {
            logger(err);
            return false;
        }
    },
    /**
     * 상담 수정
     * 
     * @param {Object} req 
     * @throws {CustomerServiceUpdateException}
     */
    async update(req) {
        const data = req.body;
        data.id = req.params.id || req.body.id;
        data.mode = 'update';
        this.validate(data, CustomerServiceUpdateException);

        try {
            const cellPhone = data.cellPhone?data.cellPhone.replace(/[^\d]/g, ""):"";
            const result = await CustomerService.update({
                orderNo : data.orderNo,
                category : data.category || "",
                customerNm : data.customerNm,
                cellPhone,
                email : data.email,
                zonecode : data.zonecode,
                address : data.address,
                addressSub : data.addressSub,
                question : data.question,
                memo : data.memo,
                productNm : data.productNm
            }, { where : { id : data.id }});

            if (!result) {
                return false;
            }

            await fileDao.updateDone(data.gid);

            if (data.addAsApply) {
                await this.registerAsBoard(req);
            }

            if (data.replyAlimTalk) {
                await replyAlimTalkToClient(data.id);
            }

            const csConfig = await getConfig("csConfig");
            if (csConfig.webhookUrls) {
                const urls = csConfig.webhookUrls.trim().split("\n").map(s=>s.replace("\r", ""));
                if (urls) {
                    for await (const url of urls) {
                        await processWebHook(url, data);
                    }
                }
            }

            return result[0] > 0;
        } catch (err) {
            logger(err);
            return false;
        }
    },
    /**
     * A/S 신청 게시판에 함게 등록 처리
     * 
     * @param {*} data 
     */
    async registerAsBoard(req) {
        const data = req.body;
        const config = await getConfig("csConfig");
        if (!config.idBoard || config.idBoard.trim() == "") {
            return false;
        }
        const subject = data.customerNm + "님 A/S 요청";
        let mobile = data.cellPhone;
        if (mobile) {
            mobile = mobile.replace(/\D/g, "");
        }
        let poster = req.manager.managerNm;

        let address = "";
        if (data.zonecode) address += `(${data.zonecode})`;
        address = address + `${data.address} ${data.addressSub}`;
        const memo = nl2br(data.memo);
        const content = `<br>주문번호 : ${data.orderNo}<br><br>
고객명 : ${data.customerNm}<br><br>
주소 : ${address}<br><br>
연락처 : ${mobile}<br><br>
이메일 : ${data.email}<br><br>
상담상품 : ${data.productNm}<br><br>
상담메모 : ${memo}
        `;
        let gid = Date.now();
        const saveData = {
            idBoard : config.idBoard,
            gid,
            poster,
            subject,
            content,
            mobile,
            idManager : req.manager.id,
            userAgent : req.userAgent,
            ipAddr : req.ip,
        };
        const boardData = await boardDataDao.save(saveData);

        return boardData;
    },
    /**
     * 상담 삭제
     *  
     * @param {int|Array} ids 
     * @returns {Boolean}
     * @throws {CustomerServiceDeleteException}
     */
    async delete(ids) {
        if (!ids) {
            throw new CustomerServiceDeleteException("삭제할 상품을 선택하세요.");
        }
        
        if (!(ids instanceof Array)) {
            ids = [ids];
        }

        try {
            for await (id of ids) {
                await CustomerService.destroy({
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
     * 상담 목록 
     * 
     * @param {int} page 페이지 번호
     * @param {int} limit 1페이지당 레코드 수
     * @param {Object} req 
     * @param {Object} searches  
     */
    async gets(page, limit, req, searches) {
        page = page || 1;
        limit = Number(limit) || 20;
        const offset = (page - 1) * limit;
        const where = {}, managerWhere = {};

        /** 검색 처리 S */
        let search;
        let isManagerRequired = false;
        if (req && req.body.search) {
            const urlParams = new URLSearchParams(req.body.search);
            search = search || {};
            for ([k,v] of urlParams.entries()) {
                if (['channel', 'category'].indexOf(k) != -1) {
                    search[k] = search[k] || [];
                    search[k].push(v);
                } else {
                    search[k] = v;
                }
            }            
        }

        if (!search && searches) search = searches;
        if (!search) search = req.query;
        if (search) {
            /** 등록일시 검색 S */
            if (search.sDate) {
                where.createdAt = { [Op.gte] : getUTCDate(search.sDate) };
            }

            if (search.eDate) {
                where.createdAt = where.createdAt || {};
                where.createdAt[Op.lte] = getUTCDate(search.eDate);
            }
            /** 등록일시 검색 E */
            /** 유입경로 S */
            if (search.channel) {
                let channels = search.channel;
                if (!(channels instanceof Array)) {
                    channels = [channels];
                }
                where.channel = { [Op.in] : channels };
            }
            /** 유입 경로 E */
            /** 상담구분 S */
            if (search.category) {
                let categories = search.category;
                if (!(categories instanceof Array)) {
                    categories = [categories];
                }

                where.category = { [Op.in] : categories };
            }
            /** 상담구분 E */
            /** 키워드 검색 S */
            if (search.sopt && search.skey && search.skey.trim() != "") {
                const skey = search.skey.trim();
                if (search.sopt == 'all') {
                    where[Op.or] = [
                        { orderNo : { [Op.like] : `%${skey}%`}},
                        { customerNm : { [Op.like] : `%${skey}%`}},
                        { cellPhone : { [Op.like] : `%${skey}%`}},
                        { email : { [Op.like] : `%${skey}%`}},
                        { memo : { [Op.like] : `%${skey}%`}},
                        { question : { [Op.like] : `%${skey}%`}},
                    ];
                } else {
                    where[search.sopt] = { [Op.like] : `%${skey}%` };
                }
            }
            /** 키워드 검색 E */
            /** 처리자 검색 S */
            if (search.idManager) {
                isManagerRequired = true;
                let idManagers = search.idManager;
                if (!(idManagers instanceof Array)) {
                    idManagers = [idManagers];
                }
                where.idManager = {[Op.in] : idManagers };
            }
            /** 처리자 검색 E */

            /** 주문번호 검색 S */
            const orWhere = [];
            if (search.orderNo) {
                orWhere.push({ orderNo : search.orderNo });
            }
            /** 주문번호 검색 E */

            /** 전화번호 검색 */
            if (search.cellPhone) {
                const cellPhone = search.cellPhone.replace(/[^\d]/g, "");
                orWhere.push({ cellPhone });
            }

            /** 고객명 검색 */
            if (search.customerNm) {
                orWhere.push({ customerNm : search.customerNm });
            }

            /** 상담 기록 검색 S */
            if (search.searchType) {
                // 주문번호
                if (search.orderNo) {
                    const cond = { [Op.substring ] :  search.orderNo.trim() };
                    if (search.searchType  == 'or') {
                        orWhere.push({ orderNo : cond });
                    } else {
                        where.orderNo = cond;
                    }
                }

                 // 고객명
                 if (search.customerNm) {
                    const cond = { [Op.substring ] :  search.customerNm.trim() };
                    if (search.searchType  == 'or') {
                        orWhere.push({ customerNm : cond });
                    } else {
                        where.customerNm = cond;
                    }
                }
                
                // 연락처
                if (search.cellPhone) {
                    const cellPhone = search.cellPhone.replace(/[^\d]/g, "");
                    const cond = { [Op.substring ] :  cellPhone };
                    if (search.searchType  == 'or') {
                        orWhere.push({ cellPhone : cond });
                    } else {
                        where.cellPhone = cond;
                    }
                }

                // 이메일
                if (search.email) {;
                    const cond = { [Op.substring ] :  search.email.trim() };
                    if (search.searchType  == 'or') {
                        orWhere.push({ email : cond });
                    } else {
                        where.email = cond;
                    }
                }
            }
            /** 상담기록 검색 E */

            if (orWhere.length > 0) {
                where[Op.or] = orWhere;
            }
        }   

        if (req && req.query.mode && req.query.mode == 'dnXls' && req.body.id) {
            if (!(req.body.id instanceof Array)) {
                req.body.id = [req.body.id];
            }
        }

        
        /** 검색 처리 E */
        const params = {
            include : [{
                model : Manager,
                attributes : ["managerId", "managerNm", "managerLv", "managerType"],
                required : isManagerRequired,
            }],
            order: [['id', 'DESC']],
            where,
            raw : true,
        };

        if (limit != 'all') {
            params.limit = limit;
            params.offset = offset;
        }

        try {
            const list = await CustomerService.findAll(params);
            for await (li of list) {
                li.attachFiles = await fileDao.gets(li.gid, true);
            }
            
            /** 총 상담 수 */
            this.total = await CustomerService.count({ where });

            /** 페이징 처리 */
            if (req) {
                this.pagination = new Pagination(req, page, this.total).getPages();
            }

            return list;
        } catch (err) {
            logger(err);
            return false;
        }
    },
    /**
     * 상담정보 조회
     * @param {int} id 
     * @returns {Boolean}
     */
    async get(id) {
        if (!id) {
            return false;
        }

        try {
            const data = await CustomerService.findOne({
                include : [{
                    model : Manager,
                    attributes : ["managerId", "managerNm"],
                }],
                where : { id },
                raw : true,
            });
            if (!data) {
                return false;
            }
            
            /** 첨부 파일 목록 */
            data.attachFiles = await fileDao.gets(data.gid, true);
            
            return data;
        } catch (err) {
            logger(err);
            return false;
        }
    },
    /**
     * 등록된 유입경로 조회 
     * 
     */
    async getChannels() {
        try {
            const channels = await CustomerService.findAll({
                attributes : [
                    [Sequelize.fn('DISTINCT', Sequelize.col('channel')), 'channel'],
                ],
                raw : true,
            });

            return channels.map(v => v.channel);
        } catch (err) {
            logger(err);
            return false;
        }
    },
    /** 
     * 상담 등록/수정 유효성 검사
     * 
     * @param {Object} data 
     * @throws {Exception}
     */
    validate(data, Exception) {
        /** 필수 입력 항목 체크 S */
        const required = {
            gid : "잘못된 접근입니다.",
            category : "상담구분을 선택하세요.",
            customerNm : "고객명을 입력하세요.",
            memo : "상담메모를 입력하세요",
        };

        /** API 요청인 경우는 상담 메모 체크 제외 */
        if (data.isApi) {
            delete required.memo;
        }

        if (data.mode == 'update') {
            required.id = "잘못된 접근입니다.";
        }

        for (key in required) {
            if (!data[key] || (typeof data[key] == 'string' && data[key].trim() == "")) {
                throw new Exception(required[key]);
            }
        }
        /** 필수 입력 항목 체크 E */
        
        /** 휴대전화번호 형식 체크 */
        if (data.cellPhone && !validateCellPhone(data.cellPhone)) {
            throw new Exception("휴대전화번호 형식이 아닙니다.")
        }
    },
    /**
     * 상담목록 엑셀 다운로드
     * 
     * @param {Object} req 
     * @param {Object} res 
     */
    async dnXls(req, res) {
        const title = "상담목록";
        const fileName = "customer_service_" + dateFormat(new Date(), "%Y%m%d%H%i%s");
        const headers = [
            { header : "상담구분", key: "category", width: 20},
            { header : "유입경로", key: "channel", width: 20},
            { header : "등록일시", key: "createdAt", width: 30},
            { header : "처리자", key: "manager", width: 30},
            { header : "주문번호", key: "orderNo", width: 30},
            { header : "고객명", key: "customerNm", width: 30},
            { header : "연락처", key: "cellPhone", width: 30},
            { header : "이메일", key: "email", width: 40},
            { header : "주소", key: "address", width: 60},
            { header : "상담메모", key: "memo", width: 80},
        ];
        const list = await this.gets(1, 'all', req);
        const bodies = [];
        list.forEach(li => {
            const createdAt = getLocalDate(li.createdAt, "%Y-%m-%d %H:%i:%s");
            const manager = li['Manager.managerNm'] + "(" + li['Manager.managerId'] + ")"; 
            let address = li['address'] + li['addressSub'];
            if (li['zonecode']) address = "(" + li['zonecode'] + ")" + address;

            bodies.push({
                category : li.category,
                channel : li.channel,
                createdAt,
                manager,
                orderNo : li.orderNo,
                customerNm : li.customerNm,
                cellPhone : li.cellPhone,
                email : li.email,
                address,
                memo : li.memo,
            });
        });

        excel.download(res, title, fileName, headers, bodies);
    },
    /**
     * 상담 횟수 조회 
     * 
     */
    async getCount(customerNm, cellPhone, orderNo) {
        try {
            if (!customerNm && !cellPhone && !orderNo) {
                throw new Error("검색항목 없음");
            }
            const orWhere = [];
            if (orderNo) { // 주문번호 
                orWhere.push({ orderNo });
            }

            if (cellPhone) {
                cellPhone = cellPhone.replace(/\D/g, "");
                orWhere.push({ cellPhone });
            }

            if (customerNm) {
                customerNm = customerNm.trim();
                orWhere.push({ customerNm });
            }

            const cnt = await CustomerService.count({
                where : {[Op.or] : orWhere },
            });

            return cnt;
        } catch (err) {
            logger(err);
            return 0;
        }
    }
};

module.exports = customerDao;