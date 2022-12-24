const { alert, confirm } = require('../../library/common');
const menuSvc = require('../../service/menu');
const levelSvc = require('../../service/manager/level');
const express = require('express');
require('express-async-errors');
const router = express.Router();

/**
 * 관리자 메뉴 설정 
 * 
 */
router.route('/')
    .get(async (req, res) => {
        const types = menuSvc.getTypes();
        const search = req.query;
        const list = await menuSvc.getParents(true, search);
        const data = { types, list, search };
        res.render('basic/menu/index', data);
    })
    .patch(async (req, res) => { // 선택 메뉴 수정 
        try {
            await menuSvc.updates(req);
            alert('수정되었습니다.', res, 'reload', 'parent');
        } catch (err) {
            alert(err.message, res);
        }
    })
    .delete(async (req, res) => { // 선택 메뉴 삭제
        try {   
            await menuSvc.deletes(req);
            alert('삭제되었습니다', res, 'reload', 'parent');
        } catch (err) {
            alert(err.message, res);
        }
    });

router.route('/add')
    .get(async (req, res) => {
        const types = menuSvc.getTypes();
        const parentMenus = await menuSvc.getParents(true);
        const parentId = req.query.parentId;
        const data = { 
            subMenuUrl  : "/basic/menu",
            types,
            parentMenus,
            parentId,
        };

        if (parentId) {
            const parent = await menuSvc.get(parentId);
            data.type = parent.type;
        }
        res.render('basic/menu/add', data);
    })
    .post(async (req, res) => {
        try {
            await menuSvc.add(req);
            
            confirm("등록되었습니다. 계속해서 등록하시겠습니까?", "parent.location.reload();", "parent.location.replace('/basic/menu');", res);
        } catch (err) {
            alert(err.message, res);
        }
    });

/** 서브 메뉴 관리 */
router.route("/sub/:id")
    .get(async (req, res) => {
        try {
            const id = req.params.id;
            const data = await menuSvc.get(id);
            data.subMenuUrl = "/basic/menu";
            data.list = await menuSvc.getSub(id, true);

            res.render("basic/menu/sub", data);
        } catch (err) {
            alert(err.message, res);
        }
    })
    .post((req, res) => {
        return res.send("");
    });

/** 메뉴 수정 */
router.route("/:id")
    .get(async (req, res) => {
        const id = req.params.id;
        const data = await menuSvc.get(id);
        data.subMenuUrl  = "/basic/menu";
        data.types = menuSvc.getTypes();
        data.parentMenus = await menuSvc.getParents(true);
        data.levels = await levelSvc.gets(true);
        res.render("basic/menu/update", data);
    })
    .post(async (req, res) => {
        try {
            await menuSvc.update(req);
            alert('수정되었습니다.', res, 'reload', 'parent');
        } catch (err) {
            alert(err.message, res);
        }
    });
module.exports = router;