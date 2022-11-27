const { dateFormat } = require('../../library/common');
const paymentDao = require('../../models/payment/dao');
const paymentSvc = require('.');

/**
 * 가상계좌 입금통보, 에스크로 구매결정 등등
 * 
 */
const noticeService = {
    /**
     * 가상계좌 입금통보
     * 
     */
    async confirmVbank(req) {
        const data = req.body;
        if (!data) {
            return;
        }
        const pgIp = req.ip;
        if (pgIp.indexOf('203.238.37') != -1 ||  pgIp.indexOf('39.115.212') != -1 ||  pgIp.indexOf('183.109.71') != -1) {
            const [ gid, idPaymentItem ] = data.no_oid.split("_");
            if (!idPaymentItem) {
                return;
            } 

            const items = await paymentDao.getsByItem(idPaymentItem, 'confirm');
            if (items.length == 0) {
                return;
            }
            const item = items[0];
            if (item.status != 'confirm') {
                return;
            }

            let pgLog = [];
            pgLog.push("-------------------------------- PG 가상계좌 입금통보 S ----------------------------------");
            pgLog.push('처리일시 : ' + dateFormat(new Date(), '%Y-%m-%d %H:%i:%s'));
            for (key in data) {
                pgLog.push(`${key} : ${data[key]}`);
            }
            pgLog.push("-------------------------------- PG 가상계좌 입금통보 E ----------------------------------");

            pgLog =  pgLog.join("\r\n");

            await paymentSvc.changeStatus(item.id, 'incash', pgLog);
        } // endif 
    } 
};

module.exports = noticeService;