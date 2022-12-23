const { managerOnly, managerAuth } = require('../../middleware/manager');
const menuSvc = require('../../service/menu');
const levelDao = require('../../models/manager/levelDao');
const kakaoTemplateDao = require('../../models/kakaoAlimTalk/templateDao');
const { alert, confirm, logger, reload } = require('../../library/common');
const express = require('express');
require('express-async-errors');
const router = express.Router();

// 게시판 등록, 수정
const registerBoard = require('../../service/boardAdmin/registerBoard');
const deleteBoards = require('../../service/boardAdmin/deleteBoards');

// 스킨 등록, 수정
const saveSkin = require('../../service/boardAdmin/saveSkin');
// 스킨 목록 수정
const updateSkins = require('../../service/boardAdmin/updateSkins');
// 스킨 목록 삭제
const deleteSkins = require('../../service/boardAdmin/deleteSkins');
// 스킨 목록
const getSkins = require('../../service/boardAdmin/getSkins');
const boardDao = require('../../models/board/boardDao');

// 관리레벨
const levelSvc = require('../../service/manager/level');

// 게시판 노출 설정 저장
const saveShowConfig = require("../../service/boardAdmin/saveShowConfig");

// 게시판 진열 순서 설정
const getBoardOrderConfig = require("../../service/boardAdmin/getBoardOrderConfig");

// 게시판 진열 순서 저장
const saveBoardOrderConfig = require('../../service/boardAdmin/saveBoardOrderConfig');

// 전체 게시판 최신글 추출
const getLatestAll = require("../../service/boardAdmin/getLatestAll");

// 게시글 목록 추출
const getAdminListData = require("../../service/boardAdmin/getAdminListData");

// 게시글 삭제
const deleteBoardData = require("../../service/boardAdmin/deleteData");

const restoreBoardData = require('../../service/boardAdmin/restoreData');

// 답변글 업데이트 
const updateAnswer = require("../../service/boardAdmin/updateAnswer");

// 게시글 양식 등록
const saveTemplate = require("../../service/boardAdmin/saveTemplate");

const boardDataDao = require('../../models/board/boardDataDao');
const boardTemplateDao = require("../../models/board/boardTemplateDao");

router.use(managerOnly, managerAuth(10), async (req, res, next) => {
    res.locals.locTitle = "게시판 관리";
    res.locals.menuOn = "board";
    const subMenus = await menuSvc.getsByType("board");
    if (subMenus) {
        res.locals.subMenus = subMenus;
    }

    res.locals.topBoards = await req.getBoards('board');
    next();
});

/** 게시판 목록 */
router.route("/")
    .get(async (req, res) => {
        const limit = req.query.limit || 20;
        const search = req.query;
        const skins = await getSkins();
        const list = await boardDao.gets(req.query.page, limit, req, search);
        const data = { 
            list,
            limit,
            total : boardDao.total,
            pagination : boardDao.pagination,
            skins,
            search,
        };

        return res.render("board/admin/index", data);
    })
    .delete(async (req, res) => { // 게시판 목록 삭제하기
        try {
            
            await deleteBoards(req);
            alert("삭제되었습니다.", res, "reload", "parent");
        } catch (err) {
            logger(err);
            alert(err.message, res);
        }
    });

/** 게시판 등록 */
router.route("/add")
    .get(async (req, res) => {
        const tmplts = await kakaoTemplateDao.gets(1, "all");
        const levels = await levelDao.gets();
        const skins = await getSkins();
        const addScript = ["board/admin_form"];
        const data = { tmplts, levels, addScript, skins };
        return res.render("board/admin/add", data);
    })
    .post(async (req, res) => {
        try {
            await registerBoard(req);
            const msg = `게시판 설정 등록되었습니다. 계속해서 등록하시겠습니까?`; 
            confirm(msg, "parent.lcation.reload();", "parent.location.href='/board/admin';", res);
        } catch (err) {
            logger(err);
            alert(err.message, res);
        }
    });

/** 게시판 수정  */
router.route("/edit/:id")
    .get(async (req, res) => {
        try {
            const id = req.params.id;
            if (!id) {
                throw new Error("잘못된 접근입니다.");
            }

            const tmplts = await kakaoTemplateDao.gets(1, "all");
            const levels = await levelDao.gets();
            const addScript = ["board/admin_form"];
            const skins = await getSkins();

            let data = await boardDao.get(id);
            data = data || {};
            data.tmplts = tmplts;
            data.levels = levels;
            data.addScript = addScript;
            data.skins = skins;
            data.mode = 'edit';
            return res.render("board/admin/edit", data);

        } catch (err) {
            alert(err.messsage, res, -1);
        }
    })
    .post(async (req, res) => {
        try {
            await registerBoard(req);
            alert('게시판 설정 저장되었습니다.', res, 'reload', 'parent');
        } catch (err) {
            logger(err);
            alert(err.message, res);
        }
    });
/** 스킨관리 */
router.route("/skin")
    .get(async (req, res) => {
        const list = await getSkins();
        const data = { list };
        return res.render("board/admin/skin", data);
    })
    .post(async (req, res) => { // 등록
        try {
            await saveSkin(req);
            alert("스킨이 등록되었습니다.", res, "reload", "parent");
        } catch (err) {
            logger(err);
            alert(err.message, res);
        }
    })
    .patch(async (req, res) => { // 수정 
        try {
            await updateSkins(req);
            alert("스킨이 수정되었습니다.", res, "reload", "parent");
        } catch (err) {
            logger(err);
            alert(err.message, res);
        }
    })
    .delete(async (req, res) => { // 삭제
        try {
            await deleteSkins(req);
            alert("스킨이 삭제되었습니다.", res, "reload", "parent");
        } catch (err) {
            logger(err);
            alert(err.message, res);
        }
    });

