const { sequelize, OrderInfo, OrderItem, OrderItemSample, OrderAddPayment,  Manager, Sequelize : { Op, QueryTypes }, Sequelize } = require('../index');
const { getException, logger, validateCellPhone, getLocalDate, getUTCDate, getConfig, dateFormat } = require('../../library/common');
/** 예외 S */
const OrderRegisterException = getException("Order/OrderRegisterException");
const OrderUpdateException = getException("Order/OrderUpdateException");
const OrderUpdateNotAuthorizedException = getException("Order/OrderUpdateNotAuthorizedException");
const OrderAddPaymentException = getException("Order/OrderAddPaymentException");
const OrderDeletePaymentException = getException("Order/OrderDeletePaymentException");
const OrderUpdatePaymentException = getException("Order/OrderUpdatePaymentException");
/** 예외 E */

const itemDao = require('../../models/product/itemDao');
const fileDao = require('../../models/file/dao');
const deliveryDao = require('../../models/delivery/dao');
const optionDao = require('../../models/product/optionDao');
const orderStatusDao = require("../../models/order/orderStatusDao");
const designStatusDao = require('../../models/order/designStatusDao');
const designDraftDao = require('../../models/order/designDraftDao');
const paymentItemDao = require('../../models/payment/itemDao');
const cashReceiptDao = require('../../models/cashReceipt/dao');
const managerDao = require('../../models/manager/dao');
const csDao = require('../../models/customer/dao');
const designerChangeDao = require('../../models/order/designerChangeDao');
const sendStatusMessageSvc = require('../../service/order/sendStatusMessage'); // 주문상태 변경 후 자동 메세지 전송 
const sizeCalculator = require('../../service/order/sizeCalculator'); // 사이즈계산기
const Pagination = require('../../library/pagination');

const traceSvc = require("../../service/delivery/trace"); // 배송 조회 관련

/**
 * 주문 DAO
 * 
 */
