const { logger, dateFormat } = require('../../library/common');
const crypto = require('crypto');
const axios = require('axios');
const inicisLib = require('./lib');

/**
 * 이니시스 결제 승인 취소 관련 
 * 
 */
const inicisCancel = {
    /**
     * 결제 취소 처리 
     * 
     * @param {String} tid PG 거래 ID
     * @returns {Boolean}
     */
    async process(tid, payMethod, ip, msg, refundInfo) {
        if (!tid || !payMethod || !ip) {
            return false;
        }

        try {
            const timestamp = dateFormat(new Date, "%Y%m%d%H%i%s");
            const config = await inicisLib.getConfig();
            
            const ips = /(\d{1,3})\.(\d{1,3})\.(\d{1,3})/.exec(ip);
            if (ips) {
                ip = `${ips[1]}.${ips[2]}.${ips[3]}`;
            } else {
                ip = "127.0.0.1";
            }

            let text = config.iniApiKey + "Refund" + payMethod+ timestamp + ip + config.mid + tid;

            const data = {
                type : "Refund",
                paymethod : payMethod,
                timestamp,
                clientIp : ip,
                mid : config.mid,
                tid,
                msg : msg || "관리자 취소",
            };
            if (payMethod == 'Vacct') { // 가상계좌

                data.refundBankCode = refundInfo.refundBankCode;
                data.refundAcctName = refundInfo.refundAcctName;

                const cipher = crypto.createCipheriv("aes-128-cbc", config.iniApiKey, config.iniApiIv);
                data.refundAcctNum = cipher.update(refundInfo.refundAcctNum, "UTF-8", "base64");
                data.refundAcctNum += cipher.final('base64');
                text += data.refundAcctNum;
            } 

            data.hashData = crypto.createHash("SHA512").update(text).digest("hex");
          
            let params = [];
            for (key in data) {
                params.push(`${key}=${encodeURIComponent(data[key])}`);
            }

            params = params.join("&");

            const url = "https://iniapi.inicis.com/api/v1/refund";
            const result = await axios({
                headers : { 'Content-Type' : "application/x-www-form-urlencoded" },
                method : "POST",
                url,
                data  : params,
            });
            
            const resultData = result.data;

            let pgLog = [];
             pgLog.push("-------------------------------- PG 결제 취소 S ----------------------------------");
             pgLog.push('처리일시 : ' + dateFormat(new Date(), '%Y-%m-%d %H:%i:%s'));
             for (key in resultData) {
                pgLog.push(`${key} : ${resultData[key]}`);
            }
             pgLog.push("-------------------------------- PG 결제 취소 E ----------------------------------");
            pgLog =  pgLog.join("\r\n");

            resultData.isSuccess = false;
            if (resultData.resultCode == '00') {
                resultData.isSuccess = true;
            }
           
            resultData.pgLog = pgLog;
            resultData.message = resultData.resultMsg;
            
            return resultData;
        } catch (err) {
            logger(err);
            return false;
        }
    }
};

module.exports = inicisCancel;