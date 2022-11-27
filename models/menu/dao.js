const { Menu } = require('..');
const { logger } = require('../../library/common');

/**
 * 메뉴 DAO
 * 
 */
const menuDao = {
    /**
     * 메뉴 추가
     * 
     * @param {Object} data
     * @returns {Boolean} 
     */
    async add(data) {
        if (!data) {
            return false;
        }

        try {
            const result = await Menu.create({
                type : data.type,
                title : data.title.trim(),
                url : data.url.trim(),
                parentId : data.parentId || 0,
                listOrder : data.listOrder || 0,
                subUrls : data.subUrls,
                isUse : (data.isUse == 1)?true:false,
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
     * 메뉴 목록
     * 
     * @param {Object} search 
     */
    async gets(search) {
        try {
            const where = {};
            /** 검색 처리 S */
            if (search) {
                if (search.hasOwnProperty('parentId'))  where.parentId = search.parentId;
                if (search.isUse) where.isUse = search.isUse;
                if (search.type) where.type = search.type;
            }
            
            /** 검색 처리 E*/
            const list = await Menu.findAll({
                order : [['parentId', 'ASC'], ['listOrder', 'DESC'], ['createdAt', 'ASC']],
                where,
                raw : true,
            });

            return list;
        } catch (err) {
            logger(err);
            return false;
        }
    },
    /**
     * 메뉴 조회 
     * 
     * @param {int} id 메뉴 등록 번호
     * @returns {Boolean|Object}
     */
    async get(id) {
        if (!id) {
            return false;
        }

        try {
            const data = await Menu.findByPk(id, { raw : true });
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
     * 메뉴 목록 수정 
     * 
     * @param {data}
     * @returns {Boolean}
     */
    async updates(data) {
        if (!data || !data.id) {
            return false;
        }

        let ids = data.id;
        if (!(ids instanceof Array)) {
            ids = [ids];
        }
        try {
            for await (id of ids) {
                await Menu.update({
                    listOrder : data[`listOrder_${id}`] || 0,
                    isUse : (data[`isUse_${id}`] == 1)?true:false,
                }, { where : { id }});
            }

            return true;
        } catch (err) {
            logger(err);
            return false;
        }
    },
    /**
     * 메뉴 수정 
     * 
     * @param {Object} data
     * @returns {Boolean}
     */
    async update(data) {
        if (!data || !data.id) {
            return false;
        }

        try {
            let accessLevel = data.accessLevel || [];
            if (!(accessLevel instanceof Array)) {
                accessLevel = [accessLevel];
            }
            
            const result = await Menu.update({
                type : data.type,
                title : data.title.trim(),
                url : data.url.trim(),
                parentId : data.parentId || 0,
                listOrder : data.listOrder || 0,
                isUse : (data.isUse == 1)?true:false,
                accessLevel,
                subUrls : data.subUrls,
            }, { where : { id : data.id }});
            
            return result[0] > 0;
        } catch (err) {
            logger(err);
            return false;
        }
    },
    /**
     * 메뉴 삭제
     * 
     * @param {Array|Int} ids
     * @returns {Boolean}
     */
    async delete(ids) {
        if (!ids) {
            return false;
        }

        if (!(ids instanceof Array)) {
            ids = [ids];
        }

        try {
            for await (id of ids) {
                await Menu.destroy({ where : { id } });
            }

            return true;
        } catch (err) {
            logger(err);
            return false;
        }
    }
};

module.exports = menuDao;