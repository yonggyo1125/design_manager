const { DesignerChange, OrderItem, sequelize, Sequelize : { Op }, Manager } = require('..');
const { logger } = require('../../library/common');
const getDesigners = require("../../service/manager/getDesigners");
const Pagination = require("../../library/pagination");

/**
 * 디자이너 변경 신청 및 처리 관련
 * 
 */
const designerChange = {
    _total : 0, // 전체 변경 요청
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
     * 디자이너 변경 신청
     * 
     * @param {Array|Int} ids 품주번호
     */
    async apply(ids) {
        try {
            if (!(ids instanceof Array)) {
                ids = [ids];
            }

            const rows = await OrderItem.findAll({
                attributes : ["id", "idDesigner", "orderNo" ],
                where : {
                    id : { [Op.in] : ids }
                },
                raw : true,
            });
           
            if (!rows) {
                throw new Error("변경할 품목이 없습니다.");
            }

            for await (let row of rows) {
                await DesignerChange.create({
                    orderNo : row.orderNo,
                    idOrderItem : row.id,
                    prevIdDesigner : row.idDesigner,
                });
            }

            return true;
        } catch (err) {
            logger(err);
            return false;
        }
    },
    /**
     * 디자이너 변경 진행중인 주문상품인지 체크
     * 
     * @param {int} id 주문 품주 번호 
     */
    async isProcess(id) {
        try {
            const cnt = await DesignerChange.count({
                where : { 
                    idOrderItem : id,
                    nextIdDesigner : null,
                }
            });
            return cnt > 0;
        } catch (err) {
            logger(err);
            return false;
        }
    },
    /**
     * 디자이너 변경 신청 정보 조회
     * 
     * @param {int} id 
     */
    async get(id) {
        try {
            const data = await DesignerChange.findByPk(id);
            if (!data) {
                throw new Error("변경 신청 내역이 없습니다.");
            }

            return data;
        } catch (err) {
            logger(err);
            return false;
        }
    },
    /**
     * 디자이너 배분 처리
     * 
     * @param {*} id 품주번호
     * @param {*} idDesigner 디자이너 
     * @param {*} idManager 처리자
     */
    async assign(id, idDesigner, idManager) {
        const transaction = await sequelize.transaction();
        try {
            await DesignerChange.update({
                nextIdDesigner : idDesigner,
                idManager,
            }, {
                where : { 
                    idOrderItem : id,
                    nextIdDesigner : null,
                },
                transaction,
            });

            await OrderItem.update({
                idDesigner,
            }, { where : { id }});

            await transaction.commit();
            return true;
        } catch (err) {
            await transaction.rollback();

            logger(err);
            return false;
        }
    },
    /**
     * 변경 로그 확인하기
     * 
     * @param {*} orderNo 
     * @param {*} idOrderItem 
     */
    async getsByOrderNo(orderNo, idOrderItem) {
        if (!orderNo) {
            return false;
        }

        try {
            const where = { orderNo };
            if (idOrderItem) {
                where.idOrderItem = idOrderItem;
            }
            
            const list = await DesignerChange.findAll({
                include : [{
                    model : Manager,
                    attributes : ["managerNm", "managerId"],
                }],
                where,
                raw : true,
            });
            if (!list) {
                throw new Error("조회 데이터 없음");
            }

            return list;
        } catch (err) {
            logger(err);
            return false;
        }
    },
    /**
     * 변경 요청 목록
     * 
     * @param {*} page 
     * @param {*} limit 
     * @param {*} req 
     * @param {*} search 
     */
    async gets(page, limit, req, search) {
        try {
            page = page || 1;
            limit = limit || 20;
            limit = limit == 'all' ? limit : Number(limit);
            const offset = (page - 1) * limit;
            const where = {};

            /** 검색 처리 S */
            search = search || {};
            if (search.orderNo) {
                where.orderNo = { [Op.substring] : search.orderNo };
            }

            if (search.notProcessedOnly) {
                where.nextIdDesigner = null;
            }
            /** 검색 처리 E */

            const list = await DesignerChange.findAll({
                include : [{
                    model : Manager,
                    attributes : ["managerNm", "managerId"],
                }],
                where,
                order: [['createdAt', 'DESC']],
                limit,
                offset,
                raw : true,
            });
            if (!list) {
                return false;
            }

            /** 총 변경 신청 수 */
            this.total = await DesignerChange.count({ where });

            if (req) {
                this.pagination = new Pagination(req, page, this.total, null, limit).getPages();
            }

            const designers = await getDesigners();
            for (let li of list) {
                for (let designer of designers) {
                    if (designer.id == li.prevIdDesigner) {
                        li.prevDesigner = designer;
                    }

                    if (designer.id == li.nextIdDesigner) {
                        li.nextDesigner = designer;
                    }
                }
            }

            return list;
        } catch (err) {
            logger(err);
            return false;
        }
    }
};

module.exports = designerChange;