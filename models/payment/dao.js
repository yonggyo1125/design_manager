const { logger } = require('../../library/common');
const { Payment, PaymentItem, Sequelize : { Op } } = require('..');
const Pagination = require('../../library/pagination');
const inicisLib = require('../../service/inicis/lib');

/**
 * 결제 DB 처리 
 * 
 */
const PaymentDao = {
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
    /** 처리상태 */
    statuses : {
        request : "결제요청",
        confirm : "결제접수",
        incash : "입금확인",
        cancel : "결제취소",
        failed : "결제실패",
    },
    /** 결제방법 */
    payMethods : {
        Card : '신용카드',
        DirectBank : '실시간계좌이체',
        VBank : '가상계좌(무통장입금)',
    },
    /**
     * 결제 기록 추가 
     * 
     * @param {Object} data
     * @throws {PaymentRequestException}
     */
    async add(data) {
        if (!data) {
            return false;
        }

        let inData;
        switch (data.pg) { 
            /** 이니시스 */
            case "inicis" : 
                let cellPhone = ""; 
                if (data.buyername) {
                    cellPhone = data.buyertel.replace(/[^\d]/g, "");
                }
                
                inData  = {
                    pg : data.pg,
                    title : data.goodname,
                    price : data.price,
                    name : data.buyername,
                    cellPhone,
                    email : data.buyeremail,
                    payMethod : data.gopaymethod,
                    idPaymentItem : data.idPaymentItem,
                };
                break;
        }

        if (!inData) {
            return false;
        }

        try {
            const result = await Payment.create(inData);

            if (!result) {
                return false;
            }

            return result.id;
        } catch (err) {
            logger(err);
            return false;
        }
    },
    /**
     * 결제 요청 결과 업데이트
     * 
     * @param {Object} data
     */
    async updateResult(data) {
        if (!data) {
            return false;
        }

        try {
            const upData = {
                pgResultCode : data.pgResultCode,
                pgResultMessage : data.pgResultMessage,
                pgLog : data.pgLog,
                pgDevice : data.pgDevice,
            };

            if (!data.isSuccess) {
                upData.status = "failed";
            }

            
            if (data.pgTransactionId) upData.pgTransactionId = data.pgTransactionId;
            if (data.payMethod) upData.payMethod = data.payMethod;
            if (data.VBankAccount) upData.VBankAccount = data.VBankAccount;
            if (data.pgBankName) upData.pgBankName = data.pgBankName;
            if (data.pgApproveDate) upData.pgApproveDate = data.pgApproveDate;
            if (data.pgApproveTime) upData.pgApproveTime = data.pgApproveTime;

            const result = await Payment.update(upData, { where : { id : data.idPayment }});

            return result[0] > 0;
        } catch (err) {
            logger(err);
            return false;
        }
    },
    /**
     * 결제 상태변경 
     * 
     * @param {int} id 결제처리 번호
     * @param {String} status - request(결제요청), confirm - 요청완료, cancel - 요청 취소, failed - 요청 실패
     * @returns {Boolean}
     */
    async changeStatus(id, status, pgLog) {
        if (!id || !status) {
            return false;
        }

        try {
            const upData = { status };
            if (pgLog) {
                const data = await Payment.findOne({
                    where : { id },
                    attributes : ["pgLog"],
                    raw : true,
                });
                if (data) {
                    pgLog = data.pgLog + "\r\n" + pgLog;
                }
                upData.pgLog = pgLog;
            }
            const result = await Payment.update(upData, { where : { id }});

            return result[0] > 0;
        } catch (err) {
            logger(err);
            return false;
        }
    },
    /**
     * 결제 내역 조회
     * 
     * @param {int} id 결제내역 변호
     * @returns {Boolean}
     */
    async get(id) {
        if (!id) {
            return false;
        }

        try {
            const data = await Payment.findOne({
                include : [{
                    model : PaymentItem,
                }],
                where : { id },
                raw : true,
            });
            if (!data) {
                return false;
            }

            this.updatePaymentInfo(data);
            return data;
        } catch (err) {
            logger(err);
            return false;
        }
    },
    /**
     * 결제 목록 
     * 
     * @param {int} page 페이지 번호
     * @param {int} limit 1페이지당 레코드 수 
     * @param {Object} req 
     * @param {Object} search 검색 query
     * 
     * @returns {Array|Object}
     */
     async gets(page, limit, req, search) {
        try {
            page = page || 1;
            limit = limit || 20;
            const offset = (page - 1) * limit;
            const where = {}, itemWhere = {};
            let itemRequired = false;
            /** 검색 처리 S */
            if (search.status) { // 처리상태 
                if (!(search.status instanceof Array)) {
                    search.status = [search.status];
                }

                where.status = { [Op.in] : search.status };
            }

            if (search.payMethod) { // 결제방법
                if (!(search.payMethod instanceof Array)) {
                    search.payMethod = [search.payMethod];
                }

                where.payMethod = { [Op.in] : search.payMethod };
            }
            
            if (search.idPayment) { // 결제 처리 ID
                where.id = { [Op.substring] : search.idPayment.trim() };
            }

            if (search.gid) { // 그룹 ID
                itemWhere.gid = { [Op.substring] : search.gid.trim() };
                itemRequired = true;
            }

            if (search.pgTransactionId) { // 거래 ID
                where.pgTransactionId = { [Op.substring] : search.pgTransactionId.trim() };
            }

            if (search.name) { // 입금자명 
                where.name = { [Op.substring] : search.name.trim() };
            }

            if (search.cellPhone) { // 휴대전화
                const cellPhone = search.cellPhone.replace(/[^\d]/g, "");
                where.cellPhone = { [Op.substring] : cellPhone };
            }

            if (search.email) { // 이메일 
                where.email = { [Op.substring] : search.email.trim() };
            }
            /** 검색 처리 E */

            const list = await Payment.findAll({
                include : [{
                    model : PaymentItem,
                    where : itemWhere,
                    required : itemRequired,
                }],
                order: [['id', 'DESC']],
                limit,
                offset,
                where,
                raw : true,
            });

            for await (li of list) {
                this.updatePaymentInfo(li);
            }

            /** 총 결제 수  */
            this.total = await Payment.count({ 
                include : [{
                    model : PaymentItem,
                    where : itemWhere,
                }],
                where,
            });

            /**  페이징 처리 */
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
     * 결제 품목별 결제 내역 조회
     * 
     * @param {idPaymentItem} 결제 품목 ID
     */
    async getsByItem(idPaymentItem, status) {
        if (!idPaymentItem) {
            return false;
        }

        try {
            const where = { idPaymentItem };
            if (status) {
                where.status = status;
            }

            const list = await Payment.findAll({
                include : [{
                    model : PaymentItem,
                }],
                where, 
                raw : true,
            })

            for await (li of list) {
                this.updatePaymentInfo(li);
            }

            return list;
        } catch (err) {
            logger(err);
            return false;
        }
    },
    /**
     * 결제 내역 정보 추가
     * 
     */
    updatePaymentInfo(data) {
        if (!data) {
            return;
        }

        if (data.payMethod) {
            data.payMethodStr = this.payMethods[data.payMethod];
        }
    
        if (data.status) {
            data.statusStr = this.statuses[data.status];
        }

        if (data.refundBankCode) {
            data.refundBankNm = inicisLib.getBank(data.refundBankCode);
        }

        if (data.pgTransactionId) {
            data['receiptUrl'] = `https://iniweb.inicis.com/DefaultWebApp/mall/cr/cm/mCmReceipt_head.jsp?noTid=${data.pgTransactionId}&noMethod=1`;
        }

        data['gid'] = data['PaymentItem.gid'];

        data.description = data['PaymentItem.description'];
    },
    /**
     * 결제 완료 처리 
     * 
     * @param {int} idPayment 결제 처리 id
     * @returns {Boolean}
     */
    async payDone(idPayment) {
        if (!idPayment) {
            return false;
        }

         const data = await this.get(idPayment);
        if (!data || !data.idPaymentItem) {
            return false;
        }

        try {
            const result = await PaymentItem.update({
                payDoneAt : new Date(),
            }, { where : { id : data.idPaymentItem }});

            return result[0] > 0;
        } catch (err) {
            logger(err);
            return false;
        } 
    },
    /**
     * 취소 결과 업데이트 
     * 
     */
    async updateCancelResult(data) {
        if (!data || !data.idPayment) {
            return;
        }
        try {
            const upData = { pgLog : data.pgLog };
            if (data.isSuccess) {
                upData.canceledAt = new Date();
            }
            await Payment.update(upData, { where : { id : data.idPayment }});
        } catch (err) {
            logger(err);
            return false;
        }
    },
    /**
     * 가상계좌 환불 계좌 정보 업데이트 
     * 
     * @param {id} 결제처리 ID
     * @param {Object} refundInfo 환불계좌정보
     * @returns {Boolean}
     */
    async updateRefundInfo(id, refundInfo) {
        if (!id  || !refundInfo) {
            return false;
        }

        try {
            const result = await Payment.update({
                refundBankCode : refundInfo.refundBankCode,
                refundAcctNum : refundInfo.refundAcctNum,
                refundAcctName : refundInfo.refundAcctName,
            }, { where : { id }});
            
            return result[0] > 0;
        } catch (err) {
            logger(err);
            return false;
        }
    }
}; 

module.exports = PaymentDao;