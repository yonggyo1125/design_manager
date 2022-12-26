const axios = require('axios');
const express = require('express');
const { BoardData } = require("../models");
require('express-async-errors');
const router = express.Router();

//const generateUrlAccessToken = require("../service/utils/generateUrlAccessToken");

router.get("/", async (req, res) => {
    const result = await axios({
        method: "GET",
        url : "https://n-mk.com/shop/dbport/board.php?id=manage_material",
    });
    
    let listOrder = Date.now();
    for (const li of result.data) {
        listOrder++;
        const cnt = await BoardData.count({ where : {extra1 : li.idx}});
        if (cnt > 0) continue;
        let contents = li.contents;
        contents = contents.replace(/http:\/\/n-mk.com/g, "https://dm.n-mk.kr");
        const params = {
            gid : li.gid,
            poster : li.post_name || "강진석",
            guestPw : li.password,
            isNotice : li.is_notice == "1"?true:false,
            category : li.category,
            subject : li.subject,
            content : contents,
            totalComments : li.commentCnt || 0,
            ipAddr : li.ip,
            userAgent : "",
            useEditor : true,
            extra1 : li.idx,
            listOrder,
            idBoard : "manage_material",
            idManager : 2,
        };

        await BoardData.create(params); 
    }


    return res.send("");
    
});
module.exports = router;