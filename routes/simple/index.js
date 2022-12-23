const express = require('express');
require('express-async-errors');
const router = express.Router();
const { alert, getConfig } = require("../../library/common");
const applyOrder = require("../../service/simple/applyOrder");
/**
 * 간편주문서
 * 
 */
router.route("/")
    .get(async (req, res) => {
        const config = await getConfig("simpleConfig");
        const data = {
            addCss : ["simple/order"],
            ...config,
        };
        res.render("simple/order", data);
    })
    .post(async (req, res) => {
        try {
            const data = req.body;
            await applyOrder(data);
            alert("접수되었습니다. 감사합니다.", res, "/mypage", "parent");
        } catch (err) {
            alert(err.message, res);
        }
    });

module.exports = router;