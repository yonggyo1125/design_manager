const { getException, logger, getConfig } = require('../../library/common');
const ExcelJS = require('exceljs');
const { InvoiceUpload, sequelize } = require('../../models');


const FileNotFoundException = getException("File/FileNotFoundException");
const fs = require('fs').promises;
const constants = require('fs').constants;



module.exports = async (req) => {
    if (!req.file || !req.file.path) {
        throw new FileNotFoundException("파일을 업로드해 주세요.");
    }
    const filePath = req.file.path;

    const options = {
        worksheets: 'emit',
    };
    
    const list = [];
    const workbook = new ExcelJS.stream.xlsx.WorkbookReader(filePath, options);
    for await (const worksheet of workbook) {
        for await (const rows of worksheet) {
            const data = [];
            for (const row of rows._cells) {
                let v = "";
                if (row && row.value) {
                    v = row.value;
                }

                data.push(v);
          }

          list.push(data);
        }
    }
    
    // 엑셀 파일 작업 처리 완료 후 삭제
    await fs.unlink(filePath);

    /** 
     * 1. 송장, 운송장, invoice 등의 키워드가 들어간 항목이 운송장 컬럼으로 체크하고 추출
     * 2. 가장 마지막이 bundleCodeForUpdate(운송장 주문서에 반영을 위한 키값) 항목
     */
    let keywords = await getConfig("doMany", "invoiceFieldKeywords");
    //const keywords = ["송장", "운송장", "운송장번호", "invoice", "INVOICE"];
    keywords = keywords?keywords.split("||"):[];
    const headers = list[0];
    let invoiceNo = 0;
    for (let i = 0; i < headers.length; i++) {
        if (keywords.indexOf(headers[i]) != -1) {
            invoiceNo = i;
            break;
        }
    }
    
    list.shift();
    const transaction = await sequelize.transaction();
    try {
        for (const li of list) {
            const invoice = li[invoiceNo];
            const bundleCodeForUpdate = li[li.length - 1];
            if (invoice && bundleCodeForUpdate) {
                const excelData = li;
                await InvoiceUpload.create({
                    bundleCodeForUpdate,
                    invoiceNo : invoice,
                    excelData,
                    fileName : req.file.originalname,
                    idManager : req.body.idManager || req.manager.id,
                }, transaction);
            }
        }

        await transaction.commit();
    } catch (err) {
        await transaction.rollback();
        logger(err);
        throw new Error("운송장 업로드 실패");
    }
};