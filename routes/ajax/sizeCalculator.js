const express = require('express');
const router = express.Router();

const sizeCalculator = require('../../service/order/sizeCalculator');

/** 사이즈 계산기 설정 조회 */
router.get("/config/:id", async (req, res) => {
    try {
        const id = req.params.id;
        if (!id) {
            throw new Error("품목 ID 누락");
        }
        
        const data = await sizeCalculator.getConfig(id);
        if (!data) {
            throw new Error("설정이 존재하지 않습니다.");
        }
        res.json({ isSuccess : true, data });
    } catch (err) {
        res.json({ isSuccess : false, message : err.message });
    }
});

/** 사이즈 계산기 가격 조회 */ 
router.get("/price/:id", async (req, res) => {
    try {
        const id = req.params.id;
        if (!id) {
            throw new Error("품목 ID 누락");
        }
        
        const data = await sizeCalculator.process(id, req.query.width, req.query.height);

        if (!data) {
            throw new Error("설정이 존재하지 않습니다.");
        }
        res.json({ isSuccess : true, data });

    } catch (err) {
        res.json({ isSuccess : false, message : err.message });
    }
});

module.exports = router;