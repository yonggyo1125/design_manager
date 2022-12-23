const express = require('express');
require('express-async-errors');
const { alert, reload, confirm, getException, go, logger } = require('../../library/common');
/** 예외 S */
const CompanyRegisterException = getException("Product/CompanyRegisterException");
const CompanyUpdateException = getException("Product/CompanyUpdateException");
const CompanyDeleteException = getException("Product/CompanyDeleteException");
const CompanySearchException = getException("Product/CompanySearchException");
const CategoryRegisterException = getException("Product/CategoryRegisterException");
const CategoryUpdateException = getException("Product/CategoryUpdateException");
const CategoryDeleteException = getException("Product/CategoryDeleteException");
const ItemRegisterException = getException("Product/ItemRegisterException");
const ItemUpdateException = getException("Product/ItemUpdateException");
const ItemDeleteException = getException("Product/ItemDeleteException");
const ItemNotFoundException = getException("Product/ItemNotFoundException");
const ItemStockRegisterException = getException("Product/ItemStockRegisterException");
const ItemStockDeleteException = getException("Product/ItemStockDeleteException");
const CategoryNotFoundException = getException("Product/CategoryNotFoundException");
const DeliveryGuideUpdateException = getException("Delivery/DeliveryGuideUpdateException");

const OptionRegisterException = getException("Product/OptionRegisterException");
const OptionUpdateException = getException("Product/OptionUpdateException");
const OptionDeleteException = getException("Product/OptionDeleteException");
const OptionNotFoundException = getException("Product/OptionNotFoundException");
/** 예외 E */

const companyDao = require('../../models/product/companyDao');
const categoryDao = require('../../models/product/categoryDao');
const itemDao = require('../../models/product/itemDao');
const itemStockDao = require('../../models/product/itemStockDao');
const { managerOnly, managerAuth } = require('../../middleware/manager');
const sampleDao = require('../../models/product/sampleDao'); // 샘플상품관련
const deliveryDao = require('../../models/delivery/dao'); // 배송관련
const bannerDao = require('../../models/banner/dao'); // 배너관련
const optionDao = require('../../models/product/optionDao'); // 옵션관련
const menuSvc = require('../../service/menu');
const sizeConfigSvc = require('../../service/product/sizeConfig'); // 사이즈 계산기 설정
const guideDao = require('../../models/product/guideDao'); // 사용방법안내 

const router = express.Router();


/** 라우터 */
const sizeConfigRouter = require('./sizeConfig');  // 사이즈 설정
const guideRouter = require('./guide'); // 사용안내관리


/**
 * 품목관리 
 * 
 */
router.use(managerOnly, managerAuth(10), async (req, res, next) => {
    res.locals.locTitle = "품목관리";
    const subMenus = await menuSvc.getsByType("product");
    if (subMenus) {
        res.locals.subMenus = subMenus;
    }

    res.locals.menuOn="product";
    res.locals.topBoards = await req.getBoards('product');
    next();
});

/** 사이즈 설정 관리  */
router.use(sizeConfigRouter);

/** 품목 리스트 */
router.route("/") 
    .get(async (req, res) => { // 품목 리스트 
        const limit = req.query.limit || 20;
        const list = await itemDao.gets(req.query.page, limit, req);
        const pagination = itemDao.pagination;
        const total = itemDao.total;
        const itemTypes = itemDao.itemTypes;
        const cateTypes = categoryDao.cateTypes;
        const categories = await categoryDao.gets();
        const sizeConfigs = await sizeConfigSvc.gets(); // 사이즈 계산기 설정
        const data = {
            limit,
            total,
            list,
            pagination,
            itemTypes,
            cateTypes,
            itemTypeKeys : Object.keys(itemTypes),
            cateTypeKeys : Object.keys(cateTypes),
            categories,
            sizeConfigs,
            search : req.query,
            addScript : ['product/option_config'],
            limits : [20, 100, 500, 1000, 2000],
        };
        return res.render("product/list", data);
    })
    .post(async (req, res) => { 
        try {
            const mode = req.query.mode || req.body.mode;
            switch (mode) {
                case "dnXls" : // 엑셀 다운로드 
                    await itemDao.dnXls(req, res);
                    break;
            }
        } catch (err) {
            alert(err.message, res, -1);
        }
    })
    .patch(async (req, res) => { // 품목 수정 
        try {
            const result = await itemDao.updates(req);
            if (!result) {
                throw new ItemUpdateException("품목 수정에 실패하였습니다.");
            }

            reload(res, "parent");
        } catch (err) {
            alert(err.message, res);
        }
    })
    .delete(async (req, res) => { // 품목 삭제 
        try {
            const ids = req.body.id || req.query.id;
            const result = await itemDao.delete(ids);
            if (!result) {
                throw new ItemDeleteException("품목삭제에 실패하였습니다.");
            }
            reload(res, "parent");
        } catch (err) {
            alert(err.message, res, -1);
        }
    });

