const { getConfig, saveConfig, alert } = require("../../library/common");
const Exception = require("../../core/exception");
const express = require('express');
const router = express.Router();

/**
 * 카카오 알림톡 설정 
 * 
 */
router.use((req, res, next) => {
    res.locals.locTitle = "카카오 알림톡 설정";
    next();
});

/** 카카오 알림톡 설정 */
router.route("/")
    .get(async (req, res) => {
        const data = await getConfig("kakaoAlimTalkConfig");
        res.render("basic/kakao_alimtalk/index", data);
    })
    .post((req, res) => {
        try {
            const data = req.body;
            const result =  saveConfig("kakaoAlimTalkConfig",data);
            if (!result) {
                throw new Exception("설정 저장에 실패하였습니다.");
            }

            alert("저장되었습니다.", res, "reload", "parent");
        } catch (err) {
            alert(err.message, res);
        }
    });

module.exports = router;