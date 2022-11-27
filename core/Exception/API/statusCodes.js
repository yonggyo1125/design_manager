/** 
 * API 응답 상태 코드 
 * 
 */
const statusCodes = {
    codes : {
        '400' : 'Bad Request',
        '405' : 'Method Not Allowed',
        '1000' : '정상처리',
        '1100' : '인증코드 발급에 실패하였습니다.',
        '1110' : '만료된 인증코드 입니다.',
        '1120' : '토큰 정보가 존재하지 않습니다.',
        '1130' : '토큰 처리에 실패하였습니다.',
        '1140' : '접속권한이 없습니다.',
        '1150' : '만료된 접속토큰 입니다.',
        '1160' : '승인되지 않은 데이터 입니다.',
    },
    get(code) {
        return statusCodes.codes[code] || "";
    },
};

module.exports = statusCodes;