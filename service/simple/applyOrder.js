const { SimpleOrder } = require('../../models');
const kakaoAlimTalkApi = require("../../service/kakaoAlimTalk/api");

/**
 * 간편 주문 접수하기
 * @param {*} data
 */
module.exports = async (data) => {
    /** 유효성 검사 S */
    const required = {
        orderNm : "주문자 성함을 기입해 주세요.",
        cellPhone : "휴대전화번호를 입력하세요.",
        zonecode : "주소를 입력하세요.",
        address : "주소를 입력하세요.",
    };

    for (const key in required) {
        if (!data[key] || data[key].trim() == "") {
            throw new Error(required[key]);
        }
    }
    /** 유효성 검사 E */
    const cellPhone = data.cellPhone.replace(/\D/g, "");
    try {
        const order = await SimpleOrder.create({
            orderNm : data.orderNm,
            cellPhone,
            zonecode : data.zonecode,
            address : data.address,
            addressSub : data.addressSub,
            productNm : data.productNm,
            orderMemo : data.orderMemo,
            extra1 : data.extra1,
            extra2 : data.extra2,
            extra3 : data.extra3,
            extra4 : data.extra4,
            extra5 : data.extra5,
            extraText1 : data.extraText1,
            extraText2 : data.extraText2,
            extraText3 : data.extraText3,
        });

        if (!order) {
            throw new Error("주문접수에 실패하였습니다.");
        }

        /** 알림톡 전송 S */
        const sendData = {
            orderNm : data.orderNm,
        };
        await kakaoAlimTalkApi.send("receive11", cellPhone, sendData); 
        /** 알림톡 전송 E */
        return order;
    } catch (err) {
        console.error(err);
        throw new Error(err.message);
    }
};