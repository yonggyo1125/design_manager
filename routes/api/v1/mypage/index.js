const express = require('express');
const { json } = require('sequelize');
const router = express.Router();
const generateUrlAccessToken = require("../../../../service/utils/generateUrlAccessToken");

/**
 * 주문상세 보기 임시 접속 URL 발급
 * 
 */
router.post("/:orderNo", async (req, res) => {
    const orderNo = req.params.orderNo;
    const url = "/mypage/" + orderNo;
    const token = await generateUrlAccessToken(url, 60 * 10);
    const accessUrl = res.locals.host + "/mypage/" + orderNo + "?token=" + token;

    res.json({ accessUrl });
});

module.exports = router;