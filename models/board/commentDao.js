const { Comment, Manager, BoardData, sequelize } = require('..');
const bcrypt = require('bcrypt');
const { logger } = require('../../library/common');
const fileDao = require('../../models/file/dao');

/**
 * 댓글  DAO
 * 
 */
const commentDao = {
    /**
     * 댓글 저장, 수정 
     * 
     * @param {*} data 
     */
    async save(data) {  
        if (!data) {
            return false;
        }

        // 비회원 비밀번호
        let guestPw = "";
        if (data.guestPw) {
            const salt = await bcrypt.genSalt(10);
            guestPw = await bcrypt.hash(data.guestPw, salt);    
        }

        let commentData;
        const transaction = await sequelize.transaction();
        try {
            let gid;
            const commonData = {
                commenter : data.commenter,
                content : data.content,
                guestPw,
            };
            
            if (data.id) { // 수정 
                await Comment.update(commonData, { where : { id : data.id }, transaction});

                commentData = await this.get(data.id);
                if (commentData) gid = commentData.gid;

            } else { // 등록
                commonData.gid = data.gid;
                commonData.idParent = data.idParent || 0;
                commonData.userAgent = data.userAgent;
                commonData.ipAddr = data.ipAddr;
                if (commonData.ipAddr) {
                    commonData.ipAddr = commonData.ipAddr.replace("::ffff:", "");
                }
                // 에디터 사용 여부
                commonData.useEditor = data.useEditor?true:false;
                commonData.idBoardData = data.idBoardData;
                commonData.idManager = data.idManager;

                // 대댓글인 경우
                if (data.idParent) {
                    commonData.idParent = data.idParent; // 부모 댓글 ID

                    const row = await Comment.findByPk(data.idParent, { attributes : ['listOrder', 'listOrder2', 'depth'], raw : true, transaction });
                    if (row) {
                        let depth = Number(row.depth) + 1;

                        commonData.depth = depth;
                        commonData.listOrder = row.listOrder;
                        commonData.listOrder2 = row.listOrder2;
                        // 동일 부모, 동일 depth를 가진 마지막 형제 데이터 조회, 없으면 현재 시간, 있으면 형제 시간에서 + 1
                        const lastSibling = await Comment.findOne({
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

                    } // endif 
                } else {
                    commonData.listOrder = Date.now();
                }

                commentData = await Comment.create(commonData, { transaction, raw : true });

                gid = data.gid;
            }

            /** 파일 업로드 완료 처리 S */
            await fileDao.updateDone(gid + "_images", transaction);
            await fileDao.updateDone(gid + "_files", transaction);
            /** 파일 업로드 완료 처리 E */

            await transaction.commit();
            await this.updateTotalComment(commentData.idBoardData);
        } catch (err) {
            await transaction.rollback();
            logger(err);
            return false;
        }
        
        return commentData;
    },
    /**
     * 댓글 조회
     * 
     * @param {*} id 
     */
    async get(id) {
        if (!id) {
            return false;
        }

        try {
            const data = await Comment.findByPk(id, {
                include : [{
                    model : Manager,
                    attributes : ["managerId", "managerNm"],
                }],
                raw : true,
            });

            if (!data) {
                return false;
            }

            await this.updateCommentData(data);

            return data;
        } catch (err) {
            logger(err);
            return false;
        }
    },
    /**
     * 댓글 목록 
     * 
     * @param {*} id 
     * @param {*} isDeletedIncluded 
     */
     async gets(id, isDeletedIncluded) {
        if (!id) {
            return false;
        }

        paranoid = true;
        if (isDeletedIncluded) {
            paranoid = false;
        }

        try {
            const rows = await Comment.findAll({
                include : [{
                    model : Manager,
                    required : false,
                    attributes : ['managerId', 'managerNm'],
                }],
                paranoid,
                order : [['listOrder', "ASC"], ["listOrder2", "ASC"], ["createdAt", "ASC"]],
                where : { idBoardData : id },
                raw : true,
            });

            if (!rows) {
                return false;
            }

            for await (const row of rows) {
                await this.updateCommentData(row);
            }
            return rows;
        } catch (err) {
            logger(err);
            return false;
        }
    },
    /**
     * 댓글 데이터 추가
     * 
     * @param {*} data 
     */
    async updateCommentData(data) {
        if (!data) {
            return;
        }

        /** 첨부 파일 처리 S */
        data.attachImages = await fileDao.gets(data.gid + "_images", true);
        data.attachFiles = await fileDao.gets(data.gid + "_files", true);
        /** 첨부 파일 처리 E */

        if (data['Manager.managerId']) {
            data.managerId = data['Manager.managerId'];
            data.managerNm = data['Manager.managerNm'];
        }

        if (data.ipAddr) {
            data.ipAddr = data.ipAddr.replace("::ffff:", "");
        }

        
    },
    /**
     * 댓글 삭제 처리 
     * 
     * @param {int} id - 게시글 번호
     * @param {boolean} isForce - 완전 삭제
     */
    async delete(id, isForce) {
        if (!id) {
            return false;
        }

        const transaction = await sequelize.transaction();
        try {
            const data = await this.get(id);
            if (!data) {
                return false;
            }
            const force = isForce?true:false;
            const result = await Comment.destroy({
                where : { id },
                transaction,
                force,
            });
            
            if (!result) {
                return false;
            }

            // 업로드된 파일 삭제
            if (isForce) {
                // 파일은 복구를 위해서 완전 삭제인 경우만 제거
                await fileDao.deletes(data.gid + "_images", transaction);
                await fileDao.deletes(data.gid + "_files", transaction);
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
     * 총 댓글 갯수 
     * 
     * @param {*} idBoardData 
     * @param {*} transaction
     */
    async updateTotalComment(idBoardData, transaction) {
        try {
            if (!idBoardData) {
                return 0;
            }
            const params = {
                where : { idBoardData : idBoardData },
            };
            if (transaction) params.transaction = transaction;
            const total = await Comment.count(params);
            
            await BoardData.update({
                totalComments : total
            }, { where : { id : idBoardData }});

        } catch (err) {
            logger(err);
            return 0;
        }
    },
    /**
     * 알림톡 전송 완료 처리
     * 
     * @param {string} sendType : comment - 답변 알림, admin - 관리자 알림
     */
     async doneSendAlimTalk(sendType, id) {
        if (!sendType || !id) {
            return;
        }

        let key = "";
        if (sendType == 'comment') {
            key = "isSentCommentKakaoAlimTalk";
        } else if (sendType == 'admin') {
            key = "isSentAdminKakaoAlimTalk";
        }

        if (!key) {
            return;
        }

        const upData = {
            [`${key}`] : true,
        };

        await Comment.update(upData, { where : { id }});
    }
};

module.exports = commentDao;