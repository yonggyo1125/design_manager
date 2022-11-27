const boardDataDao = require('../../models/board/boardDataDao');
const kakaoAlimTalkApiSvc = require("../../service/kakaoAlimTalk/api");
const processWebHook = require("../../service/utils/processWebHook");

/**
 * 게시글 작성
 * 
 * @param {*} req 
 */
module.exports = async (req) => {
    const data = req.body;
    const mode = data.mode;
    const board = req.board;

    /** 필수 항목 체크 S */
    const required = {
        poster : "작성자를 입력하세요.",
        subject : "게시글 제목을 입력하세요.",
        content : "게시글 본문을 입력하세요",
    };

    // 로그인하지 않은 경우 비회원 비밀번호 필수 항목
    if (!req.isLogin) {
        required.guestPw = "게시글 수정을 위한 비밀번호를 입력하세요.";
    }

    /** 게시글 수정일 경우 게시글 번호(id) 필수, 등록일 경우 gid, 게시판 아이디(idBoard) 필수 */
    if (mode == 'update') { // 게시글 수정 
        required.id = "잘못된 접근입니다.";
    } else { // 게시글 수정 
        required.gid = "잘못된 접근입니다.";
        required.idBoard = "잘못된 접근입니다.";
    }

    for(const key in required) {
        if (!data[key] || data[key].trim() == "") {
            throw new Error(required[key]);
        }
    }
    /** 필수 항목 체크 E */
   
    const boardData = await boardDataDao.save(data);
    if (!boardData) {
        throw new Error("게시글 작성에 실패하였습니다.");
    }
    
    let mobile = boardData.mobile;
    if (mobile) mobile = mobile.replace(/\\D/g, "");

    /** 변경 데이터 가공 */
    const replaceCodeData = {
        boardTitle : board.title,
        idBoard : board.id,
        poster : boardData.poster,
        subject : boardData.subject,
        content : boardData.content,
        createdAt : boardData.createdAt,
    };
    


    /** 답글 알림톡 전송 처리 S */
    if (!boardData.isSentReplyKakaoAlimTalk && board.useReplyMessage && board.replyKakaoTmpltCode && data.idParent && mobile) {
        const tmpltCode = board.replyKakaoTmpltCode;
        await kakaoAlimTalkApiSvc.send(tmpltCode, mobile, replaceCodeData);
        // 전송 후 완료 처리 
        await boardDataDao.doneSendAlimTalk("reply", boardData.id);
    }
    /** 답글 알림톡 전송 처리 E */

    /** 관리자 알림톡 전송 처리 S */
    if (!boardData.isSentAdminKakaoAlimTalk && board.useAdminMessage && board.adminKakaoTmpltCode && ((board.alimTalkManagers && board.alimTalkManagers.length > 0 ) || board.alimTalkMobiles)) {
        const tmpltCode = board.adminKakaoTmpltCode;
        if (board.alimTalkManagers && board.alimTalkManagers.length > 0) { // 알림톡 수신 관리자 전송
            for (const item of board.alimTalkManagers) {
                const mobile = item.mobile;
                if (!mobile) continue;
                await kakaoAlimTalkApiSvc.send(tmpltCode, mobile, replaceCodeData);
            }
        }

        if (board.alimTalkMobilesArr) {
            for (const mobile of board.alimTalkMobilesArr) {
                if (!mobile) continue;
                await kakaoAlimTalkApiSvc.send(tmpltCode, mobile, replaceCodeData);
            }
        }
        // 전송 후 완료 처리 
        await boardDataDao.doneSendAlimTalk("admin", boardData.id);

    }
    /** 관리자 알림톡 전송 처리 E */

    /** 게시글 웹훅 처리 S */
    if (board.webhookUrlsArr) {
      
        const sendData = await boardDataDao.get(boardData.id);
        for(const url of board.webhookUrlsArr) {
            await processWebHook(url, sendData);
        }
    }
    /** 게시글 웹훅 처리 E */

    return boardData;

};