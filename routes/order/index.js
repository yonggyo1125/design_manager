const express = require('express');
const { managerOnly, managerAuth } = require('../../middleware/manager');
const { getException, alert, confirm, reload, go, saveConfig, getConfig } = require('../../library/common');
const { getSido } = require('../../library/area');

/** 예외 S */
const OrderRegisterException = getException("Order/OrderRegisterException");
const OrderUpdateException = getException("Order/OrderUpdateException");
const OrderDeleteException = getException("Order/OrderDeleteException");
const OrderItemDeleteException = getException("Order/OrderItemDeleteException");
const OrderEstimateException = getException("Order/OrderEstimateException");

const OrderStatusNotFoundException = getException("Order/OrderStatusNotFoundException");
const OrderStatusRegisterException = getException("Order/OrderStatusRegisterException");
const OrderStatusUpdateException = getException("Order/OrderStatusUpdateException");
const OrderStatusDeleteException = getException("Order/OrderStatusDeleteException");
const OrderNotFoundException = getException("Order/OrderNotFoundException");
const OrderUpdatePaymentException = getException("Order/OrderUpdatePaymentException");
const DesignStatusRegisterException = getException("Order/DesignStatusRegisterException");
const DesignStatusUpdateException = getException("Order/DesignStatusUpdateException");
const DesignStatusDeleteException = getException("Order/DesignStatusDeleteException");
const DeliveryCompanyRegisterException = getException("Delivery/DeliveryCompanyRegisterException");
const DeliveryCompanyUpdateException = getException("Delivery/DeliveryCompanyUpdateException");
const DeliveryCompanyDeleteException = getException("Delivery/DeliveryCompanyDeleteException");
const DeliveryPolicyRegisterException = getException("Delivery/DeliveryPolicyRegisterException");
const DeliveryPolicyUpdateException = getException("Delivery/DeliveryPolicyUpdateException");
const DeliveryPolicyDeleteException = getException("Delivery/DeliveryPolicyDeleteException");
const DeliveryPolicyNotFoundException = getException("Delivery/DeliveryPolicyNotFoundException");
const DeliveryAreaPolicyRegisterException = getException("Delivery/DeliveryAreaPolicyRegisterException");
const DeliveryAreaPolicyUpdateException = getException("Delivery/DeliveryAreaPolicyUpdateException");
const DeliveryAreaPolicyDeleteException = getException("Delivery/DeliveryAreaPolicyDeleteException");
const DeliveryAreaPolicyNotFoundException = getException("Delivery/DeliveryAreaPolicyNotFoundException");
const DeliveryAreaChargeRegisterException = getException("Delivery/DeliveryAreaChargeRegisterException");
const DeliveryAreaChargeDeleteException = getException("Delivery/DeliveryAreaChargeDeleteException");
const FileUploadException = getException("File/FileUploadException");
const KakaoAlimTalkApiException = getException("KakaoAlimTalk/KakaoAlimTalkApiException");
/** 예외 E */

const orderDao = require('../../models/order/dao');
const deliveryDao = require('../../models/delivery/dao');
const deliveryAreaDao = require('../../models/delivery/deliveryAreaDao'); 
const orderStatusDao = require('../../models/order/orderStatusDao');
const designStatusDao = require('../../models/order/designStatusDao');
const fileDao = require('../../models/file/dao');
const categoryDao = require('../../models/product/categoryDao');
const kakaoAlimTalkTemplateDao = require('../../models/kakaoAlimTalk/templateDao');
const designerChangeDao = require('../../models/order/designerChangeDao');

const sendStatusMessageSvc = require('../../service/order/sendStatusMessage');
const menuSvc = require('../../service/menu');
const excelSvc = require('../../service/order/Excel');

// 디자이너 목록 조회
const getDesigners = require('../../service/manager/getDesigners');

// 상담사 목록 조회
const getCsAgents = require('../../service/manager/getCs');

// 디자이너 변경
const changeDesigner = require('../../service/order/ChangeDesigner');

// 관리자 메모 업데이트
const updateMemo = require('../../service/order/UpdateMemo');

// 주문 목록 업데이트
const orderListUpdate = require('../../service/order/OrderListUpdate');

// 사용방법안내 알림톡 전송 
const sendGuideAlim = require("../../service/order/sendGuide");

// API 연동 쇼핑몰 주문 상세 URL 조회
const getShopOrderViewUrl = require("../../service/order/getShopOrderViewUrl");

// 결제 요청 URL 전송
const sendPayUrl = require("../../service/payment/sendPayUrl");

const router = express.Router();
const upload = fileDao.getUploads();


/** 라우터 S */
const doManyRouter = require('./do_many'); // 일괄 처리
const barcodeRouter = require('./barcode'); // 바코드 생성
const deliveryReceiptRouter = require("./deliveryReceipt"); // 인수증
/** 라우터 E */

