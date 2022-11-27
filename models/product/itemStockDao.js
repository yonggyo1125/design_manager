const { ProductItem, ProductItemStock, Sequelize : { Op } } = require('../index');
const { getException, logger } = require('../../library/common');
const Pagination = require('../../library/pagination');
const { get } = require('./companyDao');

/**
 * 품목 재고 관련
 * 
 */
const ProductStockDao = { 
    _total : 0, // 상품별 총 재고 기록 갯수
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
     * 재고 등록 
     * 
     * @param {int} idProductItem - 품목번호 
     * @param {int} amount 추가/차감 재고 
     * @param {String} memo 재고 추가/차감 메모 
     */
    async add(idProductItem, amount, memo) {
        if (!idProductItem || !amount) {
            return false;
        }

        if (!memo) {
            memo = (amount > 0)?"입고 추가":"출고 차감";
        }

        try {
            const itemStock = await ProductItemStock.create({
                idProductItem,
                amount,
                memo,
            });
            if (!itemStock) {
                return false;
            }

            return itemStock;
        } catch (err) {
            logger(err);
            return false;
        }
    },
    /**
     * 재고등록 취소 
     * 
     * @param {int|Array} ids 재고 등록번호
     * @return {boolean}
     * @throws {ItemStockDeleteException}
     */
    async delete(ids) {
        if (!ids) {
            throw new ItemStockDeleteException("취소할 등록건을 선택하세요.");
        }

        if (!(ids instanceof Array)) {
            ids = [ids];
        }

        try {
            const result = await ProductItemStock.destroy({
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
     * 상품별 재고 목록 
     * 
     * @param {int} idProductItem 품목번호
     * @param {int} page 페이지 번호
     * @param {int} limit 1페이지당 레코드 수 
     * @param {Object} req 
     * 
     * @return {Boolean|Array}
     */
    async gets(idProductItem, page, limit, req) {
        page = page || 1;
        limit = limit || 20;
        const offset = (page - 1) * limit;
        const where = {
            idProductItem,
        };
        try {
            const list = await ProductItemStock.findAll({
                include : [{
                    model : ProductItem,
                    attributes : ['itemCode', 'itemNm'],
                }],
                order: [['id', 'DESC']],
                limit,
                offset,
                where,
                raw : true,
            });

            this.total = await ProductItemStock.count({
                where,
            });
            
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
     * 총 재고 조회
     *  
     * @param {idx} idProductItem 품목번호 
     * @return {int} 유효 총 재고 
     */
    async getStock(idProductItem) {
        if (!idProductItem) {
            return 0;
        }

        try {
            const stock = await ProductItemStock.sum('amount', {
                where : { idProductItem }
            });
            return stock;
        } catch (err) {
            logger(err);
            return 0;
        }
    }
};

module.exports = ProductStockDao;