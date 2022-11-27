const axios = require('axios');
const { logger } = require('../../library/common');
const { URL } = require('url');
const path = require('path');

/**
 * 샘플 상품관련 
 * 
 */
const sampleDao = {
    apiURL : "http://n-mk.kr/apis/",
    /**
     * 샘플이미지 조회
     * 
     * @param {String} folder
     */
    async gets(folder, itemCd, itemNm) {
        try {
            let apiURL = this.apiURL + "get_samples.php";
            const qs = [];
            if (folder) {
                folder = encodeURIComponent(folder.trim());
                qs.push(`folder=${folder}`);
            }

            if (itemCd) {
                itemCd = encodeURIComponent(itemCd.trim());
                qs.push(`itemCd=${itemCd}`);
            }

            if (itemNm) {
                itemNm = encodeURIComponent(itemNm.trim());
                qs.push(`itemNm=${itemNm}`);
            }

            if (qs) {
                apiURL += "?" + qs.join("&");
            }
 
            const result = await axios({
                method : "GET",
                url : apiURL,
            });
            const list = result.data;  
            const data = [];
            list.forEach(v => {
               
                const url = new URL(v.url);
                let pathes = decodeURIComponent(url.pathname.replace("/data/sample/files/", "")).split("/");
               const segments = decodeURIComponent(pathes.pop()).split("__");  
               segments[1] = segments[1].substring(0, segments[1].lastIndexOf("."));            
               const filename = encodeURIComponent(path.basename(v.path));
               data.push({
                   category : pathes[0],
                   subCategory : pathes[1],
                   itemCd : segments[0],
                   itemNm : segments[1],
                   downloadUrl : this.apiURL + `download.php?category=${pathes[0]}&subCategory=${pathes[1]}&itemCd=${segments[0]}&filename=${filename}`,
                   downloadAiUrl : this.apiURL + `download_ai.php?category=${pathes[0]}&subCategory=${pathes[1]}&itemCd=${segments[0]}&filename=${filename}`,
                   image : v.image,
               });
            });

            return data;
        } catch (err) {
            logger(err);
            return false;
        }
    },
    /**
     * 샘플 1차 분류 조회 
     * 
     */
    async getCategories() {
        try {   
            const apiURL = this.apiURL + "get_categories.php";
            const result = await axios({
                method : "get",
                url : apiURL,
            });

            if (result.data.length == 0)
                return false;
            
            return result.data;
        } catch (err) {
            logger(err);
            return false;
        }
    },
    /**
     * 샘플 2차 분류 조회
     * 
     * @param {String} category 1차분류
     */
    async getSubCategories(category) {
        try {
            if (!category) {
                return false;
            }

            const apiURL = this.apiURL + "get_sub_categories.php?category=" + encodeURIComponent(category);
            const result = await axios({
                method : "get",
                url : apiURL,
            });
            if (!result.data)
                return false;
            
            return result.data;
        } catch (err) {
            logger(err);
            return false;
        }
    }
};

module.exports = sampleDao;