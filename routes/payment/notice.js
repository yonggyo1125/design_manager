const noticeSvc = require('../../service/payment/notice');
const express = require('express');
require('express-async-errors');
const router = express.Router();


/** 가상계좌 입금통보 */
router.get('/vbank', async (req, res) => {
    await noticeSvc.confirmVbank(req);
    res.send("end");
});

module.exports = router;