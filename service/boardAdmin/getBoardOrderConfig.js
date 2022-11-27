const { getConfig } = require("../../library/common");
const boardDao = require("../../models/board/boardDao");

/**
 * 게시판 진열 설정에 따른 설정 정보 가져오기
 * 
 * @param {*} location 
 */
module.exports = async (location) => {
    if (!location) {
        return false;
    }

    const boards = [];
    const list = await boardDao.gets(1, 'all');
    const key = `boardListOrder_${location}`;
    const configs = await getConfig(key);

    for (const li of list) {
        if (!li.showConfig || !li.showConfig.location ) {
            continue;
        }

        const locs = li.showConfig.location;
        if (locs.indexOf(location) == -1) {
            continue;
        }

        let listOrder = 0;
        if (configs) {
            for (const conf of configs) {
                if (conf.id == li.id) {
                    listOrder = parseInt(conf.listOrder);
                    break;
                }

            }
        }

        const data = {
            id : li.id,
            title : li.title,
            listOrder,
        };

        boards.push(data);
    }

    if (boards.length > 0) {
        boards.sort((a, b) => a.listOrder - b.listOrder);
    }

    return boards;
};