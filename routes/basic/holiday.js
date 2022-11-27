const express = require('express');
const { alert, reload, getException, getConfig, getYoils } = require('../../library/common');
const holidayDao = require('../../models/holiday/dao');
const HolidayUpdateException = getException("Holiday/HolidayUpdateException");
const router = express.Router();

/**
 * 배송휴무일 관리 
 * 
 */
router.use((req, res, next) => {
    res.locals.locTitle = "휴무일 관리";
    res.locals.addCss = ["calendar"];
    next();
});


/**  배송휴무일 관리 */
router.route("/")
    .get(async (req, res) => {
        const year = req.query.year;
        const month = req.query.month;
        const data = await holidayDao.getCalendar(year, month);
        data.yoils = getYoils();
        data.holidayYoils = await getConfig("holiday", "holidayYoils");
        data.csHolidayYoils = await getConfig("csHoliday", "csHolidayYoils");
        res.render("basic/holiday/index", data);
    })
    .post(async (req, res) => {
        try {
            const result = await holidayDao.update(req);
            if (!result) {
                throw new HolidayUpdateException("설정 저장에 실패하였습니다.");
            }

            reload(res, "parent");
        } catch (err) {
            alert(err.message, res);
        }
    });

module.exports = router;