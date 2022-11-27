const { saveConfig } = require("../../library/common");
/**
 * 위치별 게시판 진열 순서 변경
 * 
 * @param {*} req 
 */
module.exports = async (req) => {
    const data = req.body;
    const loc = data.showLocation;
    let ids = data.id;
    if (!ids || !loc) {
        throw new Error("잘못된 접근입니다.");
    }

    if (!(ids instanceof Array)) {
        ids = [ids]; 
    }
    const configData = [];
    for (const id of ids) {
        const listOrder = data[`listOrder_${id}`] || 0;
        configData.push({
            id,
            listOrder,
        });
    }

    const key = `boardListOrder_${loc}`;
    await saveConfig(key, configData);
};