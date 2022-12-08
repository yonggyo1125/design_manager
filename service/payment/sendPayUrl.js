const paymentItemSvc = require("./item");
const orderDao = require("../../models/order/dao");
const kakaoAlimTalkApiSvc = require("../kakaoAlimTalk/api");
const { getConfig } = require("../../library/common");

/**
 * 결제 요청 URL 전송 
 * 
 * @param {*} id 
 */
module.exports = async (id, res) => {
    if (!id) {
        return new Error("잘못된 접근입니다.");
    }
    const host = res.locals.host;
    const item = await paymentItemSvc.get(id);
    if (!item) {
        throw new Error("등록되지 않은 결제입니다.");
    }

    const payUrl = host + "/payment/process/" + id;
    const data = await orderDao.getOrderInfo(item.gid);
    if (!data) {
        throw new Error("등록되지 않은 주문입니다.");
    }
    let mobile = data.orderCellPhone;
    if (!mobile) {
        throw new Error("전송할 휴대전화번호가 주문서에 등록되지 않았습니다.");
    }
    mobile = mobile.replace(/\D/g, "");
    data.url = payUrl;
    data.amount = item.amount;
    const siteConfig = await getConfig("siteConfig");
    data['companyBankInfo'] = siteConfig.companyBankInfo;

    const result = kakaoAlimTalkApiSvc.send("versement3", mobile, data, data.orderNo);    
    return result;
};  