const { Manager, Sequelize : { Op }, Level } = require('../index');
const { logger, secureSet, md5, getException, getUTCDate, dateFormat } = require('../../library/common');

/** 예외 S */
const ManagerValidationException = getException('Manager/ManagerValidationException');
const ManagerLoginException = getException('Manager/ManagerLoginException');
const ManagerLoginValidationException = getException("Manager/ManagerLoginValidationException");
const ManagerUpdateException = getException("Manager/ManagerUpdateException");
/** 예외 E */

const bcrypt = require('bcrypt');

const Pagination = require('../../library/pagination');

/** 
 * 관리자 계정 관련 
 * 
*/
const ManagerDao = {
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
     * 회원가입 필수 항목 
     * 
     */
    joinRequired : {
        managerId : "아이디를 입력하세요",
        managerNm : "관리자명을 입력하세요",
        managerPw : "관리자 비밀번호를 입력하세요",
        managerPwRe : "관리자 비밀번호를 확인하세요",
        email : "이메일을 입력하세요",
        mobile : "휴대전화번호를 입력하세요",
        useTerms : "이용약관에 동의하세요",
        privateTerms : "개인정보처리방침에 동의하세요",
    },
    /** 
     * 회원 가입 처리 
     * 
     * @param req - request 객체
     * @return Boolean
     * @throws ManagerValidationException 유효성 검사 실패시 
     */
    async join(req) {
        const data = req.body; 
        await this.checkJoinData(data);

        try {
            const salt = await bcrypt.genSalt(10);
            const managerPw = await bcrypt.hash(data.managerPw, salt);
            let mobile = data.mobile;
            if (mobile) mobile = mobile.replace(/\D/g, "");

            const manager = await Manager.create({
                managerType : data.managerType || "admin",
                managerId : data.managerId,
                managerNm : data.managerNm,
                managerPw,
                email : data.email,
                mobile,
                useTerms : data.useTerms || 'n',
                privateTerms : data.privateTerms || 'n',
            });
            
            return manager.id;
        } catch (err) {
            req.logger(err);
            return false;
        }
    }, 
    /**
     * 회원정보 수정
     *  
     * @param req - request 객체
     * @return Boolean
     * @throws ManagerValidationException 유효성 검사 실패시 
     */
    async edit(req) {
        const data = req.body;
        data.mode = 'edit';
        data.id = data.id || req.manager.id;
        this.joinRequired.id = "잘못된 접근입니다.";
        delete this.joinRequired.managerId;
        delete this.joinRequired.managerPw;
        delete this.joinRequired.managerPwRe;
        delete this.joinRequired.useTerms;
        delete this.joinRequired.privateTerms;

        await this.checkJoinData(data);
        try {
            

            let mobile = data.mobile;
            if (mobile) mobile = mobile.replace(/\\D/g, "");
            const upData = {
                managerType : data.managerType || "admin",
                managerNm : data.managerNm,
                email : data.email,
                mobile,
                useTerms : data.useTerms || 'n',
                privateTerms : data.privateTerms || 'n',
            };

            if (data.managerPw && data.managerPw.trim() != "") {
                const salt = await bcrypt.genSalt(10);
                const managerPw = await bcrypt.hash(data.managerPw, salt);
                upData.managerPw = managerPw;
            }

        
            const result = await Manager.update(upData, {
                where : { 
                    id : data.id
                }
            });
            return result[0] > 0;
        } catch (err) {
            logger(err);
            return false;
        }
        
    },
    /**
     * 회원가입 유효성 검사 
     * 
     * @param Object data POST 요청 데이터 
     * @throws ManagerValidationException 유효성 검사 실패시
     */
     async checkJoinData(data) {
        if (!data) {
            throw new ManagerValidationException("잘못된 접근입니다.");
        }

        /**
         * 필수 입력 항목 체크 
         * 
         */
        for (key in this.joinRequired) {           
            if (!data[key] || new String(data[key]).trim() == "") {
               throw new ManagerValidationException(this.joinRequired[key]);
            }
        }
  
        if (data.mode != 'edit') { // 회원정보 수정이 아닌 경우 
            const managerId = data.managerId;

            /** 중복 아이디 체크 */
            await this.checkDupManagerId(managerId);

            /**
             * 아이디 유효성 검사 
             *   - 알파벳, 숫자 구성 5~20개 이하 
             */
            
            if (managerId.length < 5 || managerId.length > 20 || /[^a-z0-9]/i.test(managerId)) {
                throw new ManagerValidationException("아이디는 5자리 이상 20이하의 알파벳, 숫자로 구성하세요.");
            }
        }

        /** 비밀번호 유효성 검사 */
        this.checkPassword(data.managerPw, data.managerPwRe);
    },

    /** 
     * 중복 아이디 체크  
     * 
     * @param String managerId 아이디 
     * @throws ManagerValidationException 
     */
    async checkDupManagerId(managerId) {
        if (!managerId) {
            throw new ManagerValidationException("잘못된 접근입니다.");
        }

        const cnt = await Manager.count({
            where : { managerId }
        });
        if (cnt > 0) {
            throw new ManagerValidationException(`이미 가입된 아이디 입니다 - ${managerId}`);
        }
        
    },
    /**
     * 회원가입 또는 수정시 비밀번호 유효성 검사 
     *  - 1개 이상의 알파벳, 숫자, 특수문자로 구성된 8개 이상 
     * 
     * @param String managerPw 비밀번호 
     * @param String managerPwRe 확인 비밀번호 
     * @throws ManagerValidationException 유효성 검사 실패시 
     */
     checkPassword(managerPw, managerPwRe) {
        if (!managerPw) { // 비밀번호가 입력된 경우만 체크
            return;
        }
        
        if (managerPw.length < 8 || !/[a-z]/i.test(managerPw) || !/[0-9]/.test(managerPw) || !/[~!@#$%^&*()_\-=\+\.,\\]/.test(managerPw)) {
            throw new ManagerValidationException("비밀번호는 1개 이상의 알파벳, 숫자, 특수문자로 구성하여 8자리 이상 입력하세요.");
        }

        /** 
         * 비밀번호 확인 
         *  
         */
        if (managerPw != managerPwRe) {
            throw new ManagerValidationException("비밀번호를 확인하세요.");
        }
    },
    /**
     * 로그인 처리 
     * 
     * @param req - request 인스턴스 
     * @return Boolean 
     * @throws ManagerLoginValidationException|ManagerLoginException
     */
    async login(req) {
        const data = req.body;
        if (!data) 
           return false;
        
         /** 유효성 검사 S  */
        if (!data.managerId) {
            throw new ManagerLoginValidationException("아이디를 입력하세요.");
        }

        if (!data.managerPw) {
            throw new ManagerLoginValidationException("비밀번호를 입력하세요.");
        }
        /** 유효성 검사 E */

        try {
            // 회원정보 조회
            const info = await this.get(data.managerId, true);
            if (!info) {
                throw new ManagerLoginValidationException("회원이 존재하지 않습니다.");
            }

            // 비밀번호 일치여부 체크 
            const match = await bcrypt.compare(data.managerPw, info.managerPw);
            if (!match) {
                throw new ManagerLoginValidationException("비밀번호가 일치하지 않습니다.");
            }

            /** 탈퇴 회원 여부 체크  */
            if (info.withdrawalAt) { 
                throw new ManagerLoginValidationException("탈퇴한 회원입니다.");
            }

            /** 이용제한 기간 체크 */
            if (info.stopUntil) {
                const date = dateFormat(info.stopUntil, '%Y-%m-%d 23:59:59');
                const stopUntil = new Date(date);
                if (stopUntil - new Date() > 0) {
                    throw new ManagerLoginValidationException(dateFormat(date, '%Y.%m.%d') + "까지 이용이 제한된 회원입니다");
                }
            }

            /**
             * 로그인 세션 처리 
             * 
             */
            req.session[md5("managerId")] = secureSet(info.managerId);

            return true; 
        } catch (err) {
            if (err instanceof ManagerLoginValidationException || err instanceof ManagerLoginException) {
                throw err;
            }

            req.logger(err);
            return false;
        }
    },
    /** 
     * 회원정보 조회 
     * 
    */
    async get(managerId, isLogin) {
        if (!managerId)
            return false;
        
        isLogin = isLogin || false;
        try {
            const field = isNaN(managerId)?"managerId":"id";
            const result = await Manager.findOne({
                include : [{
                    model : Level,
                    required : false,
                }],
                where : { [field] : managerId },
                raw : true,
            });

            if (result) {
                if (!isLogin) {
                    delete result.managerPw;
                }

                result.roles = result['Level.roles']?JSON.parse(result['Level.roles']):[];

                return result;
            } else {
                return false;
            }
        } catch (err) {
            logger(err);
            return false;
        }
    },
    /**
     * 관리자 목록 
     * 
     * @param {int} page 페이지 번호
     * @param {int} limit 1페이지당 레코드 수 
     * @param {Object} req 
     * @param {Object} search
     */
    async gets(page, limit, req, search) {
        page = page || 1;
        limit = limit || 20;
        if (isNaN(limit)) limit = Number(limit);
        const offset = (page - 1) * limit;
        const where = {}, andWhere = [], orWhere = [];
        
        /** 검색처리 S */
        if (search) {
            /** 가입일 S */
            if (search.createSdate) {
                const sdate = getUTCDate(search.createSdate);
                andWhere.push({ createdAt : { [Op.gte] : sdate}});
            }

            if (search.createEdate) {
                const edate = getUTCDate(search.createSdate);
                edate.setDate(edate.getDate() + 1);

                where.createdAt[Op.lt] = edate;
                andWhere.push({ createdAt : { [Op.lt] : edate } });
            }
            /** 가입일 E */
            /** 가입구분 S */
            if (search.managerType) {
                let managerType = search.managerType;
                if (!(managerType instanceof Array)) {
                    managerType = [managerType];
                }

                andWhere.push({ managerType : { [Op.in] : managerType }})
            }
            /** 가입구분 E */

            /** 아이디  */
            if (search.managerId && search.managerId.trim() != "") {
                andWhere.push({ managerId : { [Op.substring] : search.managerId.trim() } });
            }

            /** 관리자명 */
            if (search.managerNm && search.managerNm.trim() == "") {
                andWhere.push({ managerNm : { [Op.substring] : search.managerNm.trim() }});
            }

            /** 관리레벨 S */
            if (search.managerLv) {
                let managerLv = search.managerLv;
                if (!(managerLv instanceof Array)) {
                    managerLv = [managerLv];
                }

                andWhere.push({ managerLv : { [Op.in] : managerLv }});
            }
            /** 관리레벨 E */
            /** 탈퇴회원 */
            if (search.isWithdrawalMember) {
                andWhere.push({ withdrawalAt : { [Op.not] : null }});
            }

            /** 이용제한 회원 */
            if (search.isStopMember) {
                where.stopUntil = { [Op.gte ] : new Date() };
                andWhere.push({ stopUntil : { [Op.gte ] : new Date() }});
            }

            /** 검색 구분에 따른 조회 S */
            if (search.sopt && search.skey && search.skey.trim() != "") {
                const key = search.skey.trim();
                const sopt = search.sopt;
                const conds = { [Op.substring] : key };
                if (sopt == 'all') { // 통합검색
                    andWhere.push({ [Op.or] : {
                        managerId : conds,
                        managerNm : conds
                }});

                } else {
                    andWhere.push({ [sopt] :  conds});
                }
            } 
            /** 검색 구분에 따른 조회 E */
        }



        if (andWhere.length > 0) {
            where[Op.and] = andWhere;
        }

        if (orWhere.length > 0) {
            where[Op.or] = orWhere;
        }
        /** 검색처리 E */

        const list = await Manager.findAll({
            include : [{
                model : Level,
                attributes : ['level', 'levelNm'], 
            }],
            order: [['id', 'DESC']],
            limit,
            offset,
            where,
            raw : true,
        });

        /** 총 관리자 수 */
        this.total = await Manager.count({
            where,
        });
       
        /** 페이징 처리 */
        if (req) {
            this.pagination = new Pagination(req, page, this.total, null, limit).getPages();
        }
        return list;
    },
    /**
     * 관리자목록 수정
     * 
     * @param {Object} req
     * @throws {ManagerUpdateException}
     * 
     */
    async updates(req) {
        const data = req.body;
        if (!data)  {
            throw new ManagerUpdateException("잘못된 접근입니다.");
        }

        let ids = data.id;
        if (!ids) {
            throw new ManagerUpdateException("수정할 회원을 선택하세요."); 
        }

        if (!(ids instanceof Array)) {
            ids = [ids];
        }

        try {
            for await (id of ids) {
                const managerLv = data[`managerLv_${id}`] || 0;
                await Manager.update({
                    managerLv,
                }, { where : { id }});
            }

            return true;
        } catch(err) {
            logger(err);
            throw new ManagerUpdateException();
        }
    },
    /**
     * 탈퇴/이용제한 처리 
     * 
     * @param {Object} data
     * @returns {Boolean}
     */
    async updateControls(data) {
        if (!data) {
            return false;
        }

        try {
            const upData = {};
            // 회원탈퇴 처리 
            if (data.withdrawal) {
                upData.withdrawalAt = new Date();
            }

            // 회원탈퇴 처리 취소 
            if (data.cancelWithdrawal) {
                upData.withdrawalAt = null;
            }

            if (data.stopUntil) {   
                upData.stopUntil = new Date(data.stopUntil);
            } else {
                upData.stopUntil = null;
            }

            const result = await Manager.update(upData, { where : { id : data.id }});
            
            return result[0] > 0;
        } catch (err) {
            logger(err);
            return false;
        }
    },
    /**
     * 디자이너 조회
     * 
     */
    async getManagers(type, managerType) {
        managerType = managerType || "admin";
        const where = { managerType };
    
        const rows = await Manager.findAll({
            include : [{
                    model : Level,
             }],
             attributes : [
                "id", "managerId", "managerNm", "managerLv",
                "Level.roles", "Level.levelNm",
             ],
             where,
             raw : true,
        });

        const members = [];

        for (let row of rows) {
            row.roles = row.roles?JSON.parse(row.roles):[];
            if (row.roles.length > 0 && (type == 'all' || row.roles.indexOf(type) != -1)) {
                if (row.withdrawalAt) {
                    row.managerNm += '(탈퇴)';
                }

                members.push(row);
            }
        }
        
        return members;
    },
    /**
     * 여러 관리자 번호로 한꺼번에 조회하기
     * 
     * @param {*} ids 
     */
    async getByIds(ids) {
        if (!ids) {
            return false;
        }

        try {
            const list = await Manager.findAll({
                attributes : ["id", "managerId", "managerNm", "email", "mobile"],
                where : { id : {[Op.in] : ids }},
                raw : true,
            });

            if (!list) {
                return false;
            }

            return list;
        } catch (err) {
            logger(err);
            return false;
        }
    }
};

module.exports = ManagerDao;