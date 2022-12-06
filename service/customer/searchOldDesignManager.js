const axios = require('axios');
const { post } = require('../../routes/customer');

/**
 * 구 디자인관리자 데이터 조회
 * 
 * @param {*} search
 */
module.exports = async (search, page, limit) => {
    search = search || {};
    page = page || 1;
    limit = limit || 20;
    const url = "https://n-mk.com/team/api_customer?key=d134cc29-9417-496b-9f43-67f19626a9f2";
    try {
        const data = await axios({
            method : post,
            url,
            data : { search, page, limit },
        });
        
        if (search.idx) {
            if (data.data.godo5files && typeof data.data.godo5files == 'string') {
                data.data.godo5files = JSON.parse(data.data.godo5files);
            }
            return data.data || {};
        }

        const list = data.data || [];
        for (const li of list) {
            if (li.godo5files && typeof li.godo5files == 'string') {
                li.godo5files = JSON.parse(li.godo5files);
            }
        }
        
        return list;
    } catch (err) {
        console.log(err);
        return [];
    }
    
};