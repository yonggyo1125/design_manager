const ExcelJS = require('exceljs');
const { getException } = require('./common');
const ExcelDownloadException = getException("ExcelDownloadException");
/**
 * 엑셀다운로드 
 * 
 */
const excel = {
   /**
    * @param {String} title - 제목
    * @param {String} fileName - 다운로드 파일명
    * @param {Obect} headers - 엑셀 헤더 부분 
    * @param {Object} bodys - 엑셀 본문 부분
    */
    async download(res, title, fileName, headers, bodies) {
        if (!res) {
            throw new ExcelDownloadException("잘못된 접근입니다.");
        }

        if (!fileName) {
            throw new ExcelDownloadException("다운로드를 실행할 파일명이 누락되었습니다.");
        }

        title = title || "Sheet1";
        if (fileName.lastIndexOf(".xlsx") == -1) {
           if (fileName.lastIndexOf(".") != -1) {
                fileName = fileName.substring(0, fileName.lastIndexOf("."));
           }
           fileName += ".xlsx";
        }
     
        res.header("Content-Description", "Excel Download");
        res.header("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
        res.header("Content-Disposition", "attachment; filename=" + encodeURIComponent(fileName));
        res.header("Expires", 0);
        res.header("Cache-Control", "must-revalidate");
        res.header("Pragma", "public");
        
        const workbook = new ExcelJS.Workbook();
        const sheet = workbook.addWorksheet(title);
        
        if (headers)  sheet.columns = headers;
           
        if (bodies && bodies.length > 0) {
            bodies.forEach(row => sheet.addRow(row));
        }
        
        const buffer = await workbook.xlsx.writeBuffer();
        res.send(buffer);
    }
};

module.exports = excel;