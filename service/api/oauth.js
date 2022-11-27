const { getException, getLocalDate } = require('../../library/common');
/** 예외 S */
const NotAuthorizedMethodException = getException("API/NotAuthorizedMethodException");
const BadRequestException = getException("API/BadRequestException");
const CodeGenerateException = getException("API/CodeGenerateException");
const CodeExpiredException = getException("API/CodeExpiredException");
const TokenNotExistsException = getException("API/TokenNotExistsException");
const TokenProcessException = getException("API/TokenProcessException");
const TokenNotAuthorizedException = getException("API/TokenNotAuthorizedException"); 
const TokenExpiredException = getException("API/TokenExpiredException");
/** 예외 E */

const keyDao = require('../../models/api/keyDao');
const codeDao = require('../../models/api/codeDao');
const tokenDao = require('../../models/api/tokenDao');
const managerDao = require("../../models/manager/dao");

/**
 * OAuth 인증관련 
 * 
 */
const oAuthService = {
    /**
     * 인증 요청 
     * GET, POST 가능 
     * 
     * 
     * @param {Object} req
     * @throws {NotAuthorizedMethodException}
     */
    async authorize(req) {
        if (['GET', 'POST'].indexOf(req.method.toUpperCase()) == -1) {
            throw new NotAuthorizedMethodException(); 
        }

        await this.validator("authorize", req);

        /** 코드 URL 발급  */
        const codeURL = await this.generateCodeUrl(req);

        return codeURL;
    },
    /**
     * 인증요청 유효성 검사
     * 
     * @param {Object} req
     * @throws {BadRequestException}
     */
    async authorizeValidator(req) {
        const data  = (req.method.toUpperCase() == 'GET')?req.query:req.body;
        const required = ['client_id', 'redirect_uri', 'state'];
        const missing = [];
        for(field of required) {
            if (!data[field] || data[field].trim() == "") {
                missing.push(field);
            }
        }

        if (missing.length > 0) {
            const msg = `필수 요청항목이 누락되었습니다. 누락항목 : ${missing.join()}`;
            throw new BadRequestException(msg);
        }
        /** 도메인 또는 IP로 접속 인증 관련 처리 필요 */

        const keyData = await keyDao.get(data.client_id, 'rest');

        /** redirectURL 체크 */
        if (keyData.redirectURL != data.redirect_uri) {
            const msg = "잘못된 Redirect_uri 값을 입력하였습니다.";
            throw new BadRequestException(msg);
        }  
    },
    /**
     * 인증코드 발급
     * 
     * @param {int} expires 만료시간(초 단위)
     * @param {Boolean|String}
     */
    async generateCode(key, expires) {
        expires = expires || 180; // 기본값 3분
        if (!key) {
            return false;
        }

        const code = await codeDao.generate(key, expires);

        return code;
    },
    /**
     * 인증코드 정보 조회
     * 
     * @param {String} code 인증코드 
     * @returns {Boolean|Object}
     */
    async getCodeInfo(code) {
        if (!code) {
            return false;
        }

        const data = await codeDao.get(code);

        return data;
    },
    /**
     * 인증코드 URL 생성 
     * 
     * @param {Object} req
     * @returns {String}
     */
    async generateCodeUrl(req) {
        const data  = (req.method.toUpperCase() == 'GET')?req.query:req.body;
        const keyData = await keyDao.get(data.client_id, 'rest');
        
        const code = await this.generateCode(data.client_id);
        if (!code) {
            throw new CodeGenerateException();
        }
        
        let url = keyData.domain + keyData.redirectURL;
        if (url.indexOf("http") != 0) {
            url = "http://" + url;
        }

        if (url.indexOf("?") == -1) {
            url += "?";
        } else {
            url += "&";
        }

        url += `code=${code}`;

        if (data.state) {
            url += `&state=${data.state}`;
        }

        return url;
    },
    /**
     * 접근 토큰 발급/갱신/삭제 요청
     * 
     */
    async token(req) {
        if (['GET', 'POST'].indexOf(req.method.toUpperCase()) == -1) {
            throw new NotAuthorizedMethodException(); 
        }
        
        const data  = (req.method.toUpperCase() == 'GET')?req.query:req.body;
        const type = data.grant_type;
        await this.validator(type, req);

        let result = false;
        switch(type) {
            case "refresh_token" :  // 토큰 갱신 
                result = await tokenDao.refresh(data.client_id);
                break;
            case "delete" :  // 토큰 삭제
                result = await tokenDao.delete(data.client_id);
                if (result) {
                    result = {};
                }
                break;
            default :  // 토큰 발급
                result = await tokenDao.issue(data.client_id);
        }
        if (result) {
            result.response_code = 1000;
        } else {
            throw new TokenProcessException();
        }

        return result;
    },
    /**
     * 토큰 발급/갱신/삭제 요청 유효성 검사
     * 
     * @param {String} type 
     *                              authorization_code  - 접근 토큰 발급
     *                              refresh_token - 접근 토큰 갱신
     *                              delete - 접근토큰 삭제
     * 
     * @param {Object} req
     * @throws {BadRequestException|CodeExpiredException}
     */
    async tokenValidator(type, req) {
        if (!type) {
            throw new BadRequestException("인증구분값 grant_type이 누락되었습니다.");
        }
        const data  = (req.method.toUpperCase() == 'GET')?req.query:req.body;

        const required = ["grant_type", "client_id", "client_secret"];
        switch (type) {
            case "refresh_token" :  // 토큰 갱신 
                required.push("refresh_token");
                break;
            case "delete" :  // 토큰 삭제
                required.push('access_token');
                break;
            default :  // 토큰 발급
                required.push('code');
        }

        const missing = [];
        for (field of required) {
            if (!data[field] || data[field].trim() == "") {
                missing.push(field);
            }
        }

        if (missing.length > 0) {
            const msg = `필수 요청항목이 누락되었습니다. 누락항목 : ${missing.join()}`;
            throw new BadRequestException(msg);
        }

        const client_id = data.client_id;
        const client_secret = data.client_secret;
        const code = data.code;
 
        /** client_secret 일치 체크  */
        const keyInfo = await  keyDao.get(client_id, "rest");
        if (!keyInfo) {
            throw new BadRequestException("등록되지 않은 client_id 입니다.");
        }

        if (keyInfo.clientSecret != client_secret) {
            throw new BadRequestException("client_secret가 일치하지 않습니다.");
        }

        let tokenInfo = false;
        switch (type) {
            case "refresh_token" :  // 토큰 갱신 
                // 토큰이 존재하는지 체크
                tokenInfo = await tokenDao.getToken(client_id, data.refresh_token, "refresh");  
                if (!tokenInfo) {
                    throw new TokenNotExistsException();
                }

                // 갱신 가능 유효기간인지 체크 
                const gap = tokenInfo.expiredAt - new Date();
                if (gap <= 0) {
                    throw new TokenExpiredException();
                }
                break;
            case "delete" :  // 토큰 삭제
                tokenInfo = await tokenDao.getToken(client_id, data.access_token); 
                if (!tokenInfo) {
                    throw new TokenNotExistsException();
                }
                break;
            default :  // 토큰 발급
                /** 코드 유효기간 체크  */
                await this.checkCodeExpired(code, client_id);
        }
    },
    /**
     * 코드 만료시간 체크 
     *  
     * @param {String} code 
     * @param {String} apiKey
     * 
     */
    async checkCodeExpired(code, apiKey) {
        if (!code || !apiKey) {
            throw new BadRequestException()
        }
        
        const codeInfo = await this.getCodeInfo(code);
        if (!codeInfo) {
            throw new BadRequestException("발급되지 않은 인증코드 입니다.");
        }

        if (apiKey != codeInfo.apiKey) {
            throw new BadRequestException("발급 출처가 다른 인증코드 입니다.");
        }

        const gap = codeInfo.expiredAt - new Date();
        if (gap <= 0) {
            throw new CodeExpiredException();
        }
    },
     /**
     * 요청 인증 필수 항목 체크 
     * 
     * @param {String} type 
     *                                  authorize - 인증요청 
     *                                  authorization_code  - 접근 토큰 발급
     *                                  refresh_token - 접근 토큰 갱신
     *                                  delete - 접근토큰 삭제
     * @param {Object} req
     */
    async validator(type, req) {
        switch(type) {
            case "authorize" : // 인증요청 유효성 검사 
                await this.authorizeValidator(req);
                break;
            case "authorization_code" :  // 접근 토큰 발급 
            case "refresh_token" :  // 토큰 갱신
            case "delete" :  // 토큰 삭제 
                await this.tokenValidator(type, req);
                break;
        }
    },
    /**
     * 승인받은 접근 토큰인지 체크 
     * 
     * @param {Object} req
     * @throws {BadRequestException|TokenNotAuthorizedException|TokenExpiredException}
     */
    async validateAuthorizedRequest(req) {
        if (!req) {
            throw new BadRequestException();
        }

        const headers = req.headers;
        const authorization = headers.Authorization ||  headers.authorization;
        if (!authorization || authorization.indexOf('Bearer') == -1) {
            throw new BadRequestException();
        }

        const token  =  authorization.split("Bearer ")[1].trim();
        if (!token) {
            throw new BadRequestException();
        }
        
        const data = await tokenDao.getTokenInfo(token);
        if (!data) {
            throw new TokenNotAuthorizedException();
        }
        const date = new Date();
        const gap = data.expiredAt - date;
        if (gap <= 0) {
        //   throw new TokenExpiredException();
        }    

         /** 접근 토큰 검증 성공한 경우 client_id로 관리자 정보 공유 */
        const keyInfo = await keyDao.get(data.apiKey, "rest"); 
        if (!keyInfo) {
            throw new TokenNotAuthorizedException();
        }

        req.keyInfo = keyInfo;
        req.idManager = keyInfo.idManager;
        req.manager = await managerDao.get(keyInfo.idManager);
    }
};

module.exports = oAuthService;