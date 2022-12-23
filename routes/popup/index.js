const express = require('express');
require('express-async-errors');
const { alert, getException, sendPostMessage, layerClose } = require("../../library/common");
/** 얘외 S */
const SampleNotFoundException = getException("Product/SampleNotFoundException");
const CustomerApplyException = getException("Customer/CustomerApplyException");
const DesignDraftUpdateException = getException("Design/DesignDraftUpdateException");
/** 예외 E */

const sampleDao = require('../../models/product/sampleDao');
const deliveryDao = require('../../models/delivery/dao');
const customerDao = require('../../models/customer/dao');
const categoryDao = require('../../models/product/categoryDao');
const itemDao = require('../../models/product/itemDao');
const designDraftDao = require('../../models/order/designDraftDao');
const traceSvc = require('../../service/delivery/trace');

const replyAlimTalkToClient = require("../../service/design/replyAlimTalkToClient");

const router = express.Router();

/** 샘플 조회 팝업 */
router.get("/sample/:category", async (req, res) => {
    try {
        const category = req.params.category;
        if (!category) {
            throw new SampleNotFoundException("잘못된 접근입니다.");
        }
        const search = req.query;
        let cols = search.cols || [2]; // 한행에 출력할 갯수 
       
        if (!(cols instanceof Array)) cols = [cols];

        let folder = category;
        const subCategories = await sampleDao.getSubCategories(category);
        if (!search.subCategory && subCategories) search.subCategory = subCategories[0];
        if (search.subCategory) folder += "/" + search.subCategory.trim();

        const indexSub = subCategories.indexOf(search.subCategory);
        let selectedCols = (indexSub != -1)?cols[indexSub]:2;
        selectedCols = selectedCols || 2;
        /** 검색 처리 S */
        let itemCd, itemNm;
        if (search.sopt && search.skey) {
            switch (search.sopt) {
                case "itemCd": 
                    itemCd = search.skey.trim(); 
                    break;
                case "itemNm" : 
                default : 
                    itemNm = search.skey.trim();

            }
        }
        /** 검색 처리 E */
        const isPopup = req.query.isPopup?true:false;
        const list = await sampleDao.gets(folder, itemCd, itemNm);
        const data = {
            addScript : ["popup/product/sample"],
            list,
            cols,
            selectedCols,
            total : list.length,
            subCategories,
            search,
            locTitle : "샘플조회",
            isPopup,
        };

        const tpl = req.query.is_mobile?"popup/product/sample_mobile":"popup/product/sample";

        res.render(tpl, data);
    } catch (err) {
        alert(err.message, res);
    }
});


/** 출고예정일 안내 팝업 */
router.get("/delivery_guide/:cateCd", async (req, res) => { 
    try {
        const cateCd = req.params.cateCd;
        const data = await deliveryDao.getGuide(cateCd) || {};
        data.addCss = ["popup/product/delivery_guide"];
        data.addScript = ["popup/product/delivery_guide"];
        data.categories = await categoryDao.gets("sale");
        data.cateCd = cateCd;
        data.locTitle = "출고예정일 안내";
        let tpl = "popup/product/delivery_guide";
        if (req.query.isAjax) {
            tpl = "popup/product/_delivery_schedule";
        } else if (req.query.isBanner) {
            tpl = "popup/product/_delivery_banner";
        }
        
        res.render(tpl, data);
    } catch (err) {
        alert(err.message, res, -1);
    }
});

/** 전화상담신청 팝업 URL */
router.route("/customer/apply")
    .get(async (req, res) => {
        /** 선택 가능 스케줄  */
        const schedules = await customerDao.getSchedules();
        const data = {
            locTitle : "전화상담예약",
            addScript : ['popup/customer/apply'],
            schedules,
            search : req.query,
        };

        const tpl = req.query.is_mobile?"popup/customer/apply_mobile":"popup/customer/apply";
        res.render(tpl, data);
    })
    .post(async (req, res) => { 
        try {
            const result = await customerDao.applyCs(req);
            if (!result) {
                throw new CustomerApplyException("전화상담예약에 실패하였습니다.");
            }

            sendPostMessage("전화상담이 예약되었습니다", { mode : "close_popup" }, res, "parent");
        } catch (err) {
            alert(err.message, res);
        }
    });


/** 품목 선택 팝업 */
router.get("/product_items", async (req, res) => {
    req.query.cateType = 'sale';
    const list = await itemDao.gets(req.query.page, 6, req);
    const pagination = itemDao.pagination;
    const total = itemDao.total;
    const itemTypes = itemDao.itemTypes;
    const cateTypes = categoryDao.cateTypes;
    const categories = await categoryDao.gets();
    const data = {
        total,
        list,
        pagination,
        itemTypes,
        cateTypes,
        itemTypeKeys : Object.keys(itemTypes),
        cateTypeKeys : Object.keys(cateTypes),
        categories,
        search : req.query,
        addScript : ['product/popup_list'],
    };
    
    res.render("product/popup_list", data);
});


/** 시안 등록/수정 */
router.route("/draft/:uid")
    .get(async (req, res) => {
        const itemUid = req.params.uid;
        const gid = "draft_" + itemUid;
        let data = await designDraftDao.get(itemUid);
        data = data || {};
        data.itemUid = itemUid;
        data.gid = gid;
        data.addScript = ['fileUpload', 'popup/order/draft'];
        
        res.render("popup/order/draft", data);
    })
    .post(async (req, res) => {
        try {
            const result = await designDraftDao.update(req);
            if (!result) {
                throw new DesignDraftUpdateException("디자인 시안정보 저장에 실패하였습니다.");
            }

            const data = req.body;
            const draftUid = req.params.uid;
            if (data.sendDegisnerResponseAlim) { // 답변알림톡 전송
                await replyAlimTalkToClient(draftUid, "drequest1");
            }   
            
            if (data.sendCheckDraftAlim) { // 시안확인 알림톡 전송
                await replyAlimTalkToClient(draftUid, "siantask1");
            }


            alert("저장되었습니다.", res, "reload", "parent");
        } catch (err) {
            console.error(err);
            alert(err.message, res);
        }
    });

/** 배송조회 S */
router.route("/delivery_trace")
    .get(async (req, res) => {
        const companyNm = req.query.companyNm;
        const invoice = req.query.invoice;
        let url = await traceSvc.getUrl(companyNm, invoice);
        if (req.query.isAjax) {
            url = url || "";
            return res.send(url);
        }

       if  (url) {
           res.redirect(url);
       } else {
           layerClose(res, 'parent');
       }
    });
    
/** 배송조회 E */
module.exports = router;