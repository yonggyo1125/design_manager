const holidayDao = require("../../models/holiday/dao");

/**
 * 휴무일 체크 
 * 
 */
module.exports = async (type, date) => {

    const isHoliday = await holidayDao.isHoliday(type, date);
    
    return isHoliday;
};