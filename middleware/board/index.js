const { alert, uid, go } = require('../../library/common');
const boardDao = require('../../models/board/boardDao');
const boardDataDao = require('../../models/board/boardDataDao');
const commentDao = require('../../models/board/commentDao');
const menuSvc = require('../../service/menu');

module.exports = {
    /** 게시판 공통 체크 */
    async commonCheck(req, res, next) {
        try {
            
            let id = req.params.id || req.body.idBoard;
            const actionType = getActionType(req);
            /** 
             * 수정, 글 보기, 답글, 삭제의 경우 게시글 번호가 유입되었는지 체크,
             * 있으면 게시글 조회, 게시판 아이디로 변경처리 
             */
            let boardData;
            if (['update', 'view', 'delete', 'reply', 'comment'].indexOf(actionType) != -1) {
                let viewId = req.params.id || req.body.id;
                if (!viewId) {
                    throw new Error("잘못된 접근입니다.");
                }

                // 댓글 답변인 경우 
                if (actionType == 'comment' && req.requestURL.indexOf("reply") != -1) {
                    const commentData = await commentDao.get(viewId);
                    if (!commentData) {
                        throw new Error("등록되지 않은 댓글입니다.");
                    }
                    
                    viewId = commentData.idBoardData;
                }
                
                const withComment = actionType == 'view' ? true : false;
                boardData = await boardDataDao.get(viewId, withComment);
                if (!boardData) {
                    throw new Error("등록되지 않은 게시글 입니다.");
                }

                 /** 게시글 댓글 권한 체크 S */
                if (boardData.comments) {
                    const comments = boardData.comments;
                    for (const item of comments) {
                        item.isEditable = false;
                        item.isMine = false;
                        // 게시판 관리자 또는 최고 관리자인 경우 수정가능
                        if (req.isBoarder || req.isSuper) {
                            item.isEditable = true;
                        }

                        // 본인 댓글인 경우도 수정 가능 처리
                        if (req.isLogin && item.idManager == req.manager.id) {
                            item.isEditable = true;
                            item.isMine = true;
                        }
                    }
                } // endif 
                /** 게시글 댓글 권한 체크 E */
                id = boardData.idBoard;
                req.boardData = res.locals.boardData = boardData;
                if (actionType == 'comment') {
                    req.body.idBoardData = boardData.id;
                }


            }

             /** 게시판 ID 체크 */
            if (!id) {
                throw new Error("잘못된 접근입니다.");
            }
            
            /** 그룹 ID */
            req.gid = res.locals.gid = uid();
            
            /** 게시판 설정 체크 S */
            const board = await boardDao.get(id);
            if (!board) {
                throw new Error("등록되지 않은 게시판 입니다.");
            }

            if (!board.isUse) {
                throw new Error("이용할 수 없는 게시판입니다.");
            }

            req.body.useEditor = board.useEditor;
            if (boardData) { //게시글 작성시에 에디터 사용으로 저장된 경우 유지 
                board.useEditor = req.body.useEditor = boardData.useEditor;
            }

            req.board = res.locals.board = board;
            req.idBoard = req.body.idBoard = res.locals.idBoard = id;
            
            /** 게시판 설정 체크 E */

            res.locals.addCss = [`board/${board['Skin.skinType']}`];
            res.locals.bodyClass += ` board-${board.skin} board-${board['Skin.skinType']}`;
            res.locals.addScript = [];
            /** 게시글 쓰기, 수정, 답글 페이지인 경우 자바스크립트, 에디터 추가 S */
            if (req.method.toUpperCase().indexOf("GET") != -1 && ['write', 'update', 'reply'].indexOf(actionType) != -1) {
                if (board.useEditor) {
                    res.locals.addScript.push("ckeditor/ckeditor");
                }
                res.locals.addScript.push("fileUpload", "board/form");
            } 
            /** 게시글 쓰기, 수정 페이지인 경우 에디터 추가 E */

            /** 관리자 페이지에서 게시판 사용인 경우 게시판 메뉴 노출  */
            if (req.method.toUpperCase() == 'GET' && board.viewType == 'admin') {
                res.locals.locTitle = board.title;
                if (boardData) {
                    res.locals.locTitle = boardData.subject + ":" + board.title;
                }
                
                res.locals.subMenuUrl = "/board/admin/list";
                const subMenus = await menuSvc.getsByType("board");
                if (subMenus) {
                    res.locals.subMenus = subMenus;
                }
            }
           
            /** 게시판 접근 권한 업데이트*/
            const accessible = await updateAccess(req, res);

            /** 관리자 페이지 뷰인 경우 미로그인 시 로그인 */
            if (!req.isLogin && board && board.viewType == 'admin') {
                return go("/manager/login", res, "parent");
            }

            if (req.requiredGuestPasswordChk && (actionType == 'update' || actionType == 'delete')) {
                // 비회원 게시글 또는 댓글 번호 및 타입을 세션에 저장
                if (boardData) {
                    req.session.actionType = actionType;
                    req.session.viewId = boardData.id;
                    req.session.guestPasswordType="view";
                }

               return go("/board/password", res, "parent");
            }   
           
            // 현재 수정, 삭제 게시글이 회원 게시글이지만 본인 게시글이 아닌 경우 
            if (boardData && !boardData.isMine) {
                if (!accessible.update && actionType == 'update') { // 수정시
                    throw new Error("본인이 작성한 게시글만 수정할 수 있습니다.");
                }

                if (!accessible.delete && actionType == 'delete') { // 삭제시 
                    throw new Error("본인이 작성한 게시글만 삭제할 수 있습니다.");
                }
            }

            /** 접근 권한 체크 */
            await checkAccess(req);

            next();
        } catch (err) {
            console.log(err);
            alert(err.message, res, -1);
        }
    },
    /**
     * 게시글 수정, 삭제시 패스워드 쪽으로 유입된 경우 
     * 
     */
    async guestCheck(req, res, next) {
        try {
            const viewId = req.session.viewId;
            const guestPasswordType = req.session.guestPasswordType;
            const actionType = req.session.actionType;

            if (!viewId || !guestPasswordType || guestPasswordType.trim() == "" || !actionType || actionType.trim() == "") {
                throw new Error("잘못된 접근입니다.");
            }

            // commment - 댓글, view - 게시글
            const type = guestPasswordType == 'comment' ? "comment":"view";

            let data;
            if (type == 'view') {  // 게시글
                data = await boardDataDao.get(viewId);
               
                if (!data) {
                    throw new Error("등록되지 않은 게시글 입니다.");
                }
               
                // 이미 승인 받은 경우라면 actionType에 맞는 페이지로 이동
                if (req.session['boardData_chk_' + viewId]) {
                    return go(`/board/${actionType}/${viewId}`, res, "parent");
                }

                req.board = res.locals.board = await boardDao.get(data.idBoard);
                
            } else { // 댓글 
                data = await commentDao.get(viewId);
                if (!data) {
                    throw new Error("등록되지 않은 댓글입니다.");
                }

               
                const key = `commentData_chk_${data.id}`;
                 // 이미 승인받은 댓글이라면 요청한 기능 처리
                if (req.session[key]) {
                    let url;
                    if (actionType == 'delete') {
                        url = `/board/comment/delete/${viewId}`;
                    } else {
                        url = `/board/comment/${viewId}`;
                    }

                    return go(url, res, "parent");

                }

                const boardData = await boardDataDao.get(data.idBoardData);
                if (!boardData) {
                    throw new Error("댓글의 본글이 존재하지 않습니다.");
                }
                const board = await boardDao.get(boardData.idBoard);
                req.board = res.locals.board = board;
            }

           
            res.locals.type = req.type = type;
            res.locals.action = req.action = actionType;
            res.locals.data = req.data = data;
            res.locals.addCss = [`board/${req.board['Skin.skinType']}`];
            res.locals.bodyClass += ` board-${req.board.skin} board-${req.board['Skin.skinType']}`;
            next();
        } catch (err) {
            console.log(err);
            alert(err.message, res, -1);
        }
    },
    /**
     * 댓글 체크 
     * 
     * @param {*} req 
     * @param {*} res 
     * @param {*} next 
     */
    async commentCheck(req, res, next) {
        const id = req.params.id;
        if (!id) {
            throw new Error("잘못된 접근입니다.");
        }

        const data = await commentDao.get(id);
        if (!data) {
            throw new Error("등록되지 않은 댓글입니다.");
        }

        const actionType = (req.requestURL.indexOf("delete") == -1)?"edit":"delete";

        let isEditable = false, isMine = false;
        // 게시판 관리자 또는 최고 관리자인 경우 수정가능
        if (req.isBoarder || req.isSuper) {
            isEditable = true;
        }

        // 본인 댓글인 경우도 수정 가능 처리
        if (data.idManager) { // 회원 댓글
            if (req.isLogin && data.idManager == req.manager.id) {
                isEditable = true, isMine = true;
            }
        } else if(!isEditable) { // 비회원 댓글
            const key = `commentData_chk_${data.id}`;
            if (req.session[key]) { // 비회원 비밀번호 인증한 경우
                isEditable = true, isMine = true;
            } else { // 비회원 비밀번호 인증이 필요한 경우 
                req.session.actionType = actionType;
                req.session.viewId = data.id;
                req.session.guestPasswordType="comment";
                
                return go("/board/password", res);
            }
        }

        if (!isEditable) {
            const type = actionType == 'delete'?"삭제":"수정";
            throw new Error(`${type} 권한이 없습니다.`);
        }
        const boardData = await boardDataDao.get(data.idBoardData);
        const board = await boardDao.get(boardData.idBoard);
        res.locals.board = req.board = board;
        res.locals.boardData = req.boardData = boardData;
        res.locals.commentData = req.commentData = data;
        res.locals.addCss = [`board/${req.board['Skin.skinType']}`];
        res.locals.bodyClass += ` board-${req.board.skin} board-${req.board['Skin.skinType']}`;

        next();
    }
};

