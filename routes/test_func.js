const axios = require('axios');
const express = require('express');
const { sequelize, Sequelize : { Op }} = require("../models");
require('express-async-errors');
const router = express.Router();

//const generateUrlAccessToken = require("../service/utils/generateUrlAccessToken");

router.get("/", async (req, res) => {
    const result = await axios({
        method: "GET",
        url : "https://n-mk.com/shop/dbport/board.php?id=training",
    });
    

    for (const li of result.data) {
        console.log(li);
    }


    return res.send("");
    
});
module.exports = router;