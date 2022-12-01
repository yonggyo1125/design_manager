const replyAlimTalkToClient = require("../design/replyAlimTalkToClient");
const { getConfig } = require("../../library/common");

/** 주문 상태 변경 후 메세지 전송  */
const sendStatusMessage = {
    /**
     * 주문 상태 변경 후 자동 메세지 전송 
     * 
     * @param {long} orderNo 주문번호
     * @param {String} statusCd 상태코드 
     * @returns {Boolean}
     */
    async send(orderNo, statusCd, isManual) {
        if (!orderNo || !statusCd) {
            return false;
        }

        isManual = isManual?true:false;
        const orderDao = require('../../models/order/dao');
        const orderStatusDao = require('../../models/order/orderStatusDao');
        const kakaoAlimTalkApiSvc = require("../kakaoAlimTalk/api");
        const { KakaoAlimTalkHistory } = require('../../models');

        const orderInfo = await orderDao.getOrderInfo(orderNo);
        const siteConfig = await getConfig("siteConfig");

        if (!orderInfo || (!isManual && orderInfo.orderStatus == statusCd) || !orderInfo.orderCellPhone) { // 상태 코드가 변경된 경우만 전송 
            return false;
        }  
        
        const statusConf = await orderStatusDao.get(statusCd);
        if (!statusConf || !statusConf.setting || !statusConf.setting.sendAlimTalk || !statusConf.setting.tmpltCode) {
            return false;
        }

        const cellPhone = orderInfo.orderCellPhone.replace(/[^\d]/g, "");
        const tmpltCode = statusConf.setting.tmpltCode;
        const replaceCodeData = {};
        for (const key in orderInfo) {
            const v = orderInfo[key];
            if (typeof v == 'string' || typeof v == 'number') {
                replaceCodeData[key] = v;
            }
        }

        if (replaceCodeData['totalPayPrice'] != orderInfo.shopTotalPayPrice) {
            replaceCodeData['totalPayPrice'] = orderInfo.shopTotalPayPrice;
        }

        let url = "https://dm.n-mk.kr/mypage";
        replaceCodeData['url'] = url;
        
        replaceCodeData['deliveryLink'] = "https://dm.n-mk.kr/delivery/" + orderNo;
        replaceCodeData['companyBankInfo'] = siteConfig.companyBankInfo;
        replaceCodeData['reviewUrl'] = `https://dm.n-mk.kr/board/write/review?orderNo=${orderNo}`;
        
        //  주문서 상태변경시 1회만 전송 설정이 있는 경우
        if (statusConf.setting.sendAlimTalkOnce && !isManual) {
            const cnt = await KakaoAlimTalkHistory.count({ where : { tmpltCode, orderNo }});

            if (cnt > 0) {
                return false;
            }
        }
        
        // 알림톡 전송 
       await kakaoAlimTalkApiSvc.send(tmpltCode, cellPhone, replaceCodeData, orderNo);


       return true;
    },
    /**
     * 디자인상태 변경에 따른 알림톡 전송
     * 
     * @param {int} idOrderItem 품주번호
     * @param {String} designStatus 디자인상태
     * @returns {Boolean}
     */
    async sendDesignStatus(idOrderItem, designStatus) {
        if (!idOrderItem || !designStatus) {
            return false;
        }
        const orderDao = require('../../models/order/dao');

        const orderItem = await orderDao.getOrderItem(idOrderItem);
        if (!orderItem || !orderItem.designStatusInfo || !orderItem.designStatusInfo.tmpltCode) {
            return false;
        }
        
        await replyAlimTalkToClient(orderItem.itemUid, orderItem.designStatusInfo.tmpltCode);

       
        return true;
    },
    /**
     * 디자인 확정 메세지 전송
     * 
     * @param {*} id 품주번호
     */
    async sendDesignConfirm(idOrderItem) {
        if (!idOrderItem) {
            return false;
        }
        const orderDao = require('../../models/order/dao');

        const orderItem = await orderDao.getOrderItem(idOrderItem);
        if (!orderItem) {
            return false;
        }

        await replyAlimTalkToClient(orderItem.itemUid, "signconfirm");

        return true;
    },
    /**
     * 디자이너 변경 알림톡 전송
     * 
     * @param {*} idOrderItem 
     * @param {*} idDesigner 
     */
    async sendDesginerChanged(idOrderItem, idDesigner) {
        if (!idOrderItem) {
            return false;
        }
        const orderDao = require('../../models/order/dao');

        const orderItem = await orderDao.getOrderItem(idOrderItem);
        if (!orderItem || !orderItem.designStatusInfo || !orderItem.designStatusInfo.designerChangedTmpltCode) {
            return false;
        }
        if (orderItem.designerInfo && orderItem.designerInfo.id == idDesigner) {
            return false;
        }
        const tmpltCode = orderItem.designStatusInfo.designerChangedTmpltCode;
        await replyAlimTalkToClient(orderItem.itemUid, tmpltCode);

    }
};

module.exports = sendStatusMessage;