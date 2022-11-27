const express = require('express');
const router = express.Router();

const generateUrlAccessToken = require("../service/utils/generateUrlAccessToken");

router.get("/", async (req, res) => {

    //const token = await generateUrlAccessToken("/mypage/1664265515201", 300000);
    
    //return res.send("");
});
module.exports = router;