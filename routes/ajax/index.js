const express = require('express');
const { getSigugun } = require('../../library/area');
const router = express.Router();

const sizeCalculator = require('./sizeCalculator');
const deliveryCharge = require('./deliveryCharge');
/**
 * 시구군 조회 
 * 
 */
router.get("/sigugun/:sido", (req, res) => {
    const sido = req.params.sido;
    const siguguns = getSigugun(sido);
    return res.json(siguguns);
});


router.use("/size_calculator", sizeCalculator);
router.use("/delivery_charge", deliveryCharge);
module.exports = router;