/** 품목 재고 관리 */
router.route("/stock/:id")
    .get(async (req, res) => {
        try {
            const id = req.params.id;
            const item = await itemDao.get(id);
            if (!item) {
                throw new ItemNotFoundException("등록되지 않은 품목입니다.");
            }
            const list = await itemStockDao.gets(id,req.query.page, 20, req);
            const pagination = itemStockDao.pagination;
            const total = itemStockDao.total;
            const data = {
                item,
                id,
                list,
                pagination,
                total,
            };
            
            return res.render("product/stock", data);
        } catch (err) {
            alert(err.message, res, -1);
        }
    })
    .post(async (req, res) => { // 재고 등록 
        try {
            const data = req.body;
            const idProductItem = req.params.id || data.id;
            let amount = data.amount;
            const memo = data.memo;
            if (!idProductItem) {
                throw new ItemStockRegisterException("잘못된 접근입니다.");
            }
            if (!amount) {
                throw new ItemStockRegisterException("재고량을 입력하세요.");
            }

            if (data.type == 'deduct') amount *= -1;

            const result = await itemStockDao.add(idProductItem, amount, memo);
            if (!result) {
                throw new ItemStockRegisterException("재고등록에 실패하였습니다.");
            }

            reload(res, "parent");
        } catch (err) {
            alert(err.message, res, -1);
        }
    })
    .delete(async (req, res) => { // 재고등록 취소 
        try {
            const ids = req.body.id || req.query.id;
            const result = await itemStockDao.delete(ids);
            if (!result) {
                throw new ItemStockDeleteException("재고등록 취소에 실패하였습니다.");
            }

            reload(res, "parent");
        } catch (err) {
            alert(err.message, res, -1);
        }
    });

/** 품목 등록 */
router.route("/add")
    .get(async (req, res) => { 
        const categories = await categoryDao.gets(); // 품목분류
        const companies = await companyDao.gets(1, "all"); // 거래처
        const cateTypes = categoryDao.cateTypes;
        const sizeConfigs = await sizeConfigSvc.gets(); // 사이즈 계산기 설정
        const data = {
            mode : "add",
            categories,
            companies,
            cateTypes,
            sizeConfigs,
            addScript : ['product/option_config'],
        };
        return res.render("product/add", data);
    })
    .post(async (req, res) => { // 품목 등록 
        try {
            /** 품목 등록  */
            const result = await itemDao.add(req);
            if (!result) {
                throw new ItemRegisterException("품목등록에 실패하였습니다.");
            }

            confirm("계속 등록하시겠습니까?", "parent.location.reload()", "parent.location.replace('../product')", res);
            
        } catch (err) {
            alert(err.message, res);
        }
    });

/** 품목 분류관리 */
router.route("/category")
    .get(async (req, res) => {
        const guides = await guideDao.gets(1, "all");
        const list = await categoryDao.gets();
        const sizeConfigs = await sizeConfigSvc.gets(); // 사이즈 계산기 설정
        return res.render("product/category", { list, sizeConfigs, guides });
    })
    .post(async (req, res) => { // 분류 등록 
        try {
           const result = await categoryDao.add(req);
           if (!result) {
               throw new CategoryRegisterException("분류 등록에 실패하였습니다.");
           }

           reload(res, "parent");
        } catch (err) {
            alert(err.message, res);
        }
    })
    .patch(async (req, res) => { // 분류 수정 
        try {
            const result = await categoryDao.update(req);
            if (!result) {
                throw new CategoryUpdateException("분류 수정에 실패하였습니다.");
            }

            reload(res, "parent");
        } catch (err) {
            alert(err.message, res);
        }
    })
    .delete(async (req, res) => { // 분류 삭제 
        try {
            const result = await categoryDao.delete(req.body.id);
            if (!result) {
                throw new CategoryDeleteException("분류 삭제에 실패하였습니다.");
            }

            reload(res, "parent");
        } catch (err) {
            alert(err.message, res);
        }
    });

