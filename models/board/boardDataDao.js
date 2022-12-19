const { BoardData, Manager, BoardView, Comment, Sequelize : {Op}, sequelize } = require('..');
const { logger, getUTCDate, getBrowserId } = require('../../library/common');
const Pagination = require('../../library/pagination');
const fileDao = require('../file/dao');
const commentDao = require('./commentDao');
const orderDao = require("../order/dao");

const bcrypt = require('bcrypt');

/**
 * BoardData Dao
 */
const boardDataDao = {
    _total : 0, // 게시판별 전체 게시글 개수
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
     * 게시글 저장, 수정 
     * 
     * @param {*} data 
     */
    async save(data) {
        let boardData;
        const transaction = await sequelize.transaction();
        try {
            const mode = data.mode;
            let guestPw = "";
            if (data.guestPw) {
                const salt = await bcrypt.genSalt(10);
                guestPw = await bcrypt.hash(data.guestPw, salt);
            }
            
            let gid;
            let mobile = data.mobile;
            if (mobile) {
                mobile = mobile.replace(/\\D/g, "");
            }

            const commonData = {
                poster : data.poster,
                guestPw,
                isNotice : data.isNotice?true:false,
                category : data.category,
                subject : data.subject,
                content : data.content,
                email : data.email,
                mobile,
                extra1 : data.extra1,
                extra2 : data.extra2,
                extra3 : data.extra3,
                extra4 : data.extra4,
                extra5 : data.extra5,
                text1 : data.text1,
                text2 : data.text2,
                text3 : data.text3,
                idOrderItem : data.idOrderItem,
                itemCode : data.itemCode,
                reviewPt : data.reviewPt || 0,
            };
        
            if (mode == 'update') { // 수정
                await BoardData.update(commonData, { where : { id : data.id }, transaction});

                boardData = await this.get(data.id);
                if (boardData) gid = boardData.gid;

            } else { // 추가
                commonData.idBoard = data.idBoard;
                commonData.gid = data.gid;
                commonData.idManager = data.idManager;
                commonData.userAgent = data.userAgent || "";
                commonData.ipAddr = data.ipAddr || "";
                if (commonData.ipAddr) {
                    commonData.ipAddr = commonData.ipAddr.replace("::ffff:", "");
                }
                // 에디터 사용 여부
                commonData.useEditor = data.useEditor?true:false;

                // 답글인 경우
                if (data.idParent) {
                    commonData.idParent = data.idParent; // 부모 게시글 ID
                    const row = await BoardData.findByPk(data.idParent, { attributes : ['listOrder', 'listOrder2', 'depth'], raw : true, transaction });

                    if (row) {
                        let depth = Number(row.depth) + 1;

                        commonData.depth = depth;
                        commonData.listOrder = row.listOrder;
                        commonData.listOrder2 = row.listOrder2;

                        // 동일 부모, 동일 depth를 가진 마지막 형제 데이터 조회, 없으면 현재 시간, 있으면 형제 시간에서 + 1
                        const lastSibling = await BoardData.findOne({
                            attributes : ['listOrder2'],
                            where : { idParent : data.idParent, depth : depth },
                            order : [['createdAt', "DESC"]],
                            transaction,
                            raw : true,
                        });
         
                        if (lastSibling) { // 직전 형제가 있다면
                            let listOrder2 = lastSibling.listOrder2.split("||");
                            let last = listOrder2.pop();
                            last = Number(last) + 1;
                            listOrder2.push(last);
                            commonData.listOrder2 = listOrder2.join("||");
                        } else {
                            if (depth > 1) {
                                commonData.listOrder2 += "||10000";
                            } else {
                                commonData.listOrder2 = "10000";
                            }
                            
                        }
                    }
                } else {
                    commonData.listOrder = Date.now();
                }
                
                boardData = await BoardData.create(commonData, { transaction, raw : true });

                gid = data.gid;
            }
            

            /** 파일 업로드 완료 처리 S */
            await fileDao.updateDone(gid + "_images", transaction);
            await fileDao.updateDone(gid + "_files", transaction);
            /** 파일 업로드 완료 처리 E */

            await transaction.commit();

        } catch (err) {
            await transaction.rollback();
            logger(err);
            return false;
        }

        return boardData;
    },
    /**
     * 게시글 조회
     * 
     * @param {*} id 게시글 번호
     * @param {boolean} withComment 댓글 함께 조회 여부 
     * @param {boolean} withDeleted 삭제된 게시글 함께 조회
     */
    async get(id, withComment, withDeleted) {
        withDeleted = withDeleted ? true : false;
        try {
            if (!id) {
                return false;
            }
            const params = { 
                include : [{
                    model : Manager,
                    attributes : ['managerId', 'managerNm'],
                }],
                where : { id }, raw : true 
            };

            if (withDeleted) {
                params.paranoid = false;
            }
            
            const data = await BoardData.findOne(params);

            await this.updateBoardData(data);

            if (withComment) {
                data.comments = await commentDao.gets(id);
            }
            
            return data;
        } catch (err) {
            logger(err);
            return false;
        }
    },
    /**
     * 게시글 목록 조회
     * 
     * @param {String} id 게시판 아이디
     * @param {int} page 페이지 번호
     * @param {int} limit 1페이지당 레코드 수 
     * @param {Object} req 
     * @param {Object} search
     */
    async gets(id, page, limit, req, search) {
        if (!id) {
            return false;
        }
        search = search || {};
        page = page || 1;
        limit = limit || 20;
        if (isNaN(limit)) limit = Number(limit);
        const offset = (page - 1) * limit;
        const where = { idBoard : id }, andWhere = [], orWhere = [], managerWhere = {};
        let required = false, paranoid = true;

        try {

            /** 검색 처리 S */
            /** 삭제된 게시글 포함 */
            if (search.includeDeleted) {
                paranoid = false;
            }

            /** 삭제된 게시글만 조회 */
            if (search.deletedOnly) {
                andWhere.push({ deletedAt : { [Op.not] : null }});
            }

            /** 작성일자 조회 S */
            if (search.createSdate) { // 작성 시작일
                const createSdate = getUTCDate(search.createSdate);
                andWhere.push({ createSdate : { [Op.gte] : createSdate }});
            }

            if (search.createEdate) {
                const createEdate = getUTCDate(search.createEdate);
                createEdate.setData(createEdate.getDate() + 1)
                andWhere.push({ createEdate : { [Op.lt] : createEdate }});
            }
            /** 작성일자 조회 E */

            /** 날짜 검색 S */
            if (search.dateType) {
                const dateType = search.dateType.trim();
                let sconds, econds, fields;
                if (search.sdate) {
                    const sdate = getUTCDate(search.sdate);
                    sconds = { [Op.gte] : sdate };
                }

                if (search.edate) {
                    const edate = getUTCDate(search.edate);
                    econds = { [Op.lt] : edate }; 
                }

                if (dateType == 'deletedAt') { // 삭제일
                    fields = "deletedAt";
                   
                } else { // 작성일
                    fields = "createdAt";
                }

                if (sconds) { 
                    andWhere.push({ [fields] : sconds });
                }

                if (econds) {
                    andWhere.push({ [fields] : econds });
                }
            }
            /** 날짜 검색 E */

            /** 게시판 분류 검색 처리 */
            if (search.category) {
                andWhere.push({ category : search.category });
            }

            /** 제목 검색 */
            if (search.subject) {
                andWhere.push({ subject : { [Op.substring] : search.subject }});
            }

            /** 본문 검색 */
            if (search.content) {
                andWhere.push({ content : { [Op.substring] : search.content }});
            }

            /** 글 작성자 검색 S */
            if (search.poster) {
                andWhere.push({ poster : { [Op.substring] : search.poster }});
            }

            /** 작성자 ID로 조회 */
            if (search.managerId) {
                let managerId = search.managerId;
                if (!(managerId instanceof Array)) {
                    managerId = [managerId];
                }
                managerWhere.managerId = { [Op.in] : managerId };
                required = true;
            }

            /** 검색 구분 별 S */
            if (search.sopt && search.skey && search.skey.trim() != "") {
                const sopt = search.sopt;
                const skey = search.skey.trim();
                const conds = { [Op.substring] : skey };
                switch (sopt) {
                    case "all" : // 통합검색
                        orWhere.push({ subject : conds}, { content : conds }, { poster : conds });
                        //managerWhere.managerId = conds;

                        break;
                    case "subject_content":  // 제목 + 본문
                        orWhere.push({ subject : conds}, { content : conds });
                        break;
                    case "managerId" : // 작성자 아이디
                        managerWhere.managerId = conds;
                        required = true;
                        break;
                    default : 
                        andWhere.push({ [sopt] : conds });

                }
            }
            /** 검색 구분 별 E */
            
            /** 휴대전화 S */
            if (search.mobile) {
                const mobile = search.mobile.replace(/\D/g, "");
                andWhere.push({ mobile : { [Op.substring] : mobile }});
            }
            /** 휴대전화 E */

            /** 이메일 S */
            if (search.email) {
                andWhere.push({ email : { [Op.substring] : search.email }});
            }
            /** 이메일 E */

            /** 삭제된 게시글 S */
            if (search.isDeleted) {
                andWhere.push({ deletedAt : { [Op.not] : null }});
            }
            /** 삭제된 게시글 E */

            /** 댓글 포함 게시글 S */
            if (search.isHavingComments) {
                andWhere.push({ totalComments : { [Op.gt] : 0 }});
            }
            /** 댓글 포함 게시글 E */

            if (andWhere.length > 0) {
                where[Op.and] = andWhere;
            }

            if (orWhere.length > 0) {
                where[Op.or] = orWhere;
            }
            /** 검색 처리 E */
            
            /**
             * 정렬 순서 
             * 1. 공지사항, 2. 최신글 - 동일 글 안에 답글이 있는 경우 부모글 등록 순서, 3. 답글의 답글인 경우 현재 정렬 순서(listOrder2) 따름
             */
            const params = {
                include : [{
                    model : Manager,
                    required,
                    attributes : ['managerId', 'managerNm'],
                    where : managerWhere,
                }],
                paranoid,
                where,
                order: [['isNotice', "DESC"], ["listOrder", "DESC"], ['listOrder2', 'ASC'], ['createdAt', "ASC"]],
                raw : true,
            };

            // 게시글 총 합
            this.total = await BoardData.count(params);

            if (limit != 'all') {
                params.offset = Number(offset);
                params.limit = Number(limit);
            }

            const list = await BoardData.findAll(params);
            if (!list) {
                return false;
            }

            for await (const li of list) {
                await this.updateBoardData(li);
            }

            if (limit == 'all') {
                return list;
            }

            

            // 페이징 처리 
            if (req) {
                this.pagination = new Pagination(req, page, this.total, null, limit).getPages();
            }
            
            return list;

        } catch (err) {
            logger(err);
            return false;
        }
    },

    /**
     * 게시글 데이터 추가 
     * 
     * @param {*} data 
     */
    async updateBoardData(data) {
        if (!data) {
            return;
        }

        /** 첨부 파일 처리 S */
        data.attachImages = await fileDao.gets(data.gid + "_images", true);
        data.attachFiles = await fileDao.gets(data.gid + "_files", true);
        data.attachAnswerFiles = await fileDao.gets(data.gid + "_answer", true);
        /** 첨부 파일 처리 E */     

        if (data['Manager.managerId']) {
            data.managerId = data['Manager.managerId'];
            data.managerNm = data['Manager.managerNm'];
        }

        /** 아이콘 노출 여부 처리 S */
        data.icons = {
            new : false,
            attach : false,
            image : false,
        };
        const gap = new Date() - data.createdAt;
        const hours = Math.floor(gap / (1000 * 60 * 60));
        // 하루 전에 작성한 글은 new 아이콘 추가
        if (hours < 24) {
            data.icons.new = true;
        }

        // 첨부파일 있는 경우 
        if (data.attachFiles && data.attachFiles.length > 0) {
            data.icons.attach = true;
        } 

        // 이미지가 있는 경우
        if (data.attachImages && data.attachImages.length > 0) {
            data.icons.image = true;
        }
        /** 아이콘 노출 여부 처리 E */

        if (data.ipAddr) {
            data.ipAddr = data.ipAddr.replace("::ffff:", "");
        }

        /** 품주번호가 있는 경우 주문데이터 조회 S */
        if (data.idOrderItem) {
            const orderItem = await orderDao.getOrderItem(data.idOrderItem);
            if (orderItem) data.orderItem = orderItem;
        }
        /** 품주번호가 있는 경우 주문데이터 조회 E */
    },
    /**
     * 게시글 삭제 처리 
     * 
     * @param {int} id - 게시글 번호
     * @param {boolean} isForce - 완전 삭제
     */
    async delete(id, isForce) {
        if (!id) {
            return false;
        }
        /** 댓글 여부 체크 S */
        const cnt = await Comment.count({ where : { idBoardData : id } });
        if (cnt > 0 ) {
            return false;
        }
        /** 댓글 여부 체크 E */
        
        const transaction = await sequelize.transaction();
        try {
            const data  = await this.get(id, false, isForce);
            if (!data) {
                return false;
            }
            const force = isForce?true:false;
            const params = {
                where : { id },
                transaction,
            };

            if (force) {
                params.force = true;
            }

            const result = await BoardData.destroy(params);
            

            if (!result) {
                return false;
            }
            
            // 업로드된 파일 삭제
            if (isForce) {
                // 파일은 복구를 위해서 완전 삭제인 경우만 제거
                await fileDao.deletes(data.gid + "_images", transaction);
                await fileDao.deletes(data.gid + "_files", transaction);
                await fileDao.deletes(data.gid + "_answer", transaction);
            }

        
            await transaction.commit();
            
            return result > 0;
        } catch (err) {
            await transaction.rollback();
            logger(err);
            return false;

        }
    },
    /**
     * 이전 게시글 
     * 
     * @param {*} id 게시글 번호 
     * @param {*} byCategory 
     */
    async getPrev(id, byCategory) {
        if (!id) {
            return false;
        }
        
        try {
            const boardData = await BoardData.findByPk(id, {
                attributes : ['category', 'listOrder', 'idBoard'],
                raw : true,
            }); 

            if (!boardData) {
                return false;
            }

            const where = {
                idBoard : boardData.idBoard,
                listOrder : { [Op.lt] : boardData.listOrder },
                depth : 0,
            };
            
            if (byCategory && boardData.category) {
                where.category = boardData.category;
            }

            const row = await BoardData.findOne({
                include : [{
                    model : Manager,
                    attributes : ['managerId', 'managerNm'],
                }],  
                where,
                order : [['listOrder', 'DESC']],
                raw : true,
            });
            if (row) {
                if (row.managerId) row.managerId;
                if (row.managerNm) row.managerNm;
            }

            return row;
        } catch (err) {
            logger(err);
            return false;
        } 
    },
    /**
     * 다음 게시글 
     * 
     * @param {*} id 게시글 번호 
     * @param {*} byCategory 
     */
    async getNext(id, byCategory) {
        if (!id) {
            return false;
        }
        
        try {
            const boardData = await BoardData.findByPk(id, {
                attributes : ['category', 'listOrder', 'idBoard'],
                raw : true,
            }); 

            if (!boardData) {
                return false;
            }

            const where = {
                idBoard : boardData.idBoard,
                listOrder : { [Op.gt] : boardData.listOrder },
                depth : 0,
            };

            if (byCategory && boardData.category) {
                where.category = boardData.category;
            }

            const row = await BoardData.findOne({
                include : [{
                    model : Manager,
                    attributes : ['managerId', 'managerNm'],
                }],  
                where,
                order : [['listOrder', 'ASC']],
                raw : true,
            });
            if (row) {
                if (row['Manager.managerId']) row.managerId = row['Manager.managerId'];
                if (row['Manager.managerNm']) row.managerNm = row['Manager.managerNm'];
            }

            return row;
        } catch (err) {
            logger(err);
            return false;
        }
    },
    /**
     * 조회수 업데이트
     * 
     * @param {int} id 게시글 번호
     */
    async updateHit(id, req) {
        if (!id) {
            return false;
        }

        try {
            const uid = getBrowserId(req);
            await BoardView.create({
                idBoardData : id,
                uid,
            });

        } catch (err) {} // 이미 조회된 게시글인 경우  

        const cnt = await BoardView.count({ where : { idBoardData : id }});
        await BoardData.update({
            hit : cnt,
        }, { where : { id }});

        return cnt;
    },
    /**
     * 알림톡 전송 완료 처리
     * 
     * @param {string} sendType : reply - 답변 알림, admin - 관리자 알림
     */
    async doneSendAlimTalk(sendType, id) {
        if (!sendType || !id) {
            return;
        }

        let key = "";
        if (sendType == 'reply') {
            key = "isSentReplyKakaoAlimTalk";
        } else if (sendType == 'admin') {
            key = "isSentAdminKakaoAlimTalk";
        }

        if (!key) {
            return;
        }

        const upData = {
            [`${key}`] : true,
        };

        await BoardData.update(upData, { where : { id }});
    },
    /**
     * 삭제 게시글 복구 
     * 
     * @param {*} ids 
     */
    async restore(ids) {
        if (!ids) {
            return false;
        }

        if (!(ids instanceof Array)) {
            ids = [ids];
        }

        
        try {
            await BoardData.restore({ where : { id : { [Op.in] : ids} }});
        } catch (err) {
            logger(err);
            return false;
        }
    }
};

module.exports = boardDataDao;