const express = require('express');
const router = express.Router();
const { alert } = require("../../library/common");
const getGuide = require("../../service/product/getGuide");

router.get("/:id", async (req, res) => {
    try {
        const data = await getGuide(req.params.id);
        res.render("client/guide", data);
    } catch (err) {
        alert(err.message, res, -1);
    }
});

module.exports = router;