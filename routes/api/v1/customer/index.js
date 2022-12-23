const express = require("express");
require('express-async-errors');
const router = express.Router();
const customerService = require("../../../../service/api/customer");

/** 상담 등록 */
router.post("/add", async (req, res) => {
    const result = await customerService.add(req);
    res.json(result);
});


/** 상담 조회 */
router.all("/:id", async (req, res) => {
    const result = await customerService.get(req);
    res.json(result);
});

/** 상담 삭제 */
router.all("/delete/:id", async (req, res) => {
    const result = await customerService.delete(req);
    res.json({ success : result });
});

/** 상담 분류 조회 */
router.get("/categories", async (req, res) => {
    const categories = await customerService.getCategories();
    res.json(categories);
});

module.exports = router;