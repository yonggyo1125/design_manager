const { Board } = require('../../models');

/**
 * 게시판 노출 설정 저장 처리 
 * 
 * @param {*} req 
 */
module.exports = async (req) => {
    const data = req.body;
    let ids = data.id;

    if (!ids) {
        throw new Error("등록된 게시판이 없습니다.");
    }

    if (!(ids instanceof Array)) {
        ids = [ids];
    }

    for await (const id of ids) {
        const config = {};
        config.id = id;
        config.location = data[`showLocation_${id}`] || [];
        config.level = data[`showLevel_${id}`] || [];

        if (!(config.location instanceof Array)) config.location = [config.location];

        if (!(config.level instanceof Array)) config.level = [config.level];

        await Board.update({ showConfig : config}, { where : { id }});
    }
};