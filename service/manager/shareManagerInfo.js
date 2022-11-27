const { ApiKey } = require("../../models");
const { secureGet } = require('../../library/common');
const dao = require('../../models/manager/dao');
/**
 * 관리자 정보 공유
 * 
 * @param {*} req 
 */
module.exports = async (req) => {
    let managerId = req.query.data;
    const restKey = req.query.client_id;
    const clientSecret = req.query.client_secret;

    const missing = [];
    if (!managerId) {
        missing.push("data");
    } 

    if (!restKey) {
        missing.push("client_id");
    }

    if (!clientSecret) {
        missing.push("client_secret");
    }

    if (missing.length > 0) {
        throw new Error("필수 항목 누락(" + missing.join(","));
    }

    managerId = secureGet(managerId);
    const cnt = await ApiKey.count({ where : { restKey, clientSecret}});
    if ((!managerId || managerId.trim() == "") || !cnt) {
        throw new Error("인증 실패하였습니다.");
    }


   const data = await dao.get(managerId);
   if (!data) {
    throw new Error("등록되지 않은 회원입니다.");
   }

   data.levelNm = data['Level.levelNm'];
   delete data['Level.level'];
   delete data['Level.levelNm'];
   delete data['Level.roles'];
   
   return data;
};