/** 거래처 관리 */
router.route("/company")
    .get(async (req, res) => {
        const list = await companyDao.gets(req.query.page, 20, req);
        const total = companyDao.total;
        const pagination = companyDao.pagination;

        return res.render("product/company", { list, total, pagination });
    })
    .post(async (req, res) => {
        try {
            const mode = req.body.mode || req.query.mode;
            let result;
            switch (mode) {
                /** 거래처 등록  */
                case "add" :         
                    result = await companyDao.add(req);
                    if (!result) {
                        throw new CompanyRegisterException("거래처 등록에 실패하였습니다.");
                    }
                    
                    reload(res, "parent");
                    break;
                /** 거래처 삭제  */
                case "delete" : 
                    result = await companyDao.delete(req.body.id);
                    if (!result) {
                        throw new CompanyDeleteException("거래처 삭제에 실패하였습니다.");
                    }

                    reload(res,"parent");
                    break;
            }
        } catch (err) {
            alert(err.message, res);
        }
    });

/** 거래처 확인/수정하기 S */
router.route("/company/:id")
    .get(async (req, res) => { // 수정 양식 
        try {
            const company = await companyDao.get(req.params.id);
            if (!company) {
                throw new CompanySearchException("등록되지 않은 거래처 입니다.");
            }
    
            return res.render("product/_company_form", { company })
    
        } catch (err) {
            alert(err.message, res, -1);
        }

    })
    .post(async (req, res) => { // 수정 처리 
        try {
            const result = await companyDao.update(req);
            if (!result) {
                throw new CompanyUpdateException("수정에 실패하였습니다.");
            }

            reload(res, "parent");
        } catch (err) {
            alert(err.message, res);
        }
    });
/** 거래처 확인/수정하기 E */

/** 샘플상품관리  */
router.route("/sample")
    .get(async (req, res) => {
        let list = [];
        let folder;
        if (req.query.category) folder = req.query.category.trim();
        if (req.query.subCategory) folder += "/" + req.query.subCategory.trim();

        if (folder) {
            list = await sampleDao.gets(folder, req.query.itemCd, req.query.itemNm);
        }
        
        const categories = await sampleDao.getCategories(); // 1차 분류
        let subCategories;
        if (req.query.category) {
            subCategories = await sampleDao.getSubCategories(req.query.category);
        }

        const data = { 
                        list, 
                        search : req.query, 
                        categories,
                        subCategories,
                        addScript : ["product/sample"],
                    };
        return res.render("product/sample", data);
    });

/** 샘플 이미지+ai 다운로드 */
router.get("/sample/download", async (req, res) => {
    try {
        const { category, subCategory, itemCd, filename, type } = req.query;
        await sampleDao.download(res, category, subCategory, itemCd, filename, type);

    } catch (err) {
        alert(err.message, res, -1);
    }
});

/** 샘플 팝업 URL 설정하기 */   
router.get("/sample/:category", async (req, res) => {
    const category = req.params.category;
    const subCategories = await sampleDao.getSubCategories(category);
    res.render("product/sample_url", { subCategories, category });
});

/** 출고예정일 설정하기 */
router.route("/delivery_guide/:cateCd")
    .get(async (req, res) => {
        try {
            const cateCd = req.params.cateCd;
            const data = await categoryDao.get(cateCd);
            if (!data) {
                throw new CategoryNotFoundException("등록되지 않은 품목분류 입니다.");
            }
            
            const items = await itemDao.getsByCateCd(cateCd);
            data.items = items;
            data.hours = [...Array(13).keys()]
            data.hours.shift();

            data.hours2 = [...Array(24).keys()]
  
            data.bannerGroups = await bannerDao.getGroups();
            data.subMenuUrl = "/product/category";
            res.render("product/delivery_guide", data);
        } catch (err) {
            alert(err.message, res, -1);
        }
    })
    .post(async (req, res) => {
        try {
            const result = await deliveryDao.updateDeliveryGuide(req);
            if (!result) {
                throw new DeliveryGuideUpdateException("설정저장에 실패하였습니다.");
            }

            alert("저장되었습니다.", res, "reload", "parent");
        } catch (err) {
            alert(err.message, res);
        }
    });

