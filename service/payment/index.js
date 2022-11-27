const { getException } = require('../../library/common');
const inicisPay = require('../inicis/pay');
const inicisCancel = require('../inicis/cancel');
const paymentDao = require('../../models/payment/dao');
/** 예외 S */
const PaymentRequestException = getException("Payment/PaymentRequestException");
const PaymentCancelException = getException("Payment/PaymentCancelException");
const PaymentResultNotFoundException = getException("Payment/PaymentResultNotFoundException");
/** 예외 E */

/**
 * pg 결제 처리 
 * 
 */
const paymentService = {
    /**
     * 결제 기록 추가 
     * 
     * @param {Object} req
     * @returns {int} 결제등록번호 
     * @throws {PaymentRequestException}
     */
    async add(req) {
        const data = req.body;
        if (!data) {
            throw new PaymentRequestException("잘못된 접근입니다.");
        }

        const result = await paymentDao.add(data); 
        if (!result) {
            throw new PaymentRequestException("결제 등록에 실패하였습니다.");
        }

        return result;
    },
    /**
     * PG 요청 결과 업데이트 
     * 
     * @param {Object} data  
     */
    async updateResult(data) {
        if (!data) {
            throw new PaymentRequestException("잘못된 접근입니다.");
        }
        const result = await paymentDao.updateResult(data);
        if (!result) {
            throw new PaymentRequestException("결제 처리에 실패하였습니다.");
        }

        if (data.isSuccess) {
            let status = "incash";
            if (data.payMethod == 'VBank') {
                status = "confirm";
            }
            console.log("status : ", status);
            await this.changeStatus(data.idPayment, status);

            /** 결제 완료 처리  */
            await paymentDao.payDone(data.idPayment);
        }

        return data.idPayment;
    },
    /**
     * PG 결제 처리 
     * 
     * @param {Object} req 요청 정보
     * @param {Boolean} isMobile 모바일 여부 
     */
    async process(req, isMobile) {
        const data = req.body;
        let result;
        if (isMobile) {
            result = await inicisPay.processMobile(data);
        } else {
            result = await inicisPay.process(data);
        }
        if (!result) {
            throw new PaymentRequestException("결제 요청에 실패하였습니다.");
        }

        const id = await this.updateResult(result);
        if (!id) {
            throw new PaymentRequestException("결제 요청 정보 업데이트에 실패하였습니다.");
        }
        return id;
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

        const result = await paymentDao.changeStatus(id, status, pgLog);

        return result;
    },
    /**
     * 결제 내역 
     * 
     * @param {int} id 결제 내역번호 
     * @throws {PaymentResultNotFoundException}
     */
    async get(id) {
        if (!id) {
            throw new PaymentResultNotFoundException("잘못된 접근입니다.");
        }

        const data = await paymentDao.get(id);
        if (!data) {
            throw new PaymentResultNotFoundException();
        }

        return data;
    },
    /**
     * 결제 목록 
     * 
     * @param {int} page 페이지 번호
     * @param {int} limit 1페이지당 레코드 수 
     * @param {Object} req 
     * @param {Object} search 검색 query
     * 
     * @returns {Object}
     */
    async gets(page, limit, req, search) {
        const list  = await paymentDao.gets(page, limit, req, search);
        const pagination = paymentDao.pagination;
        const total = paymentDao.total;

        return { list, total, pagination };
    },
    /**
     * 결제 취소하기
     * 
     * @param {Object} req
     * @throws {PaymentCancelException}
     */
    async cancel(req) {
        const id = req.params.id || req.body.id;
        if (!id) {
            throw new PaymentCancelException("잘못된 접근입니다.");
        }
        const params = req.body;
        const data = await this.get(id);
        if (!data) {
            throw new PaymentResultNotFoundException();
        }

        if (['confirm', 'incash'].indexOf(data.status) == -1) {
            throw new PaymentCancelException("PG 승인 취소가 불가한 처리상태 입니다.");
        }

        if (data.canceledAt) {
            throw new PaymentCancelException("이미 취소된 결제 입니다.");
        }

        if (!data.pgTransactionId) {
            throw new PaymentCancelException("결제 거래 ID가 누락되었습니다.");
        }
        let payMethod = "";
        const refundInfo = {};
        switch (data.payMethod) {
            case "DirectBank" : 
                payMethod = "Acct"; 
                break;
            case "VBank" : 
                payMethod = "Vacct";
                if (!params.refundBankCode) {
                    throw new PaymentCancelException("환불계좌은행을 선택하세요.");
                }

                if (!params.refundAcctNum) {
                    throw new PaymentCancelException("환불계좌번호를 입력하세요.");
                }

                if (!params.refundAcctName) {
                    throw new PaymentCancelException("환불계좌 예금주명을 입력하세요.");
                }
                
                refundInfo.refundBankCode = params.refundBankCode;
                refundInfo.refundAcctNum = params.refundAcctNum;
                refundInfo.refundAcctName = params.refundAcctName;
                await paymentDao.updateRefundInfo(id, refundInfo);
                break;
            default : 
                payMethod = data.payMethod;
        }

        const resultData = await inicisCancel.process(data.pgTransactionId, payMethod, req.ip, "관리자 취소", refundInfo);
        
        resultData.pgLog = data.pgLog + "\r\n" + resultData.pgLog;
        resultData.idPayment = id;
        await this.updateCancelResult(resultData);

        if (!resultData.isSuccess) { // 취소  실패 처리
            throw new PaymentCancelException(resultData.message);
        }

    },
    /**
     * PG 취소 결과 업데이트 
     * 
     */
    async updateCancelResult(data) {
        await paymentDao.updateCancelResult(data);
        if (data.isSuccess) {
            this.changeStatus(id, "cancel");
        }
    }
};

module.exports = paymentService;