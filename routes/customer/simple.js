const express = require('express');
const router = express.Router();
const getSimpleOrderList = require("../../service/simple/getSimpleOrderList");

/**
 * 간편주문서 접수목록
 */
router.route("/")
    .get(async (req, res) => {
        const limit = req.query.limit || 20;
        const result = await getSimpleOrderList(req);
        const data = {
            subMenuUrl : "/customer",
            limits : [20, 50, 100, 500, 1000],
            limit,
            search : req.query,
            ...result,
        };

        return res.render("customer/simple", data);
    });


module.exports = router;