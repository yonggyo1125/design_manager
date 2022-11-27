const { PaymentItem, Manager } = require("../../models");
const { logger } = require('../../library/common');
const paymentDao = require('./dao');

/**
 * 결제 품목 DAO
 * 
 */
const paymentItemDao = {
    /**
     * 결제 등록 
     * 
     * @param {Object} data 결제상품 등록 정보 
     * @returns {Object|Boolean}
     */
    async add(data) {
        if (!data) {
            return false;
        }
        let cellPhone = "";
        if (data.cellPhone) {
            cellPhone = data.cellPhone.replace(/[^\d]/g, "");
        }

        const result = await PaymentItem.create({
            gid : data.gid,
            title : data.title,
            amount : data.amount || 0,
            name : data.name,
            cellPhone,
            description : data.description,
            csMemo : data.csMemo,
            idManager : data.idManager,
        });

        if (!result) {
            return false;
        }

        return result;
    },
    /**
     * 결제 수정 
     * 
     * @param {Object} data 결제수정 정보
     * @returns {Boolean}
     */
    async update(data) {
        if (!data || !data.id) {
            return false;
        }

        let cellPhone = "";
        if (data.cellPhone) {
            cellPhone = data.cellPhone.replace(/[^\d]/g, "");
        }
        
        const result = await PaymentItem.update({
            title : data.title,
            amount : data.amount || 0,
            name : data.name,
            cellPhone,
            description : data.description,
            csMemo : data.csMemo,
        }, { 
            where : { id : data.id }
        });

        return result[0] > 0;
    }, 
    /**
     * 그룹ID별 결제 품목 목록 
     * 
     * @param {String} gid,
     * @returns {Array|Boolean}
     */
    async gets(gid) {
        if (!gid) {
            return false;
        }
        try {
            const list = await PaymentItem.findAll({
                include : [{
                    model : Manager,
                    attributes : ["managerId", "managerNm"],
                }],
                order : [['id', 'DESC']],
                where : { gid },
                raw : true,
            });
            if (!list.length) {
                return false;
            }

            for await (li of list) {
                await this.updateInfo(li);
            }
            return list;
        } catch (err) {
            logger(err);
            return false;
        }
    },
    /**
     * 추가 정보 업데이트 
     * 
     */
    async updateInfo(data) {
        if (!data) {
            return;
        }

        data.payUrl = `/payment/process/${data.id}`;

        /**  결제 처리 내역  */
        data.payments = await paymentDao.getsByItem(data.id);
    },
    /**
     * 결제 삭제
     * 
     * @param {int} id 결제등록 id
     * @returns {Boolean}
     */
    async delete(id) {
        if (!id) {
            return false;
        }

        try {
            const result = await PaymentItem.destroy({ where : { id } });
            return result > 0;
        } catch (err) {
            logger(err);
            return false;
        }
    },
    /**
     * 결제품목 정보 조회 
     * 
     * @param {int} id 결제등록 id
     * @returns {Object|Boolean}
     */
    async get(id) {
        if (!id) {
            return false;
        }

        try {
            const data = await PaymentItem.findOne({
                include : [{
                    model : Manager,
                    attributes : ["managerNm", "managerId"],
                }],
                where : { id },
                raw : true,
            });

            if (!data) return false;

            return data;
        } catch (err) {
            logger(err);
            return false;
        }
    }
};

module.exports = paymentItemDao;