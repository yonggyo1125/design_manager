const inicisLib = require('../../service/inicis/lib');
const { alert } = require('../../library/common');
const express = require('express');
require('express-async-errors');
const router = express.Router();

const cashReceiptSvc = require('../../service/cash_receipt');

/** 발급 목록 S */
router.route('/')
    .get(async (req, res) => {
        const data = await cashReceiptSvc.gets(req.query.page, 20, req, req.query);
        data.search = req.query;
        data.addScript = ["payment/cash_receipt"];
        res.render('cash_receipt/list', data);
    });
/** 발급목록 E */

/** 발급하기 S */
router.route('/issue')
    .get(async (req, res) => {
        const config = await inicisLib.getConfig();
        
        const data = {
            subMenuUrl : "/payment/cash_receipt",
            config,
            addScript : ['payment/cash_receipt'],
        };
        const orderNo = req.query.orderNo;
        if (orderNo) {
           await  cashReceiptSvc.getDefaultOrderInfo(orderNo, data);
        }

        res.render('cash_receipt/issue', data);
    })
    .post(async (req, res) => {
        try {
            await cashReceiptSvc.issue(req);
            alert("발급되었습니다.", res, "/payment/cash_receipt", "parent");
        } catch (err) {
            alert(err.message, res);
        }
    });
/** 발급하기 E */

/** 발급 내역 상세보기 S */
router.get("/:id", async (req, res) => {
    const id = req.params.id;
    
    const data = await cashReceiptSvc.get(id);
    res.render("cash_receipt/view", data);
});

module.exports = router;