/**
 * 주문관리 
 * 
 */
router.use(managerOnly, managerAuth(10), async (req, res, next) => {
    res.locals.locTitle = "주문관리";
    const subMenus = await menuSvc.getsByType("order");
    if (subMenus) {
        res.locals.subMenus = subMenus;
    }
    res.locals.menuOn="order";
    res.locals.topBoards = await req.getBoards('order');
    next();
});

/** 주문목록 */
router.route("/")
    .get(async (req, res) => { 
        const limit = req.query.limit || 20;
        const list = await orderDao.gets(req.query.page, limit, req, req.query);
        const pagination = orderDao.pagination;
        const total = orderDao.total;
        const orderStatuses = await orderStatusDao.gets(); // 주문처리상태
        const designStatuses = await designStatusDao.gets(); // 디자인처리상태
        const designers = await getDesigners(); // 디자이너 목록
        const csAgents = await getCsAgents(); // 상담사 목록
        const deliveyPolicies = await deliveryDao.getPolicies();
        const deliveryTypes = deliveryDao.deliveryTypes;
        const itemCategories = await categoryDao.gets("sale", ["id", "cateCd", "cateNm"]);
        
        const data = {
            list,
            pagination,
            total,
            orderStatuses,
            designStatuses,
            search : req.query,
            limit,
            limits : [20, 100, 500, 1000, 2000],
            designers,
            csAgents,
            deliveyPolicies,
            itemCategories,
            deliveryTypes,
            addScript : ['order/list'],
        };

        return res.render("order/list", data);
    })
    .patch(async (req, res) => { // 주문목록 수정하기 
        try {
            await orderListUpdate(req);

            alert("변경되었습니다.", res, "reload", "parent");
        } catch (err) {
            alert(err.message, res);
        }
    })
    .delete(async (req, res) => { // 주문목록 삭제하기
        try {
            const orderNos = req.body.orderNo;
            if (!orderNos) {
                throw new OrderDeleteException("삭제할 주문을 선택하세요.");
            }

            await orderDao.delete(orderNos);
            alert("삭제되었습니다.", res, "reload", "parent");
        } catch (err) {
            alert(err.message, res);
        }
    })
    .post(async (req, res) => { 
        try {
            const mode = req.query.mode || req.body.mode;
            const type = req.query.type || req.body.type;
            switch (mode) {
                case "dnXls" : // 엑셀 다운로드
                    await excelSvc.dnXls(req, res, type);
                    break;
            }
        } catch (err) {
            alert(err.message, res, -1);
        }
    });

/** 주문등록 */
router.route("/add") 
    .get(async (req, res) => { 
        const orderNo = Date.now();
        const orderStatuses = await orderStatusDao.gets(); // 주문처리상태
        const designStatuses = await designStatusDao.gets(); // 디자인처리상태
        const deliveryCompanies = await deliveryDao.getDeliveryCompanies(); // 배송업체 목록 
        const deliveryPolicies = await deliveryDao.getPolicies(); // 배송조건

        const copyOrderNo = req.query.copy_orderNo;
        let data = {};
        if (copyOrderNo) {
            const orderInfo = await orderDao.get(copyOrderNo);
            if (orderInfo) {
                data = orderInfo;
                data.itemsJson = JSON.stringify(data.items);
            }
        }

        data.mode  =  "add";
        data.addScript = ['order/form', 'fileUpload'];
        data.orderNo = orderNo;
        data.orderStatuses = orderStatuses;
        data.designStatuses = designStatuses;
        data.deliveryCompanies = deliveryCompanies;
        data.deliveryPolicies = deliveryPolicies;
        
        return res.render("order/add", data);
    })
    .post(async (req, res) => { // 주문 등록 처리 
        try {
            const result = await orderDao.add(req);
            if (!result) {
                throw new OrderRegisterException("주문 등록에 실패하였습니다.");
            }
            const orderNo = req.body.orderNo;
            confirm("등록되었습니다, 계속 주문등록 하시겠습니까?", "parent.location.reload();", "parent.location.replace('/order/" + orderNo +"');", res);
        } catch (err) {
            console.log(err);
            alert(err.message, res);
        }
    });

