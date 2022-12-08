const api = require("../../service/kakaoAlimTalk/api");
const guideDao = require("../../models/product/guideDao");
const { OrderInfo } = require("../../models");
/**
 * 사용방법안내 알림톡 전송 
 * 
 * @param {*} orderNo 
 * @param {*} id 
 */
module.exports = async (orderNo, id, host) => {
    if (!orderNo || !id) {
        return false;
    }

    const guide = await guideDao.get(id);
    if (!guide) {
        return false;
    }

    const data = await OrderInfo.findByPk(orderNo, { 
        attributes : ['orderCellPhone', 'orderNm'],
        raw : true,
    });

    if (!data) {
        return false;
    }

    const tmpltCode = "imanual1";
    const mobile = data.orderCellPhone;
    const replaceCodeData = {
        orderNm : data.orderNm,
        orderNo,
        url : host + guide.guideUrl,
    };

    if (!mobile) {
        return false;
    }

    await api.send(tmpltCode, mobile, replaceCodeData, orderNo);

    return true;
};