// 게시글 목록
router.route("/list")
    .get(async (req, res) => { 
        const latests = await getLatestAll(7);
        res.render("board/admin/list", { latests });
    })
    .delete(async (req, res) => { // 삭제
        try {
            const search = req.query;
            if (search.isSoft) { // 소프트 삭제
                await deleteBoardData(req);
            } else { // 게시글 완전 삭제
                await deleteBoardData(req, true);
            }

           reload(res, "parent");
        } catch(err) {
            alert(err.message, res);
            logger(err);
        }
    });

// 게시글 복구
router.get("/restore/:id", async (req, res) => {
    try {
        const id = req.params.id;
        await restoreBoardData(id);
        reload(res, "parent");
    } catch (err) {
        alert(err.message, res);
        logger(err);
    }
});

/** 게시글 관리 */
router.route("/list/:id")
    .get(async (req, res) => {
        try {
            const search = req.query;
            const data = await getAdminListData(req);
            data.subMenuUrl = "/board/admin/list";
            data.search = search;
            data.limit = search.limit || 20;
            data.limits = [20, 50, 100, 500, 1000];
            res.render("board/admin/manage", data);
        } catch (err) {
            alert(err.message, res, -1);
        }  
    });

/** 게시글별 관리 S */
router.get("/view/:id", async (req, res) => {
        
        try {
            const id = req.params.id;
            if (!id) {
                throw new Error("잘못된 접근입니다.");
            }
            
            const data = await boardDataDao.get(id, true, true);
            if (!data) {
                throw new Error("등록되지 않은 게시글 입니다.");
            }
            const board = await boardDao.get(data.idBoard);
            data.board = board;
            data.subMenuUrl = "/board/admin/list";
            data.addScript = ["fileUpload", "ckeditor/ckeditor", "board/admin_view"];

            res.render("board/admin/view", data);
        } catch (err) {
            alert(err.message, res);
            logger(err);
        } 
    });

// 문의 답변 하기
router.post("/view", async (req, res) => {
    try {
        await updateAnswer(req);
        alert("문의답변이 저장되었습니다.", res, "/board/admin/view/" + req.body.id, "parent");
    } catch (err) {
        alert(err.message, res);
        logger(err);
    }
});
/** 게시글별 관리 E */

/** 게시글 양식 관리 */
router.route("/template")
    .get(async (req, res) => {
        const list = await boardTemplateDao.gets();
        const data = {
            subMenuUrl : "/board/admin/list",
            list,
        };

        return res.render("board/admin/template", data);
    })
    .delete(async (req, res) => { // 양식 삭제
        try {
            const ids = req.body.id;
            if (!ids) {
                throw new Error("삭제할 양식을 선택하세요.");
            }

            await boardTemplateDao.delete(ids);

            reload(res, "parent");
        } catch (err) {
            alert(err.message, res);
        }
    });

/** 게시글 양식 추가 */
router.route("/template/add")
    .get(async (req, res) => { 
        const data = {
            subMenuUrl : "/board/admin/list",
            addScript : ["ckeditor/ckeditor", "board/template"],
        };

        return res.render("board/admin/add_template", data);
    })
    .post(async (req, res) => {
        try {
            await saveTemplate(req);
            confirm("양식이 등록되었습니다. 계속해서 등록하시겠습니까?", "parent.location.reload();", "parent.location.replace('/board/admin/template');", res);
        } catch (err) {
            alert(err.message, res);
            logger(err);
        }
    });

/** 게시글 양식 수정 S */
router.get("/template/:id", async (req, res) => {
    try {
        const id = req.params.id;
        if (!id) {
            throw new Error("잘못된 접근입니다.");
        }
        
        const data = await boardTemplateDao.get(id);
        if (!data) {
            throw new Error("등록된 양싣이 아닙니다.");

        }

        data.subMenuUrl = "/board/admin/list";
        data.addScript = ["ckeditor/ckeditor", "board/template"];

        return res.render("board/admin/edit_template", data);

    } catch (err) {
        alert(err.message, res, -1);
    }
});

router.post("/template/edit", async (req, res) => {
    try {
        await saveTemplate(req);
        alert("수정되었습니다.", res, "/board/admin/template", "parent");
    } catch (err) {
        alert(err.message, res);
    }
});
/** 게시글 양식 수정 E */

// 게시판 노출 관리
router.route("/show")
    .get(async (req, res) => {
        const list = await boardDao.gets(1, "all");
        const levels = await levelSvc.gets(true);
        const showLocations = require('../../core/sideMenus');
        const data = { list, levels, showLocations };
        return res.render("board/admin/show", data);
    })
    .patch(async (req, res) => {
        try {
            await saveShowConfig(req);

            alert("설정이 저장되었습니다.", res, "reload", "parent");
        } catch (err) {
            logger(err);
            alert(err.message, res);
        }
    });

// 게시판 진열 순서 관리
router.route("/show_order")
    .get(async (req, res) => {
        const showLocations = require('../../core/sideMenus');
        const search = req.query;
        const boards = await getBoardOrderConfig(search.showLocation);

        const data = {
            subMenuUrl : "/board/admin/show",
            showLocations,
            search,
            boards,
        };
        
        return res.render("board/admin/show_order", data);
    })
    .patch(async (req, res) => {
        try {
            await saveBoardOrderConfig(req);
            alert("설정이 저장되었습니다.", res, "reload", "parent");
        } catch (err) {
            alert(err.message, res);
        }
    });

module.exports = router;