const express = require('express');
const { managerOnly, managerAuth } = require('../../middleware/manager');
const { getYoils, getException, alert, saveConfig, getConfig, reload, dateFormat, go } = require("../../library/common");
/** 예외 S */
const CustomerConfigException = getException("Customer/CustomerConfigException");
const CustomerApplyUpdateException = getException("Customer/CustomerApplyUpdateException");
const CustomerApplyDeleteException = getException("Customer/CustomerApplyDeleteException");
const CustomerServiceRegisterException = getException("Customer/CustomerServiceRegisterException");
const CustomerServiceUpdateException = getException("Customer/CustomerServiceUpdateException");
const CustomerServiceDeleteException = getException("Customer/CustomerServiceDeleteException");
/** 예외 E */

const customerDao = require('../../models/customer/dao');
const fileDao = require('../../models/file/dao');
const orderDao = require('../../models/order/dao');
const kakaoTemplateDao = require("../../models/kakaoAlimTalk/templateDao");
const managerDao = require("../../models/manager/dao");
const boardDao = require("../../models/board/boardDao");
const menuSvc = require('../../service/menu');
const getCsAgents = require("../../service/manager/getCs");

// 상담원 상담 통계
const getCsAgentStatistics = require('../../service/customer/getCsAgentStatistics');
// 구 디자인관리자 조회
const searchOldDesignManager = require('../../service/customer/searchOldDesignManager');

const router = express.Router();

/** 파일 업로드 설정  */
const upload = fileDao.getUploads();

router.use(managerOnly, managerAuth(10), async (req, res, next) => {
    res.locals.locTitle = "상담관리";
    const subMenus = await menuSvc.getsByType("customer");
    if (subMenus) {
        res.locals.subMenus = subMenus;
    }

    res.locals.menuOn = "customer";
    res.locals.topBoards = await req.getBoards('customer');
    next();
});

/** 상담관리 */
router.route("/")
    .get(async (req, res) => {
        const search = req.query;
        let limit = req.query.limit || 20;
        const list = await customerDao.gets(req.query.page, limit, req, search);
        const total = customerDao.total;
        const pagination = customerDao.pagination;
        const categories = await customerDao.getCategories();
        const channels = await customerDao.getChannels();
        const csAgents = await getCsAgents();

       
        const data = {
            list,
            total,
            pagination,
            categories,
            channels,
            csAgents,
            search,
            limit,
            limits : [20, 50, 100, 500, 1000],
        };

        if (search.withOldDesignManager) {
            if (search.isPopup) {
                search.searchType="or";
                req.query.page = 1;
                limit = 1000;
            }
            const oldList = await searchOldDesignManager(search, req.query.page, limit);
            data.oldList = oldList;
        }

        res.render("customer/list", data);
    })
    // 상담 (목록)수정 하기 
    .patch(async (req, res) => {
        try {
            const result = await customerDao.updates(req);
            if (!result) {
                throw new CustomerServiceUpdateException("상담 수정에 실패하였습니다.");
            }

            reload(res, "parent");
        } catch (err) {
            alert(err.message, res);
        }
    })
    // 상담 (목록)삭제 하기 
    .delete(async (req, res) => {
        try {
            const ids =  req.body.id;
            if (!ids) {
                throw new CustomerServiceDeleteException("삭제할 상담을 선택하세요.");
            }

            const result = await customerDao.delete(ids);
            if (!result) {
                throw new CustomerServiceDeleteException("상담 삭제에 실패하였습니다.")
            }

            reload(res, "parent");
        } catch (err) {
            alert(err.message, res);
        }
    })
    .post(async (req, res) => {
        const mode = req.body.mode || req.query.mode;
        switch (mode) {
            case "dnXls" : // 엑셀 다운로드
                await customerDao.dnXls(req, res);
                break;
        }
    });

/** 상담 등록 */
router.route("/add")
    .get(async (req, res) => {
        const categories = await customerDao.getCategories();
        const data = {
            mode : "add",
            categories,
            addScript : ['customer/form', 'message/kakao_alimtalk'],
            gid : Date.now(),
        };
        /** 전화상담 신청건 처리 S */
        const idApply = req.query.id_apply;
        if (idApply) {
            const apply = await customerDao.getApply(idApply);
            if (apply) {
                data.customerNm = apply.customerNm;
                data.cellPhone = apply.customerCellPhone;
                const csType = (apply.csType == 'kakao')?"카카오톡 상담":"전화상담";
                const kakaoId = (apply.csType == 'kakao')?`카카오ID : ${apply.kakaoId}`:"";
                data.memo = `상담구분 : ${csType}\r\n상담희망일시 : ${apply.preferredDateTime}\r\n${kakaoId}`;
            }
        }
        /** 전화상담 신청건 처리 E */
        /** 주문상담 신청 처리 S */
        const orderNo = req.query.orderNo;
        if (orderNo) {
            data.orderNo = orderNo;

            const orderData = await orderDao.get(orderNo);
            if (orderData) {
                data.customerNm = orderData.orderNm;
                data.cellPhone = orderData.orderCellPhone;
                data.zonecode =  orderData.receiverZonecode;
                data.address = orderData.receiverAddress;
                data.addressSub = orderData.receiverAddressSub;
            }
        } 
        /** 주문상담 신청 처리 E */
        
        res.render("customer/add", data);
    })
    .post(upload.array("attachFiles"), async (req, res) => { // 상담 등록 처리 
        try {
            const result = await customerDao.add(req);
            if (!result) {
                throw new CustomerServiceRegisterException("상담 등록에 실패하였습니다.");
            }

            go("/customer", res, "parent");
        } catch (err) {
            alert(err.message, res);
        }
    });

