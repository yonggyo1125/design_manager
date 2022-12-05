const { sequelize, Sequelize : { QueryTypes }} = require('../../models/index');
const { getUTCDate } = require('../../library/common');

/**
 * 상담 접수일로 상담원 통계 조회
 * 
 * @param {*} sdate 
 * @param {*} edate 
 */
module.exports = async (sdate, edate) => {
    const replacements = {};
    let sql = `SELECT COUNT(*) cnt, m.managerNm, m.managerId FROM customerServices c, managers m WHERE c.idManager = m.id`;

    if (sdate) {
       sql += " AND c.createdAt >= :sdate";
       const createdSdate = getUTCDate(sdate);
       replacements.sdate = createdSdate;
    }

    if (edate) {
        sql += " AND c.createdAt < :edate";
        const createEdate = getUTCDate(edate);
        createEdate.setDate(createEdate.getDate() + 1);

        replacements.edate = createEdate;
    }
    sql += " GROUP BY c.idManager";
    const rows = await sequelize.query(sql, {
        replacements,
        type : QueryTypes.SELECT,
    });
    

    return rows || [];
};