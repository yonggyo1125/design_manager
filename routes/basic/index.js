const express = require('express');
const { managerOnly, managerAuth } = require('../../middleware/manager');
const { getConfig, saveConfig, alert } = require("../../library/common");
const Exception = require("../../core/exception");
const fileDao = require('../../models/file/dao');

/** 라우터 S */
const bannerRouter = require('./banner'); // 배너관리 
const holidayRouter = require('./holiday'); // 배송휴무일관리
const paymentRouter = require('./payment'); // 결제설정 
const kakaoAlimTalkRouter = require('./kakaoAlimtalk'); // 카카오 알림톡 설정
const menuRouter = require('./menu'); // 관리자 메뉴 설정 
/** 라우터 E  */

const router = express.Router();
const upload = fileDao.getUploads();
/**
 * 기본설정
 * 
 */
router.use(managerOnly, managerAuth(10), async (req, res, next) => {
    res.locals.locTitle = "기본설정";
    res.locals.menuOn = "basic";
    res.locals.subMenus = [
        { url : '/basic', title : "기본설정" },
        { url : '/basic/payment', title : "결제설정" },
        { url : "/basic/banner", title : "배너관리" },
        { url : "/basic/holiday", title : "휴무일 관리" },
        { url : "/basic/kakao_alimtalk", title : "카카오 알림톡 설정"},
        { url : "/basic/menu", title : "관리자 메뉴 설정" },
    ];

    res.locals.topBoards = await req.getBoards('basic');
    next();
});

/** 사이트 기본 설정 */
router.route("/")
    .get(async (req, res) => {
        const data = await getConfig("siteConfig");
        data.addScript = ["basic/basic"];
        res.render("basic/index", data);
    })
    .post((req, res) => {
        try {
            const result = saveConfig("siteConfig", req.body);
            if (!result) {
                throw new Exception("설정 저장에 실패하였습니다.");
            }

            alert("저장되었습니다.", res, "reload", "parent");
        } catch (err) {
            alert(err.message, res);
        }
    });

/** 법인 인감 등록  S */
router.post('/company_stamp', upload.single('image'), async (req, res) => {
    try {
        await fileDao.updateDone("company_stamp");
        const data = await fileDao.get(req.file.idFile);
        res.json({ isSuccess : true, data });
    } catch (err) {
        res.json({ isSuccess : false, message : err.message });
    }
});
/** 법인 인감 등록 E */


/** 배너 관리  */
router.use("/banner", bannerRouter);

/** 배송 휴무일 관리 */
router.use("/holiday", holidayRouter);

/** 결제설정 */
router.use("/payment", paymentRouter);

/** 카카오 알림톡 설정 */
router.use("/kakao_alimtalk", kakaoAlimTalkRouter);

/**  관리자 메뉴 설정 */
router.use('/menu', menuRouter);

module.exports = router;