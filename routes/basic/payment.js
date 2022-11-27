const { getConfig, saveConfig, alert } = require("../../library/common");
const Exception = require("../../core/exception");
const express = require('express');
const router = express.Router();

router.route("/")
    .get(async (req, res) => {
        const data = await getConfig("payConfig");
        res.render("basic/payment", data);
    })
    .post((req, res) => {
        try {
            const data = req.body;
            if (data.payMethod && !(data.payMethod instanceof Array)) {
                data.payMethod = [data.payMethod];
            }
            data.payMethod = data.payMethod || [];
            const result =  saveConfig("payConfig",data);
            if (!result) {
                throw new Exception("설정 저장에 실패하였습니다.");
            }

            alert("저장되었습니다.", res, "reload", "parent");
        } catch (err) { 
            alert(err.message, res);
        }
    });

module.exports = router;