/** 기본 옵션관리 */
router.route('/options')
    .get(async (req, res) => {
        const limit = req.query.limit || 20;
        const list = await optionDao.getBasics(req.query.page, limit, req, true);
        const total = optionDao.total;
        const pagination = optionDao.pagination;
        const data = {
            list, total, pagination, limit, 
            limits : [20, 100, 500, 1000, 2000],
        };

        res.render('product/options', data);
    })
    .patch(async (req, res) => { // 기본 옵션 목록 수정
        try {
            const result = await optionDao.updateBasics(req);
            if (!result) {
                throw new OptionUpdateException("기본옵션 수정에 실패하였습니다.");
            }

            reload(res, "parent");
        } catch (err) {
            alert(err.message, res);
        }
    })
    .delete(async (req, res) => { // 기본 옵션 목록 삭제
        try {
            const result = await optionDao.deleteBasics(req.body.id);
            if (!result) {
                throw new OptionDeleteException("기본옵션 삭제에 실패하였습니다.");
            }

            reload(res, "parent");
        } catch (err) {
            alert(err.message, res);
        }
    });
    
/** 기본 옵션 등록 S */
router.route('/options/add')
    .get((req, res) => {
        const data = {
            subMenuUrl : "/product/options",
            mode : "add",
            addScript : ['product/options'],
        };
        res.render("product/add_options", data);
    })
    .post(async (req, res) => {
        try {
            const result = await optionDao.addBasic(req)
            if (!result) {
                throw new OptionRegisterException("기본옵션 등록에 실패하였습니다.");
            }

            return go('/product/options', res, "parent");
        } catch (err) {
            alert(err.message, res);
        }
    });
/** 기본 옵션 등록 E */

/** 기본 옵션 수정 S */
router.route("/options/:id")
    .get(async (req, res) => {
        try {
            const id = req.params.id;
            const data = await optionDao.getBasic(id, true);
            if (!data) {
                throw new OptionNotFoundException("등록되지 않은 옵션입니다.");
            }

            data.mode = id;
            data.addScript = ['product/options'];
            data.subMenuUrl = "/product/options";
            data.optionsJson = JSON.stringify(data.options);
            res.render('product/update_options.html', data);
        } catch (err) {
            alert(err.message, res, -1);
        }
    })
    .post(async (req, res) => {
        try {
            const result = await optionDao.updateBasic(req);
            if (!result) {
                throw new OptionUpdateException("기본옵션 수정에 실패하였습니다.");
            }
            
            alert("수정되었습니다.", res, "reload", "parent");
        } catch (err) {
            alert(err.message, res);
        }
    });
/** 기본 옵션 수정 E */

/** 기본 옵션 삭제 S */
router.get("/options/delete_item/:optionCd", async (req, res) => {
    try {
        const optionCd = req.params.optionCd;
        const result = await optionDao.deleteOptionBasicItem(optionCd);
        if (!result) {
            throw new OptionDeleteException("기본옵션항목 삭제 실패하였습니다.");
        }

        res.json({ isSuccess : true });
    } catch (err) {
        res.json({ isSuccess : false, message : err.message });
    }
});
/** 기본 옵션 삭제 E */


/** 추가옵션 관리 S */
router.route('/sub_options')
    .get(async (req, res) => {
        const limit = req.query.limit || 20;
        const list = await optionDao.getSubs(req.query.page, limit, req, true);
        const total = optionDao.total;
        const pagination = optionDao.pagination;
        const data = {
            list, total, pagination, limit, 
            subMenuUrl : "/product/options",
            limits : [20, 100, 500, 1000, 2000],
        };

        res.render('product/sub_options', data);
    })
    .patch(async (req, res) => { // 추가 옵션 목록 수정
        try {
            const result = await optionDao.updateSubs(req);
            if (!result) {
                throw new OptionUpdateException("추가옵션 수정에 실패하였습니다.");
            }

            reload(res, "parent");
        } catch (err) {
            alert(err.message, res);
        }
    })
    .delete(async (req, res) => { // 추가 옵션 목록 삭제
        try {
            const result = await optionDao.deleteSubs(req.body.id);
            if (!result) {
                throw new OptionDeleteException("추가옵션 삭제에 실패하였습니다.");
            }

            reload(res, "parent");
        } catch (err) {
            alert(err.message, res);
        }
    });
