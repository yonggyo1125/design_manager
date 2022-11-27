const { ProductOption, ProductOptionItem, ProductSubOption, ProductSubOptionItem, ProductTextOption, ProductTextOptionItem, Manager, sequelize, Sequelize : { Op } } = require('..');
const { getException, logger } = require('../../library/common');
const Pagination = require('../../library/pagination');

// 예외 S 
const OptionRegisterException = getException("Product/OptionRegisterException");
const OptionUpdateException = getException("Product/OptionUpdateException");
const OptionDeleteException = getException("Product/OptionDeleteException");
// 예외 E 

/**
 * 옵션관련 
 * 
 */
const optionDao = {
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
    /**
     * 기본옵션 등록 
     * 
     * @param {Object} req 
     * @throws {OptionRegisterException}
     */
    async addBasic(req) {
        const data = req.body;
        await this.validate(data, OptionRegisterException);

        try {
            
            const result = await sequelize.transaction(async (transaction) => {
                const productOption = await ProductOption.create({
                    cateNm : data.cateNm,
                    isUse : (data.isUseMain == '1')?true:false,
                    idManager : data.idManager,
                }, { transaction });
                
                let optionNms = data.optionNm;
                let optionCds = data.optionCd;
                let addPrices = data.addPrice;
                let listOrders = data.listOrder;
                let isUses = data.isUse;
                if (!(optionNms instanceof Array)) {
                    optionNms = [optionNms];
                    optionCds = [optionCds];
                    addPrices = [addPrices];
                    listOrders = [listOrders];
                    isUses = [isUses];
                }

                let no = 0;
                const idProductOption = productOption.id;
                for await (optionNm of optionNms) {
                    const optionCd = optionCds[no] || Date.now();
                    await ProductOptionItem.create({    
                        optionCd,
                        optionNm,
                        addPrice : addPrices[no] || 0,
                        listOrder : listOrders[no] || 0,
                        isUse : (isUses[no] == '1')?true:false,
                        idProductOption,
                    }, { transaction });
                    no++;
                }

                return productOption;
            });

            if (!result) {
                return false;
            }

            return result;
        } catch (err) {
            logger(err);
            return false;
        } 
    },
     /**
     * 기본옵션 수정 
     * 
     * @param {Object} req 
     * @returns {Boolean}
     * @throws {OptionUpdateException}
     */
      async updateBasic(req) {
        const data = req.body;
        const id = req.params.id;
        data.id = id;
        data.mode = "update";

        await this.validate(data, OptionUpdateException);
        try {
            
            const result = await sequelize.transaction(async (transaction) => {
                const result = await ProductOption.update({
                    cateNm : data.cateNm,
                    isUse : (data.isUse == '1')?true:false,
                    idManager : data.idManager,
                }, { where : { id }, transaction });
                
                let optionNms = data.optionNm;
                let optionCds = data.optionCd;
                let addPrices = data.addPrice;
                let listOrders = data.listOrder;
                let isUses = data.isUse;
                if (!(optionNms instanceof Array)) {
                    optionNms = [optionNms];
                    optionCds = [optionCds];
                    addPrices = [addPrices];
                    listOrders = [listOrders];
                    isUses = [isUses];
                }

                let no = 0;
                for await (optionNm of optionNms) {
                    const optionCd = optionCds[no] || Date.now();
                    const cnt = await ProductOptionItem.count({ where : { optionCd }});
                    if (cnt > 0) { // 수정
                        await ProductOptionItem.update({    
                            optionNm,
                            addPrice : addPrices[no] || 0,
                            listOrder : listOrders[no] || 0,
                            isUse : (isUses[no] == '1')?true:false,
                        }, { where : { optionCd }, transaction });
                    } else { // 추가 
                        await ProductOptionItem.create({    
                            optionCd,
                            optionNm,
                            addPrice : addPrices[no] || 0,
                            listOrder : listOrders[no] || 0,
                            isUse : (isUses[no] == '1')?true:false,
                            idProductOption : id,
                        }, { transaction });
                    }

                    no++;
                }

                return result;
            });

            return result[0] > 0;
        } catch (err) {
            logger(err);
            return false;
        }
        
    },
    /**
     * 기본옵션(목록) 수정 
     * 
     * @param {Object} req
     * @returns {Boolean}
     * @throws {OptionUpdateException}
     */
    async updateBasics(req) {
        const data = req.body;
        const ids = data.id;
        if (!ids) {
            throw new OptionUpdateException("수정할 기본옵션을 선택하세요.");
        }
        try {
            for await (id of ids) {
                await ProductOption.update({
                    isUse : (data[`isUse_${id}`] == '1')?true:false,
                    listOrder : data[`listOrder_${id}`] || 0,
                }, { where : { id }});
            }

            return true;
        } catch (err) {
            logger(err);
            return false;
        } 
    },
    /**
     * 기본옵션 삭제
     * 
     * @param {Array|int} ids 
     * @returns {Boolean}
     * @throws {OptionDeleteException}
     */
    async deleteBasics(ids) {
        if (!ids) {
            throw new OptionDeleteException("삭제할 옵션을 선택하세요.");
        }

        if (!(ids instanceof Array)) {
            ids = [ids];
        }

        try {
            for await (id of ids) {
                await sequelize.transaction(async transaction => {
                    const result = await ProductOptionItem.destroy({
                        where : { idProductOption : id }
                    }, { transaction }); 

                    await ProductOption.destroy({
                        where : { id },
                    });

                    return result;
                });
            }

            return true;
        } catch (err) {
            logger(err);
            return false;
        }
    },
    /**
     * 기본옵션 항목 삭제
     * 
     * @param {String} optionCd 
     * @returns {Boolean}
     */
    async deleteOptionBasicItem(optionCd) {
        if (!optionCd) {
            return false;
        }

        try {
            const result = await ProductOptionItem.destroy({ where : { optionCd }});
            return result > 0;
        } catch (err) {
            logger(err);
            return false;
        }
        
    },
    /**
     * 추가옵션 등록 
     * 
     * @param {Object} req 
     * @throws {OptionRegisterException}
     */
    async addSub(req) {
        const data = req.body;
        data.isSub = true;
        await this.validate(data, OptionRegisterException);

        try {
            
            const result = await sequelize.transaction(async (transaction) => {
                const productSubOption = await ProductSubOption.create({
                    cateNm : data.cateNm,
                    isUse : (data.isUseMain == '1')?true:false,
                    idManager : data.idManager,
                }, { transaction });
                
                let optionNms = data.optionNm;
                let optionCds = data.optionCd;
                let addPrices = data.addPrice;
                let listOrders = data.listOrder;
                let isUses = data.isUse;
                if (!(optionNms instanceof Array)) {
                    optionNms = [optionNms];
                    optionCds = [optionCds];
                    addPrices = [addPrices];
                    listOrders = [listOrders];
                    isUses = [isUses];
                }

                let no = 0;
                for await (optionNm of optionNms) {
                    const optionCd = optionCds[no] || Date.now();           
                    await ProductSubOptionItem.create({    
                        optionCd,
                        optionNm,
                        addPrice : addPrices[no] || 0,
                        listOrder : listOrders[no] || 0,
                        isUse : (isUses[no] == '1')?true:false,
                        idProductSubOption : productSubOption.id,
                    }, { transaction });
                    no++;
                }

                return productSubOption;
            });

            if (!result) {
                return false;
            }

            return result;
        } catch (err) {
            logger(err);
            return false;
        } 
    },
    /**
     * 추가옵션 수정 
     * 
     * @param {Object} req 
     * @returns {Boolean}
     * @throws {OptionUpdateException}
     */
     async updateSub(req) {
        const data = req.body;
        const id = req.params.id;
        data.id = id;
        data.mode = "update";
        data.isSub = true;
        await this.validate(data, OptionUpdateException);
        try {
            
            const result = await sequelize.transaction(async (transaction) => {
                const result = await ProductSubOption.update({
                    cateNm : data.cateNm,
                    isUse : (data.isUse == '1')?true:false,
                    idManager : data.idManager,
                }, { where : { id }, transaction });
                
                let optionNms = data.optionNm;
                let optionCds = data.optionCd;
                let addPrices = data.addPrice;
                let listOrders = data.listOrder;
                let isUses = data.isUse;
                if (!(optionNms instanceof Array)) {
                    optionNms = [optionNms];
                    optionCds = [optionCds];
                    addPrices = [addPrices];
                    listOrders = [listOrders];
                    isUses = [isUses];
                }

                let no = 0;
                for await (optionNm of optionNms) {
                    const optionCd = optionCds[no] || Date.now();
                    const cnt = await ProductSubOptionItem.count({ where : { optionCd }});
                    if (cnt > 0) { // 수정
                        await ProductSubOptionItem.update({    
                            optionNm,
                            addPrice : addPrices[no] || 0,
                            listOrder : listOrders[no] || 0,
                            isUse : (isUses[no] == '1')?true:false,
                        }, { where : { optionCd }, transaction });
                    } else { // 추가 
                        await ProductSubOptionItem.create({    
                            optionCd,
                            optionNm,
                            addPrice : addPrices[no] || 0,
                            listOrder : listOrders[no] || 0,
                            isUse : (isUses[no] == '1')?true:false,
                            idProductSubOption : id,
                        }, { transaction });
                    }

                    no++;
                }

                return result;
            });

            return result[0] > 0;
        } catch (err) {
            logger(err);
            return false;
        }
        
    },
    /**
     * 추가옵션(목록) 수정 
     * 
     * @param {Object} req
     * @returns {Boolean}
     * @throws {OptionUpdateException}
     */
    async updateSubs(req) {
        const data = req.body;
        const ids = data.id;
        if (!ids) {
            throw new OptionUpdateException("수정할 추가옵션을 선택하세요.");
        }
        try {
            for await (id of ids) {
                await ProductSubOption.update({
                    isUse : (data[`isUse_${id}`] == '1')?true:false,
                    listOrder : data[`listOrder_${id}`] || 0,
                }, { where : { id }});
            }

            return true;
        } catch (err) {
            logger(err);
            return false;
        } 
    },
    /**
     * 추가옵션 삭제
     * 
     * @param {Array|int} ids 
     * @returns {Boolean}
     * @throws {OptionDeleteException}
     */
    async deleteSubs(ids) {
        if (!ids) {
            throw new OptionDeleteException("삭제할 옵션을 선택하세요.");
        }

        if (!(ids instanceof Array)) {
            ids = [ids];
        }

        try {
            for await (id of ids) {
                await sequelize.transaction(async transaction => {
                    const result = await ProductSubOptionItem.destroy({
                        where : { idProductSubOption : id }
                    }, { transaction }); 

                    await ProductSubOption.destroy({
                        where : { id },
                    });

                    return result;
                });
            }

            return true;
        } catch (err) {
            logger(err);
            return false;
        }
    },
    /**
     * 기본옵션 항목 삭제
     * 
     * @param {String} optionCd 
     * @returns {Boolean}
     */
    async deleteOptionSubItem(optionCd) {
        if (!optionCd) {
            return false;
        }

        try {
            const result = await ProductSubOptionItem.destroy({ where : { optionCd }});
            return result > 0;
        } catch (err) {
            logger(err);
            return false;
        }
        
    },
    /**
     * 유효성 검사 
     * 
     * @param {Object} data 검증데이터
     * @param {Error} Exception 예외 실패시 throw할 Error 생성자
     */
    async validate(data, Exception) {
        if (!data || (data.mode == 'update' && !data.id)) {
            throw new Exception("잘못된 접근입니다.");
        }

        if (!data.cateNm || data.cateNm.trim() == "") {
            throw new Exception("옵션분류명을 입력하세요.");
        }

        if (!data.optionNm) {
            throw new Exception("옵션명을 입력하세요.");
        }

        let optionNms = data.optionNm;
        let optionCds = data.optionCd;
        if (!(optionNms instanceof Array)) {
            optionNms = [optionNms];
            optionCds = [optionCds];
        }
        
        let options = [];
        optionNms.forEach(optionNm => {
            if (!optionNm || optionNm.trim() == "") {
                throw new Exception("옵션명을 전부 입력하세요.");
            }
            if (options.indexOf(optionNm) != -1) {
                throw new Exception(`중복된 옵션입니다. - ${optionNm}`);
            }

            options.push(optionNm);
        });
        
        let dupOptionCds = [], _optionCds = [];
        for await (optionCd of optionCds) {
            if (!optionCd || optionCd.trim() == "") {
                continue;
            }
            if (_optionCds.indexOf(optionCd) != -1) {
                throw new Exception(`중복된 옵션코드입니다. - ${optionCd}`);
            }
            let cnt = 0;
            if (data.mode == 'update') {
                if (data.isSub) {
                    cnt = await ProductSubOptionItem.count({
                        where : { 
                            optionCd,
                            idProductSubOption : {[Op.ne] : data.id}
                        },
                    });
                } else {
                    cnt = await ProductOptionItem.count({
                        where : { 
                            optionCd,
                            idProductOption : {[Op.ne] : data.id}
                        },
                    });
                }
            } else {
                if (data.isSub) {
                    cnt = await ProductSubOptionItem.count({ where : { optionCd }});
                } else {
                    cnt = await ProductOptionItem.count({ where : { optionCd }});
                }
            }

            if (cnt > 0) {
                dupOptionCds.push(optionCd);
            }

            _optionCds.push(optionCd);
        }

        if (dupOptionCds.length > 0) {
            throw new Exception(`이미 등록된 옵션코드입니다. - ` + dupOptionCds.join(","));
        }
    },
    /**
     * 텍스트옵션 등록 
     * 
     * @param {Object} req 
     * @throws {OptionRegisterException}
     */
     async addText(req) {
        const data = req.body;
        data.isText = true;
        await this.validate(data, OptionRegisterException);

        try {
            
            const result = await sequelize.transaction(async (transaction) => {
                const productTextOption = await ProductTextOption.create({
                    cateNm : data.cateNm,
                    isUse : (data.isUseMain == '1')?true:false,
                    idManager : data.idManager,
                }, { transaction });
                
                let optionNms = data.optionNm;
                let optionCds = data.optionCd;
                let addPrices = data.addPrice;
                let maxLengths = data.maxLength;
                let listOrders = data.listOrder;
                let isUses = data.isUse;
                if (!(optionNms instanceof Array)) {
                    optionNms = [optionNms];
                    optionCds = [optionCds];
                    addPrices = [addPrices];
                    maxLengths = [maxLengths];
                    listOrders = [listOrders];
                    isUses = [isUses];
                }

                let no = 0;
                for await (optionNm of optionNms) {
                    const optionCd = optionCds[no] || Date.now();           
                    await ProductTextOptionItem.create({    
                        optionCd,
                        optionNm,
                        addPrice : addPrices[no] || 0,
                        maxLength : maxLengths[no] || 0,
                        listOrder : listOrders[no] || 0,
                        isUse : (isUses[no] == '1')?true:false,
                        idProductTextOption : productTextOption.id,
                    }, { transaction });
                    no++;
                }

                return productTextOption;
            });

            if (!result) {
                return false;
            }

            return result;
        } catch (err) {
            logger(err);
            return false;
        } 
    },
    /**
     * 텍스트옵션 수정 
     * 
     * @param {Object} req 
     * @returns {Boolean}
     * @throws {OptionUpdateException}
     */
     async updateText(req) {
        const data = req.body;
        const id = req.params.id;
        data.id = id;
        data.mode = "update";
        data.isText = true;
        await this.validate(data, OptionUpdateException);
        try {
            
            const result = await sequelize.transaction(async (transaction) => {
                const result = await ProductTextOption.update({
                    cateNm : data.cateNm,
                    isUse : (data.isUseMain == '1')?true:false,
                    idManager : data.idManager,
                }, { where : { id }, transaction });
                
                let optionNms = data.optionNm;
                let optionCds = data.optionCd;
                let addPrices = data.addPrice;
                let maxLengths = data.maxLength;
                let listOrders = data.listOrder;
                let isUses = data.isUse;
                if (!(optionNms instanceof Array)) {
                    optionNms = [optionNms];
                    optionCds = [optionCds];
                    addPrices = [addPrices];
                    maxLengths = [maxLengths];
                    listOrders = [listOrders];
                    isUses = [isUses];
                }
                
                let no = 0;
                for await (optionNm of optionNms) {
                    const optionCd = optionCds[no] || Date.now();
                    const cnt = await ProductTextOptionItem.count({ where : { optionCd }});
                    if (cnt > 0) { // 수정
                        await ProductTextOptionItem.update({    
                            optionNm,
                            addPrice : addPrices[no] || 0,
                            maxLength : maxLengths[no] || 0,
                            listOrder : listOrders[no] || 0,
                            isUse : (isUses[no] == '1')?true:false,
                        }, { where : { optionCd }, transaction });
                    } else { // 추가 
                        await ProductTextOptionItem.create({    
                            optionCd,
                            optionNm,
                            addPrice : addPrices[no] || 0,
                            maxLength : maxLengths[no] || 0,
                            listOrder : listOrders[no] || 0,
                            isUse : (isUses[no] == '1')?true:false,
                            idProductTextOption : id,
                        }, { transaction });
                    }

                    no++;
                }

                return result;
            });

            return result[0] > 0;
        } catch (err) {
            logger(err);
            return false;
        }
        
    },
    /**
     * 텍스트옵션(목록) 수정 
     * 
     * @param {Object} req
     * @returns {Boolean}
     * @throws {OptionUpdateException}
     */
    async updateTexts(req) {
        const data = req.body;
        const ids = data.id;
        if (!ids) {
            throw new OptionUpdateException("수정할 텍스트옵션을 선택하세요.");
        }
        try {
            for await (id of ids) {
                await ProductTextOption.update({
                    isUse : (data[`isUse_${id}`] == '1')?true:false,
                    listOrder : data[`listOrder_${id}`] || 0,
                }, { where : { id }});
            }

            return true;
        } catch (err) {
            logger(err);
            return false;
        } 
    },
    /**
     * 추가옵션 삭제
     * 
     * @param {Array|int} ids 
     * @returns {Boolean}
     * @throws {OptionDeleteException}
     */
    async deleteTexts(ids) {
        if (!ids) {
            throw new OptionDeleteException("삭제할 옵션을 선택하세요.");
        }

        if (!(ids instanceof Array)) {
            ids = [ids];
        }

        try {
            for await (id of ids) {
                await sequelize.transaction(async transaction => {
                    const result = await ProductTextOptionItem.destroy({
                        where : { idProductTextOption : id }
                    }, { transaction }); 

                    await ProductTextOption.destroy({
                        where : { id },
                    });

                    return result;
                });
            }

            return true;
        } catch (err) {
            logger(err);
            return false;
        }
    },
    /**
     * 기본옵션 항목 삭제
     * 
     * @param {String} optionCd 
     * @returns {Boolean}
     */
    async deleteOptionTextItem(optionCd) {
        if (!optionCd) {
            return false;
        }

        try {
            const result = await ProductTextOptionItem.destroy({ where : { optionCd }});
            return result > 0;
        } catch (err) {
            logger(err);
            return false;
        }
        
    },
    /**
     * 유효성 검사 
     * 
     * @param {Object} data 검증데이터
     * @param {Error} Exception 예외 실패시 throw할 Error 생성자
     */
    async validate(data, Exception) {
        if (!data || (data.mode == 'update' && !data.id)) {
            throw new Exception("잘못된 접근입니다.");
        }

        if (!data.cateNm || data.cateNm.trim() == "") {
            throw new Exception("옵션분류명을 입력하세요.");
        }

        if (!data.optionNm) {
            throw new Exception("옵션명을 입력하세요.");
        }

        let optionNms = data.optionNm;
        let optionCds = data.optionCd;
        if (!(optionNms instanceof Array)) {
            optionNms = [optionNms];
            optionCds = [optionCds];
        }
        
        let options = [];
        optionNms.forEach(optionNm => {
            if (!optionNm || optionNm.trim() == "") {
                throw new Exception("옵션명을 전부 입력하세요.");
            }
            if (options.indexOf(optionNm) != -1) {
                throw new Exception(`중복된 옵션입니다. - ${optionNm}`);
            }

            options.push(optionNm);
        });
        
        let dupOptionCds = [], _optionCds = [];
        for await (optionCd of optionCds) {
            if (!optionCd || optionCd.trim() == "") {
                continue;
            }
            if (_optionCds.indexOf(optionCd) != -1) {
                throw new Exception(`중복된 옵션코드입니다. - ${optionCd}`);
            }
            let cnt = 0;
            if (data.mode == 'update') {
                if (data.isSub) {
                    cnt = await ProductSubOptionItem.count({
                        where : { 
                            optionCd,
                            idProductSubOption : {[Op.ne] : data.id}
                        },
                    });
                } else if (data.isText) {
                    cnt = await ProductTextOptionItem.count({
                        where : { 
                            optionCd,
                            idProductTextOption : {[Op.ne] : data.id}
                        },
                    }); 
                } else {
                    cnt = await ProductOptionItem.count({
                        where : { 
                            optionCd,
                            idProductOption : {[Op.ne] : data.id}
                        },
                    });
                }
            } else {
                if (data.isSub) {
                    cnt = await ProductSubOptionItem.count({ where : { optionCd }});
                } else if (data.isText) {
                    cnt = await ProductTextOptionItem.count({ where : { optionCd }});
                } else {
                    cnt = await ProductOptionItem.count({ where : { optionCd }});
                }
            }

            if (cnt > 0) {
                dupOptionCds.push(optionCd);
            }

            _optionCds.push(optionCd);
        }

        if (dupOptionCds.length > 0) {
            throw new Exception(`이미 등록된 옵션코드입니다. - ` + dupOptionCds.join(","));
        }
    },
    /**
     * 기본옵션 목록 
     * 
     * @param {int} page  - 페이지 번호 
     * @param {int} limit - 1페이지당 레코드 수 
     * @param {Object} req 
     */
    async getBasics(page, limit, req, isAll) {
        try {
            page = page || 1;
            limit = limit || 20;
            limit = limit == 'all'? limit : Number(limit);
            const offset = (page - 1) * limit;
            const where = {};
            if (!isAll) where.isUse = true;
            const params = {
                include : [{
                    model : Manager,
                    attributes : ['managerId', 'managerNm'],
                }],
                order : [['listOrder', 'DESC'], ['id', 'DESC']],
                where,
                raw : true,
            };

            if (limit != 'all') {
                params.limit = limit;
                params.offset = offset;
            }

            const list = await ProductOption.findAll(params);

            /** 총 기본옵션 수 */
            this.total = await ProductOption.count({
                include : [{
                    model : Manager,
                }],
                where,
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
     * 기본옵션 조회
     * 
     * @param {int} id 기본옵션 등록번호
     * @returns {Array|Boolean}
     */
    async getBasic(id, isAll) {
        if (!id) {
            return false;
        }
        try {
            const where = { id };
            if (!isAll) where.isUse = true;

            const info = await ProductOption.findOne({
                include : [{
                    model : Manager,
                    attributes : ['managerId', 'managerNm'],
                }],
                where,
                raw : true,
            });

            if (!info) {
                return false;
            }

            info.options = await this.getBasicItems(id, isAll);

            return info;
        } catch (err) {
            logger(err);
            return false;
        }
    },
    /**
     * 기본옵션항목 조회
     * 
     * @param {int} id 기본옵션분류(ProductItem) 등록번호
     * @returns {Array|Boolean}
     */
    async getBasicItems(id, isAll) {
        if (!id) {
            return false;
        }

        const where = { idProductOption : id };
        if (!isAll) where.isUse = true;
        try {
            const list = await ProductOptionItem.findAll({
                where,
                order : [['listOrder', 'DESC'], ['createdAt', "ASC"]],
                raw : true,
            });

            return list;
        } catch(err) {
            logger(err);
            return false;
        }
    },
    /**
     * 선택된 기본 옵션 조회 
     * 
     * @param {Array|String} optionCds 
     */
     async getBasicItem(optionCds) {
        if (!optionCds) {
            return false;
        }

        let isSingle = false;
        if (!(optionCds instanceof Array)) {
            isSingle = true;
            optionCds = [optionCds];
        }

        const list = await ProductOptionItem.findAll({
            where : {
                optionCd : { 
                    [Op.in] : optionCds,
                }
            },  
            order : [['listOrder', 'DESC'], ['createdAt', "ASC"]],
            raw : true,
        });

        if (isSingle) return list?list[0]:false;

        return list;
    },
    /**
     * 추가옵션 목록 
     * 
     * @param {int} page  - 페이지 번호 
     * @param {int} limit - 1페이지당 레코드 수 
     * @param {Object} req 
     */
     async getSubs(page, limit, req, isAll) {
        try {
            page = page || 1;
            limit = limit || 20;
            limit = limit == 'all' ? limit : Number(limit);
            const offset = (page - 1) * limit;
            const where = {};
            if (!isAll) where.isUse = true;
            const params = {
                include : [{
                    model : Manager,
                    attributes : ['managerId', 'managerNm'],
                }],
                order : [['listOrder', 'DESC'], ['id', 'DESC']],
                where,
                raw : true,
            };

            if (limit != 'all') {
                params.limit = limit;
                params.offset = offset;
            }

            const list = await ProductSubOption.findAll(params);

            /** 총 기본옵션 수 */
            this.total = await ProductSubOption.count({
                include : [{
                    model : Manager,
                }],
                where,
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
     * 추가옵션 조회
     * 
     * @param {int} id 기본옵션 등록번호
     * @returns {Array|Boolean}
     */
    async getSub(id, isAll) {
        if (!id) {
            return false;
        }
        try {
            const where = { id };
            if (!isAll) where.isUse = true;
            const info = await ProductSubOption.findOne({
                include : [{
                    model : Manager,
                    attributes : ['managerId', 'managerNm'],
                }],
                where,
                raw : true,
            });

            if (!info) {
                return false;
            }

            info.options = await this.getSubItems(id, isAll);

            return info;
        } catch (err) {
            logger(err);
            return false;
        }
    },
    /**
     * 기본옵션항목 조회
     * 
     * @param {int} id 기본옵션분류(ProductItem) 등록번호
     * @returns {Array|Boolean}
     */
    async getSubItems(id, isAll) {
        if (!id) {
            return false;
        }

        const where = { idProductSubOption : id };
        if (!isAll) where.isUse = true;
        try {
            const list = await ProductSubOptionItem.findAll({
                where,
                order : [['listOrder', 'DESC'], ['createdAt', "ASC"]],
                raw : true,
            });

            return list;
        } catch(err) {
            logger(err);
            return false;
        }
    },
    /**
     * 선택된 추가 옵션 조회 
     * 
     * @param {Array|String} optionCds 
     */
    async getSubItem(optionCds) {
        if (!optionCds) {
            return false;
        }

        let isSingle = false;
        if (!(optionCds instanceof Array)) {
            isSingle = true;
            optionCds = [optionCds];
        }

        const list = await ProductSubOptionItem.findAll({
            where : {
                optionCd : { 
                    [Op.in] : optionCds,
                }
            },  
            order : [['listOrder', 'DESC'], ['createdAt', "ASC"]],
            raw : true,
        });

        if (isSingle) return list?list[0]:false;

        return list;
    },
    /**
     * 텍스트 옵션 목록 
     * 
     * @param {int} page  - 페이지 번호 
     * @param {int} limit - 1페이지당 레코드 수 
     * @param {Object} req 
     */
     async getTexts(page, limit, req, isAll) {
        try {
            page = page || 1;
            limit = limit || 20;
            limit = limit == 'all' ? limit : Number(limit);
            const offset = (page - 1) * limit;
            const where = {};
            if (!isAll) where.isUse = true;
            const params = {
                include : [{
                    model : Manager,
                    attributes : ['managerId', 'managerNm'],
                }],
                order : [['listOrder', 'DESC'], ['id', 'DESC']],
                where,
                raw : true,
            };

            if (limit != 'all') {
                params.limit = limit;
                params.offset = offset;
            }

            const list = await ProductTextOption.findAll(params);

            /** 총 기본옵션 수 */
            this.total = await ProductTextOption.count({
                include : [{
                    model : Manager,
                }],
                where,
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
     * 텍스트옵션 조회
     * 
     * @param {int} id 기본옵션 등록번호
     * @returns {Array|Boolean}
     */
    async getText(id, isAll) {
        if (!id) {
            return false;
        }
        try {
            const where = { id };
            if (!isAll) where.isUse = true;
            const info = await ProductTextOption.findOne({
                include : [{
                    model : Manager,
                    attributes : ['managerId', 'managerNm'],
                }],
                where,
                raw : true,
            });

            if (!info) {
                return false;
            }

            info.options = await this.getTextItems(id, isAll);

            return info;
        } catch (err) {
            logger(err);
            return false;
        }
    },
    /**
     * 텍스트옵션항목 조회
     * 
     * @param {int} id 기본옵션분류(ProductTextOptionItem) 등록번호
     * @returns {Array|Boolean}
     */
    async getTextItems(id, isAll) {
        if (!id) {
            return false;
        }

        const where = { idProductTextOption : id };
        if (!isAll) where.isUse = true;
        try {
            const list = await ProductTextOptionItem.findAll({
                where,
                order : [['listOrder', 'DESC'], ['createdAt', "ASC"]],
                raw : true,
            });

            return list;
        } catch(err) {
            logger(err);
            return false;
        }
    },
    /**
     * 선택된 텍스트 옵션 조회 
     * 
     * @param {Array|String} optionCds 
     */
    async getTextItem(optionCds) {
        if (!optionCds) {
            return false;
        }

        let isSingle = false;
        if (!(optionCds instanceof Array)) {
            isSingle = true;
            optionCds = [optionCds];
        }

        const list = await ProductTextOptionItem.findAll({
            where : {
                optionCd : { 
                    [Op.in] : optionCds,
                }
            },  
            order : [['listOrder', 'DESC'], ['createdAt', "ASC"]],
            raw : true,
        });

        if (isSingle) return list?list[0]:false;

        return list;
    }
};

module.exports = optionDao;
