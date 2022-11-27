const { alert, go } = require('../../library/common');
const { guestAuth } = require("../../middleware/mypage");
const orderCheckService = require('../../service/mypage/OrderCheckService');
const getOrders = require('../../service/order/OrdersByCellphone');
const getOrder = require("../../service/mypage/OrderViewService");
const ClientRequestUpdate = require("../../service/mypage/ClientRequestUpdateService");
const ConfirmDesignDraftService = require("../../service/mypage/ConfirmDesignDraftService");
const applyDesignerChange = require('../../service/order/ApplyDesignerChange');
const orderStatusDao = require('../../models/order/orderStatusDao');
const designStatusDao = require('../../models/order/designStatusDao');

const express = require('express');
const router = express.Router();

router.use((req, res, next) => {
    if (req.query.isPopup) {
        res.locals.isPopup = true;
    }

    next();
});

router.route("/list")
    .get(guestAuth, async (req, res) => {
        try {
            const cellPhone = req.session.guestCellPhone;
            const data = await getOrders(cellPhone, req, 4);
            if (!data) {
                throw new Error("조회된 주문이 없습니다.");
            }

            data.search = req.query;
            const tpl = req.isMobile?"list_m":"list";
            if (req.isMobile) {
                data.addCss = ["mobile/mypage"];
                data.addScript = ["mobile/mypage/common"];
            }
            res.render("mypage/" + tpl, data);
        } catch (err) {
            alert(err.message, res, "/mypage");
        }
    }); 
    


/**
 * 고객 요청 정보 업데이트
*/
router.route("/client_request")
    .post(guestAuth, async (req, res) => {
        try {
            await ClientRequestUpdate(req);
            
            res.json({ isSuccess : true });
        } catch (err) {
            const result = {
                isSuccess : false,
                message : err.message,
            };
            res.json(result);
        }
    });

/**
 * 시안 확정 안내 팝업
 * 
 */
router.route("/confirm_design/:draftUid")
    .get(guestAuth, (req, res) => {
        const uid = req.params.draftUid;
        if (!uid) {
            alert("잘못된 접근입니다.", res);
            return;
        }

        res.render("mypage/confirm_design", { uid });
    });

/**
 * 시안 확정
 * 
 */
router.route("/confirm_design_draft")
    .post(guestAuth, async (req, res) => {
        try {
            await ConfirmDesignDraftService(req);
            
            res.json({ isSuccess : true });
        } catch (err) {
            const result = {
                isSuccess : false,
                message : err.message,
            };
            res.json(result);
        }
    });  

/**
* 디자이너 변경 
*  
*/
router.route("/change_designer/:orderNo")
    .get(async (req, res) => {
        try {
            const orderNo = req.params.orderNo;
            if (!orderNo) {
                throw new Error("잘못된 접근입니다.");
            }
   
            const data = await getOrder(orderNo, req);
            if (!data.designerChangePossible) {
                throw new Error("디자이너 변경이 가능하지 않습니다.");
            }

            res.render("mypage/change_designer", data);

            
        } catch (err) {
            alert(err.message, res, -1);
        }
    })
    .post(async (req, res) => {
        try {
            await applyDesignerChange(req);

            alert("변경 신청되었습니다.", res, "reload", "parent");
        } catch (err) {
            alert(err.message, res);
        }
    });


/**
 * 고객 주문 조회 
 * 
 */
router.route("/")
    .get((req, res) => {

        res.render("mypage/index");  
    })
    .post(async (req, res) => {
        try {
            /** 
             * 휴대전화번호로 등록된 주문 체크 후 주문이 존재하는 경우 세션 처리 
             * 
             */
            await orderCheckService(req);

            go("/mypage/list", res, "parent");
        } catch (err) {
            alert(err.message, res);
        }
    });

/**
 * 주문내역
 * 
 */
 router.route("/:orderNo")
 .get(guestAuth, async (req, res) => {

    try {
        const orderNo = req.params.orderNo;
        if (!orderNo) {
            throw new Error("잘못된 접근입니다.");
        }

        const data = await getOrder(orderNo, req);
        data.orderStatuses = await orderStatusDao.gets(); // 주문처리상태
        data.designStatuses = await designStatusDao.gets(); // 디자인처리상태   
        data.addScript = ["fileUpload", "mypage/view"];
        const tpl = req.isMobile?"view_m":"view";
        if (req.isMobile) {
            data.addCss = ["mobile/mypage"];
        }

        res.render("mypage/" + tpl, data);
    } catch (err) {
        console.log(err);
        alert(err.message, res, -1);
    }
 });

module.exports = router;