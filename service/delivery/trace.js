const deliveryDao = require('../../models/delivery/dao');

/**
 * 배송조회 
 * 
 */
const deliveryTrace  = {
    /**
     * 배송 추적 URL 생성 
     * 
     * @param {String} companyNm 
     * @param {String} invoice 
     * @returns {Boolean}
     */
    async getUrl(companyNm, invoice) {
        if (!companyNm || !invoice) {
            return false;
        }
        
        const data = await deliveryDao.getDeliveryCompany(companyNm);
        if (!data || !data.companyNm) {
            return false;
        }

        const url = data.invoiceUrl  + invoice;
        return url;
    }
};

module.exports = deliveryTrace;