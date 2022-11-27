const { go } = require('../../library/common');
const bcrypt = require('bcrypt');

/**
 * 비회원 비밀번호 확인 체크
 * 
 * @param {*} req 
 */
module.exports = async (req, res) => {
    const data = req.data;
    const guestPw = req.body.guestPw;
    const type = req.type;
    const action = req.action;


    if (!data) {
        throw new Error("잘못된 접근입니다.");
    }

    if (!guestPw) {
        throw new Error("비밀번호를 입력하세요.");
    }

    const match = await bcrypt.compare(guestPw, data.guestPw);
    if (!match) {
        throw new Error("비밀번호가 일치하지 않습니다.");
    }

    // 일치하는 경우 확인 체크 
    const key = type == "comment" ? `commentData_chk_${data.id}`:`boardData_chk_${data.id}`;

    req.session[key] = true;
    
    const viewId = req.session.viewId;

    delete req.session.actionType;
    delete req.session.viewId;
    delete req.session.guestPasswordType;
    
    // 페이지 이동
    if (type == "comment") { // 댓글 
        let url;
        if (action == 'delete') { // 댓글 삭제 
            url = `/board/comment/delete/${viewId}`;
        } else { // 댓글 수정 
            url = `/board/comment/${viewId}`;
        }

        return go(url, res, "parent");
    } else { // 게시글
        return go(`/board/${action}/${data.id}`, res, "parent");
    }
 
};