const { getException } = require('../../library/common');

/** 예외 */
const KakaoAlimTalkRegisterException = getException("KakaoAlimTalk/KakaoAlimTalkRegisterException");
const KakaoAlimTalkUpdateException = getException("KakaoAlimTalk/KakaoAlimTalkUpdateException");
const KakaoAlimTalkDeleteException = getException("KakaoAlimTalk/KakaoAlimTalkDeleteException");
const KakaoAlimTalkNotFoundException = getException("KakaoAlimTalk/KakaoAlimTalkNotFoundException");

const templateDao = require('../../models/kakaoAlimTalk/templateDao');

/**
 * 카카오 알림톡 템플릿 관리
 * 
 */
const templateService = {
    /**
     * 템플릿 등록
     * 
     * @param {Object} req  
     * @throws {KakaoAlimTalkRegisterException}
     */
    async add(req) {
        const data = req.body;
        this.validator(data, KakaoAlimTalkRegisterException);
        const buttons = [];
        if (['web','delivery'].indexOf(data.buttonType) != -1) {
            if (data.buttonNm && data.buttonUrl) {
                if (!Array.isArray(data.buttonNm)) {
                    data.buttonNm = [data.buttonNm];
                }

                if (!Array.isArray(data.buttonUrl)) {
                    data.buttonUrl = [data.buttonUrl];
                }

                for (let i = 0; i < data.buttonNm.length; i++) {
                    const buttonNm = data.buttonNm[i];
                    const buttonUrl = data.buttonUrl[i];
                    if (buttonNm && buttonNm.trim() != "") {
                        buttons.push({ buttonNm,buttonUrl });
                    }
                }
            }
        }
        data.buttons = buttons;
        const result = await templateDao.add(data);
        if (!result) {
            throw new KakaoAlimTalkRegisterException("템플릿 등록에 실패하였습니다.");
        }
    },
    /**
     * 템플릿 수정
     * 
     * @param {Object} req  
     * @throws {KakaoAlimTalkUpdateException} 
     */
    async update(req) {
        const data = req.body;
        this.validator(data, KakaoAlimTalkUpdateException);
        const buttons = [];
        if (['web','delivery'].indexOf(data.buttonType) != -1) {
            if (data.buttonNm && data.buttonUrl) {
                if (!Array.isArray(data.buttonNm)) {
                    data.buttonNm = [data.buttonNm];
                }

                if (!Array.isArray(data.buttonUrl)) {
                    data.buttonUrl = [data.buttonUrl];
                }


                for (let i = 0; i < data.buttonNm.length; i++) {
                    const buttonNm = data.buttonNm[i];
                    const buttonUrl = data.buttonUrl[i];
                    if (buttonNm && buttonNm.trim() != "") {
                        buttons.push({ buttonNm,buttonUrl });
                    }
                }
            }
        }
        data.buttons = buttons;
        const result = await templateDao.update(data);
        if (!result) {
            throw new KakaoAlimTalkUpdateException("템플릿  수정에 실패하였습니다.");
        }

    },
    /**
     * 유효성 검사
     * 
     * @param {Object} data 사용자 입력 데이터 
     * @throws {Exception}
     */
    validator(data, Exception) {
        if (!data) {
            throw new Exception("잘못된 접근입니다.");
        }

        const required = {
            tmpltCode : "템플릿 코드를 입력하세요.",
            tmpltNm : "템플릿명을 입력하세요.",
            message : "템플릿 내용을 입력하세요.",
        };

        for (key in required) {
            if (!data[key] || data[key].trim() == "") {
                throw new Exception(required[key]);
            }
        }
    },
    /**
     *  템플릿 목록 
     * 
     * @param {int} page 페이지 번호
     * @param {int} limit 1페이지당 레코드 수 
     * @param {Object} req 
     * @param {Object} search 검색조건
     */
    async gets(page, limit, req, search) {
        const list = await templateDao.gets(page, limit, req, search);
        const pagination = templateDao.pagination;
        const total = templateDao.total;

        return { list, pagination, total };
    },
    /**
     * 템플릿 조회
     * 
     * @param {String} tmpltCode 템플릿코드 
     * @returns {Object}
     * @throws {KakaoAlimTalkNotFoundException} 
     */
    async get(tmpltCode) {
        if (!tmpltCode) {
            throw new KakaoAlimTalkNotFoundException("잘못된 접근입니다.");
        }

        const data = await templateDao.get(tmpltCode);
        if (!data) {
            throw new KakaoAlimTalkNotFoundException("등록되지 않은 템플릿 입니다.");
        }

        return data;
    },
    /**
     * 템플릿 삭제 
     */
    async delete(req) {
        const tmpltCodes = req.body.tmpltCode;
        if (!tmpltCodes) {
            throw new KakaoAlimTalkDeleteException("삭제할 템플릿을 선택하세요.");
        }

        const result = await templateDao.delete(tmpltCodes);
        if (!result) {
            throw new KakaoAlimTalkDeleteException("템플릿 삭제에 실패하였습니다.");
        }
    }
};

module.exports = templateService;