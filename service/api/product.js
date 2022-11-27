const { getException } = require('../../library/common');
const itemDao = require('../../models/product/itemDao');
const optionDao = require('../../models/product/optionDao');
const BadRequestException = getException("API/BadRequestException");

/**
 * 품목관리 
 * 
 */
const productService = {
    /**
     * 품목 리스트 
     * 
     *@throws {BadRequestException}
     */
    async gets(req) {
        const data = req.query;
        const cateCd = data.cateCd;
        if (!cateCd) {
            throw new BadRequestException("필수 요청항목이 누락되었습니다. 누락항목 : cateCd")
        }

        // 검색 항목
        const searchFields = ['itemType', 'itemCode',  'itemNm'];

        const search = { cateCd, cateType :  "sale" };
    

        for (let field in searchFields) {
            if (data[field] && data[field].trim() == "") {
                search[field] = data[field].trim();
            }
        }
    
        let list = await itemDao.gets(1, "all", req, search);
        list = list || [];

        return list;
    },
    /**
     * 품목 정보
     * 
     * @param {int} itemCode 상품 품목 번호
     * @throws {BadRequestException} 필수 항목 누락시 
     */
    async get(itemCode) {
        if (!itemCode) {
            throw new BadRequestException("필수 요청항목이 누락되었습니다. 누락항목 : itemCode")
        }

        const  item = await itemDao.getByItemCode(itemCode);
        if (!item || !item.id) {
            throw new BadRequestException("품목이 조회되지 않습니다.");
        }

        return item;
    },
    /**
     * 기본 옵션 정보
     * 
     * @param {int} itemCode 상품 품목 번호
     * @throws {BadRequestException} 필수 항목 누락시 
     */
    async getOptions(itemCode) {
        if (!itemCode) {
            throw new BadRequestException("필수 요청항목이 누락되었습니다. 누락항목 : itemCode")
        }

        const item = await itemDao.getByItemCode(itemCode);
        if (!item || (item && !item.options)) {
            throw new BadRequestException("기본 옵션이 조회되지 않습니다.");
        }

        return item.options;
    },
    /**
     *  추가 옵션 정보
     * 
     *  @param {int} itemCode 상품 품목 번호
     * @throws {BadRequestException} 필수 항목 누락시 
     */
    async getSub(itemCode) {
        if (!itemCode) {
            throw new BadRequestException("필수 요청항목이 누락되었습니다. 누락항목 : itemCode")
        }

        const item = await itemDao.getByItemCode(itemCode);
        if (!item || (item && !item.subOptions)) {
            throw new BadRequestException("기본 옵션이 조회되지 않습니다.");
        }

        return item.subOptions;
    },
    /**
     *  텍스트 옵션 정보
     * 
     *  @param {int} itemCode 상품 품목 번호
     * @throws {BadRequestException} 필수 항목 누락시 
     */
     async getText(itemCode) {
        if (!itemCode) {
            throw new BadRequestException("필수 요청항목이 누락되었습니다. 누락항목 : itemCode")
        }

        const item = await itemDao.getByItemCode(itemCode);
        if (!item || (item && !item.textOptions)) {
            throw new BadRequestException("기본 옵션이 조회되지 않습니다.");
        }

        return item.textOptions;
    }
};

module.exports = productService;