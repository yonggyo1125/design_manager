const { BoardTemplate, Sequelize : { Op } } = require("..");

/**
 * 게시글 양식 DAO
 * 
 */
const boardTemplateDao = {
    /**
     * 게시글 양식 저장
     * 
     * @param {*} data 
     */
    async save(data) {
        if (!data || !data.title || data.title.trim() == "" || !data.content || data.content.trim() == "") {
            return false;
        }
        
        const commonData = {
            title : data.title,
            content : data.content,
        };

        if (data.mode == 'update') { // 수정
            await  BoardTemplate.update(commonData, { where : { id : data.id }});
        } else { // 추가
            await BoardTemplate.create(commonData);
        }
        return true;
    },
    /**
     * 게시글 양식 조회
     * 
     * @param {*} id 
     */
    async get(id) {
        if (!id) {
            return false;
        }

        const data = await BoardTemplate.findByPk(id, { raw : true });

        return data;
    },
    /**
     * 게시글 양식 목록
     * 
     * @returns 
     */
    async gets() {
        const list = await BoardTemplate.findAll({
                order : [['title', 'ASC']],
                raw : true 
            });

        return list;
    },
    /**
     * 게시글 삭제
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

        await BoardTemplate.destroy({ where : { id :  { [Op.in] : ids }}});

        return true;
    }

};

module.exports = boardTemplateDao;