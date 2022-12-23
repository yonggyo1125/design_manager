const { getException, logger } = require('../../../library/common'); 
const express = require('express');
require('express-async-errors');
const router = express.Router();
const orderRouter = require('./order'); // 주문관리 
const productRouter = require('./product');  // 품목관리
const customerRouter = require('./customer'); // 상담관리
const mypageRouter = require("./mypage"); // 마이페이지
const oAuthSvc = require("../../../service/api/oauth");

const NotFoundException = getException('NotFoundException');

/** API Version 1 */

/**
 * 접근 토큰 검증 
 *  - 접근 토큰이 검증되면 client_id에 해당하는 idManager 및 관리자 정보 req 객체에 유지
 *  
 */
router.use(async (req, res, next) => {
    try {
        await oAuthSvc.validateAuthorizedRequest(req);
    } catch (err) {
        return next(err);
    }
     next();
});

// 주문 관련 API
router.use("/order", orderRouter);

// 품목관련 API
router.use("/product", productRouter);

// 고객상담  API
router.use('/customer', customerRouter); 

// 마이페이지 API
router.use("/mypage", mypageRouter);

router.use((req, res, next) => {
    const error = new NotFoundException(`${req.method} /api/v2${req.url}는(은) 없는 페이지 입니다.`);
    error.code = error.status = 404;
    next(error);
});

/** 에러 처리 라우터  */
router.use((err, req, res, next) => {
    logger(err);
    const data = {
        error : err.code || 500,
        error_description : err.message,
    };
    return res.status(err.status || 500).json(data);
});

module.exports = router;