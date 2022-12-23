const express = require('express');
require('express-async-errors');
const { managerOnly, managerAuth } = require('../../middleware/manager');
const menuSvc = require('../../service/menu');
const orderDao = require('../../models/order/dao');
const deliveryDao = require('../../models/delivery/dao');
const categoryDao = require('../../models/product/categoryDao');
const statusChangeService = require('../../service/work/statusChangeService'); // 작업 상태 변경
const updateInfoService = require('../../service/work/updateInfoService');
const getDesigners = require('../../service/manager/getDesigners');
const getCs = require('../../service/manager/getCs');
const router = express.Router();
/**
 * 작업관리 
 * 
 */
router.use(managerOnly, managerAuth(10), async (req, res, next) => {
    res.locals.locTitle = "작업관리";
    const subMenus = await menuSvc.getsByType("work");
    if (subMenus) {
        res.locals.subMenus = subMenus;
    }

    res.locals.menuOn="work";
    res.locals.topBoards = await req.getBoards('work');
    next();
});

router.route("/")
    .get(async (req, res) => {
        const search = req.query;
        search.isWorkingList = true; // 작업목록인 경우 작업 목록 노출 단계 체크
        const list = await orderDao.gets(req.query.page, 20, req, search);
        const pagination = orderDao.pagination;
        const total = orderDao.total;
        const designers = await getDesigners(); // 디자이너 목록
        const csAgents = await getCs(); // CS 목록 
        
        const deliveyPolicies = await deliveryDao.getPolicies();
        const deliveryTypes = deliveryDao.deliveryTypes;
        const itemCategories = await categoryDao.gets("sale", ["id", "cateCd", "cateNm"]);

        const data  = {
            list,
            pagination,
            total,
            deliveyPolicies,
            deliveryTypes,
            itemCategories,
            designers,
            csAgents,
            search,
            addScript : ["order/work", "fileUpload" ], 
        };
        
        return res.render("work/list", data);
    })
    .post(async (req, res) => {
        const data = req.body;
        const mode = data.mode;
        try {
            let isSuccess = false;
            switch (mode) {
                /** 작업자 진행상황 변경 */
                case "status_change" : 
                    await statusChangeService(data.idOrderItem, data.workStatus);
                    isSuccess = true;
                    break;
                /** 작업 파일, 작업자 전달사항 업데이트  */
                case "update_info" : 
                    await updateInfoService(data);
                    isSuccess = true;
                    break;
            }
            res.json({isSuccess});
        } catch (err) {
            console.log(err);
            res.json({isSuccess : false, message : err.message});
        }
    });

router.route("/scan")
    .get(async (req, res) => {
        let data = { addScript : ["order/scan"] };
        const orderNo = req.query.orderNo;
        if (orderNo) {
            const order = await orderDao.get(orderNo);
            if (order) data.order = order;
            data.orderNo = orderNo;
            
        }

        return res.render("work/scan", data);
    });
module.exports = router;