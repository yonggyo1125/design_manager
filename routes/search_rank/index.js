const searchRankJobSvc = require('../../service/searchRankJob');
const searchRankStatSvc = require('../../service/searchRankJob/statistic');
const { alert, getLocalDate } = require('../../library/common');
const express = require('express');
require('express-async-errors');
const router = express.Router();

const menuSvc = require('../../service/menu');
const logDao = require("../../models/searchRankJob/logDao");
/**
 * 검색순위 관리 
 * 
 */
router.use("/", async (req, res, next) => {
    res.locals.locTitle = "검색순위관리";
    const subMenus = await menuSvc.getsByType("search_rank");
    if (subMenus) {
        res.locals.subMenus = subMenus;
    }
    res.locals.menuOn = "search_rank";
    res.locals.topBoards = await req.getBoards('search_rank');
    next();
});

router.route('/')
    .get(async (req, res) => {
        const data = await searchRankJobSvc.gets(req.query.page, 20, req);
        res.render("search_rank/job", data);
    })
    .post(async (req, res) => {
        try {
            await searchRankJobSvc.add(req);

            alert("등록되었습니다,", res, "reload", "parent");
        } catch (err) {
            alert(err.message, res);
        }
    })
    .patch(async (req, res) => {
        try {
            await searchRankJobSvc.updates(req);
            alert("수정되었습니다", res, "reload", "parent");
        } catch (err) {
            alert(err.message, res);
        }
    })
    .delete(async (req, res) => {
        try {
            await searchRankJobSvc.deletes(req);
            alert("삭제되었습니다.", res, "reload", "parent");
        } catch (err) {
            alert(err.message, res);
        }
    });


router.get("/stat", async (req, res) => {
    const data = await searchRankStatSvc.gets(req.query.page, 20, req, req.query);
    data.search = req.query;
    res.render("search_rank/stat", data);
});

router.route("/v2")
    .get(async (req, res) => {
        const data = await searchRankJobSvc.getsV2(req.query.page, 20, req);
        res.render("search_rank/job_v2", data);
    })
    .post(async (req, res) => {
        try {
            await searchRankJobSvc.addV2(req);

            alert("등록되었습니다,", res, "reload", "parent");
        } catch (err) {
            alert(err.message, res);
        }
    })
    .patch(async (req, res) => {
        try {
            await searchRankJobSvc.updatesV2(req);
            alert("수정되었습니다", res, "reload", "parent");
        } catch (err) {
            alert(err.message, res);
        }
    })
    .delete(async (req, res) => {
        try {
            await searchRankJobSvc.deletesV2(req);
            alert("삭제되었습니다.", res, "reload", "parent");
        } catch (err) {
            alert(err.message, res);
        }
    });

router.get("/log", async (req, res) => {
    const search = req.query;
    if (!search.createdSdate && !search.createdEdate) {
        search.createdSdate = getLocalDate(new Date(), "%Y-%m-%d");
    }

    const list = await logDao.gets(req.query.page, 30, req);

    const data = {
        search,
        list,
        total : logDao.total,
        pagination : logDao.pagination,
    };
    
    return res.render("search_rank/log", data);

});

module.exports = router;