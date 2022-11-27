const axios = require('axios');
const { getException, logger, getConfig, saveConfig } = require('../../library/common');

const KakaoAlimTalkApiException = getException("KakaoAlimTalk/KakaoAlimTalkApiException");
const KakaoAlimTalkNotFoundException = getException("KakaoAlimTalk/KakaoAlimTalkNotFoundException");

const { checkCellPhoneNumber  } = require('../../library/validator');

const { KakaoAlimTalkHistory, KakaoAlimTalkReserved } = require('../../models');
const templateSvc = require('./template');
const kakaoAlimTalkDao = require('../../models/kakaoAlimTalk/dao');
const checkHoliday = require("../holiday/checkHoliday"); // 휴무일 체크 
const reservationDao = require('../../models/kakaoAlimTalk/reservationDao');

/**
 * 비즈톡 알림톡 전송 API 
 * 
 */
const kakaoAlimTalkApiService = {
    // API 요청 기본 URL 
    baseUrl  : "https://www.biztalk-api.com",
    /**
     * 메세지 전송 양식에서 전송 
     * 
     * @param {Object} req
     * @throws {KakaoAlimTalkApiException}
     */
    async sendForm(req) {
        const data = req.body;
        await this.validator(data);
        const tmpltCode = data.tmpltCode;
        const replaceCodeData = {};
        for (key in data) {
            if (key.indexOf('replaceCode') != -1 && data[key].trim() != "") {
               keyR = key.replace("replaceCode_", "");
               replaceCodeData[keyR] = data[key];
            }
        } 
        const cellPhone = data.cellPhone.replace(/[^\d]/g, "");
        const result = await this.send(tmpltCode, cellPhone, replaceCodeData);
        if (!result) {
            throw new KakaoAlimTalkApiException("전송에 실패하였습니다.");
        }
    },
    /**
     * 메세지 전송 양식 유효성 검사
     * 
     * @param {Object} data
     * @throws {KakaoAlimTalkApiException}
     */
    async validator(data) {
        const required = {
            tmpltCode : "템플릿코드가 누락되었습니다.",
            cellPhone : "메세지를 전송할 휴대전화 번호를 입력하세요.",
        };

        for (key in required) {
            if (!data[key] || data[key].trim() == "") {
                throw new KakaoAlimTalkApiException(required[key]);
            }
        }

        /** 휴대전화번호 형식 체크 */
        checkCellPhoneNumber(data.cellPhone, KakaoAlimTalkApiException);
    },
    /**
     * 카카오 알림톡 비즈톡 API 요청 
     * 
     * @param {String} tmpltCode 템플릿 코드 
     * @param {String} cellPhone 휴대전화번호
     * @param {Object} replaceCodeData 치환코드 데이터 
     * @param {long} orderNo 주문번호
     * @param {boolean} dbReserved 예약전송 접수 여부
     */
    async send(tmpltCode, cellPhone, replaceCodeData, orderNo, dbReserved) {
        try {
            if (!tmpltCode || !cellPhone) {
                throw new KakaoAlimTalkApiException("잘못된 접근입니다.");
            }
            
            const config = await getConfig("kakaoAlimTalkConfig");
            if (config.isUse != 1 || !config.senderKey) {
                return false;
            }

            dbReserved = dbReserved || false;

            /** 휴대전화번호 체크  */
            checkCellPhoneNumber(cellPhone, KakaoAlimTalkApiException);
            cellPhone = cellPhone.replace(/[^\d]/g, "");
            const tplData =  await templateSvc.get(tmpltCode);

            if (!tplData) {
                throw new KakaoAlimTalkNotFoundException("등록되지 않은 템플릿 입니다.");
            }

            let message = tplData.message;

            /** 공통 치환 코드 처리 S */
            const commonReplaceCodeData = await getConfig("kakaoAlimTalkCommonCode");           
            if (commonReplaceCodeData) {
                for (const codeData of commonReplaceCodeData) {
                    const pattern = new RegExp("#{" + codeData.code + "}", "igm");
                    message = message.replace(pattern, codeData.replace );
                }
            }
            /** 공통 치환 코드 처리 E */

            if (replaceCodeData) {
                for (const key in replaceCodeData) {
                    const pattern = new RegExp("#{" + key + "}", "igm");
                    message = message.replace(pattern, replaceCodeData[key]);
                }
            }

            /** 예약전송 체크 S */
            if (tplData.useReservation && tplData.reservation && tplData.reservation.isUse) {
                /** 휴무일인 경우 체크  S */
                const type = tplData.reservation.holidayType;
                let isReserved = false;
                const reservations = tplData.reservation.reservations;
                const isHoliday = await checkHoliday(type);
                if (isHoliday) {
                    isReserved = true;
                }
                /** 휴무일인 경우 체크 E  */

            
                /** 예약 전송 시간 체크 S */
                const today = Date.now();
                if (!isReserved && reservations && reservations.length > 0) {
                    for (const item of reservations) {
                        const sstamp = item.todaySdate.getTime();
                        const estamp = item.todayEdate.getTime();
                        if (today < sstamp || today > estamp) {
                            isReserved = true;
                        }
                    } // endfor
                } // endif 
                /** 예약 전송 시간 체크 E */

                if (isReserved && !dbReserved) { // 예약 전송인 경우
                    
                    /** 예약 전송 DB 기록 S */
                   await KakaoAlimTalkReserved.create({
                        tmpltCode,
                        cellPhone,
                        replaceCodeData,
                        orderNo,
                        holidayType : type,
                    });
                    /** 예약 전송 DB 기록 E */
                    return true;
                } // endif   
            } // endif 
            /** 예약전송 체크 E */
          
            

            /** 토큰 발급  */
            const token = await this.getToken();
            if (!token) {
                return false;
            }
            
            
            const msgIdx = Date.now();
            const  reqParams = {
                msgIdx,
                countryCode  : "82",
                resMethod : "PUSH",
                senderKey : config.senderKey,
                tmpltCode,
                message,
                recipient : cellPhone,
                messageType : tplData.messageType || "AT",
            };

            /** 버튼 처리 S */
            let channelButton = null;
            if (tplData.useAddChannel && tplData.channelNm) {
                channelButton = {"name":tplData.channelNm.trim(),"type":"AC"};
            }
            if (tplData.buttons && tplData.buttons.length > 0) {
           
                if (tplData.buttonType == 'web')  { // 웹링크 버튼 
                    const buttons = [];
                    if (channelButton) buttons.push(channelButton);
                    for (const item of tplData.buttons) {
                        buttons.push({"name":item.buttonNm,"type":"WL", "url_mobile":item.buttonUrl});
                    }
                    reqParams.attach = {"button": buttons};
                } else if (tplData.buttonType == 'delivery') { // 배송조회 버튼 
                    const buttons = [];
                    if (channelButton) buttons.push(channelButton);
                    for (const item of tplData.buttons) {
                        buttons.push({"name": item.buttonNm,"type":"DS"});
                    }

                    reqParams.attach = {"button": buttons};
                }
            }
           
            let url = this.baseUrl + "/v2/kko/sendAlimTalk";
            let result = await axios({
                headers : {
                    "Content-Type" : "application/json",
                    "bt-token" : token,
                },
                method : "post",
                url,
                data : reqParams,
            });
            
            const resultData = result.data;
            if (resultData.responseCode != '1000') {
                throw new KakaoAlimTalkApiException(resultData.msg);
            }
            
            /** 로그 기록을 위한  DB 처리 S */
            const params = {
                msgIdx,
                tmpltCode,
                tmpltNm : tplData.tmpltNm,
                message,
                recipient : cellPhone,
                responseCode : resultData.responseCode,
            };
            if (orderNo) {
                params.orderNo = orderNo;
            }
            
            await KakaoAlimTalkHistory.create(params);
            /** 로그 기록을 위한 DB 처리 E */

            return true;
        }  catch (err) {
            logger(err);
            return false;
        }
    },
    /**
     * 알림톡 전송 결과 조회
     * 
     * @returns {Array|Boolean}
     */
    async getResults() {
        try {
            const token = await this.getToken();
            if (!token) {
                return false;
            }

            const url = this.baseUrl + "/v2/kko/getResultAll";
            const result = await axios({
                headers : {
                    "Content-Type" : "application/json",
                    "bt-token" : token,
                },
                method : "GET",
                url,
            });
            
            const data = result.data;
            if (data.responseCode != '1000') {
                throw new KakaoAlimTalkApiException(data.msg);
            }

            return data.response;
        } catch (err) {
            logger(err);
            return false;
        }
    },
    /**
     * API 요청 토큰 발급 
     * 
     * @returns {String|Boolean}
     * @throws {KakaoAlimTalkApiException}
     */
    async getToken() {
        try {
            const config = await getConfig("kakaoAlimTalkConfig");
            if (config.isUse != 1 || !config.senderKey || !config.bsPwd || !config.bsId) {
                return false;
            }

            const tokenKey = "kakaoAlimTalkToken";
            let tokenInfo = await getConfig(tokenKey);
            // 토큰 발급 내역이 없거나 유효시간 20분이 경과한 경우 
            if (!tokenInfo || Date.now() - tokenInfo.timestamp >= 1000 * 60 * 20) { 
                const url = this.baseUrl + "/v2/auth/getToken";
                const result = await axios({
                    method : "post",
                    url,
                    headers : { "Content-Type" : "application/json" },
                    data : {
                        bsid : config.bsId,
                        passwd : config.bsPwd,
                    }
                });
                
                const data = result.data;
                if (data.responseCode != '1000') {
                    throw new KakaoAlimTalkApiException(data.msg);
                }
                
                /** 토큰 발급 기록 저장 S */
                tokenInfo = {
                    token : data.token,
                    timestamp : Date.now(),
                };

                await saveConfig(tokenKey, tokenInfo);
                /** 토큰 발급 기록 저장 E */

                return data.token;
            } else {
                return tokenInfo.token;
            }
            
        } catch (err) {
            logger(err);
            return false;
        }
    },
    /**
     * 전송 결과 업데이트 
     * 
     */
    async updateSendResults() {
        try {
            const list = await this.getResults();
            if (!list) {
                return false;
            }

            for await (li of list) {
               const result = await KakaoAlimTalkHistory.update({
                    biztalkUid : li.uid,
                    resultCode : li.resultCode,
                    requestAt : new Date(li.requestAt),
                    receivedAt : new Date(li.receivedAt),
                    bsid : li.bsid,
                    sendType : li.sendType,
                }, { where : { msgIdx : li.msgIdx} });
            }
        } catch (err) {
            logger(err);
            return false;
        }
    },
    /**
     *  전송목록 
     * 
     * @param {int} page 페이지 번호
     * @param {int} limit 1페이지당 레코드 수 
     * @param {Object} req 
     * @param {Object} search 검색조건
     */
    async getHistories(page, limit, req, search) {
        const list = await kakaoAlimTalkDao.getHistories(page, limit, req, search);
        const pagination = kakaoAlimTalkDao.pagination;
        const total = kakaoAlimTalkDao.total;

        return { list, pagination, total };
    },
    /**
     * 전송예약 목록 처리 
     * 
     */
    async sendReserveds() {
        const list = await reservationDao.getReserveds(1, "all");
        if (!list) {
            return false;
        }

        for await (const li of list) {
            try {
                const tmpltCode = li.tmpltCode;
                const type = li.holidayType || 'cs';
                const isHoliday = await checkHoliday(type);
                if (isHoliday) {
                    continue;
                }

                let replaceCodeData = li.replaceCodeData || {};
                if (typeof replaceCodeData == 'string') {
                    replaceCodeData = JSON.parse(replaceCodeData);
                }
    
                const result = await kakaoAlimTalkApiService.send(tmpltCode, li.cellPhone, replaceCodeData, li.orderNo, true);

                if (result) {
                    // 전송 완료 처리 
                    await reservationDao.doneSentReserved(li.id);
                }
            } catch (err) {
                logger(err);
            } 
        }
    }   
};

module.exports = kakaoAlimTalkApiService;
