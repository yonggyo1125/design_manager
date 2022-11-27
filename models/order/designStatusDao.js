const { getException, logger } = require('../../library/common');
const DesignStatusRegisterException = getException("Order/DesignStatusRegisterException");
const DesignStatusUpdateException = getException("Order/DesignStatusUpdateException");
const DesignStatusDeleteException = getException("Order/DesignStatusDeleteException");
const { DesignStatus } = require('../index');

/**
 * 디자인 처리 상태 
 * 
 */
 const designStatusDao = {
    /**
     * 디자인 상태 추가 
     * 
     * @param {Object} req 
     * @returns {Boolean|Object}
     * @throws {DesignStatusRegisterException}
     */
    async add(req) {
        const data = req.body;
        await this.validate(data, DesignStatusRegisterException);

        try {
            const result = await DesignStatus.create({
                statusCd : data.statusCd,
                statusNm : data.statusNm,
            });
            if (!result) {
                return false;
            }

            return result;
        } catch (err) {
            logger(err);
            return false;
        }
    },
    /**
     * 유효성 검사
     * 
     * @param {Object} data
     * @throws {Exception}
     */
     async validate(data, Exception) {
        /** 필수 항목 체크 S */
        const required = {
            statusCd : "처리상태코드를 입력하세요.",
            statusNm : "처리상태명을 입력하세요."
        };

        for (key in required) {
            if (!data[key] || data[key].trim() == "") {
                throw new Exception(required[key]);
            }
        }
        /** 필수 항목 체크 E */

        // 처리상태 코드는 영문자, 숫자로만 구성 체크 */
        if (/[^a-zA-Z0-9]/.test(data.statusCd)) {
            throw new Exception("처리상태코드는 영문자 및 숫자만 사용하실 수 있습니다.");
        }

        // 처리상태 코드 중복 여부 체크 
        const cnt = await DesignStatus.count({ where : { statusCd : data.statusCd }});
        if (cnt > 0) {
            throw new Exception(`이미 등록된 처리상태 코드입니다. - ${data.statusCd}`);
        }
    },
    /**
     * 디자인 처리상태 수정 
     * 
     * @param {Object} req 
     * @throws {Boolean}
     * @throws {DesignStatusUpdateException}
     */
     async update(req) {
        const data = req.body;
        if (!data) {
           return false;
        }
        
        let statusCds = data.statusCd;
        if (!statusCds) {
            throw new DesignStatusUpdateException("수정할 처리상태를 선택하세요.");
        }

        if (!(statusCds instanceof Array)) {
            statusCds = [statusCds];
        }
        
        try {
            for await (statusCd of statusCds) {
                await DesignStatus.update({
                    statusNm : data[`statusNm_${statusCd}`],
                    guideMessage : data[`guideMessage_${statusCd}`],
                    designerChangePossible : (data[`designerChangePossible_${statusCd}`] == 1)?true:false,
                    listOrder : data[`listOrder_${statusCd}`],
                    tmpltCode : data[`tmpltCode_${statusCd}`],
                    isUse : (data[`isUse_${statusCd}`] == 1)?true:false,
                    designerChangedTmpltCode : data[`designerChangedTmpltCode_${statusCd}`]
                }, { where : { statusCd }})
            }
            return true;
        } catch (err) {
            logger(err);
            return false;
        }
    },
    /**
     * 디자인 처리상태 삭제 
     * 
     * @param {statusCds} 처리상태코드 
     * @throws {Boolean}
     * @throws {DesignStatusDeleteException}
     */
    async delete(statusCds) {
        if (!statusCds) {
            throw new DesignStatusDeleteException("삭제할 처리상태를 선택하세요.");
        }

        if (!(statusCds instanceof Array)) {
            statusCds = [statusCds];
        }
        try {
            for await (statusCd of statusCds) {
                await DesignStatus.destroy({ where : { statusCd }});
            }
            
            return true;
        } catch (err) {
            logger(err);
            return false;
        }
    },
    /**
     * 주문 처리상태 목록 
     *  
     */
     async gets(isAll, attributes) {
        try {
            const where = {};
            if (!isAll) {
                where.isUse = true;

            }
            const params = {
                where,
                order : [['listOrder', "DESC"], ['createdAt', "ASC"]],
                raw : true,
            };
            if (attributes) {
                params.attributes = attributes;
            }
            const list = await DesignStatus.findAll(params);

            return list;
        } catch (err) {
            logger(err);
            return false;
        }
    },
    /**
     * 디자인 상태 조회 
     * 
     * @param {String} statusCd 
     * @returns {Object|Boolean} 
     */
    async get(statusCd) {
        if (!statusCd) {
            return false;
        }

        try {
            const data = await DesignStatus.findByPk(statusCd, { raw : true });
            if (!data) {
                return false;
            }

            return data;
        } catch (err) {
            logger(err);
            return false;
        }
    },
};

module.exports = designStatusDao;