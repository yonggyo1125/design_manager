const express = require('express');
require('express-async-errors');
const router = express.Router();
const { alert, go } = require("../../library/common");
const getDeliveryTraceUrls = require("../../service/order/getDeliveryTraceUrls");
/**
 * 운송장 조회
 * 
 */
router.get("/:orderNo", async (req, res) => {

    try {
        const orderNo = req.params.orderNo;

        const list = await getDeliveryTraceUrls(orderNo);
        if (list.length == 1 && list[0].traceUrl && list[0].traceUrl.trim() != "") {
            return go(list[0].traceUrl, res, "top");
        }
        
        res.render("delivery/index", { orderNo, list });
    } catch (err) {
        alert(err.message, res, -1);
    }
});

module.exports = router;