const { saveConfig } = require("../../library/common");

/**
 * 공통 치환코드 저장 처리
 * 
 * @param {*} data 
 */
module.exports = async (data) => {

    if (!data.code || data.code.length == 0) {
        throw new Error("공통 치환코드를 입력하세요.");
    }

    const commonCodeData = [];
    let codes = data.code || [];
    let replaces = data.replace || [];
    if (!(codes instanceof Array)) {
        codes = [codes];
    }

    if (!(replaces instanceof Array)) {
        replaces = [replaces];
    }

    for (let i = 0; i < codes.length; i++) {
        const code = codes[i];
        const replace = replaces[i] || "";
        if (!code || code.trim() == "") {
            continue;
        }

        commonCodeData.push({ code, replace });
    }
    
    const key = `kakaoAlimTalkCommonCode`;
    await saveConfig(key, commonCodeData);
    
};