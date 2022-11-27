const { ProductCategory, Sequelize : { Op } } = require('../index');
const { getException, logger } = require('../../library/common');
const CategoryRegisterException = getException("Product/CategoryRegisterException");
const CategoryUpdateException = getException("Product/CategoryUpdateException");
const CategoryDeleteException = getException("Product/CategoryDeleteException");
const CategoryNotFoundException = getException("Product/CategoryNotFoundException");

/**
 * 품목분류 관련 
 * 
 */
const categoryDao = {
    /** 분류 구분  */
    cateTypes : {
        sale : "판매",
        material : "자재",
        etc : "기타",
    },
    /** 필수 항목  */
    required : {
        cateType : "분류 구분을 선택하세요",
        cateCd : "분류코드를 입력하세요",
        cateNm : "분류명을 입력하세요",
    },
    /**
     * 분류 등록 
     * 
     * @param req 
     * @throws CategoryRegisterException 
     */
    async add(req) {
        await this.validate(req.body, CategoryRegisterException);
        const data = req.body;
        try {
            const category = await ProductCategory.create({
                cateType : data.cateType,
                cateCd : data.cateCd,
                cateNm : data.cateNm,
            });
            if (!category) {
                return false;
            }

            return category;
        } catch (err) {
            logger(err);
            return false;
        }
    },
    /**
     * 분류 수정 
     * 
     * @param req 
     * @return boolean
     * @throws CategoryUpdateException
     */
    async update(req) {
        const data = req.body;
        let ids = data.id;
        if (!ids) {
            throw new CategoryUpdateException("수정할 분류를 선택하세요.");
        }

        if (!(ids instanceof Array)) {
            ids = [ids];
        }

        try {
            for await (id of ids) {
                if (!data[`cateNm_${id}`]) 
                    continue;

                await ProductCategory.update({
                    cateType : data[`cateType_${id}`] || 'sale',
                    cateNm : data[`cateNm_${id}`],
                    listOrder : data[`listOrder_${id}`] || 0,
                    idSizeConfig : data[`idSizeConfig_${id}`] || 0,
                    idProductGuide : data[`idProductGuide_${id}`] || 0,
                }, {
                    where : { id },
                });
            }

            return true;
        } catch (err) {
            logger(err);
            return false;
        }        
    },
    /**
     * 분류 삭제  
     * 
     * @param ids 
     * @throw CategoryDeleteException 
     */
    async delete(ids) {
        if (!ids) {
            throw new CategoryDeleteException("삭제할 분류를 선택하세요");
        }

        if (!(ids instanceof Array)) {
            ids = [ids];
        }

        try {
            const result = await ProductCategory.destroy({
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
     * 유효성 검사
     * 
     * @param {data}
     * @throws {Exception} - CategoryRegistrerException|CategoryUpdateException|CategoryDeleteException
     */
    async validate(data, Exception) { 
        Exception = Exception || Error;
        if (!data) {
            throw new Exception("잘못된 접근입니다.");
        }

        /** 필수 항목 체크  S */
        for (key in this.required) {
            if (!data[key] || data[key].trim() == "") {
                throw new Exception(this.required[key]);
            }
        }
         /** 필수 항목 체크  E */

         /** 분류 코드 형식 체크 S */
         if (/[^0-9a-z]/i.test(data.cateCd)) {
            throw new Exception("분류코드는 알파벳과 숫자만 입력하세요.");
         }
         /** 분류 코드 형식 체크 E */
         /** 분류 중복 여부 체크 S */
         const cnt = await ProductCategory.count({
            where : { cateCd : data.cateCd },
         });

         if (cnt > 0) {
             throw new Exception("이미 등록된 분류코드 입니다. - " + data.cateCd);
         }

        /** 분류 중복 여부 체크 E */
    },
    /**
     * 품목 분류 목록 
     * 
     * @param {String} cateType - sale 판매, material - 자재, etc - 기타
     * @return {Boolean|Array}
     */
    async gets(cateType, attributes) {

        try {
            const where = {};
            if (cateType) {
                where.cateType = cateType;
            }
            const params = {
                order : [["cateType", "DESC"], ['listOrder', 'DESC'], [ "id", "DESC"]],
                where,
                raw : true,
            };
            if (attributes) params.attributes = attributes;
            const categories = await ProductCategory.findAll(params);
            if (!categories) {
                return false;
            }

            return categories;
        } catch (err) {
            logger(err);
            return false;
        }
    },
    /**
     * 품목 분류 정보 조회
     *  
     * @param {String} cateCd 분류코드 
     * @return {Boolean|Array}
     * @throws {CategoryNotFoundException}
     */
    async get(cateCd) {
        if (!cateCd) {
            throw new CategoryNotFoundException("분류코드는 필수 입력항목 입니다.");
        }
        try {
            const category = await ProductCategory.findOne({
                where : { cateCd },
                raw : true,
            });
            return category;
        } catch (err) {
            logger(err);
            return false;
        }
    }
};

module.exports = categoryDao;