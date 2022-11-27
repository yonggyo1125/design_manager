const { getException, logger, getToday, dateFormat, getConfig, getYoil } = require("../../library/common");
const { ProductItem, ProductCategory, Holiday, DeliveryCompany, DeliveryPolicy } = require("../index");
/** 예외 S */
const CategoryNotFoundException = getException("Product/CategoryNotFoundException");
const DeliveryCompanyRegisterException = getException("Delivery/DeliveryCompanyRegisterException");
const DeliveryCompanyUpdateException = getException("Delivery/DeliveryCompanyUpdateException");
const DeliveryCompanyDeleteException = getException("Delivery/DeliveryCompanyDeleteException");
const DeliveryPolicyRegisterException = getException("Delivery/DeliveryPolicyRegisterException");
const DeliveryPolicyUpdateException = getException("Delivery/DeliveryPolicyUpdateException");
const DeliveryPolicyDeleteException = getException("Delivery/DeliveryPolicyDeleteException");
/** 예외 E */

const categoryDao = require("../product/categoryDao");
const itemDao = require("../product/itemDao");
const bannerDao = require("../banner/dao");
const deliveryAreaDao = require('./deliveryAreaDao');

/**
 *  배송, 출고 관련 
 * 
 */
const deliveryDao = {
    // 배송 방식 
    deliveryTypes : [
        {type : 'parcel', name : '택배배송'},
        {type : 'cargo', name : '화물배송'},
        {type : 'quick', name : '퀵배송'},
        {type : 'visit', name : '방문수령'},
    ],
    // 배송비 유형
    deliveryChargeTypes : [
        {type : 'fixed', name : '고정배송비'},
        {type : 'free', name : '배송비무료'},
        {type : 'price', name : '금액별배송비'},
        {type : 'count', name : '수량별배송비'},
        //{type : 'weight', name : '무게별배송비'},
    ],
    /**
     * 배송방식 문구
     * 
     * @param {String} type 
     */
    getDeliveryTypeStr(types) {
        if (!types) {
            return;
        }
        
        if (typeof types == 'string') {
            types = types.split(",");
        }

        const strs = [];
        for (const type of types) {
            for(const item of deliveryDao.deliveryTypes) {
                if (item.type == type) {
                    strs.push(item.name);
                }
            }
        }
        return strs.join(",");
    },
    /**
     * 배송비 유형 문구 
     * @param {String} type 
     */
    getDeliveryChargeTypeStr(type) {
        if (!type) 
            return;
        
        for(item of deliveryDao.deliveryChargeTypes) {
            if (item.type == type) {
                return item.name;
            }
        }
    },
    /**
     * 출고예정일 설정 저장
     * 
     * @param {Object} req 
     * @return {Boolean}
     * @throws {DeliveryGuideUpdateException}
     */
    async updateDeliveryGuide(req) {
        const data = req.body;
        if (data.itemId) {
            if (!(data.itemId instanceof Array)) {
                data.itemId = [data.itemId];
            }
        }
        try {
            if (data.itemId) {
                for await (id of data.itemId) {
                    await ProductItem.update({
                        designAmPm : data[`designAmPm_${id}`],
                        designHour : data[`designHour_${id}`],
                        deliveryAddDay : data[`deliveryAddDay_${id}`],
                        deliveryHour : data[`deliveryHour_${id}`],
                    }, { where : { id }});
                }
            }
            /** 출고예정일 안내배너 */
            const cateCd = req.params.cateCd;
            if (cateCd) {
                const result = await ProductCategory.update({
                    bannerGroupCd : data.bannerGroupCd,
                }, { where : { cateCd }});
            } // cateCd

            return true;
        } catch (err) {
            logger(err);
            return false;
        }
    },
    /**
     * 출고예정일 안내 정보 
     * 
     * @param {String} cateCd 
     * @returns {Boolean}
     * @throws {CategoryNotFoundException}
     */
    async getGuide(cateCd) {
        if (!cateCd) {
            throw new CategoryNotFoundException("잘못된 접근입니다.");
        }

        const data = await categoryDao.get(cateCd);
        if (!data) {
            throw new CategoryNotFoundException("등록되지 않은 품목분류 입니다.");
        }

        data.items = await itemDao.getsByCateCd(cateCd);
        if (data.bannerGroupCd) {
           data.banners =  await bannerDao.getGroup(data.bannerGroupCd);
        }
        
        
        const date = new Date();
        const hour = date.getHours();
        const today = getToday();
        const { holidayYoils } = await getConfig('holiday');
        for await (item of data.items) {
            let addDay = item.deliveryAddDay || 0;
            let designHour = item.designHour || 0;
            if (item.designAmPm == 'pm')  designHour += 12;
           if (designHour >= 24) designHour = 0;
           if (hour >= designHour) addDay++;

           let stamp = today + 60 * 60 * 24 * 1000 * addDay;

           /** 공휴일 체크 및 요일별 휴무일 관리 S */
           let no = 0;
           while(true) {
            if (no > 100) break;
                 no++;

                /** 공휴일 체크  */
                const cnt = await Holiday.count({ where : { stamp, isHoliday : true }});
                if (cnt > 0) {
                    stamp += 60 * 60 * 24 * 1000;
                    continue;
                }

                /** 요일 체크 */
                const yoil = new Date(stamp).getDay();
            
                if (holidayYoils.indexOf("" + yoil) != -1)  {
                    stamp += 60 * 60 * 24 * 1000;
                    continue;
                }

                break;
            }
            item.deliveryStartStamp = stamp;
            item.deliveryStartDate = dateFormat(stamp, "%m-%d");
            item.deliveryStartYoil = getYoil(stamp);
            
           /** 공휴일 체크 및 요일별 휴무일 관리 E */
        }
        return data;
    },
    /**
     * 배송업체 등록 
     * 
     * @param {Object} req 
     * @returns {Boolean|Object}
     * @throws {DeliveryCompanyRegisterException}
     */
    async addDeliveryCompany(req) {
        const data = req.body;
        if (!data.companyNm) {
            throw new DeliveryCompanyRegisterException("배송업체명을 입력하세요.");
        }

        try {
            const deliveryCompany = await DeliveryCompany.create({
                companyNm : data.companyNm,
                invoiceUrl : data.invoiceUrl,
            });

            if (!deliveryCompany) {
                return false;
            }

            return deliveryCompany;

        } catch (err) {
            logger(err);
            return false;
        }
    },
    /**
     * 배송업체 수정 
     * 
     * @param {Object} req 
     * @throws {DeliveryCompanyUpdateException}
     */
    async updateDeliveryCompany(req) {
        const data = req.body;
        let nums = data.num;
        if (!nums) {
            throw new DeliveryCompanyUpdateException("수정할 배송업체를 선택하세요.");
        }

        if (!(nums instanceof Array)) {
            nums = [nums];
        }

        try {
            for await (num of nums) {
                const companyNm = data[`companyNm_${num}`];
                const invoiceUrl = data[`invoiceUrl_${num}`];
                const type = data[`type_${num}`] || 'delivery';
                const isUse = (data[`isUse_${num}`] == 1)?true:false;
                const listOrder = data[`listOrder_${num}`] || 0;
                console.log(companyNm, invoiceUrl, type, isUse, listOrder);
                await DeliveryCompany.update({
                    invoiceUrl,
                    type,
                    isUse,
                    listOrder
                }, { where : { companyNm }});
            }
            
            return true;
        } catch (err) {
            logger(err);
            return false;
        }
    },
    /**
     * 배송업체 삭제 
     * 
     * @param {Array|String} companyNms 
     * @throws {DeliveryCompanyDeleteException}
     */
    async deleteDeliveryCompany(companyNms) {
        if (!companyNms) {
            throw new DeliveryCompanyDeleteException("삭제할 배송업체를 선택하세요.");
        }

        if (!(companyNms instanceof Array)) {
            companyNms = [companyNms];
        }

        try {
            for await (companyNm of companyNms) {
                await DeliveryCompany.destroy({ where : { companyNm }});
            }
            
            return true;
        } catch (err) {
            logger(err);
            return false;
        }
    },
    /**
     * 배송업체 목록 
     * 
     * @param {Boolean} isAll 
     */
    async getDeliveryCompanies(isAll) {
        try {
            const where = {};
            if (!isAll) {
                where.isUse = true;
            }

            const list = await DeliveryCompany.findAll({
                order : [['listOrder', "DESC"], ['createdAt', "ASC"]],
                where,
                raw : true,
            });

            return list;
        } catch (err) {
            logger(err);
            return false;
        }
    },
    /**
     * 배송업체 정보
     * 
     * @param {String}  companyNm  배송업체명
     * @returns {Object|Boolean}
     */
    async getDeliveryCompany(companyNm) {
        try {
            const info = await DeliveryCompany.findByPk(companyNm, { raw : true });
            if (!info) {
                return false;
            }

            return info;
        } catch(err) {
            logger(err);
            return false;
        }
    },
    /**
     * 배송조건 등록
     * 
     * @param {Object} req 
     * @returns {Object|Boolean}
     * @throws {DeliveryPolicyRegisterException}
     */
    async addPolicy(req) {
        const data = req.body;
        this.validate(data, DeliveryPolicyRegisterException);
        const rangeDeliveryCharge = [];
        let deliveryType = data.deliveryType;
        if (deliveryType instanceof Array) {
            deliveryType = deliveryType.join(",");
        }

        if (data.unitStart) {
            if (!(data.price instanceof Array)) {
                data.price = [data.price];
            }
            data.unitStart.forEach((v, i) => {
                v = isNaN(v)?0:v;
                let unitEnd = data.unitEnd[i];
                unitEnd = isNaN(unitEnd)?0:unitEnd;
                let price = data.price[i];
                price = isNaN(price)?0:price;
                rangeDeliveryCharge.push({
                    unitStart : Number(v),
                    unitEnd : Number(unitEnd),
                    price : Number(price),
                });
            });
        };

        try {
            const result = await DeliveryPolicy.create({
                policyNm : data.policyNm,
                description : data.description,
                deliveryType,
                deliveryChargeType : data.deliveryChargeType || "fixed",
                deliveryCollectType : data.deliveryCollectType || "pre",
                useDeliveryAreaPolicy : (data.useDeliveryAreaPolicy == 1)?true:false,
                idDeliveryAreaPolicy : data.idDeliveryAreaPolicy || 0,
                deliveryCharge : data.deliveryCharge || 0,
                useRangeRepeat : data.useRangeRepeat == '1'?true:false,
                rangeDeliveryCharge,
                addPriceCargo : data.addPriceCargo || 0,
                addPriceQuick : data.addPriceQuick || 0,
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
     * 배송조건 수정 
     * 
     * @param {Object} req 
     * @returns {Boolean}
     * @throws {DeliveryPolicyUpdateException}
     */
    async updatePolicy(req) {
        const data = req.body;
        const id = req.params.id || req.body.id;
        data.id = id;
        data.mode = "update";
        this.validate(data, DeliveryPolicyUpdateException);
        const rangeDeliveryCharge = [];
        let deliveryType = data.deliveryType;
        if (deliveryType instanceof Array) {
            deliveryType = deliveryType.join(",");
        }

        if (data.unitStart) {
            if (!(data.price instanceof Array)) {
                data.price = [data.price];
            }
            data.unitStart.forEach((v, i) => {
                v = isNaN(v)?0:v;
                let unitEnd = data.unitEnd[i];
                unitEnd = isNaN(unitEnd)?0:unitEnd;
                let price = data.price[i];
                price = isNaN(price)?0:price;
                rangeDeliveryCharge.push({
                    unitStart : Number(v),
                    unitEnd : Number(unitEnd),
                    price : Number(price),
                });
            });
        };

        try {
            const result = await DeliveryPolicy.update({
                policyNm : data.policyNm,
                description : data.description,
                deliveryType,
                deliveryChargeType : data.deliveryChargeType || "fixed",
                deliveryCollectType : data.deliveryCollectType || "pre",
                useDeliveryAreaPolicy : (data.useDeliveryAreaPolicy == 1)?true:false,
                idDeliveryAreaPolicy : data.idDeliveryAreaPolicy || 0,
                deliveryCharge : data.deliveryCharge || 0,
                useRangeRepeat : data.useRangeRepeat == '1'?true:false,
                rangeDeliveryCharge,
                addPriceCargo : data.addPriceCargo || 0,
                addPriceQuick : data.addPriceQuick || 0,
            }, { where : { id }});

            return result[0] > 0;
        } catch (err) {
            logger(err);
            return false;
        }

    },
    /**
     * 배송조건 삭제
     * 
     * @param {Array|int} ids 
     * @returns {Boolean}
     * @throws {DeliveryPolicyDeleteException}
     */
    async deletePolicy(ids) {
        if (!ids) {
            throw new DeliveryPolicyDeleteException("삭제할 배송조건을 선택하세요.");
        }

        if (!(ids instanceof Array)) {
            ids = [ids];
        }
        try {
            for await (id of ids) {
                await DeliveryPolicy.destroy({ where : { id }});
            }

            return true;
        } catch (err) {
            logger(err);
            return false;
        }
    },
    /**
     * 배송조건 등록/수정 유효성 검사
     * 
     * @param {Object} data
     * @throws {Exception}
     */
    validate(data, Exception) {
        /** 필수입력 항목 체크 S */
        const required = {
            policyNm : "배송비 조건명을 입력하세요.",
            deliveryType : "배송방식을 선택하세요.",
            deliveryChargeType : "배송비 유형을 선택하세요.",
            deliveryCollectType : "배송비 결제방법을 선택하세요.",
        };

        if (data.mode == 'update') {
            required.id = "잘못된 접근입니다.";
        }

        for (key in required) {
            if (!data[key] || (typeof data[key] == 'string' && data[key].trim() == "")) {
                throw new Exception(required[key]);
            } 
        }

        if (data.useDeliveryAreaPolicy == 1 && !data.idDeliveryAreaPolicy) {
            throw new Exception("지역별 추가배송비 조건을 선택하세요");
        }

        if (data.deliveryChargeType == 'fixed' && (!data.deliveryCharge || Number(data.deliveryCharge) < 0)) {
            throw new Exception("고정배송비를 입력하세요.");
        }

        if (['price', 'count', 'weight'].indexOf(data.deliveryChargeType) != -1) {
            if (!(data.price instanceof Array)) {
                data.price = [data.price];
            }
            
            for (v of data.unitStart) {
                if (isNaN(v)) {
                    throw new Exception("구간범위는 숫자로 입력하세요.");
                }
            }

            for (v of data.unitEnd) {
                if (isNaN(v)) {
                    throw new Exception("구간범위는 숫자로 입력하세요.");
                }
            }
        }

        /** 필수입력 항목 체크 E */
    },
    /**
     * 배송조건 목록
     * 
     * @returns {Array|Boolean}
     */
    async getPolicies() {
        try {
            const list = await DeliveryPolicy.findAll({
                order : [['id', 'DESC']],
                raw : true,
            });

            for await (li of list) {
                /** 지역별 배송조건 설정 */
                if (li.useDeliveryAreaPolicy && li.idDeliveryAreaPolicy) {
                    li.deliveryAreaCharge = await deliveryAreaDao.getCharges(li.idDeliveryAreaPolicy);
                }

                /** 배송방식 문구 */
                li.deliveryType = li.deliveryType?li.deliveryType.split(","):[];
                li.deliveryTypeStr = this.getDeliveryTypeStr(li.deliveryType);

                const _deliveryType = [];
                for (const type of li.deliveryType) {
                    for(const item of deliveryDao.deliveryTypes) {
                        if (item.type == type) {
                            _deliveryType.push(item);
                        }
                    }
                }
                li._deliveryType = _deliveryType;
                
                /** 배송비 유형 문구 */
                li.deliveryChargeTypeStr = this.getDeliveryChargeTypeStr(li.deliveryChargeType);
            }

            return list;
        } catch (err) {
            logger(err);
            return false;
        }
    },
    /**
     * 배송조건 조회 
     * 
     * @param {int} id 배송
     * @returns {Object|Boolean}
     */
    async getPolicy(id) {
        try {
            const data = await DeliveryPolicy.findByPk(id, {
                raw : true,
            })
            if (!data) {
                return false;
            }

            if (data.rangeDeliveryCharge && typeof data.rangeDeliveryCharge == 'string') {
                data.rangeDeliveryCharge = JSON.parse(data.rangeDeliveryCharge);
            }
            
            /** 지역별 배송조건 설정 */
            if (data.useDeliveryAreaPolicy && data.idDeliveryAreaPolicy) {
                data.deliveryAreaCharge = await deliveryAreaDao.getCharges(data.idDeliveryAreaPolicy);
            }

            /** 배송방식 문구 */
            data.deliveryType = data.deliveryType ? data.deliveryType.split(","):[];
            data.deliveryTypeStr = this.getDeliveryTypeStr(data.deliveryType);

            const _deliveryType = [];
            for (const type of data.deliveryType) {
                for(const item of deliveryDao.deliveryTypes) {
                    if (item.type == type) {
                        _deliveryType.push(item);
                    }
                }
            }
            data._deliveryType = _deliveryType;

            /** 배송비 유형 문구 */
            data.deliveryChargeTypeStr = this.getDeliveryChargeTypeStr(data.deliveryChargeType);

            return data;
        } catch (err) {
            logger(err);
            return false;
        }
    }
};

module.exports = deliveryDao;