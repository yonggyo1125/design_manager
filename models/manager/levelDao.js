const { Level, Sequelize : { Op } } = require('..');
const {  logger } = require('../../library/common');


const levelDao = {
    _total : 0, // 전체 회원 수 
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
     * 관리레벨 등록 
     * 
     * @param {Object} data
     * @returns {Boolean}
     */
    async add(data) {
        if (!data) {
            return false;
        }

        try {
            let roles = data.roles || [];
            if (!(roles instanceof Array)) {
                roles = [roles];
            }

            const result = await Level.create({
                level : data.level || 0,
                levelNm : data.levelNm,
                roles,
            });

            if (!result) {
                return false;
            }

            return true;
        }  catch (err) {
            logger(err);
            return false;
        }     
    },
    /**
     * 관리레벨 목록 
     * 
     */
    async gets() {
        try {
            const list = await Level.findAll({
                order: [['level', 'ASC']],
                raw : true,
            });
            
            for (li of list) {
                if (typeof li.roles == 'string') {
                    li.roles = JSON.parse(li.roles);
                }
            }

            return list;
        } catch (err) {
            logger(err);
            return false;
        }
    },
    /**
     * 관리레벨 조회
     * 
     * @param {int} level 관리레벨
     * @returns {Object|Boolean}
     */
    async get(level) {
        if (!level) {
            return false;
        }

        try {
            const data = await Level.findByPk(level, { raw : true });
            if (!data) {
                return false;
            }

            data.roles = data.roles || [];
            if (typeof data.roles == 'string') {
                data.roles = JSON.parse(data.roles);
            }
            
            return data;
        } catch (err) {
            logger(err);
            return false;
        }
    },
    /**
     * 관리레벨 수정 
     * 
     * @param {Object} data
     * @returns {Boolean}
     */
    async updates(data) {
        if (!data || !data.level) {
            return false;
        }

        let levels = data.level;
        if (!(levels instanceof Array)) {
            levels = [levels];
        }

        try {
            for await (level of levels) {
                const levelNm = data[`levelNm_${level}`];
                let roles = data[`roles_${level}`];
                if (levelNm.trim() == "" || !roles || roles.length == 0) {
                    continue;
                }
                if (!(roles instanceof Array)) {
                    roles = [roles];
                }

                await Level.update({
                    levelNm,
                    roles,
                }, { where : { level }});
            }

            return true;
        }  catch (err) {
            logger(err);
            return false;
        }
    },
    /**
     * 관리레벨 삭제 
     * 
     * @param {levels}
     * @returns {Boolean}
     */
    async delete(levels) {
        if (!levels) {
            return false;
        }

        try {
            if (!(levels instanceof Array)) {
                levels = [levels];
            }

            const result = await Level.destroy({
                where : { level : { [Op.in] : levels }}
            });

            return result > 0;
        } catch (err) {
            logger(err);
            return false;
        }
    }
};

module.exports = levelDao;