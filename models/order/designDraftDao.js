const { getException, logger } = require('../../library/common');
const { DesignDraft, Manager, sequelize, Sequelize : { Op } } = require('..');

/** 예외 S */
const DesignDraftUpdateException = getException("Design/DesignDraftUpdateException");
/** 예외 E */

const fileDao = require('../file/dao');

/**
 * 시안 관리
 * 
 */
const designDraftDao = {
    /**
     * 시안 등록 수정 
     * 
     * @param {Object} req 
     * @returns {Boolean}
     * @throws {DesignDraftUpdateException}
     */
    async update(req) {
        const data = req.body;
        if (!data.draftUid) {
            throw new DesignDraftUpdateException("잘못된 접근입니다.");
        }
        const draftUid = data.draftUid;
        try {
            let result = false;
            const cnt = await DesignDraft.count({ where : { draftUid }});
            const commonData = {
                designChoice : data.designChoice || "0",
                draftFile1 : data.draftFile1,
                draftFile2 : data.draftFile2,
                draftFile3 : data.draftFile3,
                designerResponse : data.designerResponse
            };

            if (cnt > 0) { // 수정 
                result = await DesignDraft.update(commonData, {
                    where : { draftUid }
                });
                return true;
            } else { // 추가 
                commonData.draftUid = draftUid;
                commonData.idManager = data.idManager;
                result = await DesignDraft.create(commonData);
                return result?true:false;
            }
        } catch (err) {
            logger(err);
            return false;
        }
    },
    /**
     * 디자인 시안 정보 
     * 
     * @param {String} itemUid 
     * @returns {Object|Boolean}
     */
    async get(draftUid) {
        if (!draftUid) {
            return false;
        }

        try {
            const data = await DesignDraft.findOne({
                include : [{
                    model : Manager,
                    attributes : ['managerId', 'managerNm'],
                }],
                where : { draftUid },
                raw : true,
            });
            if (!data)  {
                return false;
            }

            data.draftFiles = [];
            for (let i = 1; i <= 3; i++) {            
                if (!data[`draftFile${i}`]) continue;

                const fileInfo = await fileDao.get(data[`draftFile${i}`]);
                if (!fileInfo) continue;
                
                fileInfo.seq = i;
                data.draftFiles.push(fileInfo);
            }

            /** 고객 첨부 파일 S */
            data.clientRequestFiles = await fileDao.gets(`draft_client_${draftUid}`, true);

            if (data.clientRequestFiles && !(data.clientRequestFiles instanceof Array)) {
                data.clientRequestFiles = [data.clientRequestFiles];
            }
            /** 고객 첨부 파일 E */


            data.designChoice = Number(data.designChoice);
            data.draftChoiced = false;
            if (data.draftFiles.length > 0) {
                data.draftChoiced = data.draftFiles[data.designChoice - 1];
            }
            
            return data;
        } catch (err) {
            logger(err);
            return false;
        }
    },
    /**
     * 품목별 디자인 시안 전체 조회
     * 
     * @param {String} itemUid 
     */
    async gets(itemUid) {   
        if (!itemUid) {
            return false;
        }

        try {
            const items = await DesignDraft.findAll({
                attributes : ["draftUid"],
                where : {
                    draftUid : {
                        [Op.startsWith] : itemUid,
                    }
                },
                raw : true,
            });

            if (!items) {
                return false;
            }

            const drafts = {};
            for await (let it of items) {
                const data = await this.get(it.draftUid);
                if (data) {
                    drafts[it.draftUid] = data;
                }
            }
            
            return drafts;
        } catch (err) {
            logger(err);
            return false;
        }

    },
    /**
     * 디자인 시안 삭제 
     * 
     * @param {String} itemUid 
     * @returns {Object|Boolean}
     */
    async delete(draftUid) {
        if (!draftUid) {
            return false;
        }

        const data = await this.get(draftUid);
        if (!data) {
            return false;
        }
        try {
            const result = await sequelize.transaction(async (transaction) => {
                if (data.draftFiles && data.draftFiles.length > 0) {
                    for await (file of data.draftFiles) {
                        await fileDao.delete(file.id, transaction);
                    }
                }

                const result = await DesignDraft.destroy({
                    where : { draftUid }
                });

                return result;
            });

            return result > 0;
        } catch (err) {
            logger(err);
            return false;
        }
    },
    /**
     * 디자인 시안 확정 처리 
     * 
     * @param {String} draftUid
     * @param {int} designChoice
     */
    async confirmDesignDraft(draftUid, designChoice) {
        if (!draftUid || !designChoice) {
            return false;
        }

        try {
            await DesignDraft.update({ 
                designChoice,
                confirmDateTime : new Date(),
            }, {
                where : { draftUid }
            });

            return true;
        } catch (err) {
            logger(err);
            return false;
        }
    },
    /**
     * 요청사항 업데이트 
     * 
     * @param {String} draftUid
     * @param {String} clientRequest 저장내용
     */
    async updateDesignRequest(draftUid, clientRequest) {
        if (!draftUid) {
            return false;
        }

        try {
            await DesignDraft.update({
                clientRequest
            }, {
                where : { draftUid }
            });
            
            return true;
        } catch (err) {
            logger(err);
            return false;
        }
    }
}; 

module.exports = designDraftDao;