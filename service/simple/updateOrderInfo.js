const { SimpleOrder } = require("../../models");

/**
 * 간편 주문서 정보 업데이트 
 * @param {*} id 
 * 
 */
module.exports = async (id, data) => {    
    if (!id) {
        return false;
    }

    data = data || {};

    const simpleData = await SimpleOrder.findByPk(id);
    if (simpleData) {
        data.orderNm = simpleData.orderNm;
        data.receiverNm = simpleData.receiverNm;
        data.orderCellPhone = simpleData.cellPhone;
        data.receiverCellPhone = simpleData.cellPhone;
        data.receiverZonecode = simpleData.zonecode;
        data.receiverAddress = simpleData.address;
        data.receiverAddressSub = simpleData.addressSub;
        data.idSimpleOrder = id;
    }
};