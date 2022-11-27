const { logger } = require('../../library/common');
const { BoardSize, BoardSizeAdd, Sequelize  } = require('..');

/**
 * 보드형 사이즈 DAO
 * 
 */
const BoardSizeDao = {
    /**
     * 설정 추가 
     * 
     * @param {Object} data
     */
    async add(data) {
        try {
            const result = await BoardSize.create({
                sizeNm : data.sizeNm,
                sizeDirection : data.sizeDirection || 'portrait',
                sizeType : data.sizeType,
                width : data.width || 0,
                height : data.height || 0,
            });

            if (!result) {
                return false;
            }
            
            return true;
        } catch (err) {
            logger(err);
            return false;
        }
    },
    /**  
     * 설정 수정
     * 
     */
    async edit(id, upData) {
        try {
             await BoardSize.update(upData, { where : { id} });
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
                await BoardSize.destroy({
                    where : { id }
                });
            }
        } catch (err) {
            logger(err);
            return false;
        }
    },
    /**
     * 보드형 사이즈 조회
     * 
     * @param {string} sizeNm : 설정이름 
     * @param {string} direction : portaint 세로형, landscape 가로형
     * @returns {Boolean|Array}
     */
    async gets(sizeNm, direction) {
        try {
            const order = [['sizeNm', 'ASC'], ['width', "ASC"], ["height", "ASC"]];
            const where = {};
            if (sizeNm) {
                where.sizeNm = sizeNm;
            }

            if (direction) {
                where.sizeDirection = direction;
            }
            const rows = await BoardSize.findAll({
                order,
                where,
                raw: true,   
            });         
             
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
     * 보드형 사이즈 이름 목록 
     * 
     */
    async getSizeNms() {
        try {
            const data = await BoardSize.findAll({
                attributes : [Sequelize.fn('DISTINCT', Sequelize.col('sizeNm')), 'sizeNm' ],
                raw : true,
            });
           
            const list = data.map(v => v.sizeNm);
            return list;
        } catch (err) {
            logger(err);
            return false;
        }
    },
    /**
     * 보드형 사이즈 추가설정 등록 
     * 
     * @param {Object} data
     */
    async addConfig(data) {
        if (!data) {
            return false;
        }
        try {
            const inData = {
                configNm : data.configNm,
                minPrice : data.minPrice || 0,
                addPriceByArea : data.addPriceByArea,
                exceptMinSize : data.exceptMinSize || 0,
                minSize : data.minSize || 0,
                maxSize : data.maxSize || 0,
            };

            await BoardSizeAdd.create(inData);
            
            return true;
        } catch (err) {
            logger(err);
            return false;
        } 
    },
     /**
     * 보드형 사이즈 추가설정 수정
     * 
     * @param {int} id : 등록번호 
     * @param {Object} upData : 수정데이터
     */
    async editConfig(id, upData) {
        if (!id || !upData) {
            return false;
        }

        try {
            await BoardSizeAdd.update(upData, { where : {id} });
        } catch (err) {
            logger(err);
            return false;
        }
    },
     /**
     * 보드형 사이즈 추가설정 삭제
     * 
     * @param {int|Array} ids: 등록번호 
     */
    async deleteConfig(ids) {
        if (!ids) {
            return false;
        }

        if (!Array.isArray(ids)) {
            ids = [ids];
        }

        try {
            await BoardSizeAdd.destroy({
                where : { id : { [Sequelize.Op.in] : ids }}
            });
        } catch (err) {
            logger(err);
            return false;
        }

    },
    /**
     * 보드형 사이즈 추가설정 목록 
     * 
     */
    async getConfigs() {
        try {
            const rows = await BoardSizeAdd.findAll({ raw : true });
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
     * 보드형 사이즈 추가 설정 조회
     * 
     * @param {int} id
     */
    async getConfig(id) {
        if (!id) {
            return false;
        }
        try {
            const data = await BoardSizeAdd.findByPk(id, { raw : true });

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

module.exports = BoardSizeDao;