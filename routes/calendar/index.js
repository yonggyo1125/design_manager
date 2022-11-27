const express = require('express');
const calendar  = require('../../library/calendar');
const { getYoils } = require('../../library/common');
const router = express.Router();

router.get("/", async (req, res) => {
    const date = new Date();
    const year = req.query.year || date.getFullYear();
    const month = req.query.month || date.getMonth() + 1;
    const mode = req.query.mode;
    let data = {};
    if (mode == 'customer_apply') {
         data = await require('../../models/customer/dao').getCalendar(year, month);
    } else {
        data = calendar.get(year, month);
    }
    data.mode = mode;
    data.yoils = getYoils();
    data.search = req.query;
    res.render("calendar/index", data);
});

module.exports = router;