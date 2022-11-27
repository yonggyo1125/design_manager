const axios = require("axios");

/**
 * 웹훅 처리
 * 
 * @param {*} url 
 * @param {*} data 
 */
module.exports = async (url, data) => {
    try {
        if (!url || !data) {
            return false;
        }

        const result = await axios.post(url, data);
        console.log("-----------------------------");
        console.log(result);
        console.log("----------------------------------------");

    } catch (err) {
        console.log(err);
        return false;
    }
};