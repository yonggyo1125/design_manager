const { logger } = require('../../library/common');
const { ApiCode, Sequelize : { Op } } = require('..');
const { v4 : uuidv4 } = require('uuid');

const codeDao = {
    /**
     * 키 발급 
     * 
     * @param {String} key  API 키 
     * @param {int} expires 만료 시간(초)
     * @returns {Boolean|String} 
     */
    async generate(key, expires) {
        if (!key) {
            return false;
        }
        try {
            expires = expires || 180;
            const expiredAt = new Date();
            expiredAt.setSeconds(expiredAt.getSeconds() + expires);
            const result = await ApiCode.create({
                code : uuidv4(),
                apiKey : key,
                expiredAt,
            });

            const code = result.code;
            return code || false;
        } catch (err) {
            logger(err);
            return false;
        }
    },
    /**
     * 인증코드 정보 조회
     *
     * @param {String} code 인증코드 
     * @returns {Boolean|Object}
     */
    async get(code) {
        if (!code) {
            return false;
        }

        try {
            const data = await ApiCode.findByPk(code, { raw : true });
            if (!data) {
                return false;
            }

            return data;
        } catch (err) {
            logger(err);
            return false;
        }
    }
};

module.exports = codeDao;