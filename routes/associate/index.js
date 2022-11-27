const express = require('express');
const { alert, getException, reload } = require('../../library/common');
const APIKeyIssueException = getException("API/APIKeyIssueException");
const APIKeyCancelException = getException("API/APIKeyCancelException");
const keyDao = require('../../models/api/keyDao');
const router = express.Router();

const menuSvc = require('../../service/menu');

/** 
 * 제휴관리  
 * 
 */
router.use(async (req, res, next) => {
    res.locals.locTitle = "제휴관리";
    const subMenus = await menuSvc.getsByType("associate");
    if (subMenus) {
        res.locals.subMenus = subMenus;
    }

    res.locals.menuOn = "associate";
    res.locals.topBoards = await req.getBoards('associate');
    next();
});

router.route("/")
    .get((req, res) => {
        
        return res.render("associate/main");
    }) 
    .post((req, res) => {
        return res.send("");
    }); 

/**
 * 
 */
 router.route("/keys")
    .post(async (req, res) => {
        try {
            const mode = req.body.mode || req.query.mode;
            switch (mode) {
                case "cancel" : // API키 발급 취소
                    const result = await keyDao.cancel(req.body.id);
                    if (!result) {
                        throw new APIKeyCancelException("발급취소에 실패하였습니다.");
                    }

                    reload(res, "parent");
                    break;
            }
        } catch (err) {
            return alert(err.message, res);
        }
    });
/**
 * 관리자별 API 키 발급 관리 
 * 
 */
router.route("/keys/:id")
    .get(async (req, res) => {
        if (!req.params.id) {
            return alert("잘못된 접근입니다.", res, -1);
        }

        /** 발급 목록  */
        const search = {
            idManager : req.params.id,
        };
        const apikeys = await keyDao.gets(req.query.page, 20, search, req);
        const data = {
            locTitle : "API키 발급관리",
            id : req.params.id,
            apikeys,
            total : keyDao.total,
            pagination : keyDao.pagination,
        }; 

        return res.render("associate/keys", data);
    })
    .post(async (req, res) => { // API키 발급 처리 
        try {
            const result = await keyDao.issue(req.params.id, req.body.domain, req.body.redirectURL);
            if (!result) {
                throw new APIKeyIssueException("API키 발급에 실패하였습니다.");
            }

            reload(res, "parent");
        } catch (err) {
            return alert(err.message, res);
        }
    });



module.exports = router;