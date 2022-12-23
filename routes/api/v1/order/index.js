/**
 * 주문 API
 * 
 */
const orderSvc = require('../../../../service/api/order');
const orderStatusDao = require('../../../../models/order/orderStatusDao');
const designStatusDao = require('../../../../models/order/designStatusDao');
const deliveryDao = require('../../../../models/delivery/dao');


const express = require('express');
require('express-async-errors');
const router = express.Router();

// 주문접수
router.post("/", async (req, res, next) => {
    try {
        const result = await orderSvc.add(req);
        res.json(result);
    } catch (err) {
        next(err);
    }
});

// 주문목록
router.use("/list", async (req, res, next) => {
    try {
        const result = await orderSvc.gets(req);
        res.json(result);
    } catch (err) {
        next(err);
    }
});



/** 주문처리상태 목록  */
router.get("/orderStatuses", async (req, res) => {
    const attributes = ["statusCd", "statusNm"];
    const data = await orderStatusDao.gets(false, attributes);
    res.json(data);
});


/** 디자인처리상태 목록  */
router.get("/designStatuses", async (req, res) => {
    const attributes = ["statusCd", "statusNm"];
    const data = await designStatusDao.gets(false, attributes);
    res.json(data);
});

/** 배송 조건 목록  */
router.get('/deliveryPolicies', async (req, res) => {
    const data = await deliveryDao.getPolicies();
    res.json(data);
});

router.route('/designDraft/:draftUid')
    .get(async (req, res, next) => { // 디자인 시안 조회 
        try {
            const data = await orderSvc.getDesignDraft(req);
            res.json(data);
        } catch (err) {
            next(err);
        }
    })
    .post(async (req, res, next)  => {
        try {
            const mode = req.body.mode || "choice_design";
            if (mode == 'send_request') { // 고객 요청 사항 전달
                await orderSvc.updateDesignRequest(req);
            } else { // 시안 확정 처리 
                await orderSvc.confirmDesignDraft(req);
            }
            res.json({"isSuccess" : true});
        } catch (err) {
            next(err);
        }
    });

router.route("/:orderNo")
    .get(async (req, res, next) => { // 주문 조회
        try {
            const data = await orderSvc.get(req);
            res.json(data);
        } catch (err) {
            next(err);
        }
    })
    .delete(async (req, res, next) => { // 주문 삭제
        try {
                await orderSvc.delete(req);
                res.json({isSuccess : true});
        } catch (err) {
            next(err);
        }
    });
module.exports = router;