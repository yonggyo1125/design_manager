const express = require('express');
require('express-async-errors');
const multer = require('multer');
const orderDao = require('../../models/order/dao');

const router = express.Router();
const formData = multer();

router.use(formData.array());
router.post('/', async (req, res) => {
    const data = req.body;
    if (!data) {
        return {};
    }

    await orderDao.updatePriceSummary(data);

    if (!data.idProductItem) {
        return {};    
    }

    if (!Array.isArray(data.idProductItem)) {
        data.idProductItem = [data.idProductItem];
    }

    const deliveryChargeItems = [];
    let totalDeliveryCharge = 0, packageTotalDeliveryCharge = 0;
    for (id of data.idProductItem) {
        let deliveryCharge = Number(data[`deliveryCharge_${id}`]);
        if (isNaN(deliveryCharge)) deliveryCharge = 0;
        let packageDelivery = data[`packageDelivery_${id}`] || "package";
        if (packageDelivery == 'package') {
            packageTotalDeliveryCharge += deliveryCharge;
        }
        
        totalDeliveryCharge += deliveryCharge;

        deliveryChargeItems.push({ id, deliveryCharge, packageDelivery });
    }

   res.json({ deliveryChargeItems, totalDeliveryCharge, packageTotalDeliveryCharge });
});

module.exports = router;