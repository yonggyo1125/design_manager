const { managerOnly, managerAuth } = require('../../middleware/manager');
const { getException, alert, logger } = require('../../library/common');
const express = require('express');
const multer = require('multer');
const fs = require('fs').promises;
const constants = require('fs').constants;
const router = express.Router();

// 운송장 번호 엑셀 업로드
const invoiceExcelUpload = require('../../service/order/InvoiceExcelUpload');
// 운송장 반영 처리
const invoiceUpdateDone = require('../../service/order/InvoiceUpdateDone');
// 반영된 운송장 삭제 처리
const invoiceUpdateDelete = require('../../service/order/InvoiceUpdateDelete');

const FileUploadException = getException("File/FileUploadException");

const invoiceUploadDao = require('../../models/order/invoiceUploadDao');

// 상담원 목록 
const getCsAgents = require('../../service/manager/getCs');

/** 파일 업로드용 multer 설정 S */
const upload = multer({
    storage : multer.diskStorage({
        async destination(req, file, done) {
            const dirPath = __dirname + "/../../tmp";
            try {
                await fs.access(dirPath, constants.F_OK);
            } catch (err) {
                if (err.code == 'ENOENT') {
                    await fs.mkdir(dirPath);
                } else {
                    throw new FileUploadException("파일업로드에 실패하였습니다.");
                }
            }
        
            done(null, dirPath);
        },
        filename(req, file, done) { 
           const fileName = "" + Date.now() + "_" + file.originalname;
           done(null, fileName);
        },
    }),
    limits : { fileSize : 1024 * 1024 * 500 },
});
/** 파일 업로드용 multer 설정 E */


// 일괄 처리 
router.route("/")
    .get(async (req, res) => {
        const type = req.query.type || "invoice";
        const search = req.query;
        search.limit = search.limit || 20;
        const csAgents = await getCsAgents();
        const data = { type, csAgents, search, limits : [20, 50, 100, 500, 1000], limit : search.limit };

        switch (type) {
            // 운송장 관리 
            case "invoice" : 
                data.list = await invoiceUploadDao.gets(search.page, search.limit, req, search);
                data.pagination = invoiceUploadDao.pagination;
                data.total = invoiceUploadDao.total;
                break;
        }

        return res.render("order/do_many", data);
    })
    .patch(async (req, res) => {  
        try {
            const mode = req.body.mode || req.query.mode;
            switch (mode) {
                // 운송장 주문 반영 처리 
                case "invoice" : 
                    await invoiceUpdateDone(req);
                    alert("반영되었습니다.", res, "reload", "parent");
                    break;
            }
        } catch (err) {
            logger(err);
            alert(err.message, res);
        } 
    })
    .delete(async (req, res) => {
        try {
            const mode = req.body.mode || req.query.mode;
            switch (mode) {
                // 업로드한 운송장 정보 삭제 처리
                case "invoice" : 
                    await invoiceUpdateDelete(req);
                    alert("삭제되었습니다.", res, "reload", "parent");
                    break;
            }
        } catch (err) {
            logger(err);
            alert(err.message, res);
        }
    });

router.route("/invoice")
    .get((req, res) => {
        return res.render("order/do_many_invoice_form");
    })
    .post(upload.single("file"), async (req, res) => {
        try {
            await invoiceExcelUpload(req);
            return alert("업로드 되었습니다.", res, "reload", "parent");
        } catch (err) {
            alert(err.message, res);
        }
    });
module.exports = router;