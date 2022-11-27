const axios = require('axios');
const crypto = require('crypto');
const { getException, logger, dateFormat } = require('../../library/common');
const PGRequestException = getException("Payment/PGRequestException");
const inicisLib = require('./lib');


/**
 * 이니시스 결제 처리 관련 
 * 
 */
const inicisPay = {
    /**
     * 인증결과 수신 및  승인요청/응답 처리(PC 웹표준 결제) 
     * 
     * @param {Object} data
     */
    async process(data) {
        if (!data) {
            throw new PGRequestException();
        }

        if (data.resultCode != '0000') {
            throw new PGRequestException();
        }
        const timestamp = Date.now();
        const qs = `authToken=${data.authToken}&timestamp=${timestamp}`;
        const signature = crypto.createHash("SHA256").update(qs).digest("hex");
        const reqData = {
            mid : data.mid,
            authToken : data.authToken,
            timestamp,
            signature,
            charset : data.charset,
            format : "JSON",
        };
        let params = [];
        for (key in reqData) {
            params.push(`${key}=${encodeURIComponent(reqData[key])}`);
        }
        params = params.join("&");
        try {
             const result = await axios({
                 headers : { "Content-Type" :  "application/x-www-form-urlencoded" },
                method : "POST",
                url : data.authUrl,
                data : params,
             });
             const resultData = result.data;
             if (resultData.ACCT_BankCode) {
                 resultData.pgBankName = inicisLib.getBank(resultData.ACCT_BankCode);
             }

             if (resultData.VACT_BankCode) {
                resultData.pgBankName = inicisLib.getBank(resultData.VACT_BankCode);
             }
             
             if (resultData.CARD_BankCode) {
                resultData.pgBankName = inicisLib.getBank(resultData.CARD_BankCode);
             }

             if (resultData.CARD_Code) {
                 resultData.CARD_NM = inicisLib.getCard(resultData.CARD_Code);
             }

             let pgLog = [];
             pgLog.push("-------------------------------- PG 결제 요청 S ----------------------------------");
             pgLog.push(`주문번호 : ${resultData.MOID}`);
             pgLog.push('처리일시 : ' + dateFormat(new Date(), '%Y-%m-%d %H:%i:%s'));
             for (key in resultData) {
                 pgLog.push(`${key} : ${resultData[key]}`);
             }
             pgLog.push("-------------------------------- PG 결제 요청 E ----------------------------------");

             pgLog =  pgLog.join("\r\n");
             const returnData = {
                isSuccess : false,
                pgResultCode : resultData.resultCode,
                pgResultMessage: resultData.resultMsg,
                pgLog,
                pgDevice : (resultData.payDevice == 'PC')?"PC":"MOBILE",
                idPayment : data.merchantData,
             };
            if (resultData.resultCode == '0000') { // 정상처리 
                returnData.isSuccess = true;
                returnData.pgTransactionId = resultData.tid; 
                returnData.payMethod = resultData.payMethod;
                if (resultData.VACT_Num)  {
                    returnData.VBankAccount = resultData.VACT_Num;
                }
                returnData.pgBankName = resultData.pgBankName || "";
                returnData.pgApproveDate = resultData.applDate || "";
                returnData.pgApproveTime = resultData.applTime || "";
            }
             
             return returnData;

        } catch (err) {
            logger(err);
            return new PGRequestException();
        }
    },
    /**
     * 인증결과 수신 및  승인요청/응답 처리(모바일 결제) 
     * 
     * @param {Object} data
     */
     async processMobile(data) {
        if (!data) {
            throw new PGRequestException();
        }
            
        if (data.P_STATUS != '00') {
            throw new PGRequestException();
        }
        
        const config = await inicisLib.getConfig();

        const params = `P_MID=${encodeURIComponent(config.mid)}&P_TID=${encodeURIComponent(data.P_TID)}`;

        try {
            const result = await axios({
                headers : {'Content-Type' : 'application/x-www-form-urlencoded'},
                method : "POST",
                url : data.P_REQ_URL,
                data : params,
            });
            const resultData = {};
            const urlParams = new URLSearchParams(result.data);
            for ([k, v] of urlParams.entries()) {
                resultData[k] = v;
            }

            if (resultData.P_FN_CD1) {
                if (resultData.P_TYPE == 'CARD') {
                    resultData.P_FN_NM = inicisLib.getCard(resultData.P_FN_CD1);
                } else {
                    resultData.pgBankName = resultData.P_FN_NM = inicisLib.getBank(resultData.P_FN_CD1);  
                }
            }

            if (resultData.P_VACT_BANK_CODE) {
                resultData.pgBankName =  resultData.P_FN_NM = inicisLib.getBank(resultData.P_VACT_BANK_CODE);
            }

            switch(resultData.P_TYPE) {
                case "CARD" : 
                    resultData.payMethod = "Card";
                    break;
                case "BANK" : 
                    resultData.payMethod = "DirectBank";
                    break;
                case "VBANK" : 
                    resultData.payMethod = "VBank";
                    break;
            }
            if (resultData.P_CARD_ISSUER_CODE) {
                resultData.pgBankName = inicislib.getBank(resultData.P_CARD_ISSUER_CODE);
            }


            let pgLog = [];
            pgLog.push("-------------------------------------------------------------------");
            pgLog.push(`주문번호 : ${resultData.P_OID}`);
            pgLog.push('처리일시 : ' + dateFormat(new Date(), '%Y-%m-%d %H:%i:%s'));
            for (key in resultData) {
                pgLog.push(`${key} : ${resultData[key]}`);
            }
            pgLog.push("-------------------------------------------------------------------");

            pgLog =  pgLog.join("\r\n");
            const returnData = {
               isSuccess : false,
               pgResultCode : resultData.P_STATUS,
               pgResultMessage: resultData.P_RMESG1,
               pgLog,
               pgDevice :"MOBILE",
               idPayment : data.P_NOTI,
            };
            if (resultData.P_STATUS == '00') { // 성공
                returnData.isSuccess = true;
                returnData.pgTransactionId = resultData.P_TID; 
                returnData.payMethod = resultData.payMethod;
                if (resultData.P_VACT_NUM)  {
                    returnData.VBankAccount = resultData.P_VACT_NUM;
                }

                returnData.pgBankName = resultData.pgBankName || "";
                returnData.pgApproveDate = "";
                returnData.pgApproveTime ="";
                if (resultData.P_AUTH_DT) {
                    returnData.pgApproveDate = resultData.P_AUTH_DT.substring(0, 8);
                    returnData.pgApproveTime = resultData.P_AUTH_DT.substring(8);
                }
            } 
            
            return returnData;
        } catch (err) {
            logger(err);
            throw new PGRequestException();
        }
     }  
};

module.exports = inicisPay;