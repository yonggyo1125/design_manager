const { Company, Sequelize : { Op } } = require('../index');
const { getException, logger } = require('../../library/common');
const CompanyRegisterException = getException("Product/CompanyRegisterException");
const CompanyDeleteException = getException("Product/CompanyDeleteException");
const CompanySearchException = getException("Product/CompanySearchException");
const CompanyUpdateException = getException("Product/CompanyUpdateException");
const { checkPhoneNumber } = require("../../library/validator");
const Pagination = require('../../library/pagination');
const req = require('express/lib/request');

/**
 * 거래처 관련 
 * 
 */
const companyDao = {
    _total : 0, // 전체 거래처 수 
    _pagination : "", // 페이지 HTML
    set total(total) {
        if (isNaN(total)) total = 0;
        this._total = total;
    },
    get total() {
        return this._total;
    },
    set pagination(pagination) {
        this._pagination = pagination 
    },
    get pagination() {
        return this._pagination;
    },
    required : {
        companyNm : "거래처명을 입력하세요", 
    },
    /** 
     * 거래처 등록
     * 
     * @param req
     * @throws CompanyRegisterException 
     */
    async add(req) {
        const data = req.body;
        
        /** 유효성 검사 */
        this.validate(req, CompanyRegisterException);
       
        /** 전화번호 검증 S  */
        let ownerPhone = "";
        if (data.ownerPhone) {
            checkPhoneNumber(data.ownerPhone, CompanyRegisterException);
            ownerPhone = data.ownerPhone.replace(/[^\d]/g, "");
        }
        
        let staffPhone = "";
        if (data.staffPhone) {
            checkPhoneNumber(data.staffPhone, CompanyRegisterException);
            staffPhone = data.staffPhone.replace(/[^\d]/g, ""); 
        }
        /** 전화번호 검증 E */

        try {
            const company = await Company.create({
                companyNm : data.companyNm,
                businessNo : data.businessNo,
                ownerNm : data.ownerNm,
                ownerPhone,
                staffNm : data.staffNm,
                staffPhone,
                companyAddress : data.companyAddress,
                memo : data.memo,
            });

            return company;
        } catch (err) {
            req.logger(err);
            return false;
        }

    },
    /**
     * 거래처 정보 수정 
     * 
     * @param req 
     * @throw CompanyUpdateException 
     */
    async update (req) {
        const data = req.body;
        const id = req.params.id || data.id;
       
        if (!id) {
            throw new CompanyUpdateException("잘못된 접근입니다.");
        }
   
        /** 유효성 검사 */
        this.validate(req, CompanyUpdateException);

        /** 전화번호 검증 S  */
        let ownerPhone = "";
        if (data.ownerPhone) {
            checkPhoneNumber(data.ownerPhone, CompanyUpdateException);
            ownerPhone = data.ownerPhone.replace(/[^\d]/g, "");
        }
        
        let staffPhone = "";
        if (data.staffPhone) {
            checkPhoneNumber(data.staffPhone, CompanyUpdateException);
            staffPhone = data.staffPhone.replace(/[^\d]/g, ""); 
        }
        /** 전화번호 검증 E */
        try {
            const result = await Company.update({
                companyNm : data.companyNm,
                businessNo : data.businessNo,
                ownerNm : data.ownerNm,
                ownerPhone,
                staffNm : data.staffNm,
                staffPhone,
                companyAddress : data.companyAddress,
                memo : data.memo,
            }, {
                where : { id },
            });
            return result[0] > 0;
        } catch (err) {
            logger(err);
            return false;
        }
    },
    /**
     * 거래처 삭제
     * @param int|Array ids 배열객체가 아닌경우는 단일 거래처 등록번호 
     * @return Boolean
     * @throws CompanyDeleteException
     */
    async delete(ids) {
        if (!ids) {
            throw new CompanyDeleteException("거래처를 선택하세요.");
        }
        if (!(ids instanceof Array)) {
            ids = [ids];
        }
        
        try {
           const result = await Company.destroy({
                where : {
                    id : { 
                        [Op.in] : ids,
                    }
                }
           });
           return result > 0;
        } catch (err) {
            logger(err);
            return false;
        }
    },
    /**
     * 거래처 목록 
     * 
     * @param int page 페이지 번호 
     * @param int limit 1페이지당 레코드수 
     * @param Object req request 객체 
     */
    async gets(page, limit, req) {
        page = page || 1;
        limit = limit || 20;
        const offset = (page - 1) * limit;
        const where = {};
        const params = {
            order : [['id', 'DESC']],
            where,
            raw : true,
        };
        if (limit != 'all') {
            params.offset = offset;
            params.limit = limit;
        }

        const list = await Company.findAll(params);
        
        /** 총 거래처 수 */
        this.total = await Company.count({
            where,
        });

        /** 페이징 처리 */
        if (req) {
            this.pagination = new Pagination(req, page, this.total).getPages();
        }

        return list;

    },
    /**
     * 거래처 조회 
     * 
     * @param int id 
     * @return Boolean|Array 
     * @throws CompanySearchException
     */
    async get(id) {
        if (!id) {
            throw new CompanySearchException("거래처 조회에 실패하였습니다.");
        }

        try {
            const company = await Company.findOne({
                where : { id },
            });
            return company;
        } catch (err) {
            logger(err);
            return false;
        }
    },
    /**
     * 유효성 검사 
     * @param data 요청 데이터 
     * @throw Exception
     */
    validate(data, Exception) {
        Exception = Exception || Error;
        const id = data.params.id || data.body.id;

        data = data.body;
        if (!data) {
           throw new Exception("잘못된 접근입니다.");
        }

        for (key in this.required) {
            if (!data[key] || data[key].trim() == "") {
                throw new Exception(this.required[key]);
            }
        }
    }
};

module.exports = companyDao;
