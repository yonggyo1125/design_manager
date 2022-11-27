const { getException } = require('../../library/common');
const CashReceiptIssueException = getException("CashReceipt/CashReceiptIssueException");
const CashReceiptNotFoundException = getException("CashReceipt/CashReceiptNotFoundException");
const inicisCashReceipt = require('../../service/inicis/cashReceipt');
const cashReceiptDao = require('../../models/cashReceipt/dao');
const orderDao = require('../../models/order/dao');

/**
 * 현금영수증 발급 관련 Service
 * 
 */
const cashReceiptService = {
    /**
     * 현금영수증 발급 처리
     * 
     * @param {Object} req
     * @throws {CashReceiptIssueException}
     */
    async issue(req) {
        const data = req.body;
        this.validator(data);

        const ips = /(\d{1,3})\.(\d{1,3})\.(\d{1,3})/.exec(req.ip);
        if (ips) {
            ip = `${ips[1]}.${ips[2]}.${ips[3]}`;
        } else {
            ip = "127.0.0.1";
        }

        data.ip = ip;
        const resultData = await inicisCashReceipt.process(data);
        resultData.orderNo = data.orderNo;
        resultData.goodName = data.goodName;
        resultData.buyerName = data.buyerName;
        resultData.buyerEmail = data.buyerEmail;
        resultData.idManager = data.idManager;
        await this.insertIssueData(resultData);
    },
    /**
     * 유효성 검사 
     * 
     * @throws {CashReceiptIssueException}
     */
    validator(data) {
        const required = {
            goodName : "상품명을 입력하세요.",
            crPrice : "결제금액을 입력하세요.",
            supPrice : "공급가액을 입력하세요.",
            buyerName : "구매자명을 입력하세요.",
            buyerEmail : "구매자 이메일을 입력하세요.",
            regNum : "현금영수증 식별번호를 입력하세요.",
        };

        for (key in required) {
            if (!data[key] || data[key].trim() == "") {
                throw new CashReceiptIssueException(required[key]);
            }
        }
    },
    /**
     * 현금영수증 발급 데이터 DB 처리 
     * 
     * @param {Object} data 발급 후 데이터
     * @param {CashReceiptIssueException}
     */
    async insertIssueData(data) {
        if (!data) {
            throw new CashReceiptIssueException("잘못된 접근입니다.");
        }
         
        await cashReceiptDao.insertIssueData(data);
    },
    /**
     * 현금영수증 발급 목록 
     * 
     * @param {int} page 페이지 번호
     * @param {int} limit 1페이지당 레코드 수 
     * @param {Object} req 
     */
    async gets(page, limit, req, search) {
        const list = await cashReceiptDao.gets(page, limit, req, search);
        const total = cashReceiptDao.total;
        const pagination = cashReceiptDao.pagination;

        return { list, total, pagination };
    },
    /**
     * 현금영수증 발급 기록 조회
     * 
     * @param {int} id 발급 처리 ID
     * @returns {Array|Boolean}
     * @throws {CashReceiptNotFoundException}
     */
    async get(id) {
        if (!id) {
            throw new CashReceiptNotFoundException("잘못된 접근입니다.");
        }
        const data = await cashReceiptDao.get(id);
        if (!data) {
            throw new CashReceiptNotFoundException();
        }

        return data;
    },
    /**
     * 주문서에서 현금영수증 발급 데이터 추출 
     * 
     * @param {long} orderNo 주문번호
     * @param {Object} data 
     */
    async getDefaultOrderInfo(orderNo, data) {
        if (!orderNo || !data) {
            return;
        }

        data.orderNo = orderNo;
        const orderData = await orderDao.get(orderNo);
        if (orderData.items.length == 0) {
            return;
        }

        let itemNm = orderData.items[0].itemNm;
        if (orderData.items.length > 1) itemNm += "외 " + (orderData.items.length - 1) + "건";
        data.goodName = itemNm;
        data.crPrice = orderData.totalPayPrice;
        data.buyerName = orderData.orderNm;
        data.regNum = orderData.cashReceiptNo;
    }
};

module.exports = cashReceiptService;