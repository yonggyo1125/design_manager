const { alert, logger, getConfig } = require('../../library/common');
const express = require('express');
const router = express.Router();

const reservationDao = require("../../models/kakaoAlimTalk/reservationDao");
const templateSvc = require('../../service/kakaoAlimTalk/template');
const apiSvc = require('../../service/kakaoAlimTalk/api');
const menuSvc = require('../../service/menu');
const saveCommonCode = require("../../service/kakaoAlimTalk/saveCommonCode");


/** 전송예약관리 라우터 */
const reservationRouter = require('./reservation');

/**  공통  */
router.use(async (req, res, next) => {
    res.locals.locTitle = "알림톡관리";
    const subMenus = await menuSvc.getsByType("kakao_alimtalk");
    if (subMenus) {
        res.locals.subMenus = subMenus;
    }

    res.locals.menuOn = "kakao_alimtalk";
    res.locals.topBoards = await req.getBoards('kakao_alimtalk');
    next();
});

/** 전송목록 */
router.route('/')
    .get(async (req, res) => {
        await apiSvc.updateSendResults();
        const search = req.query;
        const data = await apiSvc.getHistories(req.query.page, req.query.limit, req, search);
        data.search = search;
        res.render("kakao_alimtalk/list", data);
    });

 /** 템플릿 관리 */   
 router.route("/template")
    .get(async (req, res) => {
        const data = await templateSvc.gets(req.query.page, 20, req, req.query);
        data.search = req.query;
        data.addScript = ["message/kakao_alimtalk"];
        res.render("kakao_alimtalk/template", data);
    })
    .delete(async (req, res) => { // 템플릿 삭제
        try {
            await templateSvc.delete(req);
            alert("템플릿이 삭제되었습니다.", res, "reload");
        } catch (err) {
            alert(err.message, res);
        }
    });

/** 템플릿 등록  */
router.route("/template/add")
    .get(async (req, res) => {
        const reservations = await reservationDao.gets(1, "all");
        const data = {
            subMenuUrl : "/kakao_alimtalk/template",
            reservations,
            addScript : ['kakao_alimtalk/template_form'],
        };
        res.render("kakao_alimtalk/add", data);
    })
    .post(async (req, res) => {
        try {
            await templateSvc.add(req);
            alert("등록되었습니다.", res, "/kakao_alimtalk/template", "parent");
        } catch (err) {
            alert(err.message, res);
        }
    });

/** 템플릿 수정 */
router.route("/template/update/:tmpltCode")
    .get(async (req, res) => {
        try {
            const tmpltCode = req.params.tmpltCode;
            const data = await templateSvc.get(tmpltCode);
            data.subMenuUrl = "/kakao_alimtalk/template";
            data.mode = 'update';

            const reservations = await reservationDao.gets(1, "all");
            data.reservations = reservations;
            data.addScript = ['kakao_alimtalk/template_form'];
            res.render("kakao_alimtalk/update", data);
        } catch (err) {
            alert(err.message, res);
        }
    })
    .post(async (req, res) => {
        try {
            await templateSvc.update(req);
            alert("수정되었습니다.", res, "/kakao_alimtalk/template", "parent");
        } catch (err) {
            alert(err.message, res);
        }
    });

/** 알림톡 전송 팝업  */
router.route("/send_popup")
    .get(async (req, res) => {
        try {
            const tmpltCode = req.query.tmpltCode;
            const data = await templateSvc.get(tmpltCode);
            data.addScript = ["message/kakao_alimtalk"];
            data.cellPhone = req.query.cellPhone || "";
            data.name = req.query.name || "";

            const commonReplaceCodeData = await getConfig("kakaoAlimTalkCommonCode");      
            const replaced = {};
            if (commonReplaceCodeData && commonReplaceCodeData.length > 0) {
                for (const item of commonReplaceCodeData) {
                    replaced[item.code] = item.replace;
                }
            }

            data.replaced = replaced;

            res.render("kakao_alimtalk/send", data);
        } catch (err) {
            alert(err.message, res);
        }
    })
    .post(async (req, res) => { // 알림톡 전송 
        try {
            await apiSvc.sendForm(req);
            alert("전송되었습니다.", res, "reload", "parent");
        } catch (err) {
            alert(err.message, res);
        }
    });

/** 알림톡 전송 템플릿 선택  */
router.route("/message")
    .get(async (req, res) => {
        const data = req.query;
        const list = await templateSvc.gets(req.query.page, 'all', req);
        data.list = list.list;
        res.render("kakao_alimtalk/message", data);
    });

/**  공통 치환코드 관리 */
router.route("/common_code")
    .get(async (req, res) => {
        const list = await getConfig("kakaoAlimTalkCommonCode");
        const data = {
            addScript : ["kakao_alimtalk/common_code"],
            list,
        };
        res.render("kakao_alimtalk/common_code", data);
    })
    .post(async (req, res) => {
        try {
            const data = req.body;
            await saveCommonCode(data);
            alert("저장되었습니다.", res, "reload", "parent");
        } catch (err) {
            alert(err.message, res);
            logger(err);
        }
    });

/** 전송 예약관리 */
router.use("/reservation", reservationRouter);
module.exports = router;