/** 주문 수정 */
router.route("/update/:orderNo")
    .get(async (req, res) => {
        try {
            const orderNo = req.params.orderNo;
            const data = await orderDao.get(orderNo);
            if (!data) {
                throw new OrderNotFoundException("등록되지 않은 주문입니다.");
            }

            // 주문수정 권한 체크 
            await orderDao.checkUpdateAuth(orderNo);

            data.itemsJson = JSON.stringify(data.items);

            const orderStatuses = await orderStatusDao.gets(); // 주문처리상태
            const designStatuses = await designStatusDao.gets(); // 디자인처리상태
            const deliveryCompanies = await deliveryDao.getDeliveryCompanies(); // 배송업체 목록 
            const deliveryPolicies = await deliveryDao.getPolicies(); // 배송조건

            data.mode = "update";
            data.addScript = ['order/form', 'fileUpload'];
            data.orderStatuses = orderStatuses;
            data.designStatuses = designStatuses;
            data.deliveryCompanies = deliveryCompanies;
            data.deliveryPolicies = deliveryPolicies;
            data.subMenuUrl = "/order";
            
            return res.render("order/update", data);
        } catch (err) {
            alert(err.message, res, -1);
        } 
    })
    .post(async (req, res) => {
        try {
            // 주문수정 권한 체크 
           await orderDao.checkUpdateAuth(req.params.orderNo);

            const result = await orderDao.update(req);
            if (!result) {
                throw new OrderUpdateException("주문 수정에 실패하였습니다.");
            }
            const orderNo = req.params.orderNo;
            alert("수정되었습니다.", res, `/order/${orderNo}`, "parent");
        } catch (err) {
            alert(err.message, res);
        }
    });

router.post('/delete/items', async (req, res) => {
    const id = req.body.id;
    const isAjax = (req.body.isAjax == 1)?true:false;
    try {
        if (!id) {
            const msg = isAjax?"잘못된 접근입니다.":"삭제할 품목을 선택하세요.";
            throw new OrderItemDeleteException(msg);
        }

        const result = await orderDao.deleteItems(id);
        if (!result) {
            throw new OrderItemDeleteException("삭제에 실패하였습니다.");
        }
    
        res.json({ isSuccess : true });
    } catch (err) {
        if (isAjax) {
            res.json({ isSuccess : false, message : err.message});
        } else {
            alert(err.message, res, -1);
        }
    }
});


