const axios = require('axios');
const crypto = require('crypto');
const { getException, logger, dateFormat } = require('../../library/common')
const PgCashReceiptRequestException = getException("CashReceipt/PgCashReceiptRequestException");
const inicisLib = require('./lib');

/**
 * 이니시스 현금영수증 발급 관련 
 * 
 */
const incisCashReceipt = {
    /**
     * PG 현금영수증 발급 처리 
     * 
     * @param {Object} data
     * @throws {PgCashReceiptRequestException}
     */
    async process(data) {
        if (!data) {
           throw new PgCashReceiptRequestException();   
        }

        const config = await inicisLib.getConfig();
        const timestamp = dateFormat(new Date(), '%Y%m%d%H%i%s');
        const mid = config.mid;
        const clientIp = data.ip;
    
        const cipher = crypto.createCipheriv("aes-128-cbc", config.iniApiKey, config.iniApiIv);
        let regNum = cipher.update(data.regNum, "UTF-8", "base64");
        regNum += cipher.final("base64");

       

        const params = {
            type : "Issue",
            paymethod : "Receipt",
            timestamp,
            clientIp,
            mid,
            goodName : data.goodName,
            crPrice : data.crPrice || 0,
            supPrice : data.supPrice || 0,
            tax : data.tax || 0,
            srcvPrice : data.srcvPrice || 0,
            buyerName : data.buyerName,
            buyerEmail : data.buyerEmail,
            regNum,
            useOpt : data.useOpt?data.useOpt:0,
        };

        const text = config.iniApiKey + "Issue" + "Receipt" + timestamp + clientIp + mid + params.crPrice + params.supPrice + params.srcvPrice + regNum;
        params.hashData = crypto.createHash("SHA512").update(text).digest("hex");
        let paramsQs = [];
        for (key in params) {
            paramsQs.push(`${key}=${encodeURIComponent(params[key])}`);
        }

        paramsQs = paramsQs.join("&");
        try {
            const result = await axios({
                method : "post",
                headers : { 'Content-Type' : 'application/x-www-form-urlencoded' },
                url : "https://iniapi.inicis.com/api/v1/receipt",
                data : paramsQs,
            });
            const resultData = result.data;
            let pgLog = [];
            pgLog.push("-------------------------------- PG 현금영수증 발급 요청 S ----------------------------------");
            pgLog.push('처리일시 : ' + dateFormat(new Date(), '%Y-%m-%d %H:%i:%s'));
            for (key in resultData) {
                pgLog.push(`${key} : ${resultData[key]}`);
            }
            pgLog.push("-------------------------------- PG 현금영수증 발급 요청 E ----------------------------------");
            resultData.isSuccess = false;
            if (resultData.resultCode == '00') {
                resultData.isSuccess  = true;
            }

            resultData.pgLog = pgLog;

            return resultData;
        } catch (err) {
            logger(err);
            return false;
        }
    }
};

module.exports = incisCashReceipt;