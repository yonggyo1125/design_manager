const { ProductItem, ProductCategory, Company, Sequelize : { Op } } = require('../index');
const { getException, logger, dateFormat } = require('../../library/common');
const ItemRegisterException = getException("Product/ItemRegisterException");
const ItemUpdateException = getException("Product/ItemUpdateException");
const ItemDeleteException = getException("Product/ItemDeleteException");
const ItemNotFoundException = getException("Product/ItemNotFoundException");
const Pagination = require('../../library/pagination');
const itemStockDao = require('./itemStockDao');
const optionDao = require('./optionDao');
const excel = require('../../library/excel'); // 엑셀 다운로드 
const querystring = require('querystring');

/**
 * 품목 관련 
 * 
 */
const productDao = {
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
    /** 품목 구분 */
    itemTypes : {
        head : "본사",
        branch : "지사",
        company : "거래처",
    },
    /** 필수항목 */
    required : {
        itemType : "품목구분을 선택하세요.",
        itemCode : "품목코드를 입력하세요.",
        idProductCategory : "품목분류를 선택하세요.",
        itemNm : "품목명을 입력하세요.",
    },
    /**
     * 품목등록
     * @param {Object} req 
     * @return {Boolean|Object}
     * @throws {ItemRegisterException}
     */
    async add(req) {
        const data = req.body;
        await this.validate(data, ItemRegisterException);
        const idCompany = (data.itemType == 'company')?data.idCompany:null;

        /** 옵션 설정 처리 S */
        let idOptions = "", idSubOptions = "", idTextOptions = "";
        if (data.idOptions) {
            if (data.idOptions instanceof Array) {
                idOptions = data.idOptions.join("||");
            } else {
                idOptions = data.idOptions;
            }
        }

        if (data.idSubOptions) {
            if (data.idSubOptions instanceof Array) {
                idSubOptions = data.idSubOptions.join("||");
            } else {
                idSubOptions = data.idSubOptions;
            }
        }

        if (data.idTextOptions) {
            if (data.idTextOptions instanceof Array) {
                idTextOptions = data.idTextOptions.join("||");
            } else {
                idTextOptions = data.idTextOptions;
            }
        }
        /** 옵션 설정 처리 E */

        try {
            const product = await ProductItem.create({
                itemType : data.itemType || "head",
                itemCode : data.itemCode,
                idProductCategory : data.idProductCategory,
                itemNm : data.itemNm,
                provider : data.provider,
                providerPrice : data.providerPrice || 0,
                itemPrice : data.itemPrice || 0,
                texture : data.texture,
                itemSize : data.itemSize,
                itemSaleUnit : data.itemSaleUnit || 1,
                stockType : data.stockType || 'ea',
                useStock : data.useStock?true:false,
                memo : data.memo,
                idCompany,
                idOptions,
                idSubOptions,
                idTextOptions,
            });
            if (!product)
                return false;

            return product;
        } catch (err) {
            logger(err);
            return false;
        }
    },
    /**
     * 품목 정보수정 
     * 
     * @param {Object} req 
     * @return {Boolean}
     * @throws {ItemUpdateException}
     */
    async update(req) {
        const data = req.body;
        data.id = req.params.id || req.body.id;
        if (!data.id) {
            throw new ItemUpdateException("잘못된 접근입니다.");
        }

        await this.validate(data, ItemUpdateException);
        const idCompany = (data.itemType == 'company')?data.idCompany:null;

        /** 옵션 설정 처리 S */
        let idOptions = "", idSubOptions = "", idTextOptions = "";
        if (data.idOptions) {
            if (data.idOptions instanceof Array) {
                idOptions = data.idOptions.join("||");
            } else {
                idOptions = data.idOptions;
            }
        }

        if (data.idSubOptions) {
            if (data.idSubOptions instanceof Array) {
                idSubOptions = data.idSubOptions.join("||");
            } else {
                idSubOptions = data.idSubOptions;
            }
        }

        if (data.idTextOptions) {
            if (data.idTextOptions instanceof Array) {
                idTextOptions = data.idTextOptions.join("||");
            } else {
                idTextOptions = data.idTextOptions;
            }
        }
        /** 옵션 설정 처리 E */

        /** 품목별 배송정책 S */
        let idDeliveryPolicies = "";
        if (data.idDeliveryPolicies) {
            if (data.idDeliveryPolicies instanceof Array) {
                idDeliveryPolicies = data.idDeliveryPolicies.join("||");
            } else {
                idDeliveryPolicies = data.idDeliveryPolicies;                
            }
        }
        /** 품목별 배송정책 E */

        try {
            const result = await ProductItem.update({
                itemType : data.itemType || "head",
                idProductCategory : data.idProductCategory,
                itemNm : data.itemNm,
                provider : data.provider,
                providerPrice : data.providerPrice || 0,
                itemPrice : data.itemPrice || 0,
                texture : data.texture,
                itemSize : data.itemSize,
                itemSaleUnit : data.itemSaleUnit || 1,
                stockType : data.stockType || 'ea',
                useStock : data.useStock?true:false,
                memo : data.memo,
                idCompany,
                idOptions,
                idSubOptions,
                idTextOptions,
                idSizeConfig : data.idSizeConfig || 0,
                idDeliveryPolicies,
            }, { where : { id : data.id }});
            
            return result[0] > 0;
        } catch (err) {
            logger(err);
            return false;
        }
    },
    /**
     * 품목 목록 수정
     *  
     * @param {Object} req 
     * @returns {Boolean}
     * @throws {ItemUpdateException}
     */
    async updates(req) {
        let ids = req.body.id;
        const data = req.body;
        if (!ids) {
            throw new ItemUpdateException("수정할 품목을 선택하세요.");
        }

        if (!(ids instanceof Array)) {
            ids = [ids];
        }

        try {
            for await (id of ids) {
                await ProductItem.update({
                    listOrder : data[`listOrder_${id}`] || 0,
                    idSizeConfig : data[`idSizeConfig_${id}`] || 0,
                }, { where : { id }});
            }
            
            return true;
        } catch (err) {
            logger(err);
            return false;
        }
    },
    /**
     * 유효성 검증 
     * 
     * @param {Object} data 
     * @param Exception 
     */
    async validate(data, Exception) {
        Exception = Exception || Error;
        if (data.id) { // 품목정보 수정인 경우 
            delete this.required.itemCode;
        }

        /** 필수입력항목 체크 S */
        for (key in this.required) {
            if (!data[key] || data[key].trim() == "") {
                throw new Exception(this.required[key]);
            }
        }
        /** 필수입력항목 체크 E */

        /** 품목코드 중복여부 체크 S */
        if (!data.id) {
            const cnt = await ProductItem.count({
                where : { itemCode : data.itemCode }
            });
            if (cnt > 0) {
                throw new Exception("이미 등록된 품목코드 입니다 - " + data.itemCode);
            }
        }
        /** 품목코드 중복여부 체크 E */
    },
    /**
     * 품목 목록 
     * 
     * @param {int} page  - 페이지 번호 
     * @param {int} limit - 1페이지당 레코드 수 
     * @param {Object} req 
     */
    async gets(page, limit, req, searches) {
        try {
            page = page || 1;
            limit = limit || 20;
            limit = limit == 'all' ? limit : Number(limit);
            const offset = (page - 1) * limit;
            const where = {}, pcWhere = {}, cWhere = {};
            let pcRequired = false, companyRequired = false; 

            /** 검색 처리 S */
            let search;
            
            if (req && req.body.search) {
                req.body.search = querystring.parse(req.body.search);
                search = req.body.search;
            }

            if (!search && searches) search = searches;
            if (!search) search = req.query;
            if (search) {
                if (search.itemType) { // 품목구분 
                    if (!(search.itemType instanceof Array)) search.itemType = [search.itemType];
                    where.itemType = { [Op.in] : search.itemType };
                }

                if (search.cateType) { // 품목분류구분
                    if (!(search.cateType instanceof Array)) search.cateType = [search.cateType];
                   pcWhere.cateType = { [Op.in] : search.cateType};
                   pcRequired = true;
                }

                if (search.cateCd) { // 품목분류
                    pcWhere.cateCd = search.cateCd;
                    pcRequired = true;
                }

                if (search.itemCode) { // 품목코드
                    where.itemCode = { [Op.like] : `%${search.itemCode}%`};
                }

                if (search.companyNm) { // 거래처명
                    cWhere.companyNm = { [Op.like] : `%${search.company}%`};
                    companyRequired = true;
                }

                if (search.itemNm) { // 품목명
                    where.itemNm = { [Op.like] : `%${search.itemNm}%`};
                }
            }
            
            if (req && req.query.mode && req.query.mode == 'dnXls' && req.body.id) {
                if (!(req.body.id instanceof Array)) {
                    req.body.id = [req.body.id];
                }

                where.id = { [Op.in] : req.body.id };
            }
    
            /** 검색 처리 E */
            /** 품목 리스트 */
            const params = {
                include : [{
                    model : ProductCategory,
                    attributes : ["cateType", "cateCd", "cateNm"],
                    where : pcWhere,
                    required : pcRequired,
                },{
                    model : Company,
                    attributes : ["companyNm", "businessNo", "ownerNm"],
                    where : cWhere,
                    required : companyRequired,
                }],
                order: [["listOrder", "DESC"], ["id", "DESC"]],
                where,
                raw : true,
            };

            if (limit != 'all') {
                params.limit = limit;
                params.offset = offset;
            }
            const list = await ProductItem.findAll(params);

            for await (li of list) {
               li.stock = await itemStockDao.getStock(li.id);
               
               li.idOptions = li.idOptions?li.idOptions.split("||"):[];
               li.idSubOptions = li.idSubOptions?li.idSubOptions.split("||"):[];
               li.idTextOptions = li.idTextOptions?li.idTextOptions.split("||"):[];
               li.idDeliveryPolicies = li.idDeliveryPolicies?li.idDeliveryPolicies.split("||"):[];
               li.options = [];
               li.subOptions = [];
               li.textOptions = [];
               for await (id of li.idOptions) {
                   const opts = await optionDao.getBasic(id);
                   if (opts) li.options.push(opts);
               }
   
               for await (id of li.idSubOptions) {
                   const opts = await optionDao.getSub(id);
                   if (opts) li.subOptions.push(opts);
               }

               for await (id of li.idTextOptions) {
                const opts = await optionDao.getText(id);
                if (opts) li.textOptions.push(opts);
            }
               li.optionsJson = JSON.stringify(li.options);
               li.subOptionsJson = JSON.stringify(li.subOptions);
               li.textOptionsJson = JSON.stringify(li.textOptions);
               li.deliveryPoliciesJson = JSON.stringify(li.idDeliveryPolicies);

               li.id
            }

            /** 총 품목 수 */
            this.total = await ProductItem.count({
                include : [{
                    model : ProductCategory,
                    where : pcWhere,
                    required : pcRequired,
                },{
                    model : Company,
                    where : cWhere,
                    required : companyRequired,
                }],
                where 
            });
            
            /** 페이징 처리 */    
            if (req) {
                this.pagination = new Pagination(req, page, this.total, null, limit).getPages();
            }
            return list;
        } catch (err) {
            logger(err);
            return false;
        }
    },
    /**
     * 분류코드로 품목 목록 가져오기
     * 
     * @param {String} cateCd 
     */
    async getsByCateCd(cateCd) {
        const list = await this.gets(1, 'all', null, { cateCd });

        return list;
    },
    /**
     * 품목 정보 
     * 
     * @param {int} id 상품품목번호
     * @param {Boolean} isAll 전체 옵션 조회 여부 
     * @return {Object}
     * @throws {ItemNotFoundException} 조회실패시
     */
    async get(id, isAll) {
        if (!id) {
            throw new ItemNotFoundException("잘못된 접근입니다.");
        }
        try {
            const product = await ProductItem.findOne({
                where : { id },
                include : [{
                    model : ProductCategory,
                    attributes : ["cateType", "cateCd", "cateNm", 'idProductGuide'],
                    required: false,
                }, {
                    model : Company,
                    attributes : ["companyNm", "businessNo", "ownerNm"],
                    required: false,
                }],
                raw : true,
            });
            if (!product) {
                return false;
            }
            
            product.stock = await itemStockDao.getStock(id);
            product.idOptions = product.idOptions?product.idOptions.split("||"):[];
            product.idSubOptions = product.idSubOptions?product.idSubOptions.split("||"):[]
            product.idTextOptions = product.idTextOptions?product.idTextOptions.split("||"):[];
            product.idDeliveryPolicies = product.idDeliveryPolicies?product.idDeliveryPolicies.split("||"):[];
            product.options = [];
            product.subOptions = [];
            product.textOptions = [];
            for await (id of product.idOptions) {
                const opts = await optionDao.getBasic(id, isAll);
                if (opts) product.options.push(opts);
            }

            for await (id of product.idSubOptions) {
                const opts = await optionDao.getSub(id, isAll);
                if (opts) product.subOptions.push(opts);
            }

            for await (id of product.idTextOptions) {
                const opts = await optionDao.getText(id, isAll);
                if (opts) product.textOptions.push(opts);
            }
            return product;
        } catch (err) { 
            logger(err);
            return false;
        }
    },
    /**
     * 상품 품목 번호로 상품 조회
     * 
     * @param {int} itemCode 상품 품목 번호
     * @return {Object | boolean}
     * @throws {ItemNotFoundException} 조회실패시
     */
    async getByItemCode(itemCode, isAll) {
        try {
            const p = await ProductItem.findOne({
                where : { itemCode },
                attributes : [ "id" ],
                raw : true,
            });
            if (p && p.id) {
                return this.get(p.id, isAll);
            }  

            return false;
        } catch (err) {
            logger(err);
            return false;
        }
        
    },
    /**
     * 품목 삭제 
     * 
     * @param {int|Array} ids 품목번호
     * @return {boolean}
     * @throws {ItemDeleteException}
     */
    async delete(ids) {
        if (!ids) {
            throw new ItemDeleteException("삭제할 품목을 선택하세요.");
        }

        if (!(ids instanceof Array)) {
            ids = [ids];
        }

        try {
            const result = await ProductItem.destroy({
                where : {
                    id : {
                        [Op.in] : ids
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
     * 품목 리스트 엑셀 다운로드 
     * 
     * @param {Object} req 
     * @param {Object} res
     */
    async dnXls(req, res) {
        const title = "월별재고관리";
        const fileName = "product_" + dateFormat(new Date(), "%Y%m%d%H%i%s");
        const headers = [
            { header : "관리규격", key : "itemNm", width: 40 },
            { header : "ⓐ길 이(yd)", key : "stockTypeYard", width: 20},
            { header : "ⓑ수량(매/본)", key : "stockTypeEa", width: 20},
            { header : "ⓒ입고량(ⓐⓑ)", key : "stock", width: 20},
            { header : "매입처", key : "provider", width: 30 },
            { header : "단가", key : "providerPrice", width: 20},
            { header : "공급가", key : "stockPrice", width: 20},
            { header : "비고", key : "memo", width: 60 },
        ];
       
        const list = await this.gets(1, 'all', req);
        const bodies = [];
        list.forEach(li => {
            li.stock = li.stock || "";
            stockPrice = (li.stockType == 'yard')?(li.stock * li.providerPrice):(li.stock * li.providerPrice * 0.914);
            bodies.push({
                itemNm : li.itemNm,
                stockTypeYard : (li.stockType == 'yard')?li.stock:"",
                stockTypeEa : (li.stockType == 'ea')?li.stock:"",
                stock : li.stock,
                provider : li.provider,
                providerPrice : li.providerPrice,
                stockPrice,
                memo : li.memo,
            });
        });

        excel.download(res, title, fileName, headers, bodies)
    },
    /**
     * 옵션 업데이터 
     * 
     * @param {Object} req 
     * @throws {OptionUpdateException}
     */
    async updateOptions(req) {
        const data = req.body;
        if (!data.id) {
            throw new OptionUpdateException("잘못된 접근입니다.");
        }

        let idOptions = "", idSubOptions = idTextOptions = "";
        if (data.idOptions) {
            if (data.idOptions instanceof Array) {
                idOptions = data.idOptions.join("||");
            } else {
                idOptions = data.idOptions;
            }
        }
       
        if (data.idSubOptions) {
            if (data.idSubOptions instanceof Array) {
                idSubOptions = data.idSubOptions.join("||");
            } else {
                idSubOptions = data.idSubOptions;
            }
        }

        if (data.idTextOptions) {
            if (data.idTextOptions instanceof Array) {
                idTextOptions = data.idTextOptions.join("||");
            } else {
                idTextOptions = data.idTextOptions;
            }
        }

        try {
            const result = await ProductItem.update({
                idOptions,
                idSubOptions,
                idTextOptions
            }, { where : { id : data.id }});

            return result[0] > 0;
        } catch(err) {
            logger(err);
            return false;
        }
    }
};

module.exports = productDao;