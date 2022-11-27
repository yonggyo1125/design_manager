const express = require('express');
const router = express.Router();


router.route("/")
    .get((req, res) => {
        res.locals.locTitle = "바코드 생성";
        const code = req.query.code;
        const addScript = ['jquery-3.6.1.min', 'JsBarcode.all.min'];
        const width = req.query.width || 1;
        const height = req.query.height || 10;
        const data = { code, addScript, width, height };

        
        return res.render("order/barcode", data);
    });


module.exports = router;