/** 주문설정 */
router.route("/config")
    .get(async (req, res) => {
        const type = req.query.type;
        const data  = { type };
        let list = [];
        switch (type) {
            case "deliveryCompany" :  // 배송업체 등록 
                list = await deliveryDao.getDeliveryCompanies(true);
                break;
            case "deliveryPolicy" : // 배송조건 목록
                list = await deliveryDao.getPolicies();
                break;
            case "deliveryAreaPolicy" : // 지역배송조건 목록
                list = await deliveryAreaDao.getPolicies();
                break;
            case "designStatus" : // 디자인 처리 상태 
                list = await designStatusDao.gets(true);
                const kakaoTemplates = await kakaoAlimTalkTemplateDao.gets(1, 'all');
                 data.kakaoTemplates = kakaoTemplates;
                break;
            case "doMany" : // 일괄처리 설정 
                data.orderStatuses = await orderStatusDao.gets(true); // 주문상태
                const doManyConfig = await getConfig("doMany");
                if (doManyConfig && doManyConfig.invoiceFieldKeywords) {
                    doManyConfig.invoiceFieldKeywords = doManyConfig.invoiceFieldKeywords.trim().replace(/\|\|/g, "\r\n");
                }
                data.config = doManyConfig || {};
                break;
            default : // 주문 처리 상태 
                list = await orderStatusDao.gets(true);
                data.statusTypes = orderStatusDao.statusTypes;
                data.statusOnlyTypes = orderStatusDao.getStatusTypes(true);
                data.addScript = ["order/config.orderStatus"]
                break;
        }
        
         data.list = list;
        res.render("order/config", data);
    })
    .post(async (req, res) => { // 처리상태 등록 처리 
        try {
            const mode = req.body.mode;
            let result;
            switch (mode) {
                // 배송업체 등록
                case "deliveryCompany" : 
                    result = await deliveryDao.addDeliveryCompany(req);
                    if (!result) {
                        throw new DeliveryCompanyRegisterException("배송업체 등록에 실패하였습니다.");
                    }

                    break;
                // 주문처리 상태 등록 
                case "orderStatus" : 
                    result = await orderStatusDao.add(req);
                    if (!result) {
                        throw new OrderStatusRegisterException("등록에 실패하였습니다.");
                    }

                    break;
                // 디자인처리 상태 등록 
                case "designStatus" : 
                    result = await designStatusDao.add(req);
                    if (!result) {
                        throw new DesignStatusRegisterException("등록에 실패하였습니다.");
                    }

                    break;
                case "deliveryAreaPolicy" :  // 지역별 배송조건 등록 
                    result = await deliveryAreaDao.addPolicy(req);
                    if (!result) {
                        throw new DeliveryAreaPolicyRegisterException("지역별 배송조건 등록에 실패하였습니다.");
                    }
                    break;
                case "doMany" :  // 일괄처리 
                    let invoiceFieldKeywords = req.body.invoiceFieldKeywords;
                    invoiceFieldKeywords = invoiceFieldKeywords?invoiceFieldKeywords.trim().replace(/\r\n/g, "||"):"";

                    const configData = {
                        invoiceFieldKeywords,
                        invoiceOrderStatusCd : req.body.invoiceOrderStatusCd,
                    };

                    await saveConfig("doMany", configData);
                
                    break;
            }

            reload(res, "parent");
        } catch (err) {
            alert(err.message, res);
        }
    })
    .patch(async (req, res) => { // 처리상태 수정처리 
        try {
            const mode = req.body.mode;
            let result;
            switch (mode) {
                // 배송업체 수정하기
                case "deliveryCompany" : 
                    result = await deliveryDao.updateDeliveryCompany(req);
                    if (!result) {
                        throw new DeliveryCompanyUpdateException("배송업체 수정에 실패하였습니다.");
                    }

                    break;
                /** 지역별 배송조건 수정하기 */
                case "deliveryAreaPolicy" : 
                    result = await deliveryAreaDao.updatePolicy(req);
                    if (!result) {
                        throw new DeliveryAreaPolicyUpdateException("지역별 배송정책 수정에 실패하였습니다.");
                    }
                    break;
                // 주문처리 상태 수정 
                case "orderStatus" : 
                    result = await orderStatusDao.update(req);
                    if (!result) {
                        throw new OrderStatusUpdateException("처리상태 수정에 실패하였습니다.");
                    }
                    break;
                // 디자인처리 상태 수정 
                case "designStatus" : 
                    result = await designStatusDao.update(req);
                    if (!result) {
                        throw new DesignStatusUpdateException("처리상태 수정에 실패하였습니다.");
                    }
                    break;
            }
            reload(res, "parent");
        } catch (err) {
            alert(err.message, res);
        }

    })
    .delete(async (req, res) => { // 처리상태 삭제처리 
        try {
            const mode = req.body.mode;
            const statusCd = req.body.statusCd;
            let result;
            switch (mode) {
                // 배송업체 삭제 
                case "deliveryCompany" : 
                    if (!req.body.num) {
                        throw new DeliveryCompanyDeleteException("삭제할 배송업체를 선택하세요.");
                    }
                    let nums = req.body.num;
                    if (!(nums instanceof Array)) {
                        nums = [nums];
                    }
                    const companyNms = [];
                    nums.forEach(num => {
                        if (req.body[`companyNm_${num}`]) companyNms.push(req.body[`companyNm_${num}`]);
                    });
                    
                    result = await deliveryDao.deleteDeliveryCompany(companyNms);
                    if (!result) {
                        throw new DeliveryCompanyDeleteException("배송업체 삭제에 실패하였습니다.");
                    }
                    break;
                /** 배송조건 삭제하기 */
                case "deliveryPolicy" : 
                    result = await deliveryDao.deletePolicy(req.body.id);
                    if (!result) {
                        throw new DeliveryPolicyDeleteException("배송정책 삭제에 실패하였습니다.");
                    }

                    break;
                /** 지역별 배송조건 삭제하기 */
                case "deliveryAreaPolicy" : 
                    result = await deliveryAreaDao.deletePolicy(req.body.id);
                    if (!result) {
                        throw new DeliveryAreaPolicyDeleteException("지역별 배송정책 삭제에 실패하였습니다.");
                    }

                    break;
                // 주문처리 상태 삭제
                case "orderStatus" : 
                    result = await orderStatusDao.delete(statusCd);
                    if (!result) {
                        throw new OrderStatusDeleteException("처리상태 삭제에 실패하였습니다.");
                    }
                    
                    break;
                // 디자인처리 상태 삭제
                case "designStatus" : 
                    result = await designStatusDao.delete(statusCd);
                    if (!result) {
                        throw new DesignStatusDeleteException("처리상태 삭제에 실패하였습니다.");
                    }
                    break;
            }

            reload(res, "parent");
        } catch (err) {
            alert(err.message, res);
        }
    });

/** 주문상태 상세설정 S */
router.route("/popup_config")
    .get(async (req, res) => {
        try {
            const type = req.query.type || "orderStatus";
            const statusCd = req.query.statusCd;
            if (!statusCd) {
                throw new OrderStatusNotFoundException("잘못된 접근입니다.");
            }
            const data = await orderStatusDao.get(statusCd);
            if (!data) {
                throw new OrderStatusNotFoundException();
            }
            const kakaoTemplates = await kakaoAlimTalkTemplateDao.gets(1, 'all');
            data.kakaoTemplates = kakaoTemplates;
            data.type = type;

            res.render("order/popup_config", data);
        } catch (err) {
            alert(err, res, "close", "parent");
        }
    })
    .post(async (req, res) => {
        try {
            const type = req.body.type;
            const statusCd = req.body.statusCd;
            if (!type || !statusCd) {
                throw new OrderStatusNotFoundException("잘못된 접근입니다.");
            }

            switch (type) {
                case "orderStatus" :  // 주문처리상태 설정 
                    const data = await orderStatusDao.get(statusCd);
                    if (!data) {
                        throw new OrderStatusNotFoundException();
                    }

                    const result = await orderStatusDao.updateEach(req);
                    if (!result) {
                        throw new OrderStatusUpdateException("주문처리상태 수정에 실패하였습니다.");
                    }

                    alert("저장하였습니다.", res, "reload", "parent");
                    break;
            }
        } catch (err) {
            alert(err.message, res);
        }
    });