const order = {
    _total : 0, // 전체 주문 수 
    _pagination : "", // 페이지 HTML
    set total(total) {
        if (isNaN(total)) total = 0;
        this._total = total;
    },
    get total() {
        return this._total;
    },
    set pagination(pagination) {
        this._pagination = pagination;
    },
    get pagination() {
        return this._pagination;
    },
    /** 주문번호 S */
    _orderNo : undefined,
    set orderNo(orderNo) {
        this._orderNo = orderNo;
    },
    get orderNo() {
        if (!this._orderNo) {
            this._orderNo = Date.now();
        }

        return this._orderNo;
    },
    /** 주문번호 E */
    bundleCodes : {}, // 묶음배송 코드 
    /**
     * 주문등록 
     * 
     * @param {Object} req 
     * @returns 
     * @throws {OrderRegisterException}
     */
    async add(req) {
        const data = req.body;
        this.validate(data, OrderRegisterException);

        // 주문번호 
        const orderNo = data.orderNo || this.orderNo;
        data.shopOrderNo = data.shopOrderNo || null;
        data.channel = data.channel || "본사";
        data.ordererType = data.ordererType || "private";
        data.deliveryChargeType = data.deliveryChargeType || "pre";
        data.payType = data.payType || "lbt";
        
        let receiptType = data.receiptType;

        // 세금계산서가 포함되어 있지 않은 경우 
        if (receiptType && receiptType.indexOf('tax') == -1) { 
            data.taxReceiptBusinessNo = "";
            data.taxReceiptCompanyNm = "";
            data.taxReceiptEmail = "";
        }

        // 현금영수증이 포함되어 있지 않은 경우 
        if (receiptType && receiptType.indexOf('cash') == -1) {
            data.cashReceiptType = "none";
            data.cashReceiptNo = "";
        }
        if (receiptType && receiptType instanceof Array) {
            receiptType = receiptType.join("||");
        }
        const orderCellPhone = data.orderCellPhone.replace(/[^\d]/g, "");
        const receiverCellPhone = data.receiverCellPhone.replace(/[^\d]/g, "");

        /** 금액 정보 요약 업데이트  */
        await this.updatePriceSummary(data);

        const transaction = await sequelize.transaction();
        try {
            /** 주문 정보 저장 S */
            let orderInfoDeliveryPolicy;
            const orderIdDeliveryPolicy = data.idDeliveryPolicy || 0;
            if (orderIdDeliveryPolicy) {
                orderInfoDeliveryPolicy = await deliveryDao.getPolicy(orderIdDeliveryPolicy);
            }
            const orderInfo = await OrderInfo.create({
                orderNo,
                shopOrderNo : data.shopOrderNo,
                channel : data.channel,
                orderStatus : "",
                orderNm : data.orderNm,
                ordererType : data.ordererType,
                companyNm : data.companyNm,
                orderCellPhone,
                deliveryChargeType : data.deliveryChargeType || "pre",
                idDeliveryPolicy : orderIdDeliveryPolicy,
                deliveryType : data.deliveryType || "parcel",
                deliveryPolicy : orderInfoDeliveryPolicy,
                deliveryCompany : data.deliveryCompany,
                deliveryInvoice : data.deliveryInvoice,
                preferredDeliveryReleasedDate : data.preferredDeliveryReleasedDate?new Date(data.preferredDeliveryReleasedDate):undefined,
                deliveryReleasedDate : data.deliveryReleasedDate?new Date(data.deliveryReleasedDate):undefined,
                deliveryCharge : data.deliveryCharge || 0,
                deliveryChargeVat : data.deliveryChargeVat || 0,
                receiverNm : data.receiverNm,
                receiverCellPhone,
                receiverZonecode : data.receiverZonecode,
                receiverAddress : data.receiverAddress,
                receiverAddressSub : data.receiverAddressSub,
                deliveryMemo : data.deliveryMemo,
                receiptType,
                taxReceiptBusinessNo : data.taxReceiptBusinessNo,
                taxReceiptCompanyNm : data.taxReceiptCompanyNm,
                taxReceiptEmail : data.taxReceiptEmail,
                businessCertFileId : data.businessCertFileId || 0,
                cashReceiptType : data.cashReceiptType,
                cashReceiptNo : data.cashReceiptNo,
                payType : data.payType,
                depositor : data.depositor,
                itemsTotalPrice : data.itemsTotalPrice,
                totalDiscount : data.totalDiscount,
                totalDeliveryCharge : data.totalDeliveryCharge || 0,
                totalAddDeliveryCharge : data.totalAddDeliveryCharge || 0,
                totalVat : data.totalVat,
                totalPayPrice : data.totalPayPrice,
                shopTotalPayPrice : data.shopTotalPayPrice,
                shopOrderViewUrl : data.shopOrderViewUrl,
                shopName : data.shopName,
                memo : data.memo,
                idManager :  req.manager?req.manager.id:0,
            }, { transaction });
            /** 주문 정보 저장 E */
            
            /** 주문 품목 저장 S */
            let idProductItems = data.idProductItem;
            if (!(idProductItems instanceof Array)) {
                idProductItems = [idProductItems];
            }

            for await (id of idProductItems) {
                var _id = id.split("_")[0];
                const productItem = await itemDao.get(_id);
                if (!productItem) {
                    throw new OrderRegisterException("존재하지 않는 주문품목이 포함되어 있습니다.");
                }
                let cellPhone = "";
                if (data[`receiverCellPhone_${id}`]) {
                    cellPhone = data[`receiverCellPhone_${id}`];
                    cellPhone = cellPhone.replace(/[^\d]/g, "");
                }
                
                let optionCds  = "", subOptionCds = "", subOptionCdsCnt = "", textOptionCds = "";
                /** 기본 옵션 처리 S */
                if (data[`optionCds_${id}`] instanceof Array) {
                    optionCds = data[`optionCds_${id}`].join("||");
                } else {
                    optionCds = data[`optionCds_${id}`];
                }
                /** 기본 옵션 처리 E */

                /** 추가 옵션 처리 S */
                if (data[`subOptionCds_${id}`] instanceof Array) {
                    subOptionCds = data[`subOptionCds_${id}`].join("||");
                } else {
                    subOptionCds = data[`subOptionCds_${id}`];
                }
                /** 추가 옵션 처리 E */
                /** 추가 옵션 수량 처리 S */
                if (data[`subOptionCdsCnt_${id}`] instanceof Array) {
                    subOptionCdsCnt = data[`subOptionCdsCnt_${id}`].join("||");
                } else {
                    subOptionCdsCnt = data[`subOptionCdsCnt_${id}`];
                }
                /** 추가 옵션 수량 처리 E */

                /** 텍스트 옵션 처리 S */
                const textOptionTexts = [];
                if (data[`textOptionCds_${id}`] instanceof Array) {
                    textOptionCds = data[`textOptionCds_${id}`].join("||");
                } else {
                    textOptionCds = data[`textOptionCds_${id}`];
                }

                if (textOptionCds) {
                    for (let textOptionCd of textOptionCds.split("||")) {
                        const text = data[`textOptionTexts_${id}_${textOptionCd}`].trim();
                        if (!text) {
                            continue;
                        }
                        textOptionTexts.push({
                            optionCd : textOptionCd,
                            text,
                        });
                    }
                }
                /** 텍스트 옵션 처리 E */

                /** 배송 정책 처리 S */
                const idDeliveryPolicy = data[`idDeliveryPolicy_${id}`] || 0;
                let deliveryPolicy = {};
                if (idDeliveryPolicy) {
                    deliveryPolicy = await deliveryDao.getPolicy(idDeliveryPolicy);
                }
                /** 배송 정책 처리 E */

                const orderItem = await OrderItem.create({
                    orderNo,
                    itemUid : id,
                    itemCode : productItem.itemCode,
                    itemNm : productItem.itemNm,
                    itemNmSub : data[`itemNmSub_${id}`],
                    itemSizeWidth : data[`itemSizeWidth_${id}`] || 0,
                    itemSizeHeight : data[`itemSizeHeight_${id}`] || 0,
                    itemText : data[`itemText_${id}`],
                    itemFont : data[`itemFont_${id}`],
                    itemMemo : data[`itemMemo_${id}`],
                    providerPrice : productItem.providerPrice || 0,
                    itemPrice : data[`itemPrice_${id}`] || 0,
                    itemDiscount : data[`itemDiscount_${id}`] || 0,
                    itemDiscountVat : data[`itemDiscountVat_${id}`] || 0,
                    itemAdjust : data[`itemAdjust_${id}`] || 0,
                    itemCnt : data[`itemCnt_${id}`] || 1,
                    deliveryChargeType : data[`deliveryChargeType_${id}`],
                    idDeliveryPolicy,
                    deliveryType : data[`deliveryType_${id}`] || "parcel",
                    deliveryPolicy,
                    deliveryCharge : data[`deliveryCharge_${id}`] || 0,
                    deliveryChargeVat : data[`deliveryChargeVat_${id}`] || 0,
                    addDeliveryCharge : data[`addDeliveryCharge_${id}`] || 0,
                    addDeliveryChargeVat : data[`addDeliveryChargeVat_${id}`] || 0,
                    preferredDeliveryReleasedDate : data[`preferredDeliveryReleasedDate_${id}`]?new Date(data[`preferredDeliveryReleasedDate_${id}`]):undefined,
                    deliveryReleasedDate : data[`deliveryReleasedDate_${id}`]?new Date(data[`deliveryReleasedDate_${id}`]):undefined,
                    deliveryBundleCode : data[`deliveryBundleCode_${id}`],
                    deliveryCompany : data[`deliveryCompany_${id}`],
                    deliveryInvoice : data[`deliveryInvoice_${id}`],
                    receiverNm : data[`receiverNm_${id}`],
                    receiverCellPhone : cellPhone,
                    receiverZonecode : data[`receiverZonecode_${id}`],
                    receiverAddress : data[`receiverAddress_${id}`],
                    receiverAddressSub : data[`receiverAddressSub_${id}`],
                    packageDelivery : data[`packageDelivery_${id}`] || "package",
                    deliveryMemo : data[`deliveryMemo_${id}`],
                    designStatus : data[`designStatus_${id}`] || "",
                    optionCds,
                    subOptionCds,
                    subOptionCdsCnt,
                    textOptionCds,
                    textOptionTexts,
                    optionInfo : data[`optionInfo_${id}`],
                    subOptionInfo : data[`subOptionInfo_${id}`],
                    textOptionInfo : data[`textOptionInfo_${id}`],
                    basicOptionPrice : data[`basicOptionPrice_${id}`] || 0,
                    subOptionPrice : data[`subOptionPrice_${id}`] || 0,
                    textOptionPrice : data[`textOptionPrice_${id}`] || 0,
                    itemTotalPrice : data[`itemTotalPrice_${id}`] || 0,
                    itemTotalPriceVat : data[`itemTotalPriceVat_${id}`] || 0,
                    itemShopSno : data[`itemShopSno_${id}`] || "", // 쇼핑몰 품주번호
                    memo : data.memo,
                    idProductItem : productItem.id,
                    boardSizeType : data[`boardSizeType_${id}`] || 'portrait',
                    boardSize : data[`boardSize_${id}`] || 'direct',
                }, { transaction });
               
                
                if (data[`sampleItemCd_${id}`]) {
                    let sampleItemCds = data[`sampleItemCd_${id}`];
                    let sampleItemNms = data[`sampleItemNm_${id}`];
                    let sampleItemDownloadLinks = data[`sampleItemDownloadLink_${id}`];
                    let sampleItemAiDownloadLinks = data[`sampleItemAiDownloadLink_${id}`];
                    if (!(sampleItemCds instanceof Array)) {
                        sampleItemCds = [sampleItemCds];
                        sampleItemNms = [sampleItemNms];
                        sampleItemDownloadLinks = [sampleItemDownloadLinks];
                        sampleItemAiDownloadLinks = [sampleItemAiDownloadLinks];
                    }
                    
                    let no = 0;
                    for await (sampleItemCd of sampleItemCds) {
                        await OrderItemSample.create({
                            itemCd : sampleItemCd,
                            itemNm : sampleItemNms[no],
                            downloadLink : sampleItemDownloadLinks[no],
                            aiDownloadLink : sampleItemAiDownloadLinks[no],
                            idOrderItem : orderItem.id,
                        }, { transaction });
                        no++;
                    }
                }

                await fileDao.updateDone(`order_${orderNo}_${id}`, transaction);
            }

            /** 주문 품목 저장 E */
            await transaction.commit();
            this.orderNo = orderNo;

            await this.changeOrderStatus(orderNo, data.orderStatus);
            
            return true;
        } catch (err) {
            await transaction.rollback();
            
            if (err instanceof OrderRegisterException) {
                throw new OrderRegisterException(err.message);
            }

            logger(err);
            return false;
        }
    },
    /**
     * 주문서 수정 
     * 
     * @param {Object} req 
     * @returns {Boolean}
     * @throws {OrderUpdateException}
     */
    async update(req) {
        const data = req.body;
        this.validate(data, OrderUpdateException);
        data.ordererType = data.ordererType || "private";
        data.deliveryChargeType = data.deliveryChargeType || "pre";
        data.payType = data.payType || "lbt";
        let receiptType = data.receiptType;
        // 세금계산서가 포함되어 있지 않은 경우 
        if (receiptType && receiptType.indexOf('tax') == -1) { 
            data.taxReceiptBusinessNo = "";
            data.taxReceiptCompanyNm = "";
            data.taxReceiptEmail = "";
        }

        // 현금영수증이 포함되어 있지 않은 경우 
        if (receiptType && receiptType.indexOf('cash') == -1) {
            data.cashReceiptType = "none";
            data.cashReceiptNo = "";
        }
        if (receiptType && receiptType instanceof Array) {
            receiptType = receiptType.join("||");
        }
        const orderCellPhone = data.orderCellPhone.replace(/[^\d]/g, "");
        const receiverCellPhone = data.receiverCellPhone.replace(/[^\d]/g, "");
        
        /** 금액 정보 요약 업데이트  */
        await this.updatePriceSummary(data);

        const transaction = await sequelize.transaction();
        try {
            let orderInfoDeliveryPolicy;
            const orderIdDeliveryPolicy = data.idDeliveryPolicy || 0;
            if (orderIdDeliveryPolicy) {
                orderInfoDeliveryPolicy = await deliveryDao.getPolicy(orderIdDeliveryPolicy);
            }
            /** 주문정보 저장 S */
            await OrderInfo.update({
                orderStatus : data.orderStatus,
                designStatus : data.designStatus,
                orderNm : data.orderNm,
                ordererType : data.ordererType,
                companyNm : data.companyNm,
                orderCellPhone,
                deliveryChargeType : data.deliveryChargeType || "pre",
                idDeliveryPolicy : orderIdDeliveryPolicy,
                deliveryType : data.deliveryType || "parcel",
                deliveryPolicy : orderInfoDeliveryPolicy,
                deliveryCompany : data.deliveryCompany,
                deliveryInvoice : data.deliveryInvoice,
                preferredDeliveryReleasedDate : data.preferredDeliveryReleasedDate?new Date(data.preferredDeliveryReleasedDate):undefined,
                deliveryReleasedDate : data.deliveryReleasedDate?new Date(data.deliveryReleasedDate):undefined,
                deliveryCharge : data.deliveryCharge || 0,
                deliveryChargeVat : data.deliveryChargeVat || 0,
                receiverNm : data.receiverNm,
                receiverCellPhone,
                receiverZonecode : data.receiverZonecode,
                receiverAddress : data.receiverAddress,
                receiverAddressSub : data.receiverAddressSub,
                deliveryMemo : data.deliveryMemo,
                receiptType,
                taxReceiptBusinessNo : data.taxReceiptBusinessNo,
                taxReceiptCompanyNm : data.taxReceiptCompanyNm,
                taxReceiptEmail : data.taxReceiptEmail,
                businessCertFileId : data.businessCertFileId || 0,
                cashReceiptType : data.cashReceiptType,
                cashReceiptNo : data.cashReceiptNo,
                payType : data.payType,
                depositor : data.depositor,
                itemsTotalPrice : data.itemsTotalPrice,
                totalDiscount : data.totalDiscount,
                totalDeliveryCharge : data.totalDeliveryCharge || 0,
                totalAddDeliveryCharge : data.totalAddDeliveryCharge || 0,
                totalVat : data.totalVat,
                totalPayPrice : data.totalPayPrice,
                shopTotalPayPrice : data.shopTotalPayPrice,
                shopOrderViewUrl : data.shopOrderViewUrl,
                shopName : data.shopName,
                memo : data.memo,
            }, {
                where : { orderNo : data.orderNo },
                transaction,
            });
            /** 주문정보 저장 E */

            /** 주문 품목 저장 S */
            let idProductItems = data.idProductItem;
            if (!(idProductItems instanceof Array)) {
                idProductItems = [idProductItems];
            }

            for await (id of idProductItems) {
                var _id = id.split("_")[0];
                const productItem = await itemDao.get(_id);
                if (!productItem) {
                    throw new OrderRegisterException("존재하지 않는 주문품목이 포함되어 있습니다.");
                }
                let cellPhone = "";
                if (data[`receiverCellPhone_${id}`]) {
                    cellPhone = data[`receiverCellPhone_${id}`];
                    cellPhone = cellPhone.replace(/[^\d]/g, "");
                }

                let idOrderItem = data[`idOrderItem_${id}`];

                let optionCds  = "", subOptionCds = "", subOptionCdsCnt = "", textOptionCds = "";
                /** 기본 옵션 처리 S */
                if (data[`optionCds_${id}`] instanceof Array) {
                    optionCds = data[`optionCds_${id}`].join("||");
                } else {
                    optionCds = data[`optionCds_${id}`];
                }
                /** 기본 옵션 처리 E */

                /** 추가 옵션 처리 S */
                if (data[`subOptionCds_${id}`] instanceof Array) {
                    subOptionCds = data[`subOptionCds_${id}`].join("||");
                } else {
                    subOptionCds = data[`subOptionCds_${id}`];
                }
                /** 추가 옵션 처리 E */
                /** 추가 옵션 수량 처리 S */
                if (data[`subOptionCdsCnt_${id}`] instanceof Array) {
                    subOptionCdsCnt = data[`subOptionCdsCnt_${id}`].join("||");
                } else {
                    subOptionCdsCnt = data[`subOptionCdsCnt_${id}`];
                }
                /** 추가 옵션 수량 처리 E */
                
                /** 텍스트 옵션 처리 S */
                const textOptionTexts = [];
                if (data[`textOptionCds_${id}`] instanceof Array) {
                    textOptionCds = data[`textOptionCds_${id}`].join("||");
                } else {
                    textOptionCds = data[`textOptionCds_${id}`];
                }

                if (textOptionCds) {
                    for (let textOptionCd of textOptionCds.split("||")) {
                        const text = data[`textOptionTexts_${id}_${textOptionCd}`].trim();

                        if (!text) {
                            continue;
                        }
                        textOptionTexts.push({
                            optionCd : textOptionCd,
                            text,
                        });
                    }
                }
                /** 텍스트 옵션 처리 E */

                /** 배송 정책 처리 S */
                const idDeliveryPolicy = data[`idDeliveryPolicy_${id}`] || 0;
                let deliveryPolicy = {};
                if (idDeliveryPolicy) {
                    deliveryPolicy = await deliveryDao.getPolicy(idDeliveryPolicy);
                }
                /** 배송 정책 처리 E */

                const commonData = {
                    itemNmSub : data[`itemNmSub_${id}`],
                    itemSizeWidth : data[`itemSizeWidth_${id}`] || 0,
                    itemSizeHeight : data[`itemSizeHeight_${id}`] || 0,
                    itemText : data[`itemText_${id}`],
                    itemFont : data[`itemFont_${id}`],
                    itemMemo : data[`itemMemo_${id}`],
                    itemPrice : data[`itemPrice_${id}`] || 0,
                    itemDiscount : data[`itemDiscount_${id}`] || 0,
                    itemDiscountVat : data[`itemDiscountVat_${id}`] || 0,
                    itemAdjust : data[`itemAdjust_${id}`] || 0,
                    itemCnt : data[`itemCnt_${id}`] || 1,
                    deliveryChargeType : data[`deliveryChargeType_${id}`],
                    idDeliveryPolicy,
                    deliveryType : data[`deliveryType_${id}`] || "parcel",
                    deliveryPolicy,
                    deliveryCharge : data[`deliveryCharge_${id}`] || 0,
                    deliveryChargeVat : data[`deliveryChargeVat_${id}`] || 0,
                    addDeliveryCharge : data[`addDeliveryCharge_${id}`] || 0,
                    addDeliveryChargeVat : data[`addDeliveryChargeVat_${id}`] || 0,
                    preferredDeliveryReleasedDate : data[`preferredDeliveryReleasedDate_${id}`]?new Date(data[`preferredDeliveryReleasedDate_${id}`]):undefined,
                    deliveryReleasedDate : data[`deliveryReleasedDate_${id}`]?new Date(data[`deliveryReleasedDate_${id}`]):undefined,
                    deliveryBundleCode : data[`deliveryBundleCode_${id}`],
                    deliveryCompany : data[`deliveryCompany_${id}`],
                    deliveryInvoice : data[`deliveryInvoice_${id}`],
                    receiverNm : data[`receiverNm_${id}`],
                    receiverCellPhone : cellPhone,
                    receiverZonecode : data[`receiverZonecode_${id}`],
                    receiverAddress : data[`receiverAddress_${id}`],
                    receiverAddressSub : data[`receiverAddressSub_${id}`],
                    packageDelivery : data[`packageDelivery_${id}`] || "package",
                    deliveryMemo : data[`deliveryMemo_${id}`],
                    designStatus : data[`designStatus_${id}`],
                    optionCds,
                    subOptionCds,
                    subOptionCdsCnt,
                    textOptionCds,
                    textOptionTexts,
                    optionInfo : data[`optionInfo_${id}`],
                    subOptionInfo : data[`subOptionInfo_${id}`],
                    textOptionInfo : data[`textOptionInfo_${id}`],
                    basicOptionPrice : data[`basicOptionPrice_${id}`] || 0,
                    subOptionPrice : data[`subOptionPrice_${id}`] || 0,
                    textOptionPrice : data[`textOptionPrice_${id}`] || 0,
                    itemTotalPrice : data[`itemTotalPrice_${id}`] || 0,
                    itemTotalPriceVat : data[`itemTotalPriceVat_${id}`] || 0,
                    boardSizeType : data[`boardSizeType_${id}`] || 'portrait',
                    boardSize : data[`boardSize_${id}`] || 'direct',
                };
                
                if (idOrderItem) { // 수정 처리 
                    await OrderItem.update(commonData, { 
                        where : { id : idOrderItem },
                        transaction
                    });
                    
                } else { // 추가 처리 
                    commonData.orderNo = data.orderNo;
                    commonData.itemUid = id;
                    commonData.itemCode = productItem.itemCode;
                    commonData.itemNm  = productItem.itemNm;
                    commonData.providerPrice = productItem.providerPrice || 0;
                    commonData.idProductItem = productItem.id;
                    const orderItem = await OrderItem.create(commonData, { transaction });
                    idOrderItem = orderItem.id;
                }
        
                if (data[`sampleItemCd_${id}`]) {
                    let sampleItemCds = data[`sampleItemCd_${id}`];
                    let sampleItemNms = data[`sampleItemNm_${id}`];
                    let sampleItemDownloadLinks = data[`sampleItemDownloadLink_${id}`];
                    let sampleItemAiDownloadLinks = data[`sampleItemAiDownloadLink_${id}`];
                    if (!(sampleItemCds instanceof Array)) {
                        sampleItemCds = [sampleItemCds];
                        sampleItemNms = [sampleItemNms];
                        sampleItemDownloadLinks = [sampleItemDownloadLinks];
                        sampleItemAiDownloadLinks = [sampleItemAiDownloadLinks];
                    }
                    
                    let no = 0;
                    for await (sampleItemCd of sampleItemCds) {
                        const sampleData = {
                            itemNm : sampleItemNms[no],
                            downloadLink : sampleItemDownloadLinks[no],
                            aiDownloadLink : sampleItemAiDownloadLinks[no],
                        };
                        
                        const cnt = await OrderItemSample.count({ where : { itemCd : sampleItemCd, idOrderItem}});
                        if (cnt > 0) { // 수정 
                            await OrderItemSample.update(sampleData, { where : { itemCd : sampleItemCd, idOrderItem}, transaction});
                        } else { // 추가
                            sampleData.itemCd = sampleItemCd;
                            sampleData.idOrderItem = idOrderItem;
                            await OrderItemSample.create(sampleData, { transaction });
                        }
                        no++;
                    }
                }

                await fileDao.updateDone(`order_${data.orderNo}_${id}`, transaction);
            } // endfor 


            await transaction.commit();

            return true;
        } catch(err) {
            await transaction.rollback();
            logger(err);
            return false;
        }

    },
    /**
     * 주문목록 수정 
     * 
     * @param {Object}} req 
     * @returns {Boolean}
     * @throws {OrderUpdateException}
     */
    async updates(req) {
        const data = req.body;
        if (!data) {
            throw new OrderUpdateException("잘못된 접근입니다.");
        }

        let orderNos = data.orderNo;

        try {
            /** 주문서 수정 S  */
            if (orderNos) {
                if (!(orderNos instanceof Array)) {
                    orderNos = [orderNos];
                }
        
                for await (let orderNo of orderNos) {
                    await order.changeOrderStatus(orderNo, data[`orderStatus_${orderNo}`]);
                }
            }
            /** 주문서 수정 E  */

            /** 주문서 품목 수정 S  */
            let idOrderItems = data.id;
            if (!(idOrderItems instanceof Array)) {
                idOrderItems = [idOrderItems];
            }

            for await (let id of idOrderItems) {
                const designStatus = data[`designStatus_${id}`];
                const idDesigner = data[`idDesigner_${id}`];
                if (designStatus) { // 디자인 상태 변경 
                    await order.changeDesignStatus(id, designStatus);
                }

                if (idDesigner) { // 디자이너 변경 
                    await order.changeDesigner(id, idDesigner);
                }
             }
             /** 주문서 품목 수정 E  */
            return true;
        } catch (err) {
            logger(err);
            return false;
        }
    },
    /**
     * 주문서 증빙자료 정보 변경 
     * 
     * @param {Object} req
     * @returns {Boolean}
     */
    async updateReceiptTypeInfo(req) {
        const data = req.body;
        const orderNo = req.params.orderNo || data.orderNo;
        if (!orderNo) {
            return false;
        }

        let receiptType = data.receiptType;
        // 세금계산서가 포함되어 있지 않은 경우 
        if (receiptType && receiptType.indexOf('tax') == -1) { 
            data.taxReceiptBusinessNo = "";
            data.taxReceiptCompanyNm = "";
            data.taxReceiptEmail = "";
        }

        // 현금영수증이 포함되어 있지 않은 경우 
        if (receiptType && receiptType.indexOf('cash') == -1) {
            data.cashReceiptType = "none";
            data.cashReceiptNo = "";
        }
        if (receiptType && receiptType instanceof Array) {
            receiptType = receiptType.join("||");
        }

        try { 
            const result = await OrderInfo.update({
                receiptType,
                taxReceiptBusinessNo : data.taxReceiptBusinessNo,
                taxReceiptCompanyNm : data.taxReceiptCompanyNm,
                taxReceiptEmail : data.taxReceiptEmail,
                businessCertFileId : data.businessCertFileId,
                cashReceiptType : data.cashReceiptType,
                cashReceiptNo : data.cashReceiptNo,
            }, { where : { orderNo }});

            return result[0] > 0;
        } catch (err) {
            logger(err);
            return false;
        }

    },
    /**
     * 주문서 삭제 
     * 
     * @param {Array|long} orderNos 
     * @returns {Boolean}
     */
    async delete(orderNos) {
        if (!orderNos) {
            return false;
        }

        if (!(orderNos instanceof Array)) {
            orderNos = [orderNos];
        }
        
        try {
            for await (orderNo of orderNos) {
                /** 삭제 불가 주문상태인 경우 건너 뛰기 S */
                const orderStatusInfo = await orderStatusDao.get(orderNo);
                const setting = orderStatusInfo.setting;
                if (!setting || !setting.orderDeletePossible) {
                    if (orderNos.length == 1) {
                        return false;
                    } 

                    continue;
                }
                /** 삭제 불가 주문상태인 경우 건너 뛰기 E */

                const orderItems = await OrderItem.findAll({
                    attributes : ['id'],
                    where : { orderNo },
                    raw : true,
                });
                await sequelize.transaction( async (transaction) => {
                    if (orderItems && orderItems.length > 0) {
                
                        const ids = [];
                        orderItems.forEach(item => ids.push(item.id));

                        if (ids.length > 0) {
                            await order.deleteItems(ids);
                        }
                    }
                    const result = await OrderInfo.destroy({
                            where : { orderNo },
                            transaction,
                    });
                    return result;
                });
            }

            return true;
        } catch (err) {
            logger(err);
            return false;
        }
    },
    /**
     * 주문 등록/수정 유효성 검사 
     * 
     * @param {Object} data 
     * @throws {Exception}
     */
    validate(data, Exception) {
        /** 필수 입력항목 체크 S */
        const required = {
            orderStatus : "처리상태를 선택하세요.",
            orderNm : "주문자명을 입력하세요.",
            orderCellPhone : "주문자 휴대전화를 입력하세요.",
        };

        if (data.mode == 'update') {
            required.orderNo = "잘못된 접근입니다.";
        }

        for(key in required) {
            if (!data[key] || data[key].trim() == "") {
                throw new Exception(required[key]); 
            }
        } 
        
        if (!data.idProductItem) {
            throw new Exception("주문할 품목을 추가하세요.");
        }
        /** 필수 입력항목 체크 E */

        /** 주문자 휴대전화 검증  */
        if (!validateCellPhone(data.orderCellPhone)) {
            throw new Exception("휴대전화번호 형식이 아닙니다(주문자 휴대전화)");
        }

        /** 수령인 휴대전화 검증 */
        if (!validateCellPhone(data.receiverCellPhone)) {
            throw new Exception("휴대전화번호 형식이 아닙니다(수령인 휴대전화)");
        }
    },
    /**
     * 주문 접수/수정 금액 요약 정보 업데이트 
     * 
     * @param {Object} data 
     */
    async updatePriceSummary(data) {
        if (!data || !data.idProductItem) {
            return;
        }

        let idProductItems = data.idProductItem;
        if (!(idProductItems instanceof Array)) {
            idProductItems = [idProductItems];
        }

        const bundleCodes = {}; // 배송비 계산을 위한 데이터 모음 처리
        let itemsTotalPrice = totalDiscount = totalDeliveryCharge = totalVat = 0;
        for await (id of idProductItems) {  
            const itemPrice = Number(data[`itemPrice_${id}`]);
            const itemCnt = Number(data[`itemCnt_${id}`]);
            const itemDiscount = Number(data[`itemDiscount_${id}`]);
            const itemAdjust = Number(data[`itemAdjust_${id}`]);
           
            let basicOptionPrice = 0, subOptionPrice = 0, textOptionPrice = 0;
        
            /** 기본 옵션 합계 S */
            data[`optionInfo_${id}`] = [];
            if (data[`optionCds_${id}`]) {
                if (!(data[`optionCds_${id}`] instanceof Array)) {
                    data[`optionCds_${id}`] = [data[`optionCds_${id}`]];
                }
                const basicItems = await optionDao.getBasicItem(data[`optionCds_${id}`]);
                if (basicItems && basicItems.length > 0) {
                    basicItems.forEach(opt => {
                        data[`optionInfo_${id}`] = data[`optionInfo_${id}`] || [];
                        data[`optionInfo_${id}`].push({
                            optionCd : opt.optionCd,
                            optionNm : opt.optionNm,
                            addPrice : opt.addPrice,
                        });
                        basicOptionPrice += opt.addPrice; 
                    });
                }
            }
            /** 기본 옵션 합계 E */

            /** 추가 옵션 합계 S */
            data[`subOptionInfo_${id}`] = [];
            if (data[`subOptionCds_${id}`]) {
                if (!(data[`subOptionCds_${id}`] instanceof Array)) {
                    data[`subOptionCds_${id}`] = [data[`subOptionCds_${id}`]];
                }
                if (!(data[`subOptionCdsCnt_${id}`] instanceof Array)) {
                    data[`subOptionCdsCnt_${id}`] = [data[`subOptionCdsCnt_${id}`]];
                }
                const cnts = [];
                for (let i = 0; i < data[`subOptionCds_${id}`].length; i++) {
                    let cnt = data[`subOptionCdsCnt_${id}`][i];
                    const optCd = data[`subOptionCds_${id}`][i];
                    if (!optCd) {
                        cnt = 0;
                    } else {
                        if (isNaN(cnt)) cnt = 1;
                        cnts.push({optCd, cnt});
                    }
                }
         
                const subItems = await optionDao.getSubItem(data[`subOptionCds_${id}`]);
                if (subItems && subItems.length > 0) {
                    subItems.forEach((opt, i) => {
                        let cnt = 0;
                        for (let o of cnts) {
                            if (o.optCd == opt.optionCd) {
                                cnt = o.cnt;
                            }
                        }
                        data[`subOptionInfo_${id}`] = data[`subOptionInfo_${id}`] || [];
                        data[`subOptionInfo_${id}`].push({
                            optionCd : opt.optionCd,
                            optionNm : opt.optionNm,
                            addPrice : opt.addPrice,
                            optionCnt : cnt,
                        });
                        subOptionPrice += opt.addPrice * cnt;
                    });
                }
            }
            /** 추가 옵션 합계 E */

            /** 텍스트 옵션 합계 S */
            data[`textOptionInfo_${id}`] = [];
            if (data[`textOptionCds_${id}`]) {
                if (!(data[`textOptionCds_${id}`] instanceof Array)) {
                    data[`textOptionCds_${id}`] = [data[`textOptionCds_${id}`]];
                }
                const textItems = await optionDao.getTextItem(data[`textOptionCds_${id}`]);
                if (textItems && textItems.length > 0) {
                    for (let opt of textItems) {
                        if (data[`textOptionTexts_${id}_${opt.optionCd}`]) {
                            const text = data[`textOptionTexts_${id}_${opt.optionCd}`].trim();
                            data[`textOptionInfo_${id}`] = data[`textOptionInfo_${id}`] || [];
                            data[`textOptionInfo_${id}`].push({
                                optionCd : opt.optionCd,
                                optionNm : opt.optionNm,
                                addPrice : opt.addPrice,
                                text,
                            });
                            
                            // 텍스트 옵션은 실제 입력된 항목이 있는 경우 추가금액 반영
                            if (text) {
                                textOptionPrice += opt.addPrice;
                            }
                        }
                    }
                }
            }
            /** 텍스트 옵션 합계 E */

            const itemTotalPrice = (itemPrice + basicOptionPrice + textOptionPrice) * itemCnt + subOptionPrice + itemAdjust;
            const itemTotalPriceVat = (itemTotalPrice > 0)?Math.round(itemTotalPrice - itemTotalPrice / 1.1):0;
            const itemDiscountVat = (itemDiscount > 0)?Math.round(itemDiscount - itemDiscount / 1.1):0;
          

             /** 배송비 처리 위한 데이터 가공  S */
            const packageDelivery =  data[`packageDelivery_${id}`] || "package";
            let key = packageDelivery;
            let idDeliveryPolicy = data[`idDeliveryPolicy`] || 0;
            let deliveryType = data['deliveryType'] || 'parcel';

            let deliveryChargeType =  data[`deliveryChargeType`] || "pre";
            if (packageDelivery == 'each') {
                idDeliveryPolicy = data[`idDeliveryPolicy_${id}`] || 0;
                key += "_" + idDeliveryPolicy;
                
                deliveryType = data[`deliveryType_${id}`] || 'parcel';
                if (deliveryType) {
                    key += "_" + deliveryType;
                }

                if (data[`deliveryInvoice_${id}`]) {
                    key += "_" + data[`deliveryInvoice_${id}`];
                }
                deliveryChargeType =  data[`deliveryChargeType_${id}`] || "pre";
                key += "_" + deliveryChargeType;
            } 

            let deliveryPolicy = {};
            if (idDeliveryPolicy) {
                deliveryPolicy = await deliveryDao.getPolicy(idDeliveryPolicy);
            } 

            if (!bundleCodes[key]) {
                bundleCodes[key] = {
                    bundleCodeKey : key,
                    bundleCode : key,
                    packageDelivery,
                    deliveryChargeType,
                    deliveryPolicy,
                    deliveryType,
                    deliveryItems : [],
                };
             }

            if (packageDelivery == 'each') {
                if (data[`receiverAddress_${id}`] && data[`receiverAddress_${id}`].trim() != "") {
                    bundleCodes[key].address = data[`receiverAddress_${id}`].trim();
                 }
            } else {
                if (data[`receiverAddress`] && data[`receiverAddress`].trim() != "") {
                    bundleCodes[key].address = data[`receiverAddress`].trim();
                 }
            }
            
             /** 사이즈 추가 배송비 처리 S */
             let addDeliveryCharge = 0, addDeliveryChargeVat= 0 ;
             let width = data[`itemSizeWidth_${id}`] || 0;
             if (isNaN(width)) width = 0;
             let height = data[`itemSizeHeight_${id}`] || 0;
             if (isNaN(height)) height = 0;
             if (width || height) {
                 let _id = id.split("_")[0];
                 const sizeData = await sizeCalculator.process(_id, width, height);
                 if (sizeData.addDeliveryPrice > 0) {
                     addDeliveryCharge = sizeData.addDeliveryPrice;
                     addDeliveryChargeVat = Math.round(addDeliveryCharge - addDeliveryCharge / 1.1);
                 }
             }

             /** 사이즈 추가 배송비 처리 E */
            bundleCodes[key].deliveryItems.push({
                id,
                itemCnt : Number(data[`itemCnt_${id}`]) || 1,
                itemTotalPrice,
                addDeliveryCharge,
                addDeliveryChargeVat,
            });
            /** 배송비 처리 위한 데이터 가공  E */
 
            data[`basicOptionPrice_${id}`] = basicOptionPrice;
            data[`subOptionPrice_${id}`] = subOptionPrice;
            data[`textOptionPrice_${id}`] = textOptionPrice;
            data[`itemTotalPrice_${id}`] = itemTotalPrice;
            data[`itemTotalPriceVat_${id}`] = itemTotalPriceVat;
            data[`itemDiscountVat_${id}`] = itemDiscountVat;
            data[`addDeliveryCharge_${id}`] = addDeliveryCharge;
            data[`addDeliveryChargeVat_${id}`] = addDeliveryChargeVat;
            itemsTotalPrice += itemTotalPrice;
            totalDiscount += itemDiscount;

            totalVat += itemTotalPriceVat - itemDiscountVat;
        }

        /** 배송비 계산 S */
        let totalPackageDeliveryCharge = 0; // 묶음 배송비 총합 
        let totalPackageDeliveryChargeVat = 0; // 묶음 배송비 부가세 총합
        let totalAddDeliveryCharge = 0; // 사이즈별 추가 배송비
        let totalAddDeliveryChargeVat = 0; // 사이즈별 추가 배송비 부가세 총합
        for(key in bundleCodes) {
            const item = bundleCodes[key];

            let  itemsTotalPrice = 0;
            for (it of item.deliveryItems) {

                itemsTotalPrice += it.itemTotalPrice;
            }

            if (item.deliveryPolicy) {
                const deliveryPolicy = item.deliveryPolicy;
                const type = deliveryPolicy.deliveryChargeType;
     
                // 방문수령이 아닌 경우만 배송비 계산
                if (item.deliveryType != 'visit') {
                    let deliveryCharge = 0;
                    switch (type) {
                        case "fixed" : // 고정배송비
                            deliveryCharge = deliveryPolicy.deliveryCharge;
                            break;
                        case "price" :  // 금액별 배송비
                            if (deliveryPolicy.rangeDeliveryCharge && deliveryPolicy.rangeDeliveryCharge.length > 0) {
                                if (deliveryPolicy.useRangeRepeat) {
                                    const firstRange = deliveryPolicy.rangeDeliveryCharge[0];
                                    const lastRange = deliveryPolicy.rangeDeliveryCharge[1];
                                    let _totalRangeCharge = 0;
                                    
                 
                                    _totalRangeCharge += firstRange.price;
                                  

                                    if (itemsTotalPrice > lastRange.unitEnd) {
                                        const cnt = Math.ceil((itemsTotalPrice - firstRange.unitEnd) / lastRange.unitEnd);
                                        _totalRangeCharge += lastRange.price * cnt;
                                    }

                                    deliveryCharge = _totalRangeCharge;
                                } else {
                                    for (range of deliveryPolicy.rangeDeliveryCharge) {
                                        if (itemsTotalPrice >= range.unitStart)  {
                                            deliveryCharge = range.price;
                                        }
                                    }
                                }
                            } // endif 
                            break;
                        case "count" : // 수량별 배송비
                            let itemsTotalCnt = 0;
                            for (it of item.deliveryItems) {
                                itemsTotalCnt += it.itemCnt;
                            }

                            if (deliveryPolicy.rangeDeliveryCharge && deliveryPolicy.rangeDeliveryCharge.length > 0) {
                                if (deliveryPolicy.useRangeRepeat) {
                                    const firstRange = deliveryPolicy.rangeDeliveryCharge[0];
                                    const lastRange = deliveryPolicy.rangeDeliveryCharge[1];
                                    let _totalRangeCharge = 0;
                                    _totalRangeCharge += firstRange.price;
                                    

                                    if (itemsTotalCnt > lastRange.unitEnd) {
                                        const cnt = Math.ceil((itemsTotalCnt - firstRange.unitEnd) / lastRange.unitEnd);
                                        _totalRangeCharge += lastRange.price * cnt;
                                    }

                                    deliveryCharge = _totalRangeCharge;

                                } else {
                                    for (range of deliveryPolicy.rangeDeliveryCharge) {
                                        if (itemsTotalCnt >= range.unitStart)  {
                                            deliveryCharge = range.price;
                                        }
                                    }
                                }
                            }
                            break;
                    }

                    const address = item.receiverAddress || data['receiverAddress'];    
                    if (deliveryPolicy.useDeliveryAreaPolicy && deliveryPolicy.deliveryAreaCharge && address) {
                        const deliveryAreaCharge = deliveryPolicy.deliveryAreaCharge;
                        
                        let addAreaCharge = 0;
                        for(charge of deliveryAreaCharge) {
                            let isMatch = false;
                            const sido = address.split(/\s+/)[0];
                            if (charge.sido && sido.indexOf(charge.sido) != -1) {
                                isMatch = true;
                            }

                            if (isMatch && charge.sigugun && address.indexOf(charge.sigugun) == -1) {
                                isMatch = false;
                            }
                            
                            if (isMatch) {
                                addAreaCharge = charge.addCharge;
                                break;
                            }
                        }
                        deliveryCharge += addAreaCharge;
                    } // endif 
                    
                    /** 배송방법별 추가 배송비 처리 S */
                    if (item.deliveryType == 'cargo' && deliveryPolicy) {
                        deliveryCharge += deliveryPolicy.addPriceCargo;
                    } else if (item.deliveryType == 'quick' && deliveryPolicy) {
                        deliveryCharge += deliveryPolicy.addPriceQuick;
                    }
                    /** 배송방법별 추가 배송비 처리 E */

                    /** 배송비가 있는 경우 선불, 착불에 맞게 나눠서 합계 구하기  */
                     if (deliveryCharge > 0) {
                        if (item.deliveryChargeType == 'post') { // 착불인 경우 기록만 남기고 배송비 계산에는 미포함
                            deliveryCharge = 0;
                        }
                    } // endif 



                    const deliveryChargeVat = (deliveryCharge > 0)?Math.round(deliveryCharge - deliveryCharge / 1.1):0;
                    totalVat += deliveryChargeVat;
                    totalDeliveryCharge += deliveryCharge;

                    // 묶음 배송비 합계 처리
                    if (item.packageDelivery == 'package') {
                        totalPackageDeliveryCharge += deliveryCharge;
                        totalPackageDeliveryChargeVat += deliveryChargeVat;
                    }

                    /** 배송비 분할 처리  S */
                    let _deliveryCharge = deliveryCharge;
                    for (let i = 0; i <  item.deliveryItems.length; i++) {
                        const id = item.deliveryItems[i].id;
                        if (i == item.deliveryItems.length - 1) {
                            data[`deliveryCharge_${id}`] = _deliveryCharge;
                            data[`deliveryChargeVat_${id}`] = (_deliveryCharge > 0)?Math.round(_deliveryCharge - _deliveryCharge / 1.1):0;
                        } else {
                            const _charge = Math.floor(deliveryCharge * (item.deliveryItems[i].itemTotalPrice / itemsTotalPrice)) 
                            _deliveryCharge -= _charge;
                            data[`deliveryCharge_${id}`] = _charge;
                            data[`deliveryChargeVat_${id}`] = (_charge > 0)?Math.round(_charge - _charge / 1.1):0;
                        }
                        
                        // 착불이 아닌 경우 추가 배송비 추가
                        if (item.deliveryChargeType != 'post') {
                            data[`deliveryCharge_${id}`] += item.deliveryItems[i].addDeliveryCharge;
                            totalAddDeliveryCharge += item.deliveryItems[i].addDeliveryCharge;
                            totalVat += item.deliveryItems[i].addDeliveryChargeVat;
                            if (item.packageDelivery == 'package') {
                                totalPackageDeliveryCharge += item.deliveryItems[i].addDeliveryCharge;
                                totalPackageDeliveryChargeVat += item.deliveryItems[i].addDeliveryChargeVat;
                            }
                        }
                        
                    }
                    
                     /** 배송비 분할 처리  E */
                } // endif 
            } // endif 
        }
        /** 배송비 계산 E */
        data.itemsTotalPrice = itemsTotalPrice; // 상품 총합 
        data.totalDiscount = totalDiscount; // 할인 총합
        data.totalDeliveryCharge = totalDeliveryCharge + totalAddDeliveryCharge; // 배송비 총합
        data.totalAddDeliveryCharge = totalAddDeliveryCharge; // 사이즈 추가 배송비 
        data.totalAddDeliveryChargeVat = totalAddDeliveryChargeVat; // 사이즈 추가 배송비 부가세
        data.totalVat = totalVat; // 부가세 총합 
        data.totalPayPrice = itemsTotalPrice - totalDiscount + totalDeliveryCharge; // 결제금액 총합

        // 묶음 배송비 총합
        data.deliveryCharge = totalPackageDeliveryCharge;
        data.deliveryChargeVat = totalPackageDeliveryChargeVat;
    },
    /**
     * 주문품목 삭제
     * 
     * @param {Array|int} ids 
     */
    async deleteItems(ids) {
        if (!ids) {
            return false;
        }

        if (!(ids instanceof Array)) {
            ids = [ids];
        }

        const transaction = await sequelize.transaction();
      

        try {
            for await (id of ids) {
                const orderItem = await this.getOrderItem(id);
                if (!orderItem) {
                    continue;
                }

                /** 샘플 삭제 S */
                if (orderItem.samples && orderItem.samples.length > 0) {
                    for await (sample of orderItem.samples) {
                        await OrderItemSample.destroy({ where : { id : sample.id}, transaction});
                    }
                }
                /** 샘플 삭제 E */
                /** 파일 삭제 S */
                if (orderItem.attachFiles && orderItem.attachFiles.length > 0) {
                    for await (attachFile of orderItem.attachFiles) {
                        await fileDao.delete(attachFile.id, transaction);
                    }
                }
                /** 파일 삭제 E */

                /** 주문품목 삭제 S */
                await OrderItem.destroy({
                    where : { id },
                    transaction,
                });
                /** 주문품목 삭제 E */

                /** 디자인 시안 삭제 S */
                await designDraftDao.delete(orderItem.itemUid);
                /** 디자인 시안 삭제 E */
            }
            await transaction.commit();

            return true;
        } catch (err) {
            await transaction.rollback();
            logger(err);
            return false;
        }
    },
    /**
     * 주문 조회
     * 
     * @param {long} orderNo 주문번호
     * @returns {Object|Boolean}
     */
    async get(orderNo) {
        if (!orderNo) {
            return false;
        }

        // 주문정보 
        const data = await this.getOrderInfo(orderNo);
        if (!data) {
            return false;
        }

         // 배송정보
        data.deliveryInfo = await this.getDeliveryInfo(orderNo);

        // 주문상품 목록 
        const items = await this.getOrderItems(orderNo);
        data.items = items || [];

        let totalPayPrice = 0;
        let totalDeliveryCharge = 0;
        let totalAddPayment = 0;
        let totalDeliveryChargePost = 0;
        let isPackageDeliveryIncluded = false;
        data.designers = []; // 담당 디자이너
        let designerChangePossible = false;
        let isDesignerChanging = false;
        // 디자이너 변경 기록 조회
        data.designerChangeLogs = await designerChangeDao.getsByOrderNo(orderNo);
        let designerChangeNotPossibleCnt = 0; // 디자이너 변경 불가 주문품목 갯수
        items.forEach(item => {
            for (_items of data.deliveryInfo) {
                for (_it of _items.deliveryItems) {
                    if (_it.idOrderItems == item.id) {
                        item.deliveryChargePre = _it.deliveryChargePre;
                        item.deliveryChargePost = _it.deliveryChargePost;
                        item.deliveryCharge = _it.deliveryCharge;
                    }
                }
            }

            totalPayPrice += item.itemTotalPrice - item.itemDiscount;
            totalDeliveryCharge += item.deliveryCharge;
            totalDeliveryChargePost += item.deliveryChargePost;

            // 묶음 배송 포함 여부
            if (!isPackageDeliveryIncluded && item.packageDelivery == 'package') {
                isPackageDeliveryIncluded = true;
            }

            // 담당 디자이너
            if (item.designerInfo) {
                data.designers.push({
                    id : item.designerInfo.id,
                    managerId : item.designerInfo.managerId,
                    managerNm: item.designerInfo.managerNm,
                });
            }

            // 확정 시안이 아닌 디자인이 상태인 경우 디자이너 변경 가능 처리
            if (!item.designConfirmed && item.designerInfo && !item.isDesignerChanging) {
                designerChangePossible = true;
            }

            if (!item.designerChangePossible) {
                designerChangeNotPossibleCnt++;
            }

            // 디자이너가 변경 중인 경우
            if (item.isDesignerChanging) {
                isDesignerChanging = true;
            }

            // 디자인 변경 기록이 있는지 조회하고 있으면 추가 
            item.designerChangeLogs = [];
            for (let log of data.designerChangeLogs) {
               
                if (log.idOrderItem == item.id) {
                    item.designerChangeLogs.push(log);
                }
            }
        });

        // 주문상태가 디자인 변경 불가 상태 인 경우 디자이너 변경 불가 처리 
        if (data.orderStatusInfo && data.orderStatusInfo.setting && !data.orderStatusInfo.setting.orderDesignUpdate) {
            designerChangePossible = false;
        }

        /** 디자이너 변경 불가 주문이 전체인 경우는 변경 불가 처리 */
        if (designerChangeNotPossibleCnt == items.length) {
            designerChangePossible = false;
        }

        data.designerChangePossible = designerChangePossible; // 디자이너 변경 요청 가능 상태
      
        data.isPackageDeliveryIncluded = isPackageDeliveryIncluded;
       
        
        // 추가 금액 
        data.addPayments = await this.getAddPayments(orderNo);
        if (data.addPayments) {
            data.addPayments.forEach(v => totalAddPayment += v.itemPrice);
        }

        // 디자이너가 변경 중인 경우
        data.isDesignerChanging = isDesignerChanging;

        // 생성된 결제 품목
        data.paymentItems = await paymentItemDao.gets(orderNo);
        
        data.totalDeliveryCharge = totalDeliveryCharge;
        data.totalDeliveryChargePost = totalDeliveryChargePost;
        data.totalAddPayment = totalAddPayment;
        data.totalAddPaymentVat = totalAddPayment?(totalAddPayment - Math.floor(totalAddPayment / 1.1)):0;
        data.totalPayPrice = totalPayPrice + totalDeliveryCharge + totalAddPayment;
        data.totalVat += data.totalAddPaymentVat;
        
        return data;
    },
    /**
     * 주문 목록 
     * 
     * @param {int} page 페이지 번호
     * @param {int} limit 1페이지당 레코드 수 
     * @param {Object} req 
     * @param {Object} search 검색용 쿼리
     */
    async gets(page, limit, req, search) {
        try {
            page = page || 1;
            limit = limit || 20;
            limit = limit == 'all' ? limit : Number(limit);
            const offset = (page - 1) * limit;
            const where = {}, andWhere = [], orWhere = [];
            /**  검색 처리 S */
            search = search || {};

            /** 로그인한 관리자가 디자이너 인 경우 본인 디자인건만 노출 S */
            if (!req.isSuper && req.isDesigner) { // 최고관리자는 전부 노출
                search.idDesigner = req.body.idManager;
            }
            /** 로그인한 관리자가 디자이너 인 경우 본인 디자인건만 노출 E */

            /** 작업목록인 경우 작업 목록 노출 주문단계 조회 S */
            if (search.isWorkingList) {
                search.orderStatus = await orderStatusDao.getWorkingStatusCds();
            }
            /** 작업목록인 경우 작업 목록 노출 주문단계 조회 E */

            /** 날짜 통합 검색 S */
            if (search.dateType) {
                switch (search.dateType) {
                    case "createdAt": // 접수일
                        if (search.sdate) search.createSdate = search.sdate;
                        if (search.edate) search.createEdate = search.edate;
                        break;
                    case "deliveryReleasedDate" :  // 출고일
                        if (search.sdate) search.deliveryReleasedSdate = search.sdate;
                        if (search.edate) search.deliveryReleasedEdate = search.edate;
                        break;  
                }
            }
            /** 날짜 통합 검색 E */


            // 시작 접수일  
            if (search.createSdate) {
                const createSdate = getUTCDate(search.createSdate);
                andWhere.push({createdAt : {
                    [Op.gte] : createSdate,
                }});
             }

             // 종료 접수일 
            if (search.createEdate) {
                const createEdate = getUTCDate(search.createEdate);
                createEdate.setDate(createEdate.getDate() + 1);

                andWhere.push({ createdAt : { [Op.lt] :  createEdate }});
            }

            // 출고 시작일
            if (search.deliveryReleasedSdate) {
                const deliveryReleasedSdate = new Date(search.deliveryReleasedSdate);
                const sdate = search.deliveryReleasedSdate;
                andWhere.push({
                    [Op.or] : [
                                { deliveryReleasedDate : {[Op.gte] : deliveryReleasedSdate} },
                                { 
                                    orderNo : { 
                                    [Op.in] : Sequelize.literal(`(SELECT oi.orderNo 
                                                                    FROM orderItems oi 
                                                                    WHERE oi.orderNo = OrderInfo.orderNo AND oi.deliveryReleasedDate >= '${sdate}')`)
                                }}
                            ]
                });
            }

            // 출고 종료일
            if (search.deliveryReleasedEdate) {
                const deliveryReleasedEdate = new Date(search.deliveryReleasedEdate);
                deliveryReleasedEdate.setDate(deliveryReleasedEdate.getDate() + 1);
                andWhere.push({ deliveryReleasedDate : { [Op.lt] : deliveryReleasedEdate }})

                const edate = dateFormat(deliveryReleasedEdate, '%Y-%m-%d');

                andWhere.push({
                    [Op.or] : [
                                { deliveryReleasedDate : {[Op.lt] : deliveryReleasedEdate} },
                                { 
                                    orderNo : { 
                                    [Op.in] : Sequelize.literal(`(SELECT oi.orderNo 
                                                                    FROM orderItems oi 
                                                                    WHERE oi.orderNo = OrderInfo.orderNo AND oi.deliveryReleasedDate < '${edate}')`)
                                }}
                            ]
                });
            }

            // 주문번호
            if (search.orderNo) {
                andWhere.push({orderNo  : { [Op.substring] : search.orderNo }});
            }

            // 주문자명
            if (search.orderNm) {
                andWhere.push({orderNm : { [Op.substring] : search.orderNm }});
            }

            // 주문자 휴대전화
            if (search.orderCellPhone) {
                const cellPhone = search.orderCellPhone.replace(/[^\d]/g, "");
                andWhere.push({orderCellPhone : { [Op.substring] : cellPhone }});
            }
            
            // 처리상태
            if (search.orderStatus) {
                if (!(search.orderStatus instanceof Array)) {
                    search.orderStatus = [search.orderStatus];
                }

                andWhere.push({orderStatus : { [Op.in] : search.orderStatus }});
            }

            
            if (search.idManager) {
                if (!(search.idManager instanceof Array)) {
                    search.idManager = [search.idManager];
                }

                andWhere.push({idManager : { [Op.in] : search.idManager }});
            }

            /** 검색 조건 처리 S */
            if (search.sopt && search.skey && search.skey.trim() != "") {
                const skey = search.skey.trim();
                const conds = { [Op.substring] : skey };
                const mobileNo = skey.replace(/\D/g, "");
                switch (search.sopt) {
                    case "all" :  // 통합 검색 
                        orWhere.push({ orderNo : conds }, { orderNm : conds }, { shopName : conds }, { orderCellPhone : { [Op.substring] : mobileNo } } );
                        break;
                    case "orderCellPhone" :  // 주문자 휴대전화 번호
                        andWhere.push({ orderCellPhone : { [Op.substring] : mobileNo } });
                        break;
                    default : 
                        andWhere.push({[search.sopt] : conds });

                }
            }
            /** 검색 조건 처리 E */

           /** 디자이너 검색 S */
            if (search.idDesigner) {
                if (!(search.idDesigner instanceof Array)) {
                    search.idDesigner = [search.idDesigner];
                }
                
                
                andWhere.push({
                    orderNo : {
                        [Op.in] : Sequelize.literal(`(SELECT oi.orderNo 
                                                        FROM orderItems oi
                                                        WHERE oi.orderNo = OrderInfo.orderNo and oi.idDesigner IN (${search.idDesigner.join(",")}))`)
                    }
                });
            }
            /** 디자이너 검색 E */

            /** 배송조건 검색 S */
            if (search.idDeliveryPolicy) {
                if (!(search.idDeliveryPolicy instanceof Array)) {
                    search.idDeliveryPolicy = [search.idDeliveryPolicy];
                }

                orWhere.push({
                    idDeliveryPolicy : { [Op.in] : search.idDeliveryPolicy}
                });

                orWhere.push({
                    orderNo : {
                        [Op.in] : Sequelize.literal(`(SELECT oi.orderNo 
                            FROM orderItems oi
                            WHERE oi.orderNo = OrderInfo.orderNo AND oi.idDeliveryPolicy IN (${search.idDeliveryPolicy.join(",")}) AND oi.packageDelivery='each')`)
                    }
                });
            }
            /** 배송조건 검색 E */
            
            /** 배송방법 검색 S */
            if (search.deliveryType) {
                if (!Array.isArray(search.deliveryType)) {
                    search.deliveryType = [search.deliveryType];
                }

                const deliveryTypes = search.deliveryType.map(s => "'" + s + "'").join(",");
      
                orWhere.push({
                    deliveryType : { [Op.in] : search.deliveryType }
                });
   
                orWhere.push({
                    orderNo : {
                        [Op.in] : Sequelize.literal(`(SELECT oi.orderNo 
                            FROM orderItems oi
                            WHERE oi.orderNo = OrderInfo.orderNo AND oi.deliveryType IN (${deliveryTypes}) AND oi.packageDelivery='each')`)
                    }
                });
            } // endif 
            /** 배송방법 검색 E */

            /** 품목 분류 S */
            if (search.idProductCategory) {
                if (!(search.idProductCategory instanceof Array)) {
                    search.idProductCategory = [search.idProductCategory];
                }

                andWhere.push({
                    orderNo : {
                        [Op.in] : Sequelize.literal(`(SELECT oi.orderNo FROM orderItems oi, productItems p
                        WHERE oi.orderNo = OrderInfo.orderNo AND oi.idProductItem = p.id AND p.idProductCategory IN (${search.idProductCategory.join(',')}))`)
                    } 
                });
            }
            /** 품목 분류 E */


            if (andWhere.length > 0) where[Op.and] = andWhere;
            if (orWhere.length > 0) where[Op.or] = orWhere;
            /** 검색 처리 E */

            const params = {
                include : [{model : Manager,
                    required : false,
                    attributes : ['managerId', 'managerNm'],
                }],
                order: [['createdAt', 'DESC']],
                where,
                raw : true,
            };

            if (limit != 'all') {
                params.limit = limit;
                params.offset = offset;
            }

            const list = await OrderInfo.findAll(params);
            let no = 0;
            for await (let li of list) {
                li.orderStatusInfo = await orderStatusDao.get(li.orderStatus);

                
                const items = await this.getOrderItems(li.orderNo);
                li.csCount = await csDao.getCount(li.orderNm, li.orderCellPhone, li.orderNo);
                
                let deliveryReceipt = false;
                if (li.deliveryType != 'parcel') {
                    deliveryReceipt = true;
                }
                
                if (!deliveryReceipt) {
                    for (const item of items) {
                        if (item.idDeliveryPolicy && item.deliveryType != 'parcel') {
                            deliveryReceipt = true;
                            break;
                        }
                    }
                }

                li.deliveryReceipt = deliveryReceipt;

                list[no].items = items || [];
                no++;
            }

            if (limit == 'all') {
                return list;
            }

            /** 총 주문 수 */
            this.total = await OrderInfo.count({
                where,
            });

            if (req) {
                this.pagination = new Pagination(req, page, this.total, null, limit).getPages();
            }
            
            return list;
        } catch (err) {
            logger(err);
            return false;
        }
    },
    /**
     * 주문정보
     * 
     * @param {long} orderNo 주문번호
     * @returns {Boolean}
     */
    async getOrderInfo(orderNo) {
        if (!orderNo) {
            return false;
        }

        try {
            const orderInfo = await OrderInfo.findByPk(orderNo, {
                include : [{
                    model : Manager,
                    attributes : ['managerId', 'managerNm'],
                    required : false,
                }],
                raw : true,
            });
            if (!orderInfo) {
                return false;
            }

            // 접수 상담원 정보
            orderInfo.managerInfo = {
                managerId : orderInfo['Manager.managerId'],
                managerNm : orderInfo['Manager.managerNm'],
            };
            
            // 증빙자료 유형
            orderInfo.receiptType = orderInfo.receiptType?orderInfo.receiptType.split("||"):[];

            // 사업자 등록증 
            if (orderInfo.businessCertFileId) {
                orderInfo.businessCert = await fileDao.get(orderInfo.businessCertFileId);
            }

            // 주문처리상태 상세 
            if (orderInfo.orderStatus) {
                orderInfo.orderStatusInfo = await orderStatusDao.get(orderInfo.orderStatus);
            }

            // 현금영수증 발급 상세 
           if (orderInfo.receiptType.indexOf('cash') != -1) {
               orderInfo.cashReceiptIssued =  await cashReceiptDao.get(orderNo, true);
           }
           
            /** 기존 배송 정책이 있다면 기존 정책으로 유지 S */
            if (orderInfo.deliveryPolicy) {
                if (typeof orderInfo.deliveryPolicy == 'string') {
                    orderInfo.deliveryPolicy  = JSON.parse(orderInfo.deliveryPolicy);
                }

                orderInfo.idDeliveryPolicy = orderInfo.deliveryPolicy.id;
            } else {
                if (orderInfo.idDeliveryPolicy) { // 배송조건 
                    orderInfo.deliveryPolicy = await deliveryDao.getPolicy(orderInfo.idDeliveryPolicy);
                }
            }
            /** 기존 배송 정책이 있다면 기존 정책으로 유지 E */

            // 배송방식
            if (orderInfo.deliveryType) {
                orderInfo.deliveryTypeStr = deliveryDao.getDeliveryTypeStr(orderInfo.deliveryType);
            }


            return orderInfo; 
        } catch (err) {
            logger(err);
            return false;
        }
    },
    /**
     * 주문상품목록
     * 
     * @param {long} orderNo 주문번호 
     */
    async getOrderItems(orderNo) {
        if (!orderNo) {
            return false;
        }

        try {
            const list = await OrderItem.findAll({
                where : { orderNo },
                order : [['id', 'ASC']],
                raw : true,
            });
      
            if (!list) {
                return false;
            }

            for await (li of list) {
                await this.getUpdateOrderItem(li);
            }
            
            return list;
            
        } catch (err) {
            logger(err);
            return false;
        }
    },
    /**
     * 주문품목 정보 
     * 
     * @param {int} id 
     * @returns {Object|Boolean}
     */
    async getOrderItem(id) {
        if (!id) {
            return false;
        }

        try {
            const orderItem = await OrderItem.findByPk(id, {
                raw : true, 
            });

            if (!orderItem) {
                 return false;
            }

            await this.getUpdateOrderItem(orderItem);

            return orderItem;
        } catch (err) {
            logger(err);
            return false;
        }

    },
    /**
     * 주문 품목 추가 정보 처리
     * 
     * @param {Object} li 
     */
    async getUpdateOrderItem(li) {
        /** 기존 배송 정책이 있다면 기존 정책으로 유지 */
        if (li.deliveryPolicy) {
            if (typeof li.deliveryPolicy == 'string') {
                li.deliveryPolicy  = JSON.parse(li.deliveryPolicy);
            }

            li.idDeliveryPolicy = li.deliveryPolicy.id;
        } else {
            if (li.idDeliveryPolicy) { // 배송조건 
                li.deliveryPolicy = await deliveryDao.getPolicy(li.idDeliveryPolicy);
            }
        }

        if (li.deliveryType) {
            li.deliveryTypeStr = deliveryDao.getDeliveryTypeStr(li.deliveryType);
        }

        if (li.idProductItem) { // 품목 정보 
            li.productItemInfo = await itemDao.get(li.idProductItem);
            if (li.productItemInfo && li.productItemInfo['ProductCategory.idProductGuide']) {
                li.idProductGuide = li.productItemInfo['ProductCategory.idProductGuide'];
                li.productGuideUrl = `/guide/${li.idProductGuide}`;
            }
        }
        
        /** 샘플 조회 */
        li.samples = await this.getOrderItemSamples(li.id);
        
        // 출고 희망일
        li.preferredDeliveryReleasedDateStr = li.preferredDeliveryReleasedDate?getLocalDate(li.preferredDeliveryReleasedDate, "%Y-%m-%d"):"";

        // 출고일
        li.deliveryReleasedDateStr = li.deliveryReleasedDate?getLocalDate(li.deliveryReleasedDate, '%Y-%m-%d'):"";

        /** 첨부 파일 */
        li.attachFiles = await this.getOrderAttachFiles(li.orderNo, li.itemUid);

        /** 옵션 선택 정보 S  */
        li.optionCds = li.optionCds?li.optionCds.split("||"):[];
        li.subOptionCds = li.subOptionCds?li.subOptionCds.split("||"):[];
        li.subOptionCdsCnt = li.subOptionCdsCnt?li.subOptionCdsCnt.split("||"):[];
        li.textOptionCds = li.textOptionCds?li.textOptionCds.split("||"):[];
        li.options = await optionDao.getBasicItem(li.optionCds);
        li.subOptions = await optionDao.getSubItem(li.subOptionCds);
        li.textOptions = await optionDao.getTextItem(li.textOptionCds);
        li.optionsJson = JSON.stringify(li.productItemInfo.options) || [];
        li.subOptionsJson = JSON.stringify(li.productItemInfo.subOptions) || [];
        li.textOptionsJson = JSON.stringify(li.productItemInfo.textOptions) || [];

        li.deliveryPoliciesJson = JSON.stringify(li.productItemInfo.idDeliveryPolicies) || [];

        if (typeof li.optionInfo == 'string') {
            li.optionInfo  = JSON.parse(li.optionInfo);
        }

        if (typeof li.subOptionInfo == 'string') {
            li.subOptionInfo = JSON.parse(li.subOptionInfo);
        }

        if (typeof li.textOptionInfo == 'string') {
            li.textOptionInfo = JSON.parse(li.textOptionInfo);
        }

        if (typeof li.textOptionTexts == 'string') {
            li.textOptionTexts = JSON.parse(li.textOptionTexts);
        }
        
        li.textOptionTexts = li.textOptionTexts?li.textOptionTexts:[];
        li.textOptionInfo = li.textOptionInfo?li.textOptionInfo:[];
        for (let opt of li.textOptionTexts) {
            for (let _opt of li.textOptionInfo) {
                if (opt.optionCd == _opt.optionCd) {
                    opt.optionNm = _opt.optionNm;
                    opt.addPrice = _opt.addPrice;
                    break;
                }
            }
        }

        // 추가 옵션
        li.subOptionPriceVat = 0;
        for (let opt of li.subOptionInfo) {
            opt.providePrice = opt.addPrice / 1.1;
            opt.vat = opt.addPrice - opt.providePrice;
            li.subOptionPriceVat += opt.vat;
        }
        /** 옵션 선택 정보 E */
        
        /** 총 금액  */
        li.itemTotalPrice = (li.itemPrice + li.basicOptionPrice + li.textOptionPrice) * li.itemCnt + li.subOptionPrice + li.itemAdjust;
        li.itemTotalPriceVat = (li.itemTotalPrice > 0)?Math.round(li.itemTotalPrice - li.itemTotalPrice / 1.1):0;


        
        /** 디자인 상태  */
        li.designStatusStr = "";
        li.designStatusGuideMessage = "";
        li.designerChangePossible = false;

        if (li.designStatus) {
            const designStatus = await designStatusDao.get(li.designStatus);

            if (designStatus) {
                designStatus.designerChangePossible = (designStatus.designerChangePossible == 1)?true:false;
                li.designStatusStr = designStatus.statusNm;
                li.designStatusInfo = designStatus;
                li.designStatusGuideMessage = designStatus.guideMessage;
                li.designerChangePossible = designStatus.designerChangePossible?true:false;
                
            }
        }
        
        /** 디자인 시안, 작업자 업로드 파일  */
        li.designConfirmed = false;
        li.designChoice = 0;
        li.desginConfirmDateTime = null;
        if (li.itemUid) {
            li.designDraft = await designDraftDao.get(li.itemUid + "_" + li.designStatus);
            li.workFiles = await fileDao.gets(`work_${li.itemUid}`, true);
            if (li.designDraft && li.designDraft.designChoice) {
                li.designConfirmed = true;
                li.designChoice = li.designDraft.designChoice;
                li.desginConfirmDateTime = li.designDraft.confirmDateTime;
            }
        }

        /** 디자이너가 배분 된 경우  */
        if (li.idDesigner) {
            li.designerInfo = await managerDao.get(li.idDesigner);
        }

         // 디자이너 신청이 처리중인지 체크
         li.isDesignerChanging = await designerChangeDao.isProcess(li.id);
    },
    /**
     * 주문품목별 샘플 목록
     * 
     * @param {int} idOrderItem 품주번호 
     */
    async getOrderItemSamples(idOrderItem) {
        if (!idOrderItem) {
            return false;
        }

        try {
            const list = await OrderItemSample.findAll({
                where : { idOrderItem },
                order : [['id', 'ASC']],
                raw : true,
            });

            return list;

        } catch (err) {
            logger(err);
            return false;
        }
    },
    /**
     * 주문서 첨부파일 목록 
     * 
     * @param {long} orderNo 주문번호
     * @param {int} itemUid 주문상품 uid
     */
    async getOrderAttachFiles(orderNo, itemUid) {
         if (!orderNo) {
             return false;
         }

        let gid = `order_${orderNo}_`;
        if (itemUid) gid += `${itemUid}`;

        const list = await fileDao.gets(gid, true);
        return list;
    },
    /**
     * 주문서 배송정보 조회
     * 
     * @param {long} orderNo 
     * @returns 
     */
    async getDeliveryInfo(orderNo) {
        if (!orderNo) {
            return false;
        }

        const newBundleCodes = [];
        this.bundleCodes = {};
        const deliveryItems = {}; // 배송 상품 목록 
        const orderInfo = await this.getOrderInfo(orderNo);
        const items = await this.getOrderItems(orderNo);
        
        if (!orderInfo || !items) {
            return false;
        }

        for (let item of items) {
            const packageDelivery = item.packageDelivery || "package";
           
            let idDeliveryPolicy = packageDelivery == 'each' ? item.idDeliveryPolicy : orderInfo.idDeliveryPolicy;
            let deliveryType = packageDelivery == 'each' ? item.deliveryType : orderInfo.deliveryType;
            let deliveryTypeStr = deliveryDao.getDeliveryTypeStr(deliveryType);
            let deliveryChargeType = packageDelivery == 'each' ? item.deliveryChargeType : orderInfo.deliveryChargeType;
            const deliveryPolicy = packageDelivery == 'each' ? item.deliveryPolicy : orderInfo.deliveryPolicy;
            const deliveryCompany = packageDelivery == 'each' ? item.deliveryCompany : orderInfo.deliveryCompany;
            let deliveryInvoice = packageDelivery == 'each' ? item.deliveryInvoice : orderInfo.deliveryInvoice;
            const deliveryReleasedDate = packageDelivery == 'each' ? item.deliveryReleasedDate : orderInfo.deliveryReleasedDate;
            const preferredDeliveryReleasedDate = packageDelivery == 'each' ? item.preferredDeliveryReleasedDate : orderInfo.preferredDeliveryReleasedDate;
            let key = packageDelivery;
            idDeliveryPolicy = idDeliveryPolicy || 0;
            if (idDeliveryPolicy) {
                key += "_" + idDeliveryPolicy;
            }

            if (deliveryType) {
                key += "_" + deliveryType;
            }

            if (deliveryInvoice) {
                key += "_" + deliveryInvoice;
            }

            deliveryChargeType = deliveryChargeType || "pre";
            key += "_" + deliveryChargeType;
            if (!deliveryPolicy && idDeliveryPolicy) {
                deliveryPolicy = await deliveryDao.getPolicy(idDeliveryPolicy);
            }
            /** 묶음 배송 상품 처리 S */
            deliveryItems[key] = deliveryItems[key] || [];

            deliveryItems[key].push({
                idOrderItems : item.id,
                itemNm : item.itemNm,
                itemNmSub : item.itemNmSub,
                itemCnt : item.itemCnt,
                itemTotalPrice : item.itemTotalPrice,
                itemSizeWidth : item.itemSizeWidth,
                itemSizeHeight : item.itemSizeHeight,
                optionInfo : item.optionInfo,
                subOptionInfo : item.subOptionInfo,
                textOptionInfo : item.textOptionInfo,
                textOptionTexts : item.textOptionTexts,
                deliveryChargeType : deliveryChargeType,
                deliveryPolicies : item.productItemInfo?item.productItemInfo.idDeliveryPolicies:[], // 품목별 개별 배송 조건이 있는 경우 
                addDeliveryCharge : item.addDeliveryCharge,
                addDeliveryChargeVat : item.addDeliveryChargeVat,
                productItemInfo : item.productItemInfo || [],
            });
            
            /** 묶음 배송 상품 처리  */
            /** 묶음 배송 주소 처리 S */
            this.bundleCodes[key] = this.bundleCodes[key] || {};
            this.bundleCodes[key].bundleCodeKey = key;
            this.bundleCodes[key].bundleCode = key;
            this.bundleCodes[key].packageDelivery = packageDelivery;

            this.bundleCodes[key].idDeliveryPolicy = idDeliveryPolicy;
            this.bundleCodes[key].deliveryType = deliveryType;
            this.bundleCodes[key].deliveryTypeStr = deliveryTypeStr;
            this.bundleCodes[key].deliveryPolicy = deliveryPolicy;
            this.bundleCodes[key].receiverNm = packageDelivery == 'each' ? item.receiverNm : orderInfo.receiverNm;
            this.bundleCodes[key].receiverCellPhone = packageDelivery == 'each' ? item.receiverCellPhone : orderInfo.receiverCellPhone;
            this.bundleCodes[key].receiverZonecode = packageDelivery == 'each' ? item.receiverZonecode : orderInfo.receiverZonecode;
            this.bundleCodes[key].receiverAddress = packageDelivery == 'each' ? item.receiverAddress : orderInfo.receiverAddress;
            this.bundleCodes[key].receiverAddressSub = packageDelivery == 'each' ? item.receiverAddressSub : orderInfo.receiverAddressSub;
            this.bundleCodes[key].deliveryMemo = packageDelivery == 'each' ? item.deliveryMemo : orderInfo.deliveryMemo;
            this.bundleCodes[key].deliveryCompany  = deliveryCompany,
            this.bundleCodes[key].deliveryInvoice = deliveryInvoice;
            this.bundleCodes[key].deliveryReleasedDate = deliveryReleasedDate;
            this.bundleCodes[key].preferredDeliveryReleasedDate = preferredDeliveryReleasedDate;
            this.bundleCodes[key].deliveryChargeType = deliveryChargeType;
            /** 묶음 배송 주소 처리 S */            

            /* 운송장 업데이트를 위한 키 코드 추가 */
            this.bundleCodes[key].bundleCodeForUpdate = `${key}_${item.orderNo}`;
        }

       
        for (key in this.bundleCodes) {
            this.bundleCodes[key].deliveryItems = deliveryItems[key] || [];
            if (this.bundleCodes[key].deliveryItems.length == 1) {
                this.bundleCodes[key].deliveryPolicies = deliveryItems[key][0].deliveryPolicies;
            }
            /** 배송비 계산 S  */
            let totalItemDeliveryChargePre = 0;
            let totalItemDeliveryChargePost = 0;
            let totalItemDeliveryAreaCharge = 0;
            let totalItemAddDeliveryCharge = 0;
            const item = this.bundleCodes[key];
            let  itemsTotalPrice = 0;
            for (it of item.deliveryItems) {
                itemsTotalPrice += it.itemTotalPrice;
            }
            if (item.deliveryPolicy) {
                const deliveryPolicy = item.deliveryPolicy;
                const type = deliveryPolicy.deliveryChargeType;
                
                 // 방문수령이 아닌 경우만 배송비 계산 
                if (item.deliveryType != 'visit') {
                    let deliveryCharge = 0;
                    switch (type) {
                        case "fixed" : // 고정배송비
                            deliveryCharge = deliveryPolicy.deliveryCharge;
                            break;
                        case "price" :  // 금액별 배송비
                            

                            if (deliveryPolicy.rangeDeliveryCharge && deliveryPolicy.rangeDeliveryCharge.length > 0) {
                                if (deliveryPolicy.useRangeRepeat) {
                                    const firstRange = deliveryPolicy.rangeDeliveryCharge[0];
                                    const lastRange = deliveryPolicy.rangeDeliveryCharge[1];
                                    let _totalRangeCharge = 0;
                                    _totalRangeCharge += firstRange.price;
                                    
                                    if (itemsTotalPrice > lastRange.unitEnd) {
                                        const cnt = Math.ceil((itemsTotalPrice - firstRange.unitEnd) / lastRange.unitEnd);
                                        _totalRangeCharge += lastRange.price * cnt;
                                    }

                                    deliveryCharge = _totalRangeCharge;
                                } else {
                                    for (range of deliveryPolicy.rangeDeliveryCharge) {
                                        if (itemsTotalPrice >= range.unitStart)  {
                                            deliveryCharge = range.price;
                                        }
                                    }
                                }
                            } // endif 
                            break;
                        case "count" : // 수량별 배송비
                            let itemsTotalCnt = 0;
                            for (it of item.deliveryItems) {
                                itemsTotalCnt += it.itemCnt;
                            }
                            
                            if (deliveryPolicy.rangeDeliveryCharge && deliveryPolicy.rangeDeliveryCharge.length > 0) {
                                if (deliveryPolicy.useRangeRepeat) {
                                    const firstRange = deliveryPolicy.rangeDeliveryCharge[0];
                                    const lastRange = deliveryPolicy.rangeDeliveryCharge[1];
                                    let _totalRangeCharge = 0;
                                    _totalRangeCharge += firstRange.price;
                                    
                                    if (itemsTotalCnt > lastRange.unitEnd) {
                                        const cnt = Math.ceil((itemsTotalCnt - firstRange.unitEnd) / lastRange.unitEnd);
                                        _totalRangeCharge += lastRange.price * cnt;
                                    }

                                    deliveryCharge = _totalRangeCharge;

                                } else {
                                    for (range of deliveryPolicy.rangeDeliveryCharge) {
                                        if (itemsTotalCnt >= range.unitStart)  {
                                            deliveryCharge = range.price;
                                        }
                                    }
                                }
                            }
                            break;
                        /** 
                        case "weight" :  // 무게별 배송비

                            break;
                        */
                    }

                    /** 지역별 추가 배송비 S */
                    const address = item.receiverAddress;
                    if (deliveryPolicy.useDeliveryAreaPolicy && deliveryPolicy.deliveryAreaCharge && address) {
                        const deliveryAreaCharge = deliveryPolicy.deliveryAreaCharge;
                    
                        let addAreaCharge = 0;
                        for(charge of deliveryAreaCharge) {
                            let isMatch = false;
                            const sido = address.split(/\s+/)[0];
                            if (charge.sido && sido.indexOf(charge.sido) != -1) {
                                isMatch = true;
                            }

                            if (isMatch && charge.sigugun && address.indexOf(charge.sigugun) == -1) {
                                isMatch = false;
                            }
                            
                            if (isMatch) {
                                addAreaCharge = charge.addCharge;
                                break;
                            }
                        }
                        deliveryCharge += addAreaCharge;
                        totalItemDeliveryAreaCharge += addAreaCharge;
                    }

                    /** 지역별 추가 배송비 E */
                    if (item.deliveryType == 'cargo') { // 화물배송 추가비용 처리
                        deliveryCharge += deliveryPolicy.addPriceCargo;
                    } else if (item.deliveryType == 'quick') {
                        deliveryCharge += deliveryPolicy.addPriceQuick;;
                    }
                    /** 배송 방법별 추가 배송비 S */
                    
                    /** 배송 방법별 추가 배송비 E */
                    /** 배송비가 있는 경우 선불, 착불에 맞게 나눠서 합계 구하기  */
                    if (deliveryCharge > 0) {
                        if (item.deliveryChargeType == 'post') { // 착불인 경우 기록만 남기고 배송비 계산에는 미포함
                            totalItemDeliveryChargePost += deliveryCharge;
                            deliveryCharge = 0;
                        } else {
                            totalItemDeliveryChargePre += deliveryCharge;
                        }
                    } // endif 
                }
            } // endif 
           
            for (it of item.deliveryItems) {
                if (item.deliveryChargeType == 'post') { 
                    totalItemDeliveryChargePost += it.addDeliveryCharge;
                } else {
                    totalItemDeliveryChargePre += it.addDeliveryCharge;
                }

                totalItemAddDeliveryCharge += it.addDeliveryCharge; 
            }


            /** 배송 상품별 배송비 구하기  S */
            let  _totalItemDeliveryChargePre = totalItemDeliveryChargePre;
            let _totalItemDeliveryChargePost = totalItemDeliveryChargePost;
            let _totalItemDeliveryAreaCharge = totalItemDeliveryAreaCharge;
            for (let i = 0; i < item.deliveryItems.length; i++) {
                const it = item.deliveryItems[i];
                let deliveryChargePre =  0, deliveryChargePost = 0, deliveryAreaCharge = 0;
                if (i == item.deliveryItems.length - 1) {
                    deliveryChargePre = _totalItemDeliveryChargePre;
                    deliveryChargePost =  _totalItemDeliveryChargePost;
                    deliveryAreaCharge = _totalItemDeliveryAreaCharge;
                } else {
                    if (totalItemDeliveryChargePre > 0) {       
                        deliveryChargePre = Math.floor(totalItemDeliveryChargePre * (it.itemTotalPrice / itemsTotalPrice));
                        _totalItemDeliveryChargePre -= deliveryChargePre;
                    }

                    if (_totalItemDeliveryChargePost > 0) {       
                        deliveryChargePost = Math.floor(totalItemDeliveryChargePost * (it.itemTotalPrice / itemsTotalPrice));
                        _totalItemDeliveryChargePost -= deliveryChargePost;
                    }

                    if (_totalItemDeliveryAreaCharge > 0) {
                        deliveryAreaCharge = Math.floor(totalItemDeliveryAreaCharge * (it.itemTotalPrice / itemsTotalPrice));
                        _totalItemDeliveryAreaCharge -= deliveryAreaCharge;
                    }
                }

                it.deliveryChargePre = deliveryChargePre;
                it.deliveryChargePost = deliveryChargePost;
                it.deliveryCharge = deliveryChargePre;
                it.deliveryAreaCharge = deliveryAreaCharge;
            }
            /** 배송 상품별 배송비 구하기  E */

            const totalItemDeliveryCharge = totalItemDeliveryChargePre + totalItemDeliveryChargePost;
            this.bundleCodes[key].deliveryCharge = totalItemDeliveryCharge;
            this.bundleCodes[key].deliveryChargePre = totalItemDeliveryChargePre;
            this.bundleCodes[key].deliveryChargePost = totalItemDeliveryChargePost;
            this.bundleCodes[key].deliveryAreaCharge = totalItemDeliveryAreaCharge;
            this.bundleCodes[key].addDeliveryCharge = totalItemAddDeliveryCharge;
             /* 배송비 계산 E */

            newBundleCodes.push(this.bundleCodes[key]);           
        }
        
        /** 운송장 조회 URL 추가 S */
        for (const item of newBundleCodes) {
            const traceUrl = await traceSvc.getUrl(item.deliveryCompany, item.deliveryInvoice);
            item.traceUrl = traceUrl;
        }
        /** 운송장 조회 URL 추가 E */

        this.bundleCodes = newBundleCodes;
        return newBundleCodes;
    },
    /**
     * 주문 처리상태 변경 
     * 
     * @param {long} orderNo 
     * @param {String} orderStatus 
     */
    async changeOrderStatus(orderNo, orderStatus) {
        if (!orderNo || !orderStatus) {
            return false;
        }

        try {
           
            /** 기존 상태와 동일한 경우는 상태 변경 하지 않기 S */
            const data = await OrderInfo.findByPk(orderNo, {
                attributes : ['orderStatus'],
                raw : true,
            });

            if (!data || data.orderStatus == orderStatus) {
                return false;
            }
            /** 기존 상태와 동일한 경우는 상태 변경 하지 않기 E */
            await sendStatusMessageSvc.send(orderNo, orderStatus);

            const result = await OrderInfo.update({
                orderStatus,
            }, { where : { orderNo }});
            
           
            return result[0] > 0;

        } catch (err) {
            logger(err);
            return false;
        }

    },
    /**
     * 디자인 상태 변경 
     * 
     * @param {int} idOrderItem 품주번호
     * @param {String} designStatus 디자인상태
     */
    async changeDesignStatus(idOrderItem, designStatus) {
        if (!idOrderItem) {
            return false;
        }

        const orderItem = await this.getOrderItem(idOrderItem);
        if (!orderItem || (designStatus && orderItem.designStatus == designStatus)) {
            return false;
        }

        try {
            if (designStatus) {
                 await sendStatusMessageSvc.sendDesignStatus(idOrderItem, designStatus);
            }
            const result = await OrderItem.update({
                designStatus
            }, { where : { id : idOrderItem }});

            
        
            return result[0] > 0;

        } catch (err) {
            logger(err);
            return false;
        }
    },
    /**
     * 배송지 정보 변경
     * 
     * @param {Object} req 
     * @throws {OrderUpdateException}
     */
    async changeDeliveryAddress(req) {
        const data = req.body;
        if (!data || !data.orderNo || !data.bundleCodeKey || data.bundleCodeKey.length == 0) {
            throw new OrderUpdateException("잘못된 접근입니다.");
        }

        if (!(data.bundleCodeKey instanceof Array)) {
            data.bundleCodeKey = [data.bundleCodeKey];
        }
        
        try {
            /** 휴대전화번호 유효성 검사  */
            for await (key of data.bundleCodeKey) {
                if (data[`receiverCellPhone_${key}`]) {
                    if (!validateCellPhone(data[`receiverCellPhone_${key}`])) {
                        throw new OrderUpdateException("휴대전화번호 형식이 아닙니다.");
                    }
                }
            }

            for await (key of data.bundleCodeKey) {
                let receiverCellPhone = data[`receiverCellPhone_${key}`];

                receiverCellPhone = receiverCellPhone.replace(/[^\d]/g, "");

                const upData = {
                    receiverNm : data[`receiverNm_${key}`],
                    receiverCellPhone,
                    receiverZonecode : data[`receiverZonecode_${key}`],
                    receiverAddress : data[`receiverAddress_${key}`],
                    receiverAddressSub : data[`receiverAddressSub_${key}`],
                    deliveryMemo : data[`deliveryMemo_${key}`],
                    idDeliveryPolicy : data[`idDeliveryPolicy_${key}`] || 0,
                    deliveryType : data[`deliveryType_${key}`] || "parcel",
                    deliveryCompany : data[`deliveryCompany_${key}`], 
                    deliveryInvoice : data[`deliveryInvoice_${key}`],
                    deliveryReleasedDate : data[`deliveryReleasedDate_${key}`]?new Date(data[`deliveryReleasedDate_${key}`]):null,
                    preferredDeliveryReleasedDate : data[`preferredDeliveryReleasedDate_${key}`]?new Date(data[`preferredDeliveryReleasedDate_${key}`]):null,
                };
      
            
                let idOrderItems = data[`idOrderItems_${key}`];
                if (!(idOrderItems instanceof Array)) {
                    idOrderItems = [idOrderItems];
                }
                
                if (key.indexOf("each") != -1) { // 개별 배송인 경우 각 품주별로 업데이트 
                    await OrderItem.update(upData, {
                        where : { id : { [Op.in] : idOrderItems }}
                    });
                } else { // 묶음배송인 경우 본 주문에 업데이트 
                    await OrderInfo.update(upData, {
                        where : { orderNo : data.orderNo },
                    });
                }
            }

            return true;
        } catch (err) {
            logger(err);
            return false;
        }
    },
    /**
     * 묶음배송코드 변경 (deprecated)
     * 
     * @param {int} idOrderItem 품주번호
     * @param {String} bundleCode 묶음배송코드
     * @returns {Boolean}
     */
    async changeOrderItemBundleCode(idOrderItem, bundleCode) {
        if (!idOrderItem) {
            return false;
        }

        bundleCode = bundleCode || "";

        try {
            const result = await OrderItem.update({
                deliveryBundleCode : bundleCode,
            }, {
                where : { id : idOrderItem },
            });
            
            return result[0] > 0;
        } catch (err) {
            logger(err);
            return false;
        }
    },
    /**
     * 주문 수정 권한 체크 
     * 
     * @param {long} OrderNo
     * @throws {OrderUpdateException}
     */
    async checkUpdateAuth(orderNo) {
        if (!orderNo) {
            throw new OrderUpdateNotAuthorizedException("잘못된 접근입니다.");
        }

        try {
            const sql = `SELECT oi.createdAt, os.setting FROM orderInfos oi,  orderStatuses os WHERE oi.orderNo = ? AND oi.orderStatus = os.statusCd `;
            const rows = await sequelize.query(sql, {
                replacements : [orderNo],
                type : QueryTypes.SELECT,
            });
            if (rows.length == 0 || !rows[0].setting) {
                throw new OrderUpdateNotAuthorizedException();
            }
            
            const data = rows[0];
            if (typeof data.setting == 'string') {
                data.setting = JSON.parse(data.setting);
            }
            if (!data.setting.orderUpdatePossible) {
                throw new OrderUpdateNotAuthorizedException();
            }

            // 수정 시간 마감 여부 체크 
            let orderUpdateClosedDays = await getConfig("siteConfig", "orderUpdateClosedDays") || 0;
            orderUpdateClosedDays = Number(orderUpdateClosedDays);
            if (orderUpdateClosedDays > 0) {
                const createdAt = getLocalDate(data.createdAt);
                createdAt.setDate(createdAt.getDate() + orderUpdateClosedDays);
                const gap = createdAt - new Date();
                if (gap <= 0) {
                    throw new OrderUpdateNotAuthorizedException("주문서관리시한이 마감되었습니다.");
                }
            }
        } catch (err) {
            logger(err);
            throw new OrderUpdateNotAuthorizedException(err.message);
        }
    },
    /**
     * 주문서 존재 여부 체크 
     * 
     * @param {long} orderNo 주문번호
     */ 
    async isOrderExists(orderNo) {
        try {
            const cnt = await OrderInfo.count({ where : { orderNo }});
            return cnt > 0;
        } catch (err) {
            logger(err);
            return false;
        }
    },
    /**
     * 추가 결제금액 등록 
     * 
     * @param {Object} req
     * @throws {OrderAddPaymentException}
     */
    async addPayment(req) {
        const orderNo = req.params.orderNo;
        const data = req.body;
        if (!orderNo || !data) {
            throw new OrderAddPaymentException("잘못된 접근입니다.");
        }

        if (!data.itemNm || data.itemNm.trim() == "") {
            throw new OrderAddPaymentException("추가항목을 입력하세요.");
        }

        if (data.itemPrice == 0) {
            throw new OrderAddPaymentException("추가금액을 입력하세요.");
        }

        try {
            await OrderAddPayment.create({
                orderNo,
                itemNm : data.itemNm,
                itemPrice : data.itemPrice,
                csMemo : data.csMemo,
                idManager : data.idManager,
            });

            return true;
        } catch (err) {
            logger(err);
            if (err instanceof OrderAddPaymentException) {
                throw err;
            }
        }
    },
    /**
     * 추가금액 수정 
     * 
     * @param {Object} req 
     * @throws {OrderUpdatePaymentException}
     */
    async updatePayment(req) {
        const id = req.params.id;
        const data = req.body;
        if (!id || !data) {
            throw new OrderUpdatePaymentException("잘못된 접근입니다.");
        }

        if (!data.itemNm || data.itemNm.trim() == "") {
            throw new OrderUpdatePaymentException("추가항목을 입력하세요.");
        }

        if (!data.itemPrice || data.itemPrice <= 0) {
            throw new OrderUpdatePaymentException("추가금액을 입력하세요.");
        }

        try {
            await OrderAddPayment.update({
                itemNm : data.itemNm,
                itemPrice : data.itemPrice,
                csMemo : data.csMemo,
            }, { 
                where : { id }
            });
        } catch (err) {
            logger(err);
            throw new OrderUpdatePaymentException("초가금액 수정에 실패하였습니다.");
        }   
    },
    /**
     * 추가금액 삭제 
     * 
     * @param {int} id 추가금액 등록 id 
     * @throws {OrderDeletePaymentException}
     */
    async deletePayment (id) {
        if (!id) {
            throw new OrderDeletePaymentException("잘못된 접근입니다.");
        }

        try {
            await OrderAddPayment.destroy({where : {id}});
        } catch (err) {
            logger(err);
            if (err instanceof OrderDeletePaymentException) {
                throw err;
            }
        }
    },
    /**
     * 추가 결제 품목 목록 
     *  
     * @param {long} orderNo 주문번호
     * @returns {Array|Boolean}
     */
    async getAddPayments(orderNo) {
        if (!orderNo) {
            return false;
        }

        try {
            const list = await OrderAddPayment.findAll({
                include : [{
                    model : Manager,
                    attributes : ["managerNm", "managerId"],
                }],
                where : { orderNo },
                order : [['id', 'DESC']],
                raw : true,
            });
            
            return list;
        } catch (err) {
            logger(err);
            return false;
        }
    },
    /**
     * 추가결제 품목 정보 조회 
     * 
     *  @param {int} id 결제 등록 id 
     *  @returns {Array|Boolean}
     */
    async getAddPayment(id) {
        if (!id) {
            return false;
        }

        try {
            const data = OrderAddPayment.findOne({
                include : [{
                    model : Manager,
                    attributes : ["managerNm", "managerId"],
                }],
                where : { id },
                raw : true,
            });
            if (!data) {
                return false;
            }
            
            return data;
        } catch (err) {
            logger(err);
            return false;
        }
    },
    /**
     * 작업자 진행상황 업데이트
     * 
     */
    async updateWorkStatus(id, workStatus) {
        try {  
            if (!id || !workStatus) {
                throw new Error("잘못된 접근입니다.");
            }

            await OrderItem.update({
                workStatus,
            }, { where : { id }});
            
            return true;

        } catch (err) {
            logger(err);
            return false;
        }
    }, 
    /**
     * 작업 정보 업데이트
     * 
     */
    async updateWorkInfo(id, data) {
        try {
            if (!id) {
                throw new Error("잘못된 접근입니다.");
            }

            const upData = {
                workFileName : data.workFileName || "",
                workMemo : data.workMemo || "",
            };

            await OrderItem.update(upData, { where : { id }});
            return true;
        } catch (err) {
            logger(err);
            return false;
        }
    },
    /**
     * 디자이너 변경 
     * 
     * @param {*} id 
     * @param {*} idDesigner 
     */
    async changeDesigner(id, idDesigner) {
        if (!id) {
            return false;
        }
        idDesigner = idDesigner || 0;
        try {
            
            await sendStatusMessageSvc.sendDesginerChanged(id, idDesigner);  // 디자이너 변경시 알림톡 전송

            await OrderItem.update({
                idDesigner,
            }, { where : { id }});

            return true;
        } catch (err) {
            logger(err);
            return false;
        }
    },
    /**
     * 주문서 관리자 메모 업데이트
     *  
     */
    async updateMemo(orderNo, memo) {
        if (!orderNo) {
            return false;
        }

        memo = memo || "";

        try {
           await OrderInfo.update({
                memo,
            }, { where : { orderNo }});

            return true;
        } catch (err) {
            logger(err);
            return false;
        }
    },
    /**
     * 주문품목 관리자 메모 업데이트
     * 
     * @param {*} id 
     * @param {*} itemMemo 
     */
    async updateItemMemo(id, itemMemo) {
        if (!id) {
            return false;
        }

        itemMemo = itemMemo || "";

        try {
            await OrderItem.update({
                itemMemo
            }, { where : { id }});

            return true;
        } catch (err) {
            logger(err);
            return false;
        }
    }

};

module.exports = order;