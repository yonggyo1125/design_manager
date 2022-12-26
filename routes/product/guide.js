const express = require('express');
require('express-async-errors');
const router = express.Router();
const { uid, alert, confirm, logger, reload } = require('../../library/common'); 
const guideDao = require('../../models/product/guideDao');
const saveGuide = require("../../service/product/saveGuide"); // 사용안내 저장
const deleteGuide = require("../../service/product/deleteGuide"); // 사용안내 삭제
const menuSvc = require('../../service/menu');

/**
 * 사용안내관리 목록 
 * 
 */
router.route("/")
    .get(async (req, res) => {
        const search = req.query;
        const list = await guideDao.gets(search.page, search.limit, req, search);
        const subMenus = await menuSvc.getsByType("customer");
        if (subMenus) {
            res.locals.subMenus = subMenus;
        }
    
        res.locals.menuOn="customer";
        res.locals.topBoards = await req.getBoards('customer');
        const data = { 
            list, 
            pagination :  guideDao.pagination,
            total : guideDao.total,
            search,
        };

        res.render("product/guide/index", data);
    })
    .delete(async (req, res) => {
        try {
            await deleteGuide(req.body.id);
            reload(res, "parent");
        } catch (err) {
            alert(err.message, res);
        }
    });

/**
 * 사용안내 등록
 * 
 */
router.route("/add")
    .get((req, res) => {
        const data = {
            subMenuUrl : "/product/guide",
            addScript : ["ckeditor/ckeditor", "fileUpload", "guide/form"],
            gid : uid(),
        };
        res.render("product/guide/add", data);
    })  
    .post(async (req, res) => {
        try {

            await saveGuide(req);

            confirm("사용방법이 등록되었습니다. 계속 등록하시겠습니까?", "parent.location.reload();", "parent.location.replace('/product/guide');", res);
        } catch (err) {
            alert(err.message, res);
            logger(err);
        }
    });
/** 사용 안내 수정 S */
router.get("/edit/:id", async (req, res) => {
    const id = req.params.id;
    const data = await guideDao.get(id);

    data.subMenuUrl = "/product/guide";
    data.addScript = ["ckeditor/ckeditor", "fileUpload", "guide/form"];
    
    res.render("product/guide/edit", data);
});

router.post("/edit", async (req, res) => {
    try {

        await saveGuide(req);

        alert("수정되었습니다.", res, "/product/guide", "parent");
    } catch (err) {
        alert(err.message, res);
        logger(err);
    }
});
/** 사용 안내 수정 E */ 

module.exports = router;