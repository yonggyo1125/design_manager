const { getException, logger } = require('../../library/common');
const OrderStatusRegisterException = getException("Order/OrderStatusRegisterException");
const OrderStatusUpdateException = getException("Order/OrderStatusUpdateException");
const OrderStatusDeleteException = getException("Order/OrderStatusDeleteException");
const { OrderStatus, OrderInfo } = require('../index');

/**
 * 주문 처리 상태 
 * 
 */
const orderStatusDao = {
    /**
     * 기본 처리 구분 
     * 
     */
    statusTypes : [
        { type  : 'ready', typeNm : "주문접수" },
        { type  : 'requestCash', typeNm : "입금요청" },
        { type  : 'confirmCash', typeNm : "입금확인" },
        { type  : 'working', typeNm : "작업진행중" },
        { type  : 'workingDone', typeNm : "작업완료" },
        { type  : 'prepareDelivery', typeNm : "배송준비중" },
        { type  : 'onDelivery', typeNm : "배송중" },
        { type  : 'deliveryDone', typeNm : "배송완료" },
        { type  : 'confirmOrder', typeNm : "주문확정" },
        { type : 'etc', typeNm : "기타" },
    ],
    getStatusTypes(typeOnly = false) {
        if (typeOnly) {
            const types = [];
            orderStatusDao.statusTypes.forEach(t => types.push(t.type));
            return types;
        } 

        return orderStatusDao.statusTypes;
    },
    /**
     * 주문상태 추가 
     * 
     * @param {Object} req 
     * @returns {Boolean|Object}
     * @throws {OrderStatusRegisterException}
     */
    async add(req) {
        const data = req.body;
        await this.validate(data, OrderStatusRegisterException);

        try {
            const result = await OrderStatus.create({
                statusCd : data.statusCd,
                statusNm : data.statusNm,
            });
            if (!result) {
                return false;
            }

            return result;
        } catch (err) {
            logger(err);
            return false;
        }
    },
    /**
     * 유효성 검사
     * 
     * @param {Object} data
     * @throws {Exception}
     */
    async validate(data, Exception) {
        /** 필수 항목 체크 S */
        const required = {
            statusCd : "처리상태코드를 입력하세요.",
            statusNm : "처리상태명을 입력하세요."
        };

        for (key in required) {
            if (!data[key] || data[key].trim() == "") {
                throw new Exception(required[key]);
            }
        }
        /** 필수 항목 체크 E */

        // 처리상태 코드는 영문자, 숫자로만 구성 체크 */
        if (/[^a-zA-Z0-9]/.test(data.statusCd)) {
            throw new Exception("처리상태코드는 영문자 및 숫자만 사용하실 수 있습니다.");
        }

        // 처리상태 코드 중복 여부 체크 
        const cnt = await OrderStatus.count({ where : { statusCd : data.statusCd }});
        if (cnt > 0) {
            throw new Exception(`이미 등록된 처리상태 코드입니다. - ${data.statusCd}`);
        }
    },
    /**
     * 주문상태 수정 
     * 
     * @param {Object} req 
     * @throws {Boolean}
     * @throws {OrderStatusUpdateException}
     */
    async update(req) {
        const data = req.body;
        if (!data) {
           return false;
        }
        
        let statusCds = data.statusCd;
        if (!statusCds) {
            throw new OrderStatusUpdateException("수정할 처리상태를 선택하세요.");
        }

        if (!(statusCds instanceof Array)) {
            statusCds = [statusCds];
        }
        try {
            for await (statusCd of statusCds) {
                await OrderStatus.update({
                    statusNm : data[`statusNm_${statusCd}`],
                    listOrder : data[`listOrder_${statusCd}`],
                    isUse : (data[`isUse_${statusCd}`] == 1)?true:false,
                }, { where : { statusCd }})
            }
            return true;
        } catch (err) {
            logger(err);
            return false;
        }
    },
    /**
     * 주문처리상태 설정 저장하기 
     * 
     * @param {Object} req 
     */
    async updateEach(req) {
        const data = req.body;
        const statusCd = data.statusCd;
        if (!data || !statusCd || !data.statusNm) {
            return false;
        }

        const setting = {
            orderDeletePossible : data.orderDeletePossible?true:false,
            orderUpdatePossible : data.orderUpdatePossible?true:false,
            orderDeliveryUpdate : data.orderDeliveryUpdate?true:false,
            orderDesignUpdate : data.orderDesignUpdate?true:false,
            showWorkingList : data.showWorkingList?true:false, // 작업자 목록 노출
            orderAddPayment : data.orderAddPayment?true:false,
            orderCreatePayment : data.orderCreatePayment?true:false,
            sendAlimTalk : data.sendAlimTalk?true:false,
            sendAlimTalkOnce : data.sendAlimTalkOnce?true:false,
            tmpltCode : data.tmpltCode,
        };

        try {
            const result = await OrderStatus.update({
                statusNm :  data.statusNm,
                isUse : (data.isUse == 1)?true:false,
                listOrder : data.listOrder || 0,
                setting,
            }, { where : { statusCd }});
            
            return result[0] > 0;
        } catch (err) {
            logger(err);
            return false;
        }
    },
    /**
     * 주문상태 삭제 
     * 
     * @param {statusCds} 처리상태코드 
     * @throws {Boolean}
     * @throws {OrderStatusDeleteException}
     */
    async delete(statusCds) {
        if (!statusCds) {
            throw new OrderStatusDeleteException("삭제할 처리상태를 선택하세요.");
        }

        if (!(statusCds instanceof Array)) {
            statusCds = [statusCds];
        }
        try {
            for await (statusCd of statusCds) {
                await OrderStatus.destroy({ where : { statusCd }});
            }

            return true;
        } catch (err) {
            logger(err);
            return false;
        }
    },
    /**
     * 주문 처리상태 목록 
     *  
     */
    async gets(isAll, attributes) {
        try {
            const where = {};
            if (!isAll) {
                where.isUse = true;

            }
            const params = {
                where,
                order : [['listOrder', "DESC"], ['createdAt', "ASC"]],
                raw : true,
            };
            if (attributes) {
                params.attributes = attributes;
            }
            const _list = await OrderStatus.findAll(params);
            const list = [];
            const statusTypes = this.getStatusTypes(true);
            statusTypes.forEach(t => {
                _list.forEach(li => {
                    if (li.statusCd == t) {
                        list.push(li);
                    }
                });
            });
            
            for (li of _list) {
                if (statusTypes.indexOf(li.statusCd) == -1) {
                    list.push(li);
                }
            }

            return list;
        } catch (err) {
            logger(err);
            return false;
        }
    },
    /**
     * 처리상태 조회
     * 
     * @param {String|Integer} statusCd 문자열 : 처리상태 코드, 정수 : 주문번호
     * @returns {Boolean}
     */
    async get(statusCd) {
        if (!statusCd) {
            return false;
        }

        try {
            // 주문번호인 경우 
            if (!isNaN(statusCd)) {
                const orderInfo = await OrderInfo.findByPk(statusCd, {
                    attributes : ['orderStatus'],
                    raw : true,
                });
                if (!orderInfo) {
                    return false;
                }

                statusCd = orderInfo.orderStatus;
            }
            
            const data = await OrderStatus.findByPk(statusCd, { raw : true });
            if (!data)  {
                return false;
            }

            if (data.setting && typeof data.setting == 'string') {
                data.setting = JSON.parse(data.setting);
            }
            
            return data;
        } catch (err) {
            logger(err);
            return false;
        }
    },
    /**
     * 작업 목록 노출 주문상태 코드 조회 
     * 
     */
    async getWorkingStatusCds() {
        const statusCds = [];
        const list = await this.gets(false, ["statusCd", "setting"]);
        for (let li of list) {
            if (li.setting && typeof li.setting == 'string') {
                li.setting = JSON.parse(li.setting);
            }

            if (li.setting && li.setting.showWorkingList) {
                statusCds.push(li.statusCd);
            }
        }
        
        return statusCds;
    }
};

module.exports = orderStatusDao;