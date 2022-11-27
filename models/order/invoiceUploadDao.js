const { logger, getUTCDate, getConfig } = require("../../library/common");
const Pagination = require('../../library/pagination');
const { OrderInfo, OrderItem, InvoiceUpload, Manager, Sequelize : { Op }, sequelize } = require('..');
const orderDao = require('../../models/order/dao');

/**
 * 운송장 업로드 관리 
 * 
 * 
 */
const invoiceUpload = {
    _total : 0, // 전체 업로드 수 
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
     * 업로드한 운송장 목록
     * 
     * @param {int} page 페이지 번호
     * @param {int} limit 1페이지당 레코드 수 
     * @param {Object} req 
     * @param {Object} search 검색용 쿼리
     */
    async gets(page, limit, req, search) {
        try {
            page = page || 1;
            limit = limit || 20;
            limit = limit == 'all' ? limit : Number(limit);
            const offset = (page - 1) * limit;
            const where = {}, andWhere = [], orWhere = [];
            search = search || {};

            /** 검색 처리 S */
            // 신청 아이디 
            if (search.ids) { 
                andWhere.push({id : { [Op.in] : search.ids }});
            }

            /** 처리상태 S */ 
            if (search.isDoneStatus) {
                const inDones = [];
                if (search.isDoneStatus.indexOf("notDone") != -1) {
                    inDones.push(0);
                }

                if (search.isDoneStatus.indexOf("done") != -1) {
                    inDones.push(1);
                }

                andWhere.push({ isDone : { [Op.in] : inDones }});
            }
             /** 처리상태 E */ 

             
            /**  검색 처리 E */

            /** 검색 구분 처리 S */
            if (search.sopt && search.skey && search.skey.trim() != "") {
                const sopt = search.sopt;
                const key = search.skey.trim();
                const conds = { [Op.substring] : key };
                switch (sopt) {
                    case "all" : // 통합 검색
                        andWhere.push({
                            [Op.or] : {
                                bundleCodeForUpdate : conds,
                                invoiceNo : conds,
                                fileName : conds,
                            },
                        });
                        break;
                    case "orderNo" : // 주문번호
                        andWhere.push({ bundleCodeForUpdate : conds });
                        break;
                    default : 
                        andWhere.push({ sopt : conds});   
                }

            }
            /** 검색 구분 처리 E */

            /** 업로드일자 검색 S */
            if (search.createdSdate) {
               const createSdate = getUTCDate(search.createdSdate);
               andWhere.push({ createdAt : { [Op.gte] : createSdate } });
            }

            if (search.createEdate) {
                const createEdate = getUTCDate(search.createEdate);
                createEdate.setData(createEdate.getDate() + 1);

                andWhere.push({ createdAt : { [Op.lt] :  createEdate }});
            }
            /** 업로드일자 검색 E */
            
            /** 처리자 검색 S */
            if (search.idManager) {
                if (!(search.idManager instanceof Array)) {
                    search.idManager = [search.idManager];
                }
                andWhere.push({ idManager : { [Op.in] : search.idManager }});
            }
            /** 처리자 검색 E */

            if (andWhere.length > 0) {
                where[Op.and] = andWhere;
            }

            if (orWhere.length > 0) {
                where[Op.or] = orWhere;
            }
            
            const params = {
                include : [{
                    model : Manager,
                    required: false,
                    attributes : ['managerId', 'managerNm'],
                }],
                order : [['createdAt', 'DESC']],
                where,
                raw : true,
            };

            if (limit != 'all') {
                params.limit = limit;
                params.offset = offset;
            }

            const list = await InvoiceUpload.findAll(params);

           
            if (limit == 'all') {
                return list;
            }

            for (let li of list) {
                li.excelData = li.excelData || [];
                if (typeof li.excelData == 'string') {
                    li.excelData = JSON.parse(li.excelData);
                }

                const tmp = li.bundleCodeForUpdate.split("_");
                li.orderNo = tmp.pop();
                li.bundleCode = tmp.join("_");
            }

            /** 총 운송장 수 */
            this.total = await InvoiceUpload.count({ where });

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
     * 운송장 업로드 완료 처리
     * 
     * @param {*} ids 
     */
    async updateDone(ids) {
        if (!ids) {
            return false;
        }

        if (!(ids instanceof Array)) {
            ids = [ids];
        }
        const list = await this.gets(1, 'all', undefined, { ids });
        
        if (!list) {
            return false;
        }

        const orderStatus = await getConfig("doMany", "invoiceOrderStatusCd");

        for (const li of list) {
            const transaction = await sequelize.transaction();
            try {
                
                const tmp = li.bundleCodeForUpdate.split("_");
                const orderNo = tmp.pop();
                const bundleCode = tmp.join("_");

                const data = await orderDao.getDeliveryInfo(orderNo);
                if (!data) continue;
    
                for (const item of data) {
                    if (item.bundleCode != bundleCode) {
                        continue;
                    }

                    const upData = { deliveryInvoice : li.invoiceNo };
                    if (item.packageDelivery == 'each') {  // 개별 배송인 경우는 주문 상품별로 업데이트
                        if (item.deliveryItems && item.deliveryItems.length > 0) {
                            const ids = item.deliveryItems.map((v => v.idOrderItems));
                        
                            await OrderItem.update(upData, { 
                                where : {
                                    id : { [Op.in] : ids }
                                },
                                transaction});
                        } // endif 
                       
                    } else { // 묶음 배송인 경우는 메인 주문서에 업데이트
                        await OrderInfo.update(upData, { where : { orderNo }}); 
                
                    }

                    await InvoiceUpload.update({ isDone : true }, { where : { id : li.id }, transaction });
                    // 운송장 번호 업데이트 후 자동 단계 변경 설정이 있는 경우 변경 처리
                    if (orderStatus) {
                        await orderDao.changeOrderStatus(orderNo, orderStatus);
                    }
                } // endfor 

                await transaction.commit();
            } catch (err) {
                logger(err);
                await transaction.rollback();
            }
        }
    },
    /**
     * 업로드 목록 삭제
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

        try {
            await InvoiceUpload.destroy({
                where : { id : { [Op.in] : ids }}
            });
        } catch (err) {
            logger(err);
            return false;
        }
    }
};

module.exports = invoiceUpload;