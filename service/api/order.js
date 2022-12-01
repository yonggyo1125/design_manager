const { ProductItem } = require('../../models');
const { getException, dateFormat } = require('../../library/common')
const orderDao = require('../../models/order/dao');
const designStatusDao = require('../../models/order/designStatusDao');
const designDraftDao = require('../../models/order/designDraftDao');
const orderStatusDao = require('../../models/order/orderStatusDao');
const optionDao = require("../../models/product/optionDao");
const TokenNotAuthorizedException = getException("API/TokenNotAuthorizedException");
const BadRequestException = getException("API/BadRequestException");
const NotAuthorizedMethodException = getException("API/NotAuthorizedMethodException");
const NotAuthorizedDataException = getException("API/NotAuthorizedDataException");
const OrderRegisterException = getException("Order/OrderRegisterException");
const OrderDeleteException = getException("Order/OrderDeleteException");

const adjustPayPrice = require("./adjustPayPrice"); // 쇼핑몰 주문 금액 조정


/**
 * 주문 API Service
 */
const orderService = {
    /**
     * 주문정보 조회
     * 
     * @param {Object} req
     * @throws {TokenNotAuthorizedException}
     */
    async gets(req) {
        if (['GET', 'POST'].indexOf(req.method.toUpperCase()) == -1) {
            throw new NotAuthorizedMethodException(); 
        }

        if (!req.idManager) {
            throw new TokenNotAuthorizedException();
        }
        
        const data = (req.method.toUpperCase() == 'GET')?req.query:req.body;

        /** 검색 항목 추가 */
        const search = { idManager : req.idManager };
        let sDate = data.createSdate;
        if (!sDate || sDate.trim() == "") {
            throw new BadRequestException("한달 이내의 주문일을 입력하세요.");
        }

        let eDate = data.createEdate;
        if (!eDate || eDate.trim() == "") {
            eDate = dateFormat(new Date(), "%Y-%m-%d");
        }

        /** 날짜 형식 통일  */
        sDate = sDate.replace(/[^\d]/g, "");
        eDate = eDate.replace(/[^\d]/g, "");
    
        const pattern = /(\d{4})(\d{2})(\d{2})/;
        const replacePattern = "$1-$2-$3";
        sDate = sDate.replace(pattern, replacePattern);
        eDate = eDate.replace(pattern, replacePattern);

        search.createSdate = sDate;
        search.createEdate = eDate;
        const gap = new Date(eDate) - new Date(sDate);
        const days = gap / (1000 * 60 * 60 * 24);
        if (days > 31) {
            throw new BadRequestException("한달 이내의 주문일을 입력하세요.");
        }

        const searchField = ["orderNo", "orderNm", "orderCellPhone", "orderStatus"];

        for (field of searchField) {
            if (data[field] && data[field].trim() != "") {
                search[field] = data[field].trim();
            }
        }
        
        let list = await orderDao.gets(1, 'all', req, search);
        if (!list) list = [];
        return list;
    },
    /**
     * 주문조회 
     *
     * @param {Object} req
     * @throws {TokenNotAuthorizedException}
     */
    async get(req) {
        if (['GET', 'POST'].indexOf(req.method.toUpperCase()) == -1) {
            throw new NotAuthorizedMethodException(); 
        }
        
        if (!req.idManager) {
            throw new TokenNotAuthorizedException();
        }

        let orderNo = req.params.orderNo || req.query.orderNo || req.body.orderNo;
        if (!orderNo || orderNo.trim() == "") {
            throw new BadRequestException();
        }

        orderNo = orderNo.trim();
        let data = await orderDao.get(orderNo);
        if (!data)  return {};

        if (req.idManager != data.idManager) {
            throw new NotAuthorizedDataException();
        }

        

        return data;
    },
    /**
     * 주문접수 
     * 
     * @param {Object} req
     */
    async add(req) {
        if (['POST'].indexOf(req.method.toUpperCase()) == -1) {
            throw new NotAuthorizedMethodException(); 
        }
        const data = req.body;
        const receiptType = data.receiptType; // 증빙자료
        const orderStatuses = await orderStatusDao.gets(false, ['statusCd']);
        const designStatuses = await designStatusDao.gets(false, ['statusCd']);
        const orderStatus = [], designStatus = [];
        for (let status of orderStatuses) {
            if (status && status.statusCd) {
                orderStatus.push(status.statusCd);
            }
        }

        for (let status of designStatuses) {
            if (status && status.statusCd) {
                designStatuses.push(status.statusCd);
            }
        }

        // 주문정보 필수 항목 
        const requiredOrderInfo = [ 
            "shopOrderNo(쇼핑몰 주문번호)", 
            "orderStatus(처리상태 - 상태 코드 확인)",
            "orderNm(주문자명)",
            "ordererType(주문자 구분 - private : 일반, company : 사업자)",
            "orderCellPhone(주문자 휴대전화)",
            "receiverNm(수령인/업체명)",
            "receiverCellPhone(수령인 휴대전화)",
            "receiverZonecode(배송지 우편번호)",
            "receiverAddress(배송지 주소)",
            "receiverAddressSub(배송지 나머지 주소)",  
            "payType(결제수단 - lbt : 무통장, card : 카드결제)",
        ];

        // 무통장 결제인경우 입금자명 필수 항목
        if (data.payType == 'lbt') {
            requiredOrderInfo.push("depositor(입금자명)" );
        } 


        if (receiptType && receiptType.indexOf("tax") != -1 && receiptType.indexOf("cash") != -1 ) { // 세금계산서와 현금영수증이 모두 포함된 경우
            throw new BadRequestException("세금계산서, 현금영수증 중에서 하나만 선택하여 전송하세요.");
        }

        /** 세금계산서일 경우 필수 항목 추가  */
        if (receiptType && receiptType.indexOf("tax") != -1) {
            requiredOrderInfo.push("taxReceiptBusinessNo(사업자등록번호)");
            requiredOrderInfo.push("taxReceiptCompanyNm(업체명/대표자명)");
            requiredOrderInfo.push("taxReceiptEmail(담당자 이메일)");
        }

        /**  현금영수증인 경우 필수 항목 추가 */
        if (receiptType && receiptType.indexOf("cash") != -1) {
            requiredOrderInfo.push("cashReceiptType(발급유형 - jumin : 주민등록번호, cellPhone : 휴대전화번호, businessNo : 사업자번호");
            requiredOrderInfo.push("cashReceiptNo(주민등록번호 or 휴대전화번호 or 사업자번호");
        }

        const missing = [];
        for (let field of requiredOrderInfo) {
            const key = field.split("(")[0];
            if (!data[key] || data[key].trim() == "") {
                missing.push(field);
            }
        }

        if (missing.length > 0) {
            const msg = `필수 요청항목이 누락되었습니다. 누락항목 : ${missing.join()}`;
            throw new BadRequestException(msg);
        }

        /** 주문 상태 유효성 검사 */
        if (orderStatus.indexOf(data.orderStatus) == -1) {
            throw new BadRequestException(`등록되지 않은 주문상태 코드 입니다.  - ${data.orderStatus}`);
        }

        /** 주문상품 유효성 검사 S */
        if (data.items && typeof data.items  == 'string') {
            data.items = JSON.parse(data.items);
        }

        if (!data.items || data.items.length == 0 || !(data.items instanceof Array)) {
            throw new BadRequestException("주문을 접수할 상품이 누락되었습니다.");
        }
        // 주문상품 팔수 항목
        const requiredOrderItems = [
            'itemCode(품목코드)',
            'itemNmSub(쇼핑몰 상품명)',
           // 'itemSizeWidth(사이즈 너비)',
            //'itemSizeHeight(사이즈 높이)',
            //'itemText(문구)',
            //'itemFont(폰트)',
            'itemPrice(판매원가)',
            'itemCnt(수량)',
            'deliveryChargeType(배송비 구분 - pre : 선불, post : 후불)',
            'itemShopSno(쇼핑몰 품주번호)',
            //'idDeliveryPolicy(배송조건 id)',
        ];
        
        const items = data.items;
    
        data.idProductItem = [];


        /** 배송 조건, 방식 처리 S */
        const keys = new Set();
        for await (let item of items) {
            let key = item.deliveryType;
            if (item.idDeliveryPolicy) {
                key += "_" + item.idDeliveryPolicy;
            }
            if (item.deliveryCompany) {
                key += "_" + item.deliveryCompany;
            }
            if (item.deliveryInvoice) {
                key += "_" + item.deliveryInvoice;
            }
            
            if (item.deliveryChargeType) {
                key += "_" + item.deliveryChargeType;
            }

            keys.add
            
        }

        
        let isPackageDelivery = false
        if (keys.size == 1) { // 전부 동일한 배송조건인 경우 묶음 배송
            isPackageDelivery = true;
            data.idDeliveryPolicy = items[0].idDeliveryPolicy;
            data.deliveryType = items[0].deliveryType;
            data.deliveryChargeType = items[0].deliveryChargeType;
            data.deliveryInvoice = items[0].deliveryInvoice;
            data.deliveryCompany = items[0].deliveryCompany;
        }
        /** 배송 조건, 방식 처리 E */

        for await (let item of items) {
            const missing = [];
            for (let field of requiredOrderItems) {
                const key = field.split("(")[0];
                if (!item[key] || ("" + item[key]).trim() == "") {
                    missing.push(field);
                }
            }

            if (missing.length > 0) {
                const msg = `필수 요청항목이 누락되었습니다. 누락항목 : ${missing.join()}`;
                throw new BadRequestException(msg);
            }

            // 유효한 품목코드인지 체크 
            const pItem = await ProductItem.findOne({
                where : { itemCode : item.itemCode },
                raw : true,
            });
            
            if (!pItem) {
                throw new BadRequestException(`등록되지 않은 품목코드 입니다. 품목코드 : ${item.itemCode}`);
            }

            const idOptions = pItem.idOptions?pItem.idOptions.split("||"):[];
            const idSubOptions = pItem.idSubOptions?pItem.idSubOptions.split("||"):[];
            const idTextOptions = pItem.idTextOptions?pItem.idTextOptions.split("||"):[];
           
            /** 기본 옵션 S */
            const _optionCds = [];
            if (idOptions.length > 0) {
                for await (let id of idOptions) {
                    const items = await optionDao.getBasicItems(id);
                    if (items && items.length > 0) {
                        for (let it of items) {
                            _optionCds.push(it.optionCd);
                        }
                    }
                }
            }
            /** 기본 옵션 E */
            /** 추가 옵션 S */
            const _subOptionCds = [];
            if (idSubOptions.length > 0) {
                for await (let id of idSubOptions) {
                    const items = await optionDao.getSubItems(id);
                    if (items && items.length > 0) {
                        for (let it of items) {
                            _subOptionCds.push(it.optionCd);
                        }
                    }
                }
            }
            /** 추가 옵션 E */
            /** 텍스트 옵션 S */
            const _textOptionCds = [];
            if (idTextOptions.length > 0) {
                for await (let id of idTextOptions) {
                    const items = await optionDao.getTextItems(id);
                    if (items && items.length > 0) {
                        for (let it of items) {
                            _textOptionCds.push(it.optionCd);
                        }
                    }
                }
            }
            /** 텍스트 옵션 E */

            /** 기본 옵션 유효성 검사 S */
            if (item.optionCds) {
                    if (_optionCds.length == 0) {
                        throw new BadRequestException("선택할 수 있는 옵션이 없는 상품입니다.");
                    }
                   
                    if (!(item.optionCds instanceof Array)) {
                        item.optionCds = [item.optionCds];
                    }

                    const mismatch = [];
                    for (let code of item.optionCds) {
                        if (_optionCds.indexOf(code) == -1) {
                            mismatch.push(code);
                        }
                    }
                    
                    if (mismatch.length > 0) {
                        const msg = `품목코드 ${item.itemCode}에서 허용하지 않는 기본 옵션코드가 포함되어 있습니다. 기본 옵션코드 : ${mismatch.join()}`;
                        throw new BadRequestException(msg);
                    }
            }
            /** 기본 옵션 유효성 검사 E */

            /** 추가 옵션 유효성 검사 S */
            if (item.subOptionCds) {
                if (_subOptionCds.length == 0) {
                    throw new BadRequestException("선택할 수 있는 추가 옵션이 없는 상품입니다.");
                }

                if (!(item.subOptionCds instanceof Array)) {
                    item.subOptionCds = [item.subOptionCds];
                }

                const mismatch = [];
                for (let code of item.subOptionCds) {
                    code = code.split("||")[0];
                    if (_subOptionCds.indexOf(code) == -1) {
                        mismatch.push(code);
                    }
                }
                if (mismatch.length > 0) {
                    const msg = `품목코드 ${item.itemCode}에서 허용하지 않는 추가 옵션코드가 포함되어 있습니다. 추가 옵션코드 : ${mismatch.join()}`;
                    throw new BadRequestException(msg);
                }
            }
            /** 추가 옵션 유효성 검사 E */

            /** 텍스트 옵션 유효성 검사 S */
            
        
            if (item.textOptions) {
                 if (_textOptionCds.length == 0) {
                    throw new BadRequestException("선택할 수 있는 텍스트 옵션이 없는 상품입니다.");
                }

                if (!(item.textOptions instanceof Array)) {
                    item.textOptions = [item.textOptions];
                }
               
                const mismatch = [];
                for (let opt of item.textOptions) {
                    if (_textOptionCds.indexOf(opt.optionCd) == -1) {
                        mismatch.push(opt.optionCd);
                    }
                }

                if (mismatch.length > 0) {
                    const msg = `품목코드 ${item.itemCode}에서 허용하지 않는 텍스트 옵션코드가 포함되어 있습니다. 텍스트 옵션코드 : ${mismatch.join()}`;
                    throw new BadRequestException(msg);
                }

            }
            /** 텍스트 옵션 유효성 검사 E */

            /** 데이터 완성 처리  */
            const id = pItem.id + "_" + Date.now();
            data.idProductItem.push(id);
            data[`itemNmSub_${id}`] = item.itemNmSub || "";
            data[`itemPrice_${id}`] = item.itemPrice || 0;
            data[`itemCnt_${id}`]  = item.itemCnt || 1;
            data[`itemSizeWidth_${id}`] = item.itemSizeWidth || 0;
            data[`itemSizeHeight_${id}`] = item.itemSizeHeight || 0;
            data[`itemText_${id}`] = item.itemText || "";
            data[`itemFont_${id}`] = item.itemFont || "";
            if (item.optionCds) data[`optionCds_${id}`] = item.optionCds;
            
            if (item.subOptionCds) {
                data[`subOptionCds_${id}`] = [];
                data[`subOptionCdsCnt_${id}`] = [];                
                for (let sub of item.subOptionCds) {
                    sub = sub.split("||");
                    data[`subOptionCds_${id}`].push(sub[0]);
                    data[`subOptionCdsCnt_${id}`].push(sub[1]);
                }
            }

            // 텍스트 옵션 처리 S 
            if (item.textOptions) { 
                data[`textOptionCds_${id}`] = [];
                for (let opt of item.textOptions) {
                    data[`textOptionCds_${id}`].push(opt.optionCd);
                    data[`textOptionTexts_${id}_${opt.optionCd}`] = opt.text;
                }
            }

            if (!isPackageDelivery) {
                item.receiverNm = item.receiverNm || data.receiverNm;
                item.receiverCellPhone = item.receiverCellPhone || data.receiverCellPhone;
                item.receiverZonecode = item.receiverZonecode || data.receiverZonecode;
                item.receiverAddress = item.receiverAddress || data.receiverAddress;
                item.receiverAddressSub = item.receiverAddressSub || data.receiverAddressSub;
                item.deliveryMemo = item.deliveryMemo || data.deliveryMemo;

            }

            // 텍스트 옵션 처리 E
            data[`itemDiscount_${id}`] = item.itemDiscount || 0;
            data[`itemAdjust_${id}`] = item.itemAdjust || 0;
            data[`deliveryChargeType_${id}`] = item.deliveryChargeType || "pre";
            data[`idDeliveryPolicy_${id}`] = item.idDeliveryPolicy || 0;
            data[`deliveryType_${id}`] = item.deliveryType || "parcel";
            data[`deliveryCompany_${id}`] = item.deliveryCompany || "";
            data[`deliveryInvoice_${id}`] = item.deliveryInvoice || "";
            data[`deliveryReleasedDate_${id}`] = item.deliveryReleasedDate || "";
            data[`preferredDeliveryReleasedDate_${id}`] = item.preferredDeliveryReleasedDate || "";
            data[`deliveryBundleCode_${id}`] = item.deliveryBundleCode || "";
            data[`receiverNm_${id}`] = item.receiverNm || "";
            data[`receiverCellPhone_${id}`] = item.receiverCellPhone || "";
            data[`receiverZonecode_${id}`] = item.receiverZonecode || "";
            data[`receiverAddress_${id}`] = item.receiverAddress || "";
            data[`receiverAddressSub_${id}`] = item.receiverAddressSub || "";
            data[`deliveryMemo_${id}`] = item.deliveryMemo || "";
            data[`packageDelivery_${id}`] = isPackageDelivery ? "package" : "each";
            
           
            if (item.designStatus) {
                /** 디자인 상태 유효성 검사 */
                if (designStatus.indexOf(item.designStatus) == -1) {
                    throw new BadRequestException(`등록되지 않은 디자인 상태 코드 입니다. - ${item.designStatus}`);
                }

                data[`designStatus_${id}`] = item.designStatus || "";
            }
            data[`itemShopSno_${id}`] = item.itemShopSno || "";
        }

        delete data.items;

        data.orderNo = Date.now();
        req.body = data;

        const result = await orderDao.add(req);
        if (!result) {
            throw new OrderRegisterException();
        }

        await adjustPayPrice(data.orderNo);

        return { orderNo : data.orderNo };
        /** 주문상품 유효성 검사 E */
    },
    async delete(req) {
        const orderNo = req.params.orderNo;

        if (!orderNo) {
            throw new BadRequestException("삭제할 주문번호가 누락되었습니다");
        }
        console.log("-------------------------");
        console.log(orderNo);
        const result = await orderDao.delete(orderNo);
        console.log("-------------------------------");
        if (!result) {
            throw new OrderDeleteException();
        }
    },
    /** 
     * 시안 조회
     * 
     * @param {req}
     */
    async getDesignDraft(req) {
        const draftUid = req.params.draftUid;
        if (!draftUid) {
            throw new BadRequestException("draftUid 누락되었습니다.");
        }

        const result = await designDraftDao.get(draftUid);
        if (!result)  {
            throw new BadRequestException("등록된 시안이 없습니다." );
        }

        return result;
    },
    /**
     * 시안 확정 
     * 
     * @param {req}
     */
    async confirmDesignDraft(req) {
        const draftUid = req.params.draftUid;
        if (!designUid) {
            throw new BadRequestException("draftUid 누락되었습니다.");
        }

        const designChoice = req.body.designChoice;
        if (!designChoice) {
            throw new BadRequestException("선택된 시안이 없습니다.");
        }
        const result = await designDraftDao.confirmDesignDraft(draftUid, designChoice);
        if (!result) {
            throw new BadRequestException("시안확정을 실패하였습니다.");
        }

        return result;
    },
    /**
     * 요청사항 업데이트 
     * 
     * @param {req}
     */
    async updateDesignRequest(req) {
        const draftUid = req.params.draftUid;
        if (!draftUid) {
            throw new BadRequestException("draftUid 누락되었습니다.");
        }

        const clientRequest = req.body.clientRequest;
        const result = await designDraftDao.updateDesignRequest(draftUid, clientRequest);
        if (!result) {
            throw new BadRequestException("요청사항 반영에 실패하였습니다.");
        }

        return result;
    }
};

module.exports = orderService;