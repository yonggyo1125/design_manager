const express = require('express');
require('express-async-errors');
const { alert, reload, getException, go } = require("../../library/common");

/** 예외 S */
const BannerGroupAddException = getException("Banner/BannerGroupAddException");
const BannerGroupDeleteException = getException("Banner/BannerGroupDeleteException");
const BannerRegisterException = getException("Banner/BannerRegisterException");
const BannerUpdateException = getException("Banner/BannerUpdateException");
const BannerNotFoundException = getException("Banner/BannerNotFoundException");
const BannerDeleteException = getException("Banner/BannerDeleteException");
/** 예외 E */

const bannerDao = require("../../models/banner/dao"); 
const fileDao = require('../../models/file/dao');

const router = express.Router();

/**
 * 배너 관리 
 * 
 */
router.use((req, res, next) => {
    res.locals.locTitle = "배너관리";
    res.locals.subMenuUrl = "/basic/banner";
    next();
});

/** 배너 목록  */
router.route("/")
    .get(async (req, res) => {
        const search = req.query;
        const list = await bannerDao.gets(req.query.page, 20, req);
        const pagination = bannerDao.pagination;
        const total = bannerDao.total;
        const bannerGroups = await bannerDao.getGroups();
        
        const data = {
            list,
            pagination,
            total,
            bannerGroups,
            search,
        };

        res.render("basic/banner/list", data);
    })
    /**
     * 선택배너 수정하기  
     * 
     */
    .patch(async (req, res) => {
        try {
            const result = await bannerDao.updates(req);
            if (!result) {
                throw new BannerUpdateException("배너 수정에 실패하였습니다.");
            }
            
            reload(res, "parent");
        } catch (err) {
            alert(err.message, res);
        }
    })
    /**
     * 선택배너 삭제하기 
     * 
     */
    .delete(async (req, res) => {
        try {
            const ids = req.body.id;
            const result = await bannerDao.delete(ids);
            if (!result) {
                throw new BannerDeleteException("배너 삭제에 실패하였습니다.");
            }

            reload(res, "parent");
        } catch (err) {
            alert(err.message, res);
        }
    });

/** 배너 그룹 관리 */
router.route("/group")
    .get(async (req, res) => {    
        const list = await bannerDao.getGroups(req.query);
        res.render("basic/banner/group", { list });
    })
    .delete(async (req, res) => { 
        try {
            const result = await bannerDao.deleteGroups(req.body.id);
            if (!result) {
                throw new BannerGroupDeleteException("배너그룹 삭제에 실패하였습니다.");
            }

            reload(res, "parent");
        } catch (err) {
            alert(err.message, res);
        }
    });

/** 배너그룹 등록 */
router.route("/add_group")
    .get((req, res) => {
        res.render('basic/banner/add_group')
    })
    .post(async (req, res) => { // 그룹 등록 처리 
        try {
            const result = await bannerDao.addGroup(req.body.groupNm);
            if (!result) {
                throw new BannerGroupAddException("배너그룹 등록에 실패하였습니다.");
            }

            reload(res, "parent");
        } catch (err) {
            alert(err.message, res);
        }
    });

/** 배너 등록  */
router.route("/add")
    .get(async (req, res) => { 
        const bannerGroups = await bannerDao.getGroups();

        const data = {
            mode : "add",
            bannerGroups,
            gid : Date.now(),
            addScript : ["fileUpload", "banner/form"],
        };
        res.render("basic/banner/add", data);
    })
    .post(async (req, res) => { // 등록처리 
        try {
            const banner = await bannerDao.add(req);
            if (!banner) {
                throw new BannerRegisterException("배너 등록에 실패하였습니다.");
            }
            // 배너 등록 성공시 배너 목록으로 이동
            go("/basic/banner", res, "parent");
        } catch (err) {
            alert(err.message, res);
        }
    });


/** 배너 수정 */
router.route("/update/:id")
    .get(async (req, res) => { 
        try {
            const id = req.params.id;
            const data = await bannerDao.get(id);
            if (!data) {
               throw new BannerNotFoundException("등록되지 않은 배너입니다.");
            }
            data.bannerGroups = await bannerDao.getGroups();
            data.mode = "update";
            data.addScript = ["fileUpload", "banner/form"];
            res.render("basic/banner/update", data);
        } catch (err) {
            alert(err.message, res, -1);
        }
    })
    .post(async (req, res) => { // 수정처리  
        try {
            const result = await bannerDao.update(req);
            if (!result) {
                throw new BannerUpdateException("배너 수정에 실패하였습니다.");
            }

            alert("수정하였습니다.", res, "/basic/banner", "parent");
        } catch (err) {
            alert(err.message, res);
        }
    });
module.exports = router;