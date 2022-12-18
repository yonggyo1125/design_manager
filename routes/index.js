const express = require('express');
const { go } = require("../library/common");

const getLatest = require('../service/board/getLatest'); // 메뉴별 최근 게시글

const managerRouter = require('./manager'); // 관리자 계정 
const basicRouter = require('./basic'); // 관리자 기본설정 
const associateRouter = require('./associate'); // 제휴관리 
const productRouter = require('./product'); // 품목관리 
const orderRouter = require('./order'); // 주문관리
const workRouter = require('./work'); // 작업관리
const customerRouter = require('./customer'); // 상담관리
const popupRouter = require('./popup'); // 팝업관련
const fileRouter = require('./file'); // 파일업로드 관련 
const calendarRouter = require('./calendar'); // 달력 
const ajaxRouter = require('./ajax'); // ajax 처리 라우터 
const paymentRouter = require('./payment'); // 결제 관련 라우터
const kakaoAlimTalkRouter = require('./kakao_alimtalk'); // 알림톡관리 라우터 
const searchRankRouter = require('./search_rank'); // 검색순위관리 라우터

/** API 관련 S */
const oauthRouter = require('./oauth'); // OAuth 인증
const apiV1Router = require('./api/v1'); // API Version 1

/** API 관련 E */

/** 게시판 관리 라우터 */
const boardAdminRouter = require('./board/admin');

/** 게시판 라우터 */
const boardRouter = require('./board');

/** 고객 마이페이지 라우터 */
const mypageRouter = require('./mypage');

/** 고객용 사용안내 라우터 */
const guideRouter = require('./guide');

/** 운송장 조회 라우터 */
const deliveryRouter = require("./delivery");

/** 간편주문서 라우터 */
const simpleOrderRouter = require('./simple');

const router = express.Router();


/** 메인 라우터 */
router.get("/", async (req, res) => {
    if (!req.isLogin) {
        return go("/manager/login", res);
    }
    const boards = await req.getBoards('main');
    res.locals.topBoards = boards;  

    
    /** 최신 게시글 조회 S */
    const latests = [];
    for await (const board of boards) {
        const list = await getLatest(board.id, 7);
        latests.push({
            id : board.id,
            title : board.title,
            list,
        });

    }   
    /** 최신 게시글 조회 E */
    const data = { latests };
    res.render("main/index", data);
    
});

/** 관리자계정 관리 */
router.use("/manager", managerRouter);

/** 관리자 - 설정 */
router.use("/basic", basicRouter);

/** 제휴관리 */
router.use("/associate", associateRouter);

/** 품목관리 */
router.use("/product", productRouter);

/** 주문관리 */
router.use("/order", orderRouter);

/** 작업관리 */
router.use("/work", workRouter);

/** 상담관리 */
router.use("/customer", customerRouter);

/** 팝업관련 */
router.use("/popup", popupRouter);

/** 파일업로드 관련 */
router.use("/file", fileRouter);

/** 달력 */
router.use("/calendar", calendarRouter);

/** ajax 처리 */
router.use('/ajax', ajaxRouter);

/** 결제관련 라우터 */
router.use("/payment", paymentRouter);


/** 알림톡롼련 라우터 */
router.use("/kakao_alimtalk", kakaoAlimTalkRouter);

/** 검색순위 관리 라우터 */
router.use("/search_rank", searchRankRouter);


/** API 관련 */
router.use("/oauth", oauthRouter);
router.use("/api/v1", apiV1Router);

/** 게시판 관리 */
router.use('/board/admin', boardAdminRouter);

/** 게시판 */
router.use("/board", boardRouter);

/** 고객 마이페이지 */
router.use("/mypage", mypageRouter);

/** 고객용 사용방법 안내 */
router.use("/guide", guideRouter);

/** 운송장 조회 */
router.use("/delivery", deliveryRouter);

/** 간편 주문서  */
router.use("/simple", simpleOrderRouter);

/** 테스트 관련 */
const testRouter = require('./test_func');
router.use("/test_func", testRouter);

module.exports = router;