const boardSvc = require('../../service/product/boardSize');
const sizeConfigSvc = require('../../service/product/sizeConfig');
const { alert, confirm, reload } = require('../../library/common');

const express = require('express')
const router = express.Router();


/** 사이즈 설정  */
router.route("/size_config")
    .get(async (req, res) => {
        const list = await sizeConfigSvc.gets();
        const boardSizeNms = await boardSvc.getSizeNms();
        const boardSizeAdds = await boardSvc.getConfigs();
        const sizeDeliveries = await sizeConfigSvc.getSizeDeliveries();
        const data = {
            list,
            boardSizeNms,
            boardSizeAdds,
            sizeDeliveries,
        };
        res.render("product/size_config", data);
    })
    /** 사이즈 설정 수정  */
    .patch(async (req, res) => {
        try {
            await sizeConfigSvc.edits(req);

            alert("수정되었습니다,", res, "reload", "parent");
        } catch (err) {
            alert(err.message, res);
        }
    })
    /** 사이즈 설정 삭제  */
    .delete(async (req, res) => {
        try {
            await sizeConfigSvc.delete(req);

            alert("삭제되었습니다,", res, "reload", "parent");
        } catch (err) {
            alert(err.message, res);
        }
    });

/** 사이즈 설정 등록  */
router.route("/size_config/add")
    .get(async (req, res) => {
        const boardSizeNms = await boardSvc.getSizeNms();
        const boardSizeAdds = await boardSvc.getConfigs();
        const sizeDeliveries = await sizeConfigSvc.getSizeDeliveries()
        const data = {
            subMenuUrl : '/product/size_config',
            boardSizeNms,
            boardSizeAdds, 
            sizeDeliveries,
        };
        res.render("product/size_config_add", data);
    })
    .post(async (req, res) => {
        try {
            await sizeConfigSvc.add(req);
            confirm("등록되었습니다. 계속 등록하시겠습니까?", "parent.location.reload();", "parent.location.replace('/product/size_config');", res);
        } catch (err) {
            alert(err.message, res);
        }
    });

/** 사이즈별 추가 배송비 */
router.route("/size_config/delivery")
    .get(async (req, res) => {
        const list = await sizeConfigSvc.getSizeDeliveries();
        const data = {
            subMenuUrl : '/product/size_config',
            list,
        };
        res.render("product/size_config_delivery", data);
    })
    .patch(async (req, res) => {
        try {
            await sizeConfigSvc.editSizeDelivery(req);
            alert("수정되었습니다.", res, "reload", "parent");
        } catch (err) {
            alert(err.message, res);
        }
    })
    .delete(async (req, res) => {
        try {
            await sizeConfigSvc.deleteSizeDelivery(req);
            alert("삭제되었습니다.", res, "reload", "parent");
        } catch (err) {
            alert(err.message, res);
        }
    });

/** 사이즈별 추가 배송비 등록  */
router.route("/size_config/delivery/add")
    .get((req, res) => {
        const data = {
            subMenuUrl : '/product/size_config',
        };
        res.render("product/size_config_delivery_add", data);
    })
    .post(async (req, res) => {
        try {
            await sizeConfigSvc.addSizeDelivery(req);
            confirm("등록되었습니다. 계속 등록하시겠습니까?", "parent.location.reload();", "parent.location.replace('/product/size_config/delivery');", res);
        } catch (err) {
           alert(err.message, res);
        }
    });


/** 사이즈 설정 수정  */
router.route("/size_config/:id")
    .get(async (req, res) => {
        try {
            const id = req.params.id;
            const data = await sizeConfigSvc.get(id);
            data.boardSizeNms = await boardSvc.getSizeNms();
            data.boardSizeAdds = await boardSvc.getConfigs();
            data.sizeDeliveries = await sizeConfigSvc.getSizeDeliveries();
            data.subMenuUrl =  '/product/size_config';
            
            res.render("product/size_config_edit", data);
        } catch (err) {
            alert(err.message, res, -1);
        }
    })
    .patch(async (req, res) => {
        try {
            await sizeConfigSvc.edit(req);
            alert("수정되었습니다.", res, "/product/size_config", "parent");
        } catch (err) {
            alert(err.message, res);
        }
    });

/** 보드형 사이즈 관리 */
router.route("/board_size")
    .get(async (req, res) => {
        const list = await boardSvc.gets(req.query.sizeNm, req.query.direction);
        const sizeNms = await boardSvc.getSizeNms();

        const data = {
            subMenuUrl : '/product/size_config',
            list,
            sizeNms,
            search : req.query || {},
        };
        res.render("product/board_size", data);
    })
    /** 보드형 사이즈 수정  */
    .patch(async (req, res) => {
        try {
            await boardSvc.edit(req);
            reload(res, "parent");
        }  catch (err) {
            alert(err.message, res);
        }
    })
    /** 보드형 사이즈 삭제  */
    .delete(async (req, res) => {
        try {
            await boardSvc.delete(req);
            reload(res, "parent");
        } catch (err) {
            alert(err.message, res);
        }
    });

/** 보드형 사이즈 등록 */
router.route("/board_size/add")
    .get((req, res) => {
        const data = {
            subMenuUrl : '/product/size_config',
        };
        res.render("product/board_size_add", data);
    })
    .post(async (req, res) => {
        try {
            await boardSvc.add(req);
            confirm("등록되었습니다. 계속 등록하시겠습니까?", "parent.location.reload();", "parent.location.replace('/product/board_size');", res);
        } catch (err) {
            alert(err.message, res);
        }
    });

/** 보드형 사이즈 추가 설정  */
router.route("/board_size_config")
    .get(async (req, res) => {
        const list = await boardSvc.getConfigs();
        const data = {
            subMenuUrl : '/product/size_config',
            list,
        };
        res.render("product/board_size_config", data);
    })
    /** 추가 설정 수정 */
    .patch(async (req, res) => {
        try {
            await boardSvc.editConfig(req);
            alert("수정되었습니다.", res, "reload", "parent");
        } catch (err) {
            alert(err.message, res);
        }
    })
    /** 추가 설정 삭제  */
    .delete(async (req, res) => {
        try {   
            await boardSvc.deleteConfig(req);
            alert("삭제되었습니다.", res, "reload", "parent");
        } catch (err) {
            alert(err.message, res);
        }
    });

/** 보드형 사이즈 추가 설정 등록 */
router.route("/board_size_config/add")
    .get(async (req, res) => {
        const data = {
            subMenuUrl : '/product/size_config',
        };
        res.render("product/board_size_config_add", data);
    })
    .post(async (req, res) => {
        try {
            await boardSvc.addConfig(req);
            confirm("등록되었습니다. 계속 등록하시겠습니까?", "parent.location.reload();", "parent.location.replace('/product/board_size_config');", res);
        } catch (err) {
            alert(err.message, res);
        }
    });

module.exports = router;