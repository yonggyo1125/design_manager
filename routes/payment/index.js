const express = require('express');
const { alert, go, isMobile, getConfig, getException, layerClose } = require('../../library/common');
const router = express.Router();
const paymentItemSvc = require('../../service/payment/item');
const payDataSvc = require('../../service/payment/payData');
const paymentSvc = require('../../service/payment');
const inicisLib = require('../../service/inicis/lib');

const paymentDao = require('../../models/payment/dao');

/** 예외 S */
const PaymentDoneException = getException("Payment/PaymentDoneException");
const PaymentCancelException = getException("Payment/PaymentCancelException");
/** 예외 E */

/** 라우터  */
const cashReceiptRouter = require('./cash_receipt');
const noticeRouter = require('./notice');
const menuSvc = require('../../service/menu');

/** 공통 */
router.use(async (req, res, next) => {
    res.locals.locTitle = "결제관리";
    const subMenus = await menuSvc.getsByType("payment");
    if (subMenus) {
        res.locals.subMenus = subMenus;
    }
    res.locals.menuOn="payment";
    res.locals.topBoards = await req.getBoards('payment');
    next();
});

/**  현금영수증 관리  */
router.use("/cash_receipt", cashReceiptRouter);

/** 가상계좌 입금통보, 에스크로 구매결정등  통보 URL */
router.use("/notice", noticeRouter);

/** 결제 주문 S */
router.route('/')
    .get(async (req, res) => {
        const data = await paymentSvc.gets(req.query.page, 20, req, req.query);
        data.statuses = paymentDao.statuses;
        data.payMethods = paymentDao.payMethods;

        data.search = req.query;
        res.render("payment/list", data);
    })
    .post(async (req, res) => { // 등록 처리 
        try {
            const id = await paymentSvc.add(req);
            res.json({ isSuccess : true, idPayment : id });
        } catch (err) {
            res.json({ isSuccess : false, message : err.message });
        }
    });
/** 결제 주문 E */

/** 결제 등록 S */
router.route("/add")
    .get((req, res) => {
        const gid = req.query.gid;
        const amount = req.query.amount || "";
        const name = req.query.name || "";
        const cellPhone = req.query.cellPhone || "";

        const data = { gid, amount, name, cellPhone };

        res.render("payment/add", data);
    })
    .post(async (req, res) => {
        try { 
            await paymentItemSvc.add(req);
            
            alert("등록되었습니다.", res, "reload", "parent.parent");
        } catch (err) {
            alert(err.message, res);
        }
    });
/** 결제 등록 E */

/** 결제 수정 S */
router.route("/update/:id")
    .get(async (req, res) => {
        try {
            const data = await paymentItemSvc.get(req.params.id);
            data.mode = "update";
            res.render("payment/add", data);
        } catch (err) {
            alert(err.message, res, "close", "parent");
        }
    })
    .post(async (req, res) => {
        try {
            await paymentItemSvc.update(req);
            
            alert("수정되었습니다.", res, "reload", "parent.parent");
        } catch (err) {
            alert(err.message, res);
        }
    });
/** 결제 수정 E */

/** 결제 삭제 S */
router.get("/delete/:id", async (req, res) => {
    try {
        await paymentItemSvc.delete(req.params.id);
        
        alert("삭제되었습니다.", res, "reload", "parent.parent");
    } catch (err) {
        alert(err.message, res);
    }
});
/** 결제 삭제 E */

/** 결제 내역 보기 S */
router.route("/view/:id")
    .get(async (req, res) => {
        try {
            const id = req.params.id;
            const data = await paymentSvc.get(id);
            let tpl = "view";
            if (req.query.isAdmin) tpl = "view_admin";

            res.render(`payment/${tpl}`, data);
        } catch (err) {
            alert(err.message, res);
        }
    });
/** 결제 내역 보기 E */


/** 결제 약관 보기 S */
router.get('/terms/:type', async (req, res) => {
    const type = req.params.type;
    const data = await getConfig("payConfig");
    let content = "";
    if (type == 'private') {
        content = data.termsPrivate;
    } else {
        content = data.termsPayment;
    }

    res.render("payment/terms", { content } );
});
/** 결제 약관 보기 E */

/** 결제 취소하기 S */
router.post('/cancel', async (req, res) => {
    try {
        await paymentSvc.cancel(req);
        res.json({ isSuccess : true });
    } catch (err) {
        res.json({ isSuccess : false, message : err.message });
    }
}); 

router.route('/cancel/:id')
     .get(async (req, res) => {
        try {
            const id = req.params.id;
            const data = await paymentSvc.get(id);
            if (data['canceledAt']) {
                throw new PaymentCancelException("이미 취소된 결제 입니다.");
            }
            if (!data['pgTransactionId'] || data['pgResultCode'] != '0000') {
                throw new PaymentCancelException("취소가 불가한 결제 입니다.");
            }

            data['amount'] = data['PaymentItem.amount'];
            data['banks'] = inicisLib.getBank("all");
            data['addScript'] = ['payment/cancel'];

            res.render("payment/cancel", data);
        } catch (err) {
            alert(err.message, res);
            layerClose(res, "parent");
        }
    })
    .post(async (req, res) => {
        try {
            await paymentSvc.cancel(req);
            alert("취소되었습니다.", res, "reload", "parent.parent");
        } catch (err) {
            alert(err.message,  res);
        }
    });
/** 결제 취소하기 E */


/** 결제 하기 S */
// PC 웹표준 결제 콜백 처리 
router.post("/callback", async (req, res) => { 
    try {
        const id = await paymentSvc.process(req);
        go(`/payment/view/${id}`, res);
        
    } catch (err) {
        alert(err.message, res);
    }
});

router.get("/close", (req, res) => {
    res.send(`<script>parent.codefty.payment.pgPopupClose();</script>`);
});

// 모바일 결제 콜백 처리 
router.post("/mobile/callback", async (req, res) => {
    try {
        const id = await paymentSvc.process(req, true);
       go(`/payment/view/${id}`, res);
    } catch (err) {
        const url = `/payment/${req.query.idPaymentItem}`;
       alert(err.message, res, url);
    }
});

router.route("/process/:id")
    .get(async (req, res) => {
        try {
            const id = req.params.id;
            const data = await payDataSvc.get(id);
            if (data['payDoneAt']) {
                throw new PaymentDoneException("결제진행이 완료되었습니다.");
            }

            if (isMobile(req)) {
                data.addScript = ["payment/form_mobile"];
                res.render("payment/form_mobile", data);
            } else {
                data.addScript = ["payment/form"];
                res.render("payment/form", data);
            }
        } catch (err) {
            alert(err.message, res, "close");
        }
    });
/** 결제하기 E */

module.exports = router;