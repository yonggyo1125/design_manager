/**
 * @api {get/post} /oauth/authorize 1. 인증코드 발급요청
 * @apiVersion 0.0.1
 * @apiName 인증코드 발급
 * @apiGroup API 사용 인증
 * 
 * @apiParam {String} client_id  발급받은 Client ID
 * @apiParam {String} redirect_uri 코드 정상 발급 후 리다이렉트 될 URL
 * @apiParam {String} state 사이트 간 요청 위조(cross-site request forgery) 공격을 방지하기 위해 애플리케이션에서 생성한 상태 토큰값으로 URL 인코딩을 적용한 값을 사용
 *  
 * @apiSuccess {String} code 
 * @apiSuccess {String} state
 * 
 * @apiError (Error 401) {Number}  error 인증실패시 반환받는 에러코드
 * @apiError (Error 401) {String} error_description 인증실패시 반환받는 에러메세지
 */

/**
 * @api {get/post} /oauth/token 2. 접근 토큰 발급/갱신/삭제 요청
 * @apiVersion 0.0.1
 * @apiName 접근토큰 발급/갱신/삭제
 * @apiGroup API 사용 인증
 * 
 * @apiParam (공통) {String} grant_type 인증과정에 대한 구분값<br>1)발급:authorization_code<br>2)갱신:refresh_token<br>3)삭제
 * @apiParam (공통) {String} client_id 발급받은 Client ID
 * @apiParam (공통) {String} client_secret 발급받은 Client Secret
 * @apiParam (발급) {String} code 인증요청 API 호출에 성공하고 반환받은 인증코드 값
 * @apiParam (갱신) {String} refresh_token 인증에 성공하고 발급받은 갱신토큰(refresh_token)
 * @apiParam (삭제) {String} access_token 인증에 성공하고 발급받은 접근토큰
 */