const { OrderItem, Manager, OrderInfo } = require("../../models");
const generateUrlAccessToken = require("../utils/generateUrlAccessToken");
const kakaoAlimTalkApi = require("../kakaoAlimTalk/api");

/**
 * 고객 수정 요청 사항을 디자이너에게 알림톡 전달
 * 
 */
module.exports = async (itemUid, tmpltCode) => {
    if (!itemUid || !tmpltCode) {
        return;
    }

    const itemUids = itemUid.split("_");
    itemUid = itemUids[0]+"_"+itemUids[1];

    const data = await OrderItem.findOne({
        include : [{model : Manager,
            attributes : ['managerId', 'managerNm', 'mobile' ],
        }, {
            model : OrderInfo,
            attributes : ["totalPayPrice", "orderNm", "orderCellPhone"],
        }],
        where : { itemUid },
        raw : true,
    });

    
    if (!data) {
        return;
    }

    const mobile = data['OrderInfo.orderCellPhone'];
    if (!mobile || mobile.trim() == "") {
        return;
    }

    data.designer = data['Manager.managerNm'];
    data.orderNm = data['OrderInfo.orderNm'];
    data.totalPayPrice = data['OrderInfo.totalPayPrice'];
    
    const _url = `/mypage/${data.orderNo}`;
    const token = await generateUrlAccessToken(_url, 60 * 60 * 3);
    const url = `https://dm.n-mk.kr${_url}?token=${token}`; 
    data.url = url;

    
    await kakaoAlimTalkApi.send(tmpltCode, mobile, data, data.orderNo);
};