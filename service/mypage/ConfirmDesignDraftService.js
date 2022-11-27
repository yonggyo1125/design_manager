const designDraftDao = require('../../models/order/designDraftDao');
const replyAlimTalkToClient = require("../design/replyAlimTalkToClient");

module.exports = async (req) => {
    const draftUid = req.body.draftUid;
    if (!draftUid) {
        throw new Error("draftUid 누락되었습니다.");
    }

    const designChoice = req.body.designChoice;
    if (!designChoice) {
        throw new Error("선택된 시안이 없습니다.");
    }
    const result = await designDraftDao.confirmDesignDraft(draftUid, designChoice);
    if (!result) {
        throw new Error("시안확정을 실패하였습니다.");
    }

    // 시안확정 메세지 전송
    await replyAlimTalkToClient(draftUid, "signconfirm");

};