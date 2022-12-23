const express = require('express');
require('express-async-errors');
const router = express.Router();
const categoryDao = require('../../../../models/product/categoryDao');
const productSvc = require('../../../../service/api/product');

// 품목분류 목록 
router.get("/categories", async (req, res, next) => {
    try {
        let data = await categoryDao.gets("sale", ["cateCd", "cateNm"]);
        data = data || [];

        res.json(data);
    } catch (err) {
        next(err);
    }
});

// 품목 리스트
router.get("/list", async (req, res, next) => {
    try {
        const result = await productSvc.gets(req);
        res.json(result);
    } catch (err) {
        next(err);
    }
});

// 기본 옵션
router.get("/options/:id", async (req, res, next) => {
    try {
        const options = await productSvc.getOptions(req.params.id);
        res.send(options);
    } catch (err) {
        next(err);
    }
});

// 텍스트 옵션
router.get("/text_options/:id", async (req, res, next) => {
    try {
        const textOptions = await productSvc.getText(req.params.id);
        res.send(textOptions);
    } catch (err) {
        next(err);
    }
});

// 추가 옵션
router.get("/sub_options/:id", async (req, res, next) => {
    try {
        const subOptions = await productSvc.getSub(req.params.id);
        res.send(subOptions);
    } catch (err) {
        next(err);
    }
});

// 품목 조회
router.get("/:id",  async (req, res , next) => {
    try {  
        const item = await productSvc.get(req.params.id);
        res.json(item);
    } catch (err) {
        next(err);
    }
});

module.exports = router;