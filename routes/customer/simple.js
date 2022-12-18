const express = require('express');
const router = express.Router();

/**
 * 간편주문서 접수목록
 */
router.route("/")
    .get((req, res) => {
        const limit = req.query.limit || 20;
        const data = {
            subMenuUrl : "/customer",
            limits : [20, 50, 100, 500, 1000],
            limit,
        };

        return res.render("customer/simple", data);
    })
    .post((req, res) => {

    });


module.exports = router;