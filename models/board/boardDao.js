const { Board, BoardData, Skin, Manager, Sequelize : { Op } } = require('..');
const { logger } = require('../../library/common');
const Pagination = require('../../library/pagination');
const managerDao = require('../manager/dao');
const path = require('path');

/**
 * 게시판 설정
 * 
 */
const boardDao = {
    _total : 0, // 전채 게시판 수
    _pagination : "", // 페이지 HTML
    set total(total) {
        if (isNaN(total)) total = 0;
        this._total = total;
    },
    get total() {
        return this._total;
    },
    set pagination(pagination) {
        this._pagination = pagination;
    },
    get pagination() {
        return this._pagination;
    },
    /**
     * 게시판 설정 저장
     * - 없으면 추가, 있으면 수정
     * 
     * @param {*} data 
     */
    async save(data) {

        let listAccessLevel = data.listAccessLevel || [];
        if (!(listAccessLevel instanceof Array)) {
            listAccessLevel = [listAccessLevel];
        }

        listAccessLevel = listAccessLevel.join(",");

        let viewAccessLevel = data.viewAccessLevel || [];
        if (!(viewAccessLevel instanceof Array)) {
            viewAccessLevel = [viewAccessLevel];
        }

        viewAccessLevel = viewAccessLevel.join(",");

        let writeAccessLevel = data.writeAccessLevel || [];
        if (!(writeAccessLevel instanceof Array)) {
            writeAccessLevel = [writeAccessLevel];
        }

        writeAccessLevel = writeAccessLevel.join(",");

        let replyAccessLevel = data.replyAccessLevel || [];
        if (!(replyAccessLevel instanceof Array)) {
            replyAccessLevel = [replyAccessLevel];
        }

        replyAccessLevel = replyAccessLevel.join(",");

        let commentAccessLevel = data.commentAccessLevel || [];
        if (!(commentAccessLevel instanceof Array)) {
            commentAccessLevel = [commentAccessLevel];
        }

        commentAccessLevel = commentAccessLevel.join(",");

        let listAccessManagers = data.listAccessManagers || [];
        if (!(listAccessManagers instanceof Array)) {
            listAccessManagers = [listAccessManagers];
        }

        listAccessManagers = listAccessManagers.join(",");

        let viewAccessManagers = data.viewAccessManagers || [];
        if (!(viewAccessManagers instanceof Array)) {
            viewAccessManagers = [viewAccessManagers];
        }

        viewAccessManagers = viewAccessManagers.join(",");


        let writeAccessManagers = data.writeAccessManagers || [];
        if (!(writeAccessManagers instanceof Array)) {
            writeAccessManagers = [writeAccessManagers];
        }

        writeAccessManagers = writeAccessManagers.join(",");

        let replyAccessManagers = data.replyAccessManagers || [];
        if (!(replyAccessManagers instanceof Array)) {
            replyAccessManagers = [replyAccessManagers];
        }

        replyAccessManagers = replyAccessManagers.join(",");

        let commentAccessManagers = data.commentAccessManagers || [];
        if (!(commentAccessManagers instanceof Array)) {
            commentAccessManagers = [commentAccessManagers];
        }

        commentAccessManagers = commentAccessManagers.join(",");

        let alimTalkManagers = data.alimTalkManagers || [];
        if (!(alimTalkManagers instanceof Array)) {
            alimTalkManagers = [alimTalkManagers];
        }

        alimTalkManagers = alimTalkManagers.join(",");

        let category = data.category?data.category.trim():"";
        category = category.replace(/\r\n/g, "||");

        const commonData = {
            title : data.title,
            isUse : data.isUse == 1 ? true:false,
            rowsPerPage : data.rowsPerPage || 20,
            useViewList : data.useViewList?true:false,
            category,
            listAccessLevel,
            viewAccessLevel,
            writeAccessLevel,
            replyAccessLevel,
            commentAccessLevel,
            listAccessManagers,
            viewAccessManagers,
            writeAccessManagers,
            replyAccessManagers,
            commentAccessManagers,
            viewType : data.viewType || 'admin',
            useEditor : data.useEditor == 1 ? true:false,
            useFileAttach : data.useFileAttach == 1 ? true:false,
            useImageAttach : data.useImageAttach == 1 ? true:false,
            afterWriteTarget : data.afterWriteTarget || 'view',
            useReply : data.useReply?true:false,
            useReplyMessage : data.useReplyMessage == 1 ? true:false,
            useComment : data.useComment?true:false,
            useCommentMessage : data.useCommentMessage == 1 ? true:false,
            useAdminMessage : data.useAdminMessage == 1 ? true:false,
            useTemplate : data.useTemplate == 1 ? true:false,
            skin : data.skin || 'default',
            useEmail : data.useEmail?true:false,
            useMobile : data.useMobile?true:false,
            replyKakaoTmpltCode : data.replyKakaoTmpltCode,
            commentKakaoTmpltCode : data.commentKakaoTmpltCode,
            adminKakaoTmpltCode : data.adminKakaoTmpltCode,
            answerKakaoTmpltCode : data.answerKakaoTmpltCode,
            alimTalkManagers,
            alimTalkMobiles : data.alimTalkMobiles,
            webhookUrls : data.webhookUrls,
            isReview : data.isReview?true:false,
            isReviewOrderOnly : data.isReviewOrderOnly?true:false,
            idManager : data.idManager,
        };

        try {
            /** 이미 등록되어 있으면 수정, 없다면 추가 */
            const cnt = await Board.count({ where : { id : data.id }});
            if (cnt > 0) { // 수정 
                await Board.update(commonData, { where : { id : data.id }});
            } else { // 추가 
                commonData.id = data.id;
                await Board.create(commonData);
            }

            return true;
        } catch (err) {
            logger(err);
            return false;
        }
    },
    /**
     * 게시판 설정 삭제
     * 
     * @param {*} ids 
     */
    async delete(ids) {
        if (!ids) {
            return false;
        }

        if (!(ids instanceof Array)) {
            ids = [ids];
        }

        try {   

            for await (const id of ids) {
                const cnt = await this.getPostCnt(id);
                if (cnt > 0) continue;
                
                await Board.destroy({ where : { id }});
            }
           
            return true;
        } catch (err) {
            logger(err);
            return false;
        }
    },  
    /**
     * 게시판 설정
     * 
     * @param {*} id 
     */
    async get(id) {
        if (!id) {
            return false;
        }

        try {
            const data = await Board.findByPk(id, {
                include : [{ 
                    model : Manager,
                    required : false,
                    attributes : ['managerId', 'managerNm'],
                },{
                    model : Skin,
                    required : false,
                    attributes : ['skinNm', 'skinType'],
                }],
                 raw : true
             });
            if (!data) {
                return false;
            }
            
            data.category = data.category?data.category.split("||"):[];
            data.listAccessLevel = data.listAccessLevel?data.listAccessLevel.split(","):[];
            data.viewAccessLevel = data.viewAccessLevel?data.viewAccessLevel.split(","):[];
            data.writeAccessLevel = data.writeAccessLevel?data.writeAccessLevel.split(","):[];
            data.replyAccessLevel = data.replyAccessLevel?data.replyAccessLevel.split(","):[];
            data.commentAccessLevel = data.commentAccessLevel?data.commentAccessLevel.split(","):[];
            data.listAccessManagers = data.listAccessManagers?data.listAccessManagers.split(","):[];
            data.viewAccessManagers = data.viewAccessManagers?data.viewAccessManagers.split(","):[];
            data.writeAccessManagers = data.writeAccessManagers?data.writeAccessManagers.split(","):[];
            data.replyAccessManagers = data.replyAccessManagers?data.replyAccessManagers.split(","):[];
            data.commentAccessManagers = data.commentAccessManagers?data.commentAccessManagers.split(","):[];
            data.alimTalkManagers = data.alimTalkManagers?data.alimTalkManagers.split(","):[];

            data.listAccessManagers = await managerDao.getByIds(data.listAccessManagers);
            data.viewAccessManagers = await managerDao.getByIds(data.viewAccessManagers);
            data.writeAccessManagers = await managerDao.getByIds(data.writeAccessManagers);
            data.replyAccessManagers = await managerDao.getByIds(data.replyAccessManagers);
            data.commentAccessManagers = await managerDao.getByIds(data.commentAccessManagers);
            data.alimTalkManagers = await managerDao.getByIds(data.alimTalkManagers);

            if (data.alimTalkMobiles) {
                data.alimTalkMobilesArr = data.alimTalkMobiles.trim().split("\n").map(s => s.replace("\r", ""));
            }   
            
            if (data.webhookUrls) {
                data.webhookUrlsArr = data.webhookUrls.trim().split("\n").map(s => s.replace("\r", ""));
            }
            
            /** 스킨 경로 S */
            if (data.skin) {
                const skinPath = path.join(__dirname, "..", "..", "views", "board", "skins", data.skin);
                data.skinPath = skinPath;
                data.listSkinPath = path.join(skinPath, "list.html");
                data.viewSkinPath = path.join(skinPath, "view.html");
                data.writeSkinPath = path.join(skinPath, "write.html");
                data.updateSkinPath = path.join(skinPath, "update.html");
                data.commentSkinPath = path.join(skinPath, "comment.html");
                data.editCommentSkinPath = path.join(skinPath, "edit_comment.html");
                data.replyCommentSkinPath = path.join(skinPath, "reply_comment.html");
                data.passwordSkinPath = path.join(skinPath, "password.html");
            }
            /** 스킨 경로 E */

            /** 출력 구분 처리 S */
            const layoutPath = path.join(__dirname, "..", "..", "views", "layout");
            if (data.viewType == 'member') {
                data.layoutPath = path.join(layoutPath, "mypage.html"); // 회원페이지의 경우
            } else {
                data.layoutPath = path.join(layoutPath, "main.html"); // 관리자페이의 경우
            }
            /** 출력 구분 처리 E */

            await this.updateBoardInfo(data);
            return data;
        } catch (err) {
            logger(err);
            return false;
        }
    },
    /**
     * 게시판 목록 
     * 
     * @param {int} page 페이지 번호
     * @param {int} limit 1페이지당 레코드 수 
     * @param {Object} req 
     * @param {Object} search 검색용 쿼리스트링
     */
    async gets(page, limit, req, search) {
        try {
            page = page || 1;
            limit = limit || 20;
            limit = limit == 'all' ? limit : Number(limit);
            const offset = (page - 1) * limit;
            const where = {}, andWhere = [], orWhere = [];

            /** 검색 처리 S */
            search = search || {};
        
            /** 사용여부 S */
            if (search.isUse) { 
                const isUse = [];
                if (search.isUse.indexOf('n') != -1) {
                    isUse.push(0);
                }

                if (search.isUse.indexOf('y') != -1) {
                    isUse.push(1);
                }

                andWhere.push({ isUse : { [Op.in] : isUse }});
            }
            /** 사용여부 E */
            /** 스킨 검색 S */
            if (search.skin) {
                if (!(search.skin instanceof Array)) {
                    search.skin = [search.skin];
                }

                andWhere.push({ skin : { [Op.in] : search.skin }});
            }
            /** 스킨 검색 E */

            /** 키워드 검색 S */
            if (search.sopt && search.skey && search.skey.trim() != "") {
                const sopt = search.sopt;
                const skey = search.skey.trim();

                if (sopt == 'all') {
                    andWhere.push({
                        [Op.or] : [{id : { [Op.substring] : skey }}, {title : { [Op.substring] : skey }}],
                    });

                } else {
                    andWhere.push({ [sopt] : { [Op.substring] : skey }});
                }
            }
            /** 키워드 검색 E */


            if (andWhere.length > 0) {
                where[Op.and] = andWhere;
            }
            /** 검색 처리 E */
            const params = {
                include : [{ 
                    model : Manager,
                    required : false,
                    attributes : ['managerId', 'managerNm'],
                },{
                    model : Skin,
                    required : false,
                    attributes : ['skinNm', 'skinType'],
                }],
                order: [['createdAt', 'DESC']],
                where,
                raw : true,
            };

            if (limit != 'all') {
                params.limit = limit;
                params.offset = offset;
            }

            const list = await Board.findAll(params);
            for await (const li of list) {
                li.showConfig = li.showConfig || {};
                if (typeof li.showConfig == 'string') {
                    li.showConfig = JSON.parse(li.showConfig);
                }

                await this.updateBoardInfo(li);
            }
            if (limit == 'all') {
                return list;
            }
            
            /** 총 게시판 수 */
            this.total = await Board.count({ where });

            if (req) {
                this.pagination = new Pagination(req, page, this.total, null, limit).getPages();
            }

            return list;

        } catch(err) {
            logger(err);
            return false;
        }
    },
    /**
     * 스킨 저장 처리
     *  - 스킨 ID가 이미 있으면 수정, 없으면 추가
     * 
     * @param {*} data 
     */
    async saveSkin(data) {
        if (!data) {
            return false;
        }

        const id = data.id;

        try {
            const upData = {
                skinType : data.skinType,
                skinNm : data.skinNm,
            };

            const cnt = await Skin.count({ where : { id } });
            if (cnt > 0) { // 수정
               
                await Skin.update(upData, { where : { id }});
            } else { // 추가 
                upData.id = id;
                upData.idManager = data.idManager;
                await Skin.create(upData);
            }

            return true;

        } catch (err) {
            logger(err);
            return false;
        }
    },
    /**
     * 스킨 목록 삭제
     * 
     * @param {*} ids 
     */
    async deleteSkins(ids) {
        if (!ids) {
           return false;
        }
    
        if (!(ids instanceof Array)) {
            ids = [ids];
        }

        try {
            await Skin.destroy({
                where : { id : { [Op.in] : ids }},
            });

            return true;
        } catch (err) {
            logger(err);
            return false;
        }
    
    },  
    /**
     * 게시판 스킨 목록 조회
     * 
     */
    async getSkins() {
        try {
            const skins = await Skin.findAll({
                order : [['createdAt', 'DESC']],
                raw : true,
            });
            return skins;
        } catch (err) {
            logger(err);
            return false;
        }
    },
    /**
     * 게시판 설정 추가 정보 업데이트
     * 
     * @param {*} board 
     */
    async updateBoardInfo(board) {
        const cnt = await this.getPostCnt(board.id);
        board.postCnt = cnt;
        board.skinType = board['Skin.skinType'];
    },
    /**
     * 게시판별 총 게시글 개수
     * 
     * @param {*} idBoard 
     */
    async getPostCnt(idBoard) {
        const cnt = await BoardData.count({ where : { idBoard } });
        return cnt;
    }
};

module.exports = boardDao;