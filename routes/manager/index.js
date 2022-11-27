const express = require('express');
const dao = require('../../models/manager/dao');
const { alert, go, getException, layerClose } = require('../../library/common');
/** 예외 S */
const ManagerException = getException("Manager/ManagerException");
const ManagerLoginException = getException("Manager/ManagerLoginException");
const ManagerNotFoundException = getException("Manager/ManagerNotFoundException");
/** 예외 E */
const managerDao = require('../../models/manager/dao');
const { guestOnly, managerOnly } = require("../../middleware/manager"); // 유효성 검사 
const menuSvc = require('../../service/menu');
const levelSvc = require('../../service/manager/level');
const controlSvc = require('../../service/manager/controls');
const shareSessionCookie = require('../../service/manager/shareSessionCookie');
const shareManagerInfo = require('../../service/manager/shareManagerInfo');

const router = express.Router();

router.use(async (req, res, next) => {
    res.locals.addScript = [ "manager" ];
    res.locals.locTitle = "관리자 기능 관리";
    res.locals.menuOn = "manager";
    const subMenus = await menuSvc.getsByType("manager");
    if (subMenus) {
        res.locals.subMenus = subMenus;
    }

    res.locals.topBoards = await req.getBoards('manager');
    next();
});

/** 관리자 로그인 */
router.route("/login")
    .get(guestOnly, (req, res) => { // 로그인 양식
        const data = {
            requestURL : req.query.requestURL || "",
            locTitle : "로그인",
        };

        // 공유 세션 추가 쿠키 추가
        shareSessionCookie(req, res);

        res.render("manager/login", data);
    })
    .post(guestOnly, async (req, res) => { // 로그인 처리 
        try {
            const result = await dao.login(req);
            if (!result) {
                throw new ManagerLoginException("로그인에 실패하였습니다.");
            }
            
            // 로그인 성공 후 requestURL 데이터가 있다면 그 URL로 이동하고 없다면 메인페이지로 이동 
            const url = req.body.requestURL || "../";
            return go(url, res, "parent");
        } catch (err) {
            return alert(err.message, res);
        }
    });

/**
 * 관리자 회원가입 
 * 
 */
router.route("/join")
    .get(guestOnly, (req, res) => { // 가입 양식 
        const data = {
            mode : "join",
            locTitle : "회원가입",
        };
        res.render("manager/join", data);
    })
    .post(guestOnly, async (req, res) => { // 가입 처리 
        try {
            const result = await dao.join(req);
            if (!result) {
                throw new ManagerException("회원가입에 실패하였습니다.");
            }
            
            return go("../manager/login", res,"parent");

        } catch (err) {
           return alert(err.message, res);
        }
    });

/** 회원정보 수정 */
router.get("/info", managerOnly, (req, res) => {
    const data = {
        mode : "edit/0",
        locTitle : "회원정보수정",
    };

    return res.render("manager/info", data);
});

/** 로그아웃 처리 */
router.get("/logout", (req, res) => {
    req.session.destroy();
    go("../manager/login", res);
});

/** 관리자 회원정보 수정 */
router.route("/edit/:id")
    .get(async (req, res) => {
        try {
            const id = req.params.id;
            if (!id) {
                throw new ManagerException("잘못된 접근입니다.");
            }
            
            const managerInfo = await dao.get(Number(id));
            if (!managerInfo) {
                throw new ManagerException("존재하지 않는 관리자입니다.");
            }

            const data = {
                locTitle : "관리자 정보수정",
                mode : `edit/${id}`,
                managerInfo,
            };
            
            return res.render("manager/info", data);
        } catch (err) {
            return alert(err.message, res, -1);
        }
    })
    .post(async (req, res) => { // 관리자 정보 수정 처리 
        try {
            if (!req.isLogin) {
                throw new ManagerLoginException("로그인이 필요합니다.");
            }

            const id = Number(req.params.id) || req.manager.id;
            if (!id || isNaN(id)) {
                throw new ManagerException("잘못된 접근입니다.");
            }
            req.body.id = id;

            const result = await dao.edit(req);
            if (!result) {
                throw new ManagerException("수정에 실패하였습니다.");
            }
            
            return alert("수정되었습니다.", res, 'reload', "parent");

        } catch (err) {
            return alert(err.message, res);
        }
    });

/** 관리자 목록  */
router.route("/list")
    .get(async (req, res) => {
        const search = req.query;
        const list = await managerDao.gets(req.query.page, 20, req, search);
        const levels = await levelSvc.gets();
        const data = {
            locTitle : "관리자 목록",
            list,
            pagination : managerDao.pagination,
            total : managerDao.total,
            levels,
            search,
            addScript : ['manager/list'],
        };

        return res.render("manager/list", data);
    })
    .patch(async (req, res) => { // 선택 회원 수정하기
        try {
            await managerDao.updates(req);
            alert('수정되었습니다.', res, 'reload', 'parent');
        } catch (err) {
            alert(err.message, res);
        }
    });
/** 관리 레벨 */
router.route('/level')
    .get(async (req, res) => {
        const roles = levelSvc.getRoles();
        const list = await levelSvc.gets();
        res.render('manager/level', { list, roles });
    })
    .post(async (req, res) => {
        try {
            await levelSvc.add(req);
            alert('등록되었습니다.', res, 'reload', 'parent');
        } catch (err) {
            alert(err.message, res);
        }
    })
    .patch(async (req, res) => { // 관리레벨 수정 
        try {
            await levelSvc.updates(req);            
            alert("수정되었습니다.", res, "reload", "parent");
        } catch (err) {
            alert(err.message, res);
        }
    })
    .delete(async (req, res) => {
        try {
            await levelSvc.deletes(req);
            alert('삭제되었습니다.', res, "reload", "parent");
        } catch (err) {
            alert(err.message, res);
        }
    });

/** 탈퇴/이용제한 관리 */
router.route("/controls/:id")
    .get(async (req, res) => {
        try {
            const id = req.params.id;
            const data = await managerDao.get(id);
            if (!data) {
                throw new ManagerNotFoundException();
            }
            res.render("manager/controls", data);
        } catch (err) {
            alert(err.message, res);
        }
    })
    .post(async (req, res) => {
        try {
            await controlSvc.update(req);
            alert('처리되었습니다.', res, 'reload', 'parent.parent');
        } catch (err) {
            alert(err.message, res);
        }
    });

/** 관리자 선택 팝업 */
router.get("/popup_select/:id", async (req, res) => {
    const search = req.query;
    const list = await managerDao.gets(req.query.page, 7, req, search);
    const levels = await levelSvc.gets();
    try {
        const id = req.params.id;
        if (!id) {
            throw new Error("잘못된 접근입니다.");
        }
        
        const data = {
            locTitle : "관리자 목록",
            list,
            pagination : managerDao.pagination,
            total : managerDao.total,
            levels,
            search,
            addScript : ['manager/popup_select'],
            id,
        };
        
        return res.render("manager/popup_select", data);
    } catch (err) {
        alert(err.message, res);
        layerClose(res, "parent");
    } 
});

/** 
 * 타 사이트 연동을 위한 로그인 정보 요청 처리 
 * 
 */
router.get("/share", async (req, res) => {
    try {
        
       const data = await shareManagerInfo(req);
       res.json(data);
    } catch (err) {
        res.json({ isSuccess : false, message : err.message });
    }

});

module.exports = router;