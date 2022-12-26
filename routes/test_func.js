const axios = require('axios');
const express = require('express');
const { Comment, BoardData, Sequelize : { Op } } = require("../models");
require('express-async-errors');
const router = express.Router();

//const generateUrlAccessToken = require("../service/utils/generateUrlAccessToken");
/** 
router.get("/", async (req, res) => {
    const result = await axios({
        method: "GET",
        url : "https://n-mk.com/shop/dbport/board.php?id=c_s",
    });
    
    let listOrder = Date.now();
    for (const li of result.data) {
        listOrder++;
        const cnt = await BoardData.count({ where : {extra1 : "" + li.idx}});
        if (cnt > 0) continue;
        let contents = "" + li.contents;
        contents = contents.replace(/http:\/\/n-mk.com/g, "https://dm.n-mk.kr");
        try {
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
            extra1 : "" + li.idx,
            listOrder,
            idBoard : "c_s",
            idManager : 2,
        };

        await BoardData.create(params); 
        } catch (e) {
            console.log(e);
            continue;
        }
    }



    return res.send("");
    
});
*/

router.get("/", async (req, res) => {
    const list = await BoardData.findAll({ 
        attributes: ["id", "extra1"],
        where: { totalComments : { [Op.gt] : 0 }} 
    });
    for (const li of list) {
        
        const idx = li.extra1;
        if (!idx) continue; 

        let url = `https://n-mk.com/shop/dbport/comment.php?idx=${idx}`;
        const result = await axios({
            method : "GET",
            url,
        });
        if (!result) continue;
        let gid = Date.now();
        for (const data of result.data) {
            gid++;
            const cnt = await BoardData.count({ where : { extra1 : "" + data.idx}});
            if (cnt > 0) continue;

            const params = {
                gid, 
                commenter : data.post_name,
                content : data.contents,
                ipAddr : data.ip,
                useEditor : false,
                listOrder : gid,
                extra1 : data.idx,
                idBoardData : li.id,
                idManager : 2,
            };
            await Comment.create(params);
        }

    }

    res.send("");
});

module.exports = router;