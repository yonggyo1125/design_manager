const { CashReceipt, Manager, Sequelize : { Op } } = require('..');
const { logger } = require('../../library/common');
const Pagination = require('../../library/pagination');

const cashReceiptDao = {
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
     * 현금영수증 발급 데이터 기록
     * 
     * @param {Object} data
     * @returns {Boolean}
     */
    async insertIssueData(data) {
        if (!data) {
            return false;
        }

        try {
            const upData = {
                goodName : data.goodName,
                buyerName : data.buyerName,
                buyerEmail : data.buyerEmail,
                pgResultCode : data.resultCode,
                pgResultMessage : data.resultMsg,
                pgTransactionId : data.tid,
                pgApproveDate : data.authDate,
                pgApproveTime : data.authTime,
                pgApproveCode : data.authCode,
                pgApproveNo : data.authNo,
                pgApprovePrice : data.authPrice || 0,
                pgApproveSupplyPrice : data.authSupplyPrice || 0,
                pgApproveTax : data.authTax || 0,
                pgApproveSrvcPrice : data.authSrvcPrice || 0,
                pgApproveUseOpt : (data.authUseOpt == '1')?true:false,
                idManager : data.idManager,
            };

            if (data.orderNo) {
                upData.orderNo = data.orderNo;
            }
            const result = await CashReceipt.create(upData);
            if (!result) 
                return false;
            
            return true;
        } catch (err) {
            logger(err);
            return false;
        }
    },
     /**
    * 현금영수증 발급 목록 
    * 
    * @param {int} page 페이지 번호
    * @param {int} limit 1페이지당 레코드 수 
    * @param {Object} req 
    */
    async gets(page, limit, req, search) {
        try {
            page = page || 1;
            limit = limit || 20;
            const offset = (page - 1) * limit;
            const where = {};

            /**  검색 처리 S */
            if (search.buyerName) {
                where.buyerName = { [Op.substring] : search.buyerName.trim() };
            }

            if (search.buyerEmail) {
                where.buyerEmail = { [Op.substring] : search.buyerEmail.trim() };
            }

            if (search.orderNo) {
                where.orderNo = { [Op.substring] : search.orderNo.trim() };
            }

            if (search.goodName) {
                where.goodName = { [Op.substring] : search.goodName.trim() };
            }

            if (search.pgApproveUseOpt) {
                if (!(search.pgApproveUseOpt instanceof Array)) {
                    search.pgApproveUseOpt  = [search.pgApproveUseOpt];
                }

                const pgApproveUseOpt = [];
                search.pgApproveUseOpt.forEach(v => pgApproveUseOpt.push((v == '1')?true:false));
                where.pgApproveUseOpt = { [Op.in] : pgApproveUseOpt };
            }
            /** 검색 처리 E */

            const list = await CashReceipt.findAll({
                include : [{
                    model : Manager,
                    attributes : ['managerNm', 'managerId'],
                }],
                order : [['id', 'DESC']],
                limit, 
                offset,
                where, 
                raw : true,
            });        

            /** 총 발급 건 수  */
            this.total = await CashReceipt.count({
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
     * 현금영수증 발급 기록 조회
     * 
     * @param {int} id 발급 처리 ID
     * @returns {Array|Boolean}
     */
   async get(id, isOrderNo = false) {
        if (!id) {
            return false;
        }

        try {
            const where = {};
            if (isOrderNo) {
                where.orderNo= id;
            } else {
                where.id = id;
            }
            
            const data = await CashReceipt.findOne({
                include : [{
                    model : Manager,
                    attributes : ["managerNm", "managerId"],
                }],
                where,
                raw : true,
            });

            if (!data) {
                return false;
            }
            
            data.managerNm = data['Manager.managerNm'];
            data.managerId = data['Manager.managerId'];
            
            return data;
        } catch (err) {
            logger(err);
            return false;
        }
    }
};

module.exports = cashReceiptDao;