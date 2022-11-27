const { logger } = require('../../library/common');
const { SizeConfig, SizeConfigDelivery, Sequelize : { Op} } = require('..');

/**
 * 사이즈 계산기 설정 DAO 
 * 
 */
const SizeConfigDao = {
    /**
     * 설정 추가 
     * 
     */
    async add(data) {
        try {
            await SizeConfig.create({
                configNm : data.configNm,
                sqmPrice : data.sqmPrice || 0,
                sqmPriceB2B : data.sqmPriceB2B || 0,
                minSqm : data.minSqm || 0,
                maxSqm : data.maxSqm || 0,
                basicSize : data.basicSize,
                maxSize : data.maxSize,
                sampleSize : data.sampleSize,
                boardSizeNm : data.boardSizeNm,
                idBoardSizeAdd : data.idBoardSizeAdd || 0,
                idSizeDeliveryConfig : data.idSizeDeliveryConfig || 0,
                cutUnit : data.cutUnit || '1',
                cutType : data.cutType || "round",
            });

            return true;
        } catch (err) {
            logger(err);
            return false;
        }
    },
    /**
     * 설정 데이터 
     */
    async edit(id, upData) {
        try {
            await SizeConfig.update(upData, { where : { id } });
            
            return true;
        } catch (err) {
            logger(err);
            return false;
        }
    },
    /**
     * 설정 삭제 
     * 
     */
    async delete(ids) {
        if (!ids) {
            return false;
        }

        if (!Array.isArray(ids)) {
            ids = [ids];
        }

        try {
            for await (id of ids) {
                await SizeConfig.destroy({where : { id } });
            }

            return true;
        } catch (err) {
            logger(err);
            return false;
        }
    },
    /**
     * 설정 목록 조회
     * 
     */
    async gets() {
        try {
            const list = await SizeConfig.findAll({
                raw : true,
            });

            if (!list) {
                return false;
            }

            return list;
        } catch (err) {
            logger(err);
            return false;
        }
    },
    /**
     * 사이즈 설정 조회
     * 
     * @param {int} id
     */
    async get(id) {
        if (!id) {
            return false;
        }

        try {
            const data = await SizeConfig.findByPk(id, {
                raw : true,
            });
            if (!data) {
                return false;
            }
            return data;
            
        } catch (err) {
            logger(err);
            return false;
        }
    },
    /**
     * 사이즈별 추가배송비 등록
     * 
     *  @param {Object} data
     */
    async addSizeDelivery(data) {
        if (!data) 
            return false;

        try {
            data.size = data.size || 0;
            data.addPrice = data.addPrice || 0;
            data.sizeType = data.sizeType || 'width';

            await SizeConfigDelivery.create(data);

            return true;
        } catch (err) {
            logger(err);
            return false;
        }
    },
    /**
     * 사이즈별 추가 배송비 수정
     * 
     */
    async editSizeDelivery(id, upData) {
        if (!id || !upData) {
            return false;
        }

        try {
            await SizeConfigDelivery.update(upData, {
                where : { id }
            });

            return true;
        } catch (err) {
            logger(err);
            return false;
        }
    },
    /**
     * 사이즈별 추가 배송비 삭제
     * 
     */
    async deleteSizeDelivery(ids) {
        if (!ids) {
            return false;
        }

        if (!Array.isArray(ids)) {
            ids = [ids];
        }

        await SizeConfigDelivery.destroy({
            where : { id : { [Op.in] : ids }}
        });

        return true;
    },
    /** 
     * 사이즈별 추가배송비 목록 
     * 
     */
    async getSizeDeliveries() {
        try {
            const rows = await SizeConfigDelivery.findAll({ raw : true });
            if (!rows) {
                return false;
            }

            return rows;
        } catch (err) {
            logger(err);
            return false;
        }
    },
    /**
     * 사이즈별 추가 배송비 조회
     * 
     * @param {int} id
     */
    async getSizeDelivery(id) {
        if (!id) {
            return false;
        }

        try {
            const data = await SizeConfigDelivery.findByPk(id, { raw : true });
            if (!data) {
                return false;
            }

            return data;
        } catch (err) {
            logger(err);
            return false;
        }
    }
}; 

module.exports = SizeConfigDao;