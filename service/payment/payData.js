const { getException } = require('../../library/common');
const paymentItemDao = require('../../models/payment/itemDao');
const inicisLib = require('../inicis/lib');
const PaymentNotFoundException = getException("Payment/PaymentNotFoundException");
/**
 * 결제 데이터 조회 
 * 
 */
const payDataService = {
    /**
     * 결제 데이터 조회 
     * 
     * @param {int} id
     */
    async get(id) {
        if (!id) {
            throw new PaymentNotFoundException("잘못된 접근입니다.");
        }

        const data = await paymentItemDao.get(id);
        if (!data) {
            throw new PaymentNotFoundException();
        }
        data.config = await inicisLib.getConfig(data.gid + "_" + id, data.amount);
        
        return data;
    }
};

module.exports = payDataService;