const invoiceUploadDao = require('../../models/order/invoiceUploadDao');
/**
 * 운송장 업데이트 목록 삭제
 * 
 * @param {*} req 
 */
module.exports = async (req) => {
    const ids = req.body.id;
    if (!ids) {
        throw new Error("삭제할 항목을 선택하세요.");
    }

    await invoiceUploadDao.delete(ids);
};