/** 주문상태 상세설정 E */

/** 배송조건 등록 */
router.route("/config/delivery_policy")
    .get(async (req, res) => {
        const deliveryTypes = deliveryDao.deliveryTypes; // 배송방식
        const deliveryChargeTypes = deliveryDao.deliveryChargeTypes; // 배송비유형
        const deliveryAreaPolicies = await deliveryAreaDao.getPolicies(); // 지역별 배송비 정책 
        const data = {
            subMenuUrl : "/order/config",
            addScript : ['order/delivery_policy'],
            deliveryTypes,
            deliveryChargeTypes,
            deliveryAreaPolicies,
        };

        res.render("order/delivery_policy_add",data);
    })
    .post(async (req, res) => {
        try {
            const result = await deliveryDao.addPolicy(req);
            if (!result) {
                throw new DeliveryPolicyRegisterException("배송조건 등록에 실패하였습니다.");
            }

            confirm("등록되었습니다, 계속 배송조건을 등록 하시겠습니까?", "parent.location.reload();", "parent.location.replace('/order/config?type=deliveryPolicy');", res);

        } catch (err) {
            alert(err.message, res);
        }
    });
/** 배송조건 수정 */
router.route("/config/delivery_policy/:id")
    .get(async (req, res) => {
        try {
            const id = req.params.id;
            const data = await deliveryDao.getPolicy(id);
            if (!data) {
                throw new DeliveryPolicyNotFoundException("등록되지 않은 배송조건입니다.");
            }
            if (data.rangeDeliveryCharge) {
                data.rangeDeliveryChargeJson =JSON.stringify(data.rangeDeliveryCharge);
            }

            data.mode = "update";
            data.subMenuUrl = "/order/config";
            data.addScript = ['order/delivery_policy'];
            data.deliveryTypes = deliveryDao.deliveryTypes; // 배송방식
            data.deliveryChargeTypes = deliveryDao.deliveryChargeTypes; // 배송비유형
            data.deliveryAreaPolicies = await deliveryAreaDao.getPolicies(); // 지역별 배송비 정책 
            res.render("order/delivery_policy_update",data);
        } catch (err) {
            alert(err.message, res, -1);
        }
    })
    .post(async (req, res) => { // 수정하기 
        try {
            const result = await deliveryDao.updatePolicy(req);
            if (!result) {
                throw new DeliveryPolicyUpdateException("배송조건 수정에 실패하였습니다.");
            }

            go("/order/config?type=deliveryPolicy", res, "parent");
        } catch (err) {
            alert(err.message, res);
        }
    });

/** 지역별 추가배송비 관리 */
router.route("/config/delivery_area_policy/:id")
    .get(async (req, res) => {
        try {
            const id = req.params.id;
            const data = await deliveryAreaDao.getPolicy(id);
            if (!data) {
                throw new DeliveryAreaPolicyNotFoundException("등록되지 않은 지역별 배송비정책 입니다.");
            }

            data.subMenuUrl = "/order/config";
            data.addScript = ['area'];
            data.sidos = getSido();
            data.list = await deliveryAreaDao.getCharges(id);

            res.render('order/delivery_area_policy_add', data);
        } catch(err) {
            alert(err.message, res, -1);
        }
    })
    .post(async (req, res) => { // 추가배송비 등록 
        try {
            const result = await deliveryAreaDao.addCharge(req);
            if (!result) {
                throw new DeliveryAreaChargeRegisterException("지역별 추가배송비 등록에 실패하였습니다.");
            }

            reload(res, "parent");
        } catch (err) {
            alert(err.message, res);
        }
    })
    .delete(async (req, res) => { // 추가배송비 삭제
        try {
            const id = req.params.id;
            let checkes = req.body.check;
            if (!checkes) {
                throw new DeliveryAreaChargeDeleteException("삭제할 추가배송비를 선택하세요.");
            }
            
            if (!(checkes instanceof Array)) {
                checkes = [checkes];
            }

            for await (check of checkes) {
                check = check.split("_");
                await deliveryAreaDao.deleteCharge(id, check[0], check[1]);
            }

            reload(res, "parent");
        } catch (err) {
            alert(err.message, res);
        }
    });

