const { logger } = require('../../library/common');
const oauthSvc = require('../../service/api/oauth');
const express = require('express');
require('express-async-errors');
const router = express.Router();

/** 인증 요청  */
router.use("/authorize", async (req, res, next) => {
    try {
        const codeURL = await oauthSvc.authorize(req);
        return res.redirect(codeURL);
    } catch (err) {
        return next(err);
    }
});
    
/* 접근토큰 발급/갱신/삭제 요청 */
router.use("/token", async (req, res, next) => {
    try {
        const result = await oauthSvc.token(req);
        return res.json(result);
    } catch (err) { 
        return next(err);
    }
});

/** 에러 처리 라우터  */
router.use((err, req, res, next) => {
    const data = {
        error : err.code,
        error_description : err.message,
    };
    try {
        logger(err);
        return res.status(err.status || 500).json(data);
    } catch (e) {
        logger(e);
        //return res.json(data);

    } 
});
module.exports = router;