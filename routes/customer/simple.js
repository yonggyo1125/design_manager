const express = require('express');
const router = express.Router();
const getSimpleOrderList = require("../../service/simple/getSimpleOrderList");
const { saveConfig, getConfig, alert } = require("../../library/common");

/**
 * 간편주문서 접수목록
 */
router.route("/")
    .get(async (req, res) => {
        const limit = req.query.limit || 20;
        const result = await getSimpleOrderList(req);
        const config = await getConfig("simpleConfig");
        const data = {
            subMenuUrl : "/customer",
            limits : [20, 50, 100, 500, 1000],
            limit,
            search : req.query,
            ...result,
            config,
        };
        
        return res.render("customer/simple", data);
    });

/**
 * 추가항목 설정 
 * 
 */
router.route("/config")
    .get(async (req, res) => {
        const data = await getConfig("simpleConfig");
        data.subMenuUrl = "/customer";
        return res.render("customer/simple_config", data);
    })
    .post(async (req, res) => {
        const data = req.body;
        delete data.ipAddr;
        delete data.idManager;
        delete data.userAgent;
        await saveConfig("simpleConfig", data);

        alert("저장되었습니다.", res, "/customer/simple/config", "parent");
    });

module.exports = router;