/** 추가옵션 관리 E */

/** 추가 옵션 삭제 S */
router.get("/sub_options/delete_item/:optionCd", async (req, res) => {
    try {
        const optionCd = req.params.optionCd;
        const result = await optionDao.deleteOptionSubItem(optionCd);
        if (!result) {
            throw new OptionDeleteException("추가옵션항목 삭제 실패하였습니다.");
        }

        res.json({ isSuccess : true });
    } catch (err) {
        res.json({ isSuccess : false, message : err.message });
    }
});
/** 추가 옵션 삭제 E */

/** 추가옵션 등록 S */
router.route('/sub_options/add')
    .get((req, res) => {
        const data = {
            subMenuUrl : "/product/options",
            mode : "add",
            addScript : ['product/options'],
        };
        res.render("product/add_sub_options", data);
    })
    .post(async (req, res) => {
        try {
            const result = await optionDao.addSub(req);
            if (!result) {
                throw new OptionRegisterException("추가옵션 등록에 실패하였습니다.");
            }

            return go('/product/sub_options', res, "parent");
        } catch (err) {
            console.log(err);
            alert(err.message, res);
        }
    });
/** 추가옵션 등록 E */

/** 추가옵션 수정 S */
router.route("/sub_options/:id")
    .get(async (req, res) => {
        try {
            const id = req.params.id;
            const data = await optionDao.getSub(id, true);
            if (!data) {
                throw new OptionNotFoundException("등록되지 않은 옵션입니다.");
            }

            data.mode = id;
            data.addScript = ['product/options'];
            data.subMenuUrl = "/product/options";
            data.optionsJson = JSON.stringify(data.options);
            res.render('product/update_sub_options', data);
        } catch (err) {
            alert(err.message, res, -1);
        }
    })
    .post(async (req, res) => {
        try {
            const result = await optionDao.updateSub(req);
            if (!result) {
                throw new OptionUpdateException("추가옵션 수정에 실패하였습니다.");
            }
            
            alert("수정되었습니다.", res, "reload", "parent");
        } catch (err) {
            alert(err.message, res);
        }
    });
/** 추가옵션 수정 E */

/** 텍스트 옵션 관리 S */
router.route("/text_options")
    .get(async (req, res) => {
        const limit = req.query.limit || 20;
        const list = await optionDao.getTexts(req.query.page, limit, req, true);
        const total = optionDao.total;
        const pagination = optionDao.pagination;
        const data = {
            list, total, pagination, limit, 
            subMenuUrl : "/product/options",
            limits : [20, 100, 500, 1000, 2000],

        };  
        res.render("product/text_options", data);
    })
    .patch(async (req, res) => { // 텍스트 옵션 목록 수정
        try {
            const result = await optionDao.updateTexts(req);
            if (!result) {
                throw new OptionUpdateException("텍스트옵션 수정에 실패하였습니다.");
            }

            reload(res, "parent");
        } catch (err) {
            alert(err.message, res);
        }
    })
    .delete(async (req, res) => { // 텍스트 옵션 목록 삭제
        try {
            const result = await optionDao.deleteTexts(req.body.id);
            if (!result) {
                throw new OptionDeleteException("텍스트옵션 삭제에 실패하였습니다.");
            }

            reload(res, "parent");
        } catch (err) {
            alert(err.message, res);
        }
    });
/** 텍스트 옵션 관리 E */

/** 텍스트 옵션 삭제 S */
router.get("/text_options/delete_item/:optionCd", async (req, res) => {
    try {
        const optionCd = req.params.optionCd;
        const result = await optionDao.deleteOptionTextItem(optionCd);
        if (!result) {
            throw new OptionDeleteException("텍스트옵션항목 삭제 실패하였습니다.");
        }

        res.json({ isSuccess : true });
    } catch (err) {
        res.json({ isSuccess : false, message : err.message });
    }
});
/** 텍스트 옵션 삭제 E */

