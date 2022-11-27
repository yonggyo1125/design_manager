const { getException } = require('../../library/common');
const paymentItemDao = require('../../models/payment/itemDao');
const PaymentRegisterException = getException("Payment/PaymentRegisterException");
const PaymentUpdateException = getException("Payment/PaymentUpdateException");
const PaymentDeleteException = getException("Payment/PaymentDeleteException");
const PaymentNotFoundException = getException("Payment/PaymentNotFoundException");

/**
 * 결제 항목
 * 
 */
const paymentItem = {
    /**
     * 결제 등록  
    *  
    * @param {Object} req 
    * @throws {PaymentRegisterException}
     */
    async add(req) {
        const data = req.body;
        this.validate(data, PaymentRegisterException);
        const result = await paymentItemDao.add(data);
        if (!result) {
            throw new PaymentRegisterException();
        }
    },
    /**
     * 결제 수정
     * 
     * @param {Object} req
     * @throws {PaymentUpdateException}
     */ 
    async update(req) {
        const id = req.params.id;
        const data = req.body;
        if (!id || !data) {
            throw new PaymentUpdateException("잘못된 접근입니다.");
        }

        data.id = id;
        this.validate(data);
        const result = await paymentItemDao.update(data);
        if (!result) {
            throw new PaymentUpdateException();
        }
    },
    /**
     * 등록,수정 유효성 검사
     * 
     * @param {Object} data 요청 데이터 
     * @throws {Exception} - PaymentRegisterException(등록 예외),  PaymentUpdateException(수정 예외)
     */
    validate(data, Exception) {
        /** 필수항목 체크 S */
        if (!data) {
            throw new Exception("잘못된 접근입니다.");
        }

        const required = {
            title : "결제항목을 입력하세요.",
            amount : "결제금액을 입력하세요.",
        };

        for (key in required) {
            if (!data[key] || data[key].trim() == "") {
                throw new Exception(required[key]);
            }
        }
        /** 필수항목 체크 E */

        /** 결제금액 0원 이상 입력 체크  */
        if (isNaN(data.amount)) {
            throw new Exception("결제금액은 숫자로 입력하세요.");
        }

        if (data.amount <= 0) {
            throw new Exception("결제가능한 금액을 입력하세요.");
        }
    },
    /**
     * 결제 삭제 
     * 
     * @throws {PaymentDeleteException}
     */
    async delete(id) {
        if (!id) {
            throw new PaymentDeleteException("잘못된 접근입니다.");
        }

        const result = paymentItemDao.delete(id);
        if (!result) {
            throw new PaymentDeleteException();
        }
    },
    /**
     * 결제 정보 조회
     * 
     * @param {int} id 결제등록 id
     * @throws {PaymentNotFoundException}
     */
    async get(id) {
        if (!id) {
            throw new PaymentNotFoundException("잘못된 접근입니다.");
        }

        const data = await paymentItemDao.get(id);
        if (!data) {
            throw new PaymentNotFoundException();
        }

        return data;
    },
};

module.exports = paymentItem;