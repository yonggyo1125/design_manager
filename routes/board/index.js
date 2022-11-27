const { alert, reload, go, uid } = require('../../library/common');
const { commonCheck, guestCheck, commentCheck } = require('../../middleware/board');
const reviewCheck = require('../../middleware/board/review'); // 후기 체크 

const express = require('express');
const router = express.Router();

const boardDataDao = require('../../models/board/boardDataDao');

/** 게시글 작성, 수정 */
const saveData = require('../../service/board/saveData');

/** 비회원 비밀번호 확인 */
const guestPasswordCheck = require('../../service/board/guestPasswordCheck');

/** 게시글 또는 댓글 삭제 */
const deleteData = require('../../service/board/deleteData');

/** 게시글 목록 조회 */
const getListData = require('../../service/board/getListData');

/** 이전, 이후 게시글 조회 */
const getNearData = require('../../service/board/getNearData');

/** 댓글 작성, 수정 */
const saveComment = require('../../service/board/saveComment');

/** 댓글 삭제 */
const deleteComment = require('../../service/board/deleteComment');

/** 게시판 템플릿 */
const boardTemplateDao = require("../../models/board/boardTemplateDao");

/** 후기 작성 가능 주문 폼목 조회 */
const getReviewOrderItems = require("../../service/board/getReviewOrderItems");

router.use(async (req, res, next) => {
    res.locals.menuOn = "board";
    res.locals.topBoards = await req.getBoards('board');
    next();
});

/** 게시글 목록  */
router.route("/list/:id")
    .get(commonCheck, async (req, res) => {
    
        const data = await getListData(req);
        return res.render("board/list", data);
    })
    .post(commonCheck, async (req, res) => {
        
    });

/** 게시글 등록 */
router.route("/write/:id")
    .get(commonCheck, reviewCheck, async (req, res) => {
        
        const templates = await boardTemplateDao.gets();

        return res.render("board/write", { templates });
    })
    .post(commonCheck, async (req, res) => {
        try {
            const board = req.board;
            const data = await saveData(req);
            let url = "/board/list/" + board.id;
            if (board.afterWriteTarget == 'view') {
                url  = "/board/view/" + data.id;
            }

            go(url, res, "parent");

        } catch (err) {
            alert(err.message, res);
        }
    });

/** 게시글 수정 */
router.route("/update/:id")
    .get(commonCheck, async (req, res) => {
        const templates = await boardTemplateDao.gets();
        const data = res.locals.boardData;
        data.mode = "update";
        data.templates = templates;
        return res.render("board/update", data);
    })
    .post(commonCheck, async (req, res) => {
        try {
            const board = req.board;
            const data = await saveData(req);
            let url = "/board/list/" + board.id;
            if (board.afterWriteTarget == 'view') {
                url  = "/board/view/" + data.id;
            }

            go(url, res, "parent");

        } catch (err) {
            alert(err.message, res);
        }
    });

/** 게시글 답글 */
router.route("/reply/:id")
    .get(commonCheck, (req, res) => {
        const boardData = res.locals.boardData;
        const data = {
            subject : boardData.subject,
            idParent : boardData.id,
        };  
        return res.render("board/write", data);
    });

/** 게시글 삭제 */
router.use("/delete/:id", commonCheck, async (req, res) => {
    const data = res.locals.boardData;
    try {
        await deleteData(req);
        go(`/board/list/${data.idBoard}`, res, "parent");
    } catch (err) {
        alert(err.message, res, `/board/view/${data.id}`, "parent");
    }
    
});

/** 게시글 보기 */
router.route("/view/:id")
    .get(commonCheck, async (req, res) => {
        const data = res.locals.boardData;
        const board = req.board;

        /** 댓글 작성, 수정 후 세션이 있는 경우 */
        if (req.session.idComment) {
            data.idComment = req.session.idComment;
            delete req.session.idComment;
        }

        /** 이전, 이후 게시글 조회  */
        const nearData = await getNearData(data.id, true);
        if (nearData.prev) data.prev = nearData.prev;
        if (nearData.next) data.next = nearData.next;

        /** 게시글 조회수 업데이트 */
        const hit = await boardDataDao.updateHit(data.id, req);
        data.hit = hit;

        if (board.useComment) { // 댓글 사용하는 경우 
            data.addScript = data.addScript || [];
            if (board.useEditor) {
                data.addScript.push("ckeditor_basic/ckeditor");
            }
            data.addScript.push("board/comment");
            
            data.gid = uid();

            // 이미지나 파일 첨부가 있는 경우
            if (board.useImageAttach && board.useFileAttach) {
                data.addScript.push("fileUpload");
            }
        }

        if (board.useViewList && board.accessible.list ) { // 게시글 하단 목록 노출
            req.params.id = board.id;
            if (data.category) {
                data.search = data.search || {};
                data.search.category = req.query.category = data.category;
            }
            
            const listData = await getListData(req);
            data.list = listData.list;
            data.page = listData.page;
            data.limit = listData.limit;
            data.pagination = listData.pagination;
            data.total = listData.total;
            data.isViewList = true;
            
        }

        return res.render("board/view", data);
    });


 /** 비회원 비밀번호 체크  */
