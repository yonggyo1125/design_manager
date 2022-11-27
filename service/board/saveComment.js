const commentDao = require('../../models/board/commentDao');
const kakaoAlimTalkApiSvc = require("../../service/kakaoAlimTalk/api");
const processWebHook = require("../../service/utils/processWebHook");

/**
 * 댓글 작성 및 수정 
 * 
 * @param {*} req 
 */
module.exports = async (req) => {
    const data = req.body;
    const board = req.board;
    const boardData = req.boardData;

    /** 댓글 작성, 수정 유효성 검사 S */
    const required = {
        idBoardData : "잘못된 접근입니다.",
        commenter : "작성자를 입력하세요.",
        content : "댓글을 작성해주세요.",
    };
    if (data.id) { // 수정
        required.id = "잘못된 접근입니다.";

    } else { // 추가
        required.gid = "잘못된 접근입니다.";
    }

    if (!req.isLogin && (!data.guestPw || data.guestPw.trim() == "")) {
        required.guestPw = "비밀번호를 입력하세요.";
    }

    for (const field in required) {
       if (!data[field] || ("" + data[field]).trim() == "") {
            throw new Error(required[field]);
       }
    }

    /** 댓글 작성, 수정 유효성 검사 E */

    /** 댓글 작성, 수정  */
    const commentData = await commentDao.save(data);
    if (commentData) {
        req.session.idComment=commentData.id;

        /** 변경 데이터 가공 */
        /** 변경 데이터 가공 */
        const replaceCodeData = {
            boardTitle : board.title,
            idBoard : board.id,
            poster : commentData.commenter,
            content : commentData.content,
            createdAt : commentData.createdAt,
        };

        /** 답글 알림톡 전송 처리 S */
        let mobile = boardData.mobile;
         if (mobile) mobile = mobile.replace(/\\D/g, "");
        if (!commentData.isSentCommentKakaoAlimTalk && board.useCommentMessage && board.commentKakaoTmpltCode && mobile) {
            const tmpltCode = board.commentKakaoTmpltCode;
            await kakaoAlimTalkApiSvc.send(tmpltCode, mobile, replaceCodeData);
            // 전송 후 완료 처리 
            await commentDao.doneSendAlimTalk("comment", commentData.id);
        }
        /** 답글 알림톡 전송 처리 E */


        /** 관리자 알림톡 전송 처리 S */
        if (!commentData.isSentAdminKakaoAlimTalk && board.useAdminMessage && board.adminKakaoTmpltCode && ((board.alimTalkManagers && board.alimTalkManagers.length > 0 ) || board.alimTalkMobiles)) {
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
            await commentDao.doneSendAlimTalk("admin", commentData.id);

        }
        /** 관리자 알림톡 전송 처리 E */

        /** 댓글 웹훅 처리 S */
        if (board.webhookUrlsArr) {
            for(const url of board.webhookUrlsArr) {
            
                const sendData = await commentDao.get(commentData.id);
                sendData.mode = "comment";
                await processWebHook(url, sendData);
            }
        }
        /** 댓글글 웹훅 처리 E */

    }

    return commentData;
};