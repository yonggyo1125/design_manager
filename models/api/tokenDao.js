const { logger } = require('../../library/common');
const { ApiToken } = require('..');
const {v4 : uuidv4 } = require('uuid');


/**
 * 접근 토큰 발급/갱신/삭제 처리 
 * 
 */
const tokenDao = {
    /**
     * 인증토큰 발급 처리 
     *  - 인증토큰은 2시간 유효시간을 가짐
     * 
     * @param {String} apiKey 인증 key
     * @returns {Boolean|Object} 
     */
    async issue(apiKey) {
        if (!apiKey) {
            return false;
        }

        // 기존 인증키 삭제 후 새로 생성
        try {
            await ApiToken.destroy({ where : { apiKey } });
            const expiredAt = new Date();
            expiredAt.setHours(expiredAt.getHours() + 1);
            const result  = await ApiToken.create({
                apiKey,
                accessToken : uuidv4(),
                refreshToken : uuidv4(),
                expiredAt,
            });

            if (!result.accessToken) {
                return false;
            }

            const offsetHours = new Date().getTimezoneOffset() / 60;
            expiredAt.setHours(expiredAt.getHours() + offsetHours * - 1);
            return {
                access_token : result.accessToken,
                refresh_token : result.refreshToken,
                token_type : "bearer",
                expires_In : Math.floor(expiredAt.getTime() / 1000),
            };
        } catch (err) {
            logger(err);
            return false;
        }
    },
    /**
     * 접근 토큰 조회
     * 
     * @param {String} apiKey 인증 키
     * @param {String} token  접근토큰(type이 refresh가 아닌 경우), 갱신토큰(type이 refresh인 경우)
     * @returns {Boolean|Object}
     */
    async getToken(apiKey, token, type) {
        if (!apiKey && (token || (!token && type == 'none'))) {
            return false;
        }

        try {
            type = type || "access";
            const where = { apiKey };
            if (type == 'refresh') {
                where.refreshToken = token;
            } else if (type == 'none') {

            } else {
                where.accessToken = token;
            }

            const result = await ApiToken.findOne({
                where,
                raw : true,
            });
            
            if (!result || !result.accessToken) {
                return false;
            }
            const expiredAt = result.expiredAt;
            const offsetHours = new Date().getTimezoneOffset() / 60;
            expiredAt.setHours(expiredAt.getHours() + offsetHours * - 1);
            return {
                access_token : result.accessToken,
                refresh_token : result.refreshToken,
                token_type : "bearer",
                expires_In : Math.floor(expiredAt.getTime() / 1000),
            };
        } catch (err) {
            logger(err);
            return false;
        }
    },
    /**
     * 토큰 정보 조회
     * 
     * @param {String} accessToken
     * @returns {Boolean|Object}
     */
    async getTokenInfo(accessToken) {
        if (!accessToken) {
            return false;
        }
        
        try {
            const data = await ApiToken.findOne({
                where : { accessToken },
                raw : true,
            });
            if (!data || !data.accessToken) {
                return false;
            }

            return {
                apiKey : data.apiKey,
                access_token : data.accessToken,
                refresh_token : data.refreshToken,
                token_type : "bearer",
                expiredAt : data.expiredAt,
            };
        } catch (err) {
            logger(err);
            return false;
        }
    },
    /**
     * 토큰 유효기간 업데이트 
     * 
     * @param {String} apiKey 인증 키
     * @returns {Boolean}
     */
    async refresh(apiKey) {
        if (!apiKey) {
            return false;
        }

        try {
            const expiredAt = new Date();
            expiredAt.setHours(expiredAt.getHours() + 1);
            const result = await ApiToken.update({
                expiredAt,
            }, { where : { apiKey }});
            if (result[0] > 0) {
                const tokens = await this.getToken(apiKey, null, "none");
                return tokens;
            } else {
                return false;
            }
        } catch (err) {
            logger(err);
            return false;
        }
    },
    /**
     * 토큰  삭제
     * 
     * @param {String} apiKey 인증 키
     * @returns {Boolean}
     */
    async delete(apiKey) {
        if (!apiKey) {
            return false;
        }

        try {
            const result = await ApiToken.destroy({
                where : { apiKey }
            });

            return result > 0;
        } catch (err) {
            logger(err);
            return false;
        }
    }
};

module.exports = tokenDao;