/** 배송지 변경하기 */
router.route("/change_delivery/:orderNo")
    .get(async (req, res) => {
        const orderNo = req.params.orderNo;
        await orderDao.getDeliveryInfo(orderNo);        
        const bundleCodes = orderDao.bundleCodes;
        res.render("order/change_delivery", { orderNo, bundleCodes });
    })
    .post(async (req, res) => {
        try {
            req.body.orderNo = req.params.orderNo;
            const result = await orderDao.changeDeliveryAddress(req);
            if (!result) {
                throw new OrderUpdateException("배송지 변경에 실패하였습니다.");
            }

            res.json({ isSuccess : true });
        } catch (err) {
            res.json({ isSuccess : false, message : err.message });
        }
    });

/** 운송장 등록/관리 */
router.route('/delivery/:orderNo')
    .get(async (req, res) => {
        try {
            const orderNo = req.params.orderNo;
            const bundleCodes= await orderDao.getDeliveryInfo(orderNo);
            if (!bundleCodes) {
                throw new OrderNotFoundException("등록되지 않은 주문입니다.");
            }

            const deliveryCompanies = await deliveryDao.getDeliveryCompanies(); // 배송업체 목록 
            const deliveryPolicies = await deliveryDao.getPolicies(); // 배송조건
            const data = { 
                subMenuUrl  : "/order" ,
                orderNo,
                bundleCodes,
                deliveryCompanies,
                deliveryPolicies,
                addScript : ['order/delivery'],
            };

            res.render('order/delivery', data);
        } catch (err) {
            alert(err.message, res, -1);
        }
    })
    .post(async (req, res) => {
        try {
            req.body.orderNo = req.params.orderNo;
            const result = await orderDao.changeDeliveryAddress(req);
            if (!result) {
                throw new OrderUpdateException("배송지 변경에 실패하였습니다.");
            }

            alert("변경되었습니다.", res, "reload", "parent");
        } catch (err) {
            alert(err.message, res);
        }
    });

/** 견적서 출력 S */
router.get('/estimate/:orderNo', async (req, res) => {
    try {
        const orderNo = req.params.orderNo;
        const data = await orderDao.get(orderNo);
        if (!data) {
            throw new OrderNotFoundException("등록되지 않은 주문입니다.");
        }
        if (data.receiptType.indexOf('estimate') == -1) {
            throw new OrderEstimateException("견적서를 조회할 수 없는 주문입니다.");
        }
        const max = 19;
        let moreRows= [];
        let rowCnt = data.items.length;
        if (data.addPayments && data.addPayments.length > 0) rowCnt += data.addPayments.length;

        // 추가 옵션 출력 칸수 추가
        for (let it of data.items) {
            if (it.subOptionInfo) {
                rowCnt += it.subOptionInfo.length;
            }
        }
        
        if (data.totalDeliveryCharge && data.totalDeliveryCharge > 0) rowCnt++;
        if (max > rowCnt) {
            moreRows = [...Array(max - rowCnt).keys()];
        }
        data.moreRows = moreRows;

        res.render("order/estimate", data); 
    } catch (err) {
        alert(err.message, res, "close");
    }
});
/** 견적서 출력 E */

/** 사업자 등록증 업로드 S */
router.post("/business_cert_upload", upload.single('file'), async (req, res) => {
    try {
        if (!req.file || !req.file.idFile) {
            throw new FileUploadException("파일 업로드 실패하였습니다.");
        }

        const data = await fileDao.get(req.file.idFile);
        if (!data) {
            throw new FileUploadException("파일 업로드 실패하였습니다.");
        }

        await fileDao.updateDone(data.gid);

        res.json({ isSuccess : true, data });
    }  catch (err) {
        res.json({ isSuccess : false, message : err.message });
    }
});
/**  사업자 등록증 업로드 E */

