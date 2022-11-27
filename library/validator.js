/**
 * 범용 Validator 
 * 
 */
const validator = {
    /**
     * 유선전화 + 휴대전화번호 유효성 검사
     * 
     * @param String phoneNum 
     * @param Exception 
     */
    checkPhoneNumber(phoneNum, Exception) {
        Exception = Exception || Error;
        phoneNum = phoneNum.replace(/[^\d]/g, "");
        pattern = /^0[\d][0123456]*[\d]{3,4}[\d]{4}$/;
        if (!pattern.test(phoneNum)) {
            throw new Exception("전화번호 형식이 아닙니다.");
        }
    },
    /**
     * 휴대전화번호 유효성 검사
     * 
     * @param String cellPhoneNum 
     * @param Exception 
     */
    checkCellPhoneNumber(cellPhoneNum, Exception) {
        Exception = Exception || Error;
        cellPhoneNum = cellPhoneNum.replace(/[^\d]/g, "");
        pattern = /^01[016789][\d]{3,4}[\d]{4}$/;
        if (!pattern.test(cellPhoneNum)) {
            throw new Exception("휴대전화번호 형식이 아닙니다.");
        }
    }
};

module.exports = validator;