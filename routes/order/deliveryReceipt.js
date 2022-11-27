const express = require('express');
const { Utils } = require('sequelize');
const router = express.Router();
const { alert } = require('../../library/common');
const orderDao = require('../../models/order/dao');

/**
 * 인수증
 * 
 */
router.get("/:orderNos", async (req, res) => {

    try {
        let orderNos = req.params.orderNos.split("_");
       

        const datas = [];
        for (const orderNo of orderNos) {
            const data = await orderDao.get(orderNo);
            if (!data) {
                continue;
            }

            let deliveryReceipt = false;
            if (data.deliveryInfo && data.deliveryInfo.length > 0) {
                for (const item of data.deliveryInfo) {
                    if (item.deliveryType != 'parcel') {
                        deliveryReceipt = true;;
                    }

                    item.receiverNm = item.receiverNm.replace("(홈페이지)", "");
                }
            
                for (const item of data.deliveryInfo) {
                    let totalCnt = 0, startCnt = 0, endCnt = 5;
                    const itemCnt = item.deliveryItems.length;
                    if (itemCnt > 0) {
                        if (itemCnt >= 5) endCnt = itemCnt;
                        startCnt = itemCnt;
                    }
                    const designs = [];
                    for (const it of item.deliveryItems) {
                        totalCnt += it.itemCnt;

                        for (const p of data.items) {
                            if (p.id == it.idOrderItems ) {
                                if (p.designConfirmed && p.designStatusInfo) {
                                    designs.push({
                                        designStatusStr : p.designStatusStr,
                                        draft : p.designDraft.draftChoiced,
                                        designerNm : p.designerInfo.managerNm,
                                        designerId : p.designerInfo.managerId,
                                    });
                                }
                            }
                        }
                    }

                    item.designs = designs;
                    item.totalCnt = totalCnt;
                    item.startCnt = startCnt;
                    item.endCnt = endCnt;
                }
            }
       
            if (!deliveryReceipt) {
                continue;
            }

            datas.push(data);
        }
        
        if (datas.length == 0) {
            throw new Error("인수증을 출력할 수 있는 주문이 없습니다.");
        }

        res.render("order/delivery_receipt", { list : datas });
    } catch (err) {
        alert(err.message, res, -1);
    }
});

module.exports = router;