/** 게시판, 게시글 접근 가능 업데이트 */
async function updateAccess(req, res) {
    const accessible = {
        list : false, // 목록 
        view : false, // 게시글 보기
        write : false, // 글쓰기 
        update : false, // 글수정
        delete : false, // 글삭제
        reply : true, // 답글 쓰기 
        comment : false, // 댓글 쓰기
    };

    
    /** 게시판 권한 체크 S */

    let level = 0;  

     /** 게시글 권한 체크 S */
     if (req.boardData) {
        const data = req.boardData;
        /** 본인 게시글인지 체크 */
        data.isMine = false;
        if (req.isLogin && data.idManager == req.manager.id) {
            data.isMine = true;
        }

        /** 비회원 게시글 중에서 비밀번호 인증을 받은 경우  */
        data.requiredGuestPasswordChk = false;
        if (!data.idManager && !req.isBoarder && !req.isSuper) {
            if (req.session['boardData_chk_' + data.id]) {
                data.isMine = true;
            } else {
                data.requiredGuestPasswordChk = true; // 비회원 비밀번호 인증이 필요한 경우 
            }
        }


        req.requiredGuestPasswordChk = data.requiredGuestPasswordChk;

        if (data.isMine) { // 본인 게시글인 경우 글 수정, 글 삭제, 글 보기 가능
            accessible.update = accessible.delete = accessible.view = true;

            // 답글은 본인글이 아닐떄 가능
            accessible.reply = false;
        }
        /** 게시글 권한 체크 E */
    }
   
    if (req.isLogin) {
        level = req.manager.managerLv;

        // 게시판 관리자 역할일 경우 모든 권한 true
        if (req.isBoarder || req.isSuper) {
            for (const key in accessible) {
                if (key == 'reply') continue;
                accessible[key] = true;
            }

            if (req.boardData) { 
                req.boardData.isMine = true;
                req.boardData.accessible = accessible;
            }
            
            if (req.board) {
                req.board.accessible = accessible;
            }
            if (!req.board.useComment) accessible.comment = false;
            if (!req.board.useReply) accessible.reply = false;
            return accessible;  
        }
    }

   

    if (req.board) {
        const board = req.board;
        for (const key in accessible) {
            if (['update', 'delete'].indexOf(key) != -1) {
                continue;
            }

            // 목록 접근 가능 관리자 체크
            if (req.isLogin) {
                const managerId = req.manager.id;
                if (board[`${key}AccessManagers`] && board[`${key}AccessManagers`].length > 0) {
                    const managerIds = board[`${key}AccessManagers`].map(o => o.managerId);
                    if (managerIds.indexOf(managerId) != -1) {
                        accessible[key] = true;
                    }
                }
            }

            //  접근 권한이 설정되지 않은 경우나 권한이 있는 경우
            if (((!board[`${key}AccessLevel`] && ['reply', 'delete', 'update'].indexOf(key) == -1) || (board[`${key}AccessLevel`].length == 0 && ['reply', 'delete', 'update'].indexOf(key) == -1))|| board[`${key}AccessLevel`].indexOf("" + level) != -1) {
                accessible[key] = true;
            }
        }
       
    }

    /** 게시판 권한 체크 E */

    if (!req.board.useComment) accessible.comment = false; // 댓글 미사용인 경우 
    if (!req.board.useReply) accessible.reply = false; // 답글 미사용인 경우 

    if (req.board) {
        req.board.accessible = accessible;
    }

    if (req.boardData) { 
        req.boardData.accessible = accessible;
    }
    
    return accessible;
}

/** 접근 권한 체크  */
async function checkAccess(req) {
    const type = getActionType(req);
    const accessible = await updateAccess(req);

    // 로그인 하지 않고 각 type별 접근 가능 레벨이 설정된 경우 로그인 페이지로 이동
    if (!req.isLogin && req.board) {
        const board = req.board;
        const accessLevel = board[`${type}AccessLevel`];
        if (accessLevel && accessLevel.length > 0) {
            throw new Error("접근 권한이 없습니다.");
        }
    }


    if (!accessible[type]) {
        throw new Error("접근 권한이 없습니다.");
    }
}

function getActionType(req) {
    const url = req.requestURL;
    let type = "";
    if (url.indexOf("/update") != -1) type = "update";
    if (url.indexOf("/write") != -1) type = "write";
    if (url.indexOf("/view") != -1) type = "view";
    if (url.indexOf("/list") != -1) type = "list";
    if (url.indexOf("/reply") != -1) type = "reply";
    if (url.indexOf("/delete") != -1) type = "delete";
    if (url.indexOf("/comment") != -1) type = "comment";
    
    return type;
}

