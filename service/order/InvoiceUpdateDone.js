const invoiceUploadDao = require('../../models/order/invoiceUploadDao');

/**
 * 운송장 반영 처리 
 * 
 * @param {*} req 
 */
module.exports = async (req) => {
    const ids = req.body.id;
    if (!ids) {
        throw new Error("처리할 업로드건을 선택하세요.");
    }

    await invoiceUploadDao.updateDone(ids);

};