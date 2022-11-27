const boardDao = require('../../models/board/boardDao');
module.exports = async () => {
    const skins = await boardDao.getSkins();
    return skins;
};