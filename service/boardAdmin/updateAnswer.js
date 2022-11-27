const { BoardData } = require("../../models");
const { validateCellPhone } = require("../../library/common");
const kakaoAlimTalkApi = require("../kakaoAlimTalk/api");
const boardDao = require("../../models/board/boardDao");
const boardDataoDao = require('../../models/board/boardDataDao');
const fileDao = require('../../models/file/dao');
/**
 * 문의 답변 수정
 * 
 */
module.exports = async (req) => {
    const data = req.body;
    const id = data.id;
    if (!id) {
        throw new Error("잘못된 접근입니다.");
    }

    const boardData = await boardDataoDao.get(id);
    if (!boardData) {
        throw new Error("등록되지 않은 게시글입니다.");
    }

    const text1 = data.text1;
    if (!text1 && text1.trim() == "") {
        throw new Error("문의 답변을 작성해 주세요.");
    }

    let mobile = data.mobile;
    if (data.sendAlimTalk) {
        if (!mobile || mobile.trim() == "") {
            throw new Error("알림톡을 전송할 휴대전화번호를 입력하세요.");
        }

        const matched = validateCellPhone(mobile);
        if (!matched) {
            throw new Error("휴대전화번호 형식이 아닙니다.");
        }

        mobile = mobile.replace(/\D/g, "");
    }


    await BoardData.update({ text1 }, { where : { id }});

   
    /** 알림톡 전송 S */
    const board = await boardDao.get(boardData.idBoard);
    if (data.sendAlimTalk && mobile && board && board.answerKakaoTmpltCode) {
        const tmpltCode = board.answerKakaoTmpltCode;
        
        await kakaoAlimTalkApi.send(tmpltCode, mobile, boardData);

    }
    /** 알림톡 전송 E */

    /** 파일 업로드 완료 처리 S */
    await fileDao.updateDone(boardData.gid + "_answer");
    /** 파일 업로드 완료 처리 E */
};  