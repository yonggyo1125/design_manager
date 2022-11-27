const { logger } = require('../../library/common');
const { ProductGuide, sequelize, Sequelize : { Op } } = require("..");
const fileDao = require("../../models/file/dao");
const Pagination = require('../../library/pagination');

/**
 * 사용방법안내 DAO
 * 
 */
const guideDao = {
    _total : 0, // 전체 사용 방법 안내
    _pagination : "",
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
     * 사용방법 안내 저장 처리 
     * 
     * @param {*} data 
     */
    async save(data) {
        // 공통 데이터
        const commonData = {
            title : data.title,
            content : data.content,
        };
        const transaction = await sequelize.transaction();
        try {
            
            
            if (data.mode == 'update') { // 수정 
                
                await ProductGuide.update(commonData, { where : { id : data.id }, transaction});

            } else { // 추가
                commonData.gid = data.gid;
                await ProductGuide.create(commonData, { transaction });
            }
            
            // 파일 업로드 완료 처리 
            await fileDao.updateDone(data.gid + "_movie", transaction);
            await fileDao.updateDone(data.gid + "_image", transaction);
            await fileDao.updateDone(data.gid + "_editor", transaction);

            transaction.commit();   
        } catch (err) {
            logger(err);
           await transaction.rollback();
        }
    },
    /**
     * 사용방법안내 조회
     * 
     * @param {*} id 
     */
    async get(id) {
        if (!id) {
            return false;
        }

        try {
            const data = await ProductGuide.findByPk(id, { raw : true });
            if (data) {
                const movies = await fileDao.gets(data.gid + "_movie", true);
                const images = await fileDao.gets(data.gid + "_image", true);
                const editors = await fileDao.gets(data.gid + "_editor", true);

                data.movies = movies || [];
                data.images = images || [];
                data.editors = editors || [];

                data.guideUrl = `/guide/${data.id}`;
            }
            return data;
        } catch (err) {
            logger(err);
            return false;
        }
    },
    /**
     * 사용방법안내 목록
     * 
     * @param {int} page 페이지 번호
     * @param {int} limit 1페이지당 레코드 수 
     * @param {Object} req 
     * @param {Object} search
     */
    async gets(page, limit, req, search) {
        page = page || 1;
        limit = limit || 20;
        let offset = 0;
        if (limit != 'all') {
            if (isNaN(limit)) limit = Number(limit);
            offset = (page - 1) * limit;
        }
        
        const where = {}, andWhere = [], orWhere = [];


        if (andWhere.length > 0) {
            where[Op.and] = andWhere;
        }

        if (orWhere.length > 0) {
            where[Op.or] = orWhere;
        }
        
        const params = {
            order : [['id', 'DESC']],
            where,
            raw : true,
        };
        
        if (limit != 'all') {
            params.limit = limit;
            params.offset = offset;
        }

        const list = await ProductGuide.findAll(params);

        if (limit == 'all') {
            return list;
        }

        /** 총 사용방법 수 */
        this.total = await ProductGuide.count({ where });
        
        /** 페이징 처리 */
        if (req) {
            this.pagination = new Pagination(req, page, this.total, null, limit).getPages();
        }

        return list;
    },
    /**
     * 사용방법안내 삭제
     * 
     * @param {*} ids 
     */
    async delete(ids) {
        if (!ids) {
            return false;
        }

        if (!(ids instanceof Array)) {
            ids = [ids];
        }

        const list = await ProductGuide.findAll({
            where : { id : { [Op.in] : ids }},
            raw : true,
        });
        
        if (list.length == 0) {
            return false;
        }

        for (const li of list) {
            const transaction = await sequelize.transaction();
            try {
                
                await ProductGuide.destroy({ where : { id : li.id }, transaction })
                await fileDao.deletes(li.gid + "_movie", transaction);
                await fileDao.deletes(li.gid + "_image", transaction);
                await fileDao.deletes(li.gid + "_editor", transaction);

                transaction.commit();
            } catch (err) {
                transaction.rollback();
                logger(err);
            }
        } // endfor

    }
};

module.exports = guideDao;