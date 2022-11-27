const { getException, logger } = require('../../library/common');

/** 예외 S */
const DeliveryAreaPolicyRegisterException = getException("Delivery/DeliveryAreaPolicyRegisterException");
const DeliveryAreaPolicyUpdateException = getException("Delivery/DeliveryAreaPolicyUpdateException");
const DeliveryAreaPolicyDeleteException = getException("Delivery/DeliveryAreaPolicyDeleteException");
const DeliveryAreaChargeRegisterException = getException("Delivery/DeliveryAreaChargeRegisterException");
const DeliveryAreaChargeDeleteException = getException("Delivery/DeliveryAreaChargeDeleteException");
/** 예외 E */

const { DeliveryAreaPolicy, DeliveryAreaCharge } = require('..');

/**
 * 지역별 배송비 Dao 
 * 
 */
const deliveryAreaDao = {
    /**
     * 지역별 배송조건 등록
     * 
     * @param {Object} req 
     * @returns {Boolean|Object}
     * @throws {DeliveryAreaPolicyRegisterException}
     */
    async addPolicy(req) {
        const data = req.body;
        if (!data) {
            throw new DeliveryAreaPolicyRegisterException("잘못된 접근입니다.");
        }

        if (!data.policyNm || data.policyNm.trim() == "") {
            throw new DeliveryAreaPolicyRegisterException("지역별 추가배송비명을 입력하세요.");
        }

        try {
            const result = await DeliveryAreaPolicy.create({
                policyNm : data.policyNm,
                description : data.description,
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
     * 지역별 배송정책 수정하기
     * 
     * @param {Object} req 
     * @returns {Boolean}
     * @throws {DeliveryAreaPolicyUpdateException}
     */
    async updatePolicy(req) {
        const data = req.body;
        if (!data) {
            throw new DeliveryAreaPolicyUpdateException("잘못된 접근입니다.");
        }

        let ids = data.id;
        if (!ids) {
            throw new DeliveryAreaPolicyUpdateException("수정할 배송조건을 선택하세요.");
        }

        if (!(ids instanceof Array)) {
            ids = [ids];
        }

        try {
            for await (id of ids) {
                await DeliveryAreaPolicy.update({
                    policyNm : data[`policyNm_${id}`],
                    description : data[`description_${id}`],
                }, { where : { id }});
            }

            return true;
        } catch (err) {
            logger(err);
            return false;
        }
    },
    /**
     * 지역별 배송정책 삭제하기
     * 
     * @param {Array|int} ids 
     * @returns {Boolean}
     * @throws {DeliveryAreaPolicyDeleteException}
     */
    async deletePolicy(ids) {
        if (!ids) {
            throw new DeliveryAreaPolicyDeleteException("삭제할 배송조건을 선택하세요.");
        }

        try {
            for await (id of ids) {
                await DeliveryAreaPolicy.destroy({ where : { id }});
            }

            return true;
        } catch (err) {
            logger(err);
            return false;
        }
    },
    /**
     * 지역별 배송정책 목록 
     * 
     * @returns {Array|Boolean}
     */
    async getPolicies() {
        try {
            const list = await DeliveryAreaPolicy.findAll({
                Order : [['id', 'DESC']],
                raw : true,
            });

            return list;
        } catch (err) {
            logger(err);
            return false;
        }
    },
    /**
     * 지역별 배송정책 조회 
     * 
     * @param {int} id 지역별 배송정책 등록번호
     * @returns {Boolean}
     */
    async getPolicy(id) {
        if (!id) {
            return false;
        }

        try {
            const result = await DeliveryAreaPolicy.findByPk(id, { raw : true });

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
     * 지역별 추가 배송비 등록 처리 
     * 
     * @param {Object} req 
     * @returns {Boolean|Object}
     * @throws {DeliveryAreaChargeRegisterException}
     */
    async addCharge(req) {
        const id = req.params.id || req.body.id;
        const data = req.body;
        if (!id || !data) {
            throw new DeliveryAreaChargeRegisterException("잘못된 접근입니다.");
        }
        if (!data.sido || data.sido.trim() == "") {
            throw new DeliveryAreaChargeRegisterException("시도를 선택하세요.");
        }

        if (!data.addCharge || Number(data.addCharge) <= 0) {
            throw new DeliveryAreaChargeRegisterException("추가배송비를 입력하세요.");
        }

        try {
            const result = await DeliveryAreaCharge.create({
                sido : data.sido,
                sigugun : data.sigugun,
                idDeliveryAreaPolicy : id,
                addCharge : data.addCharge,
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
     * 지역별 추가배송비 삭제 
     * 
     * @param {int} idDeliveryAreaPolicy 지역별 추가배송비 조건 등록번호 
     * @param {String} sido 시도
     * @param {String} sigugun 시구군
     * @returns {Boolean}
     */
    async deleteCharge(idDeliveryAreaPolicy, sido, sigugun) {
        if (!idDeliveryAreaPolicy || !sido || sido.trim() == "") {
            return false;
        }

        const where = {
            idDeliveryAreaPolicy,
            sido,
        }

        if (sigugun && sigugun.trim() != "") {
            where.sigugun = sigugun;
        }

        try {
            const result = await DeliveryAreaCharge.destroy({
                where,
            });

            return result > 0;
        } catch (err) {
            logger(err);
            return false;
        }
    },
    /**
     * 지역별 추가배송비 목록 
     * 
     * @param {int} idDeliveryAreaPolicy 지역별 추가배송비 조건 등록번호
     * @returns {Array|Boolean}
     */
    async getCharges(idDeliveryAreaPolicy) {
        if (!idDeliveryAreaPolicy) {
            return false;
        }

        try {
            const list = await DeliveryAreaCharge.findAll({
                where : { idDeliveryAreaPolicy },
                Order : [['sido', 'ASC'], ['sigugun', 'ASC']],
                raw : true,
            });
            
            return list;
        } catch (err) {
            logger(err);
            return false;
        }

    }
};

module.exports = deliveryAreaDao;