/** 상담 수정  */
router.route("/update/:id")
    .get(async (req, res) => {
        try {
            const id = req.params.id;
            if (!id) {
                throw new CustomerServiceUpdateException("잘못된 접근입니다.");
            }
            const data = await customerDao.get(id);
            data.mode = `update/${id}`;
            data.categories = await customerDao.getCategories();
            data.addScript = ['customer/form', "fileUpload", 'message/kakao_alimtalk'];
            data.subMenuUrl = "/customer";
            res.render("customer/update", data);
        } catch (err) {
            alert(err.message, res, -1);
        }
    })
    .post(upload.array("attachFiles"), async (req, res) => { // 상담 수정 처리 
        try {
            const result = await customerDao.update(req);
            if (!result) {
                throw new CustomerServiceUpdateException("상담 수정에 실패하였습니다.");
            }

            
            go("/customer", res, "parent");
        } catch (err) {
            alert(err.message, res);
        }
    });

/** 전화상담 신청관리 */
router.route("/apply")
    .get(async (req, res) => {
        if (!req.query.sDate) {
            req.query.sDate = dateFormat(new Date(), "%Y-%m-%d");
        }
        
        const list = await customerDao.getApplies(req.query.page, 20, req);
        const pagination = customerDao.pagination;
        const channels = await customerDao.getApplyChannels();
        
        res.render("customer/apply", { list, pagination, channels, search : req.query });
    })
    // 처리상태 변경하기 
    .patch(async (req, res) => {
        try {
            const result = await customerDao.updateApplies(req);
            if (!result) {
                throw new CustomerApplyUpdateException("처리상태 변경에 실패하였습니다.");
            }

            reload(res, "parent");
        } catch (err) {
            alert(err.message, res);
        }
    })
    // 선택 상담 삭제하기 
    .delete(async (req, res) => {
        try {
            const result = await customerDao.deleteApplies(req);
            if (!result) {
                throw new CustomerApplyDeleteException("삭제에 실패하였습니다.");
            }

            reload(res, "parent");
        } catch (err) {
            alert(err.message, res);
        }
    });

/** 상담 통계 */
router.get("/stat", async (req, res) => {

    const search = req.query;
    if (!search.sDate) {
        const date = new Date();
        date.setMonth(date.getMonth() - 1);
        search.sDate = dateFormat(date, "%Y-%m-%d");
    }

    let sdate = search.sDate;
    const edate = search.eDate;
    
    const list = await getCsAgentStatistics(sdate, edate);

    const data = { list, search };
    res.render("customer/stat", data);
});

/** 상담 설정 */
router.route("/config")
    .get(async (req, res) => {
      
        const data = await getConfig("csConfig");
        data.yoils = getYoils();
        csSpan = [...Array(10).keys()];
        csSpan.shift();
        data.csSpan = csSpan;
        data.hours = [...Array(24).keys()];
        const templates = await kakaoTemplateDao.gets(1, "all");
        data.templates = templates;

        if (data.alimManagers) {
            data.alimManagers = await managerDao.getByIds(data.alimManagers);
        }

        data.alimManagers = data.alimManagers || [];

        const boards = await boardDao.gets(1, "all");
        data.boards = boards;

        data.addScript = ["customer/config"];
        res.render("customer/config", data);
    })
    .post(async (req, res) => {
        try {
            const data = req.body;
            data.availYoils = data.availYoils || [];
            if (!(data.availYoils instanceof Array)) {
                data.availYoils = [data.availYoils];
            }
            
            data.alimManagers = data.alimManagers || [];
            if (!(data.alimManagers instanceof Array)) {
                data.alimManagers = [data.alimManagers];
            }

            const result = await saveConfig("csConfig", data);
            if (!result) {
                throw new CustomerConfigException("설정 저장에 실패하였습니다.");
            }

            alert("저장되었습니다",res, "reload", "parent");
        } catch (err) {
            alert(err.message, res);
        }
    });

/** 상담가능 시간대 확인 */
router.get("/config/avail_schedule", async (req, res) => {
    const list = await customerDao.getSchedules();
    res.render("customer/avail_schedule", { list });
});


/** 상담 기록 조회 */
router.get("/search", (req, res) => {
    const data = {
        search : req.query,
    };
    
    res.render("customer/search", data);
});

/** 상담 기록 검색 결과 - 신 디자인관리자 */
router.get('/search_result', async (req, res) => {
    const list = await customerDao.gets(req.query.page, 'all', req, req.query);
    res.render("customer/search_result", { list });
});

/** 상담 기록 검색 결과 - 구 디자인관리자 */
router.get("/search_old_result", async (req, res) => {
    const search = req.query;
   
    if (!search) {
        return res.send("");
    }
    
    const list = await searchOldDesignManager(search, 1, 1000);
    res.render("customer/search_old_result", { list });
});


/** 상담내역 확인 - 신규 */
router.get("/view/:id", async (req, res) => {
    const id = req.params.id;

    const data = await customerDao.get(id);
    res.render("customer/view", data);
});


/** 상담내역 확인 - 구 디자인관리자 */
router.get("/view_old/:idx", async (req, res) => {
    const idx = req.params.idx;

    let data = await searchOldDesignManager({idx});
    res.render("customer/view_old", data);
});
module.exports = router;