/** 증빙자료 변경하기 */
router.route("/change_receipt_type/:orderNo")
    .get(async (req, res) => {
        try {
            const orderNo = req.params.orderNo;
            const data = await orderDao.getOrderInfo(orderNo);
            if (!data) {
                throw new OrderNotFoundException();
            }

            data.addScript = ["order/form", 'fileUpload'];
            res.render("order/change_receipt_type", data);
        } catch (err) {
            alert(err.message, res,  "close", "parent");
        }
    })
    .post(async (req, res) => {
        try {
            const result = await orderDao.updateReceiptTypeInfo(req);
            if (!result)  {
                throw new OrderUpdateException("증빙자료 변경에 실패하였습니다.");
            }

            alert("변경되었습니다.", res, "reload", "parent.parent");
        } catch (err) {
            alert(err.message, res);
        }
    });

    /**  추가 금액 등록 S */
    router.route("/add_payment/:orderNo")
        .get((req, res) => {
            try {
                const orderNo = req.params.orderNo;
                if (!orderDao.isOrderExists(orderNo)) {
                    throw new OrderNotFoundException();
                }

                const data = {
                    orderNo,
                 };
                res.render("order/add_payment", data);
            } catch (err) {
                alert(err.message, res, "close", "parent");
            }
        })
        .post(async (req, res) => {
            try {
                await orderDao.addPayment(req);

                alert("등록되었습니다.", res, "reload", "parent.parent");
            } catch (err) {
                alert(err.message, res);
            }
        });
    /**  추가 금액 등록 E */
    
    /** 추가 금액 수정 S */
    router.route("/update_payment/:id")
        .get(async (req, res) => {
            const id = req.params.id;
            const data = await orderDao.getAddPayment(id);
            if (!data) {
                throw new OrderUpdatePaymentException("등록되지 않은 추가금액입니다.");
            }
            data.mode = 'update';
            res.render("order/add_payment", data);
        })
        .post(async (req, res) => {
            try {
                await orderDao.updatePayment(req);
                alert("수정되었습니다.", res,  "reload", "parent.parent");
            } catch (err) {
                alert(err.message, res);
            }
        });
    /** 추가 금액 수정 E */

    /** 추가 금액 삭제 S */
    router.get("/delete_payment/:id", async (req, res) => {
        try {
            const id = req.params.id;
            await orderDao.deletePayment(id);
            alert("취소되었습니다.", res, "reload", "parent");
        } catch (err) {
            alert(err.message, res);
        }
    });
    /** 추가 금액 삭제 E */

    /** 결제 생성하기 S */
    router.get("/create_payment/:orderNo", async (req, res) => {
        try {
            const orderNo = req.params.orderNo;
            const data = await orderDao.get(orderNo);
            if (!data) {
                throw new OrderNotFoundException();
            }
            data.addScript = ["order/create_payment"];
            res.render("order/create_payment", data);
        } catch (err) {
            alert(err.message, res);
        }
    });
/** 결제 생성하기 E */

/** 알림톡 메세지 전송  */
router.post("/message", async (req, res) => {
    try {
        const mode = req.body.mode || req.query.mode;
        let result = "";
        switch (mode) {
             // 알림톡 주문상태 메세지 전송 
            case "orderStatusChange" : 
                const orderNo = req.body.orderNo;
                if (!orderNo) {
                    throw new OrderNotFoundException("잘못된 접근입니다.");
                }
                
                const orderInfo = await orderDao.getOrderInfo(orderNo);
                if (!orderInfo) {
                    throw new OrderNotFoundException();
                }
                
                result = await sendStatusMessageSvc.send(orderNo, orderInfo.orderStatus, true);
                if (!result) {
                    throw new KakaoAlimTalkApiException("알림톡 전송에 실패하였습니다.");
                }
                res.json({ isSuccess : true });
                break;
            // 알림톡 디자인상태 메세지 전송 
            case "designStatusChange" : 
                const id = req.body.id;
                if (!id) {
                    throw new OrderNotFoundException("잘못된 접근입니다.");
                }

                const orderItem = await orderDao.getOrderItem(id);
                if (!orderItem) {
                    throw new OrderNotFoundException("등록되지 않은 주문 품목입니다.");
                }

                result = await sendStatusMessageSvc.sendDesignStatus(id, orderItem.designStatus);
                if (!result) {
                    throw new KakaoAlimTalkApiException("알림톡 전송에 실패하였습니다.");
                }
                res.json({ isSuccess : true });
                break;
            // 알림톡 디자인 확정 메세지 전송
            case "designConfirm" : 
                const _id = req.body.id;
                if (!_id) {
                    throw new OrderNotFoundException("잘못된 접근입니다.");
                }

                const _orderItem = await orderDao.getOrderItem(_id);
                if (!_orderItem) {
                    throw new OrderNotFoundException("등록되지 않은 주문 품목입니다.");
                }

                result = await sendStatusMessageSvc.sendDesignConfirm(_id);
                if (!result) {
                    throw new KakaoAlimTalkApiException("알림톡 전송에 실패하였습니다.");
                }
                res.json({ isSuccess : true });
                break;
        }
    } catch (err) {
        res.json({ isSuccess : false, message : err.message });
    }
});

/** 디자이너 변경 */
router.all("/change_designer", async (req, res) => {
    try {
        const idDesigner = req.body.idDesigner || req.query.idDesigner;
        const idOrderItem = req.body.idOrderItem || req.query.idOrderItem;
        await changeDesigner(idOrderItem, idDesigner);

        res.json({ isSuccess : true });

    } catch (err) {
        res.json({ isSuccess : false, message : err.message});
    }
});

/** 디자이너 변경 요청 및 처리 목록 S */
router.route("/designer_changes")
    .get(async (req, res) => {
        const search = req.query;
        const list = await designerChangeDao.gets(req.query.page, req.query.limit, req, search);
        const data = {
            subMenuUrl : "/order",
            list,
            total : designerChangeDao.total,
            pagination : designerChangeDao.pagination,
            search,
        };

        res.render("order/designer_changes", data);
    })
    .post((req, res) => {

    });
