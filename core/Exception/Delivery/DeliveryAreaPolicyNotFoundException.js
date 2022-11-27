const Exception = require('../../exception');

/**
 * 지역별 배송정책 조회 예외
 * 
 */
class DeliveryAreaPolicyNotFoundException extends Exception {

}

module.exports = DeliveryAreaPolicyNotFoundException;