router.route("/password")
    .get(guestCheck, (req, res) => {
        const data = res.locals.data;
        return res.render("board/password", data);
    })
    .post(guestCheck, async (req, res) => {
        try {
            await guestPasswordCheck(req, res);
        } catch (err) {
            alert(err.message, res);
        }
    });

// 댓글 작성, 수정 처리
router.route("/comment/:id")
    .get(commentCheck, async (req, res) => { // 댓글 수정 양식 
        const board = req.board;
        const data = { commentData : req.commentData, mode : "edit" };
        if (board.useComment) { // 댓글 사용하는 경우 
            data.addScript = data.addScript || [];
            if (board.useEditor) {
                data.addScript.push("ckeditor_basic/ckeditor");
            }
            data.addScript.push("board/comment");
        

            // 이미지나 파일 첨부가 있는 경우
            if (board.useImageAttach && board.useFileAttach) {
                data.addScript.push("fileUpload");
            }
        }

        return res.render("board/edit_comment", data);
    })  
    .post(commonCheck, async (req, res) => { 
        try {
            const commentData = await saveComment(req);
            if (!commentData) {
                const typeMsg = req.body.id ? "수정":"작성";
                throw new Error(`댓글 ${typeMsg}에 실패하였습니다.`);
            }

            const url = `/board/view/${commentData.idBoardData}?done=1#comment_${commentData.id}`;
            if (req.body.id) { // 수정일땐 본글로 이동 
                 return alert("수정되었습니다.", res, url, "parent");
            } else if (commentData.idParent) { // 댓글 답변일 경우 
                return go(url, res, "parent");
            } else { // 추가일 땐 새로고침
                return reload(res, "parent");
            }

        } catch (err) {
            console.log(err);
            alert(err.message, res);
        }
    });

/** 댓글 삭제 */
router.use("/comment/delete/:id", commentCheck, async (req, res) => {

    try {
        const commentData = req.commentData;

        await deleteComment(commentData.id, req);
        
        const url = `/board/view/${commentData.idBoardData}`;
        return go(url, res, "parent");
    } catch (err) {
        alert(err.message, res, -1);
    }
    
});

/** 댓글 답변 */
router.route("/comment/reply/:id")
    .get(commonCheck, async (req, res) => {
        const data = req.boardData;
        const board = req.board;
        data.idParent = req.params.id;

        if (board.useComment) { // 댓글 사용하는 경우 
            data.addScript = data.addScript || [];
            if (board.useEditor) {
                data.addScript.push("ckeditor_basic/ckeditor");
            }
            data.addScript.push("board/comment");
        
            data.gid = uid();

            // 이미지나 파일 첨부가 있는 경우
            if (board.useImageAttach && board.useFileAttach) {
                data.addScript.push("fileUpload");
            }
        }

        return res.render("board/reply_comment", data);
    });

/** 템플릿 조회 */
router.get("/template/:id", async (req, res) => {
    try {
        const id = req.params.id;
        if (!id) {
            throw new Error("잘못된 접근입니다.");
        }

        const data = await boardTemplateDao.get(id);
        if (!data) {
            throw new Error("등록되지 않은 템플릿입니다.");
        }

        res.json({ success : true, data });
    } catch (err) {
        res.json({ success : false, message : err.messsage });
    }
});

/**
 * 주문 품목 선택 
 * 
 */
router.route("/select_orderItem/:orderNo")
    .get(async (req, res) => {
        try {
            const orderNo = req.params.orderNo;
            
            const items = await getReviewOrderItems(orderNo);
            
            const data =  { 
                items,
                addCss : ['mobile/mypage']
            };
            res.render("board/select_order_item", data);

        } catch (err) {
            alert(err.message, res, -1);
        }
    });

module.exports = router;