/** 디자이너 변경 요청 및 처리 목록 E */

/** 디자이너 변경 요청 처리 S */
router.route("/request_change_designer/:id")
    .get(async (req, res) => {
        const id = req.params.id;
        const designers = await getDesigners();
        const data = {
            id,
            designers,
        };
    
        res.render("order/request_change_designer", data);
    })
    .post(async (req, res) => {
        try {
            const id = req.params.id;
            if (!id) {
                throw new Error("잘못된 접근입니다.");
            }
            const idDesigner = req.body.idDesigner;
            const idManager = req.body.idManager;

            if (!idDesigner) {
                throw new Error("변경할 디자이너를 선택하세요.");
            }
            
            await designerChangeDao.assign(id, idDesigner, idManager);
            reload(res, "parent");
        } catch (err) {
            alert(err.message, res);
        }
    });
/** 디자이너 변경 요청 처리 E */


/** 일괄처리 라우터  */
router.use("/do_many", doManyRouter);

/** 바코드 생성 라우터 */
router.use("/barcode", barcodeRouter);

router.use("/delivery_receipt", deliveryReceiptRouter);

/** 사용방법안내 알림톡 전송 */
router.get("/send_guide/:orderNo/:id", async (req, res) => {
    try {
        const orderNo = req.params.orderNo;
        const id = req.params.id;
    
        const result = await sendGuideAlim(orderNo, id, res.locals.host);
        if (!result) {
            throw new Error("전송에 실패하였습니다.");
        }
    } catch (err) {
        alert(err.message, res);
    }
});

/** 배송 정책 조회  */
router.get("/delivery_policy/:id", async (req, res) => {
    const id = req.params.id;
    const data = await deliveryDao.getPolicy(id);
    const list = (data && data._deliveryType) ? data._deliveryType : [];
    
    res.json(list);
});

/** 결제 요청 URL 전송 */
router.all("/sendPayUrl/:id", async (req, res) => {
    try {
        const id = req.params.id;
        const result = await sendPayUrl(id, res);
        if (!result) {
            throw new Error("결제요청 URL 전송에 실패하였습니다.");
        }

        alert("결제요청 URL이 전송되었습니다.", res);
        
    } catch (err) {
        alert(err.message, res);
    }
});


/** 주문 상세 */
router.route("/:orderNo")
.get(async (req, res) => {
    try {
        const orderNo = req.params.orderNo;
        const data = await orderDao.get(orderNo);
        if (!data) {
            throw new OrderNotFoundException("등록되지 않은 주문입니다.");
        }

        data.subMenuUrl = "/order";
        data.orderStatuses = await orderStatusDao.gets(); // 주문처리상태
        data.designStatuses = await designStatusDao.gets(); // 디자인처리상태
        data.deliveryCompanies = await deliveryDao.getDeliveryCompanies(); // 배송업체 목록 
        data.deliveryPolicies = await deliveryDao.getPolicies(); // 배송조건
        data.designers = await getDesigners();
        
        data.addScript = ["order/form", "order/view", "payment/cancel", 'jquery-3.6.1.min', 'JsBarcode.all.min'];
        
        res.render("order/view", data);
    } catch (err) {
        alert(err.message, res);
    }
})
.post(async (req, res) => {
    try {
        const mode = req.body.mode;
        let result;
        switch (mode) {
            // 주문 처리상태 변경
            case "change_order_status" :  
                result = await orderDao.changeOrderStatus(req.params.orderNo, req.body.orderStatus);
                if (!result) {
                    throw new OrderStatusUpdateException("주문처리상태 변경에 실패하였습니다.");
                }

                res.json({ isSuccess : true });
                break;
            // 디자인상태 변경
            case "change_design_status" : 
                result = await orderDao.changeDesignStatus(req.body.idOrderItem, req.body.designStatus);
                if (!result) {
                    throw new DesignStatusUpdateException("디자인상태 변경에 실패하였습니다.");
                }

                res.json({ isSuccess : true });
                break;
            /** 묶음 배송코드 변경 */
            case "change_bundle_code" : 
                result = await orderDao.changeOrderItemBundleCode(req.body.idOrderItem, req.body.bundleCode);
                if (!result) {
                    throw new OrderUpdateException("묶음배송코드 변경에 실패하였습니다.");
                }

                res.json({ isSuccess : true });
                break;
            /** 관리자 메모 변경 */
            case "change_memo" : 
                await updateMemo(req);
                
                res.json({ isSuccess : true });
                break;
            /** API 요청 쇼핑몰 주문서 URL  */
            case "get_shopOrderViewUrl" : 
                const url = await getShopOrderViewUrl(req.params.orderNo);
                
                res.json({ isSuccess : url?true:false, url });
                break;
        }

    } catch (err) {
        res.json({ isSuccess : false, message : err.message });
    }
});
module.exports = router;