/** 텍스트 옵션 추가 S */
router.route("/text_options/add")
    .get((req, res) => {
        const data = {
            subMenuUrl : "/product/options",
            mode : "add",
            addScript : ["product/options"],
        };
        res.render("product/add_text_options", data);
    })
    .post(async (req, res) => {
        try {
            const result = await optionDao.addText(req);
            if (!result) {
                throw new OptionRegisterException("텍스트옵션 등록에 실패하였습니다.");
            }

            return go('/product/text_options', res, "parent");
        } catch (err) {
            console.log(err);
            alert(err.message, res);
        }
    });
/** 텍스트 옵션 추가 E */

/** 텍스트옵션 수정 S */
router.route("/text_options/:id")
    .get(async (req, res) => {
        try {
            const id = req.params.id;
            const data = await optionDao.getText(id, true);
            if (!data) {
                throw new OptionNotFoundException("등록되지 않은 옵션입니다.");
            }

            data.mode = id;
            data.addScript = ['product/options'];
            data.subMenuUrl = "/product/options";
            data.optionsJson = JSON.stringify(data.options);
            res.render('product/update_text_options', data);
        } catch (err) {
            alert(err.message, res, -1);
        }
    })
    .post(async (req, res) => {
        try {
            const result = await optionDao.updateText(req);
            if (!result) {
                throw new OptionUpdateException("텍스트옵션 수정에 실패하였습니다.");
            }
            
            alert("수정되었습니다.", res, "reload", "parent");
        } catch (err) {
            alert(err.message, res);
        }
    });
/** 텍스트옵션 수정 E */


/** 품목별 옵션 설정 S */
router.route('/option_config')
    .get(async (req, res) => {
        const id = req.query.id; 
        const options = await optionDao.getBasics(1, 'all', req, true);
        const subOptions = await optionDao.getSubs(1, 'all', req, true);
        const textOptions = await optionDao.getTexts(1, 'all', req, true);
        const data = {
            options, subOptions, textOptions,
        };
        let idOptions = [], idSubOptions = [], idTextOptions = [];
        if (id) {
            data.id = id;
            const item = await itemDao.get(id, true);
            if (item) {
                idOptions = item.idOptions;
                idSubOptions = item.idSubOptions;
                idTextOptions = item.idTextOptions;
            }
        }
        data.idOptions = idOptions;
        data.idSubOptions = idSubOptions;
        data.idTextOptions = idTextOptions;
        res.render('product/option_config', data);
    })
    .post(async (req, res) => {
        try {
            const result = await itemDao.updateOptions(req);
            if (!result) {
                throw new OptionUpdateException("옵션설정에 실패하였습니다.");
            }
            
            res.json({ isSuccess : true });
        } catch (err) {
            res.json({ isSuccess : false, message : err.message });
        }
    });
/** 품목별 옵션 설정 E */

/** 사용안내관리 S */
router.use("/guide", guideRouter);
/** 사용안내관리 E */

/** 품목 수정 S */
router.route("/:id")
    .get(async (req, res) => {
        try {
            const id = req.params.id;
            const item = await itemDao.get(id);
            if (!item) {
                throw new ItemNotFoundException("등록되지 않은 품목입니다.");
            }

            const categories = await categoryDao.gets(); // 품목분류
            const companies = await companyDao.gets(1, "all"); // 거래처 
            const cateTypes = categoryDao.cateTypes;
            const sizeConfigs = await sizeConfigSvc.gets(); // 사이즈 계산기 설정

            const deliveryPolicies = await deliveryDao.getPolicies(); // 배송조건 목록
            const data = {
                mode: id,
                categories,
                companies,
                cateTypes,
                sizeConfigs,
                deliveryPolicies,
                item,
                subMenuUrl : "/product",
                addScript : ['product/option_config'],
            };
        return res.render("product/update", data);
        } catch (err) {
            alert(err.message, res, -1);
        }
    })
    .post(async (req, res) => { // 품목 수정 처리 
        try {
            const result = await itemDao.update(req);
            if (!result) {
                throw new ItemUpdateException("품목수정에 실패하였습니다.");
            }

            alert("수정되었습니다.", res, "/product", "parent");
        } catch (err) {
            alert(err.message, res);
        }
    });
/** 품목 수정 E */

module.exports = router;