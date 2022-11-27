const designDraftDao = require('../../models/order/designDraftDao');

/**
 * 고객 요청 사항 반영 처리
 * 
 * @param {*} req 
 * @param {*} res 
 */
module.exports = async (req) => {
    const draftUid = req.body.draftUid;
    if (!draftUid) {
        throw new Error("draftUid 누락되었습니다.");
    }

    const clientRequest = req.body.clientRequest;
    const result = await designDraftDao.updateDesignRequest(draftUid, clientRequest);
    if (!result) {
        throw new Error("요청사항 반영에 실패하였습니다.");
    }

};