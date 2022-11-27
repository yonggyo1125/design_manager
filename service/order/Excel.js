const querystring = require('querystring');
const  excel = require('../../library/excel'); // 엑셀 
const { getLocalDate, dateFormat } = require('../../library/common');
const  orderDao = require('../../models/order/dao');

/**
 * 주문 목록 엑셀 다운로드
 * 
 */
const excelService = {
    /**
     * 엑셀다운로드 
     * 
     * @param {Object} req 
     * @param {Object} res
     */
    async dnXls(req, res, type) {
        type = type || "orders";

        let title = "주문목록(";
        title += (type == 'items')?"품목별":"주문별";
        title += ")";
        const fileName = "order_" + type + "_" +  dateFormat(new Date(), "%Y%m%d%H%i%s");

        let search;
        if (req.body.search) {
            search = querystring.parse(req.body.search);
        }

        const orderData = await orderDao.gets(1, "all", req, search);
        if (!orderData) {
            return false;
        }

        let data;
        switch (type) {
            case "items" :  // 주문 품목별 
                data = await this.getItemsData(orderData);
                break;
            case "orders" :  // 주문서별
                data = await this.getOrdersData(orderData);
                break;

            case "lotte" :  // 롯데 택배
                data = await this.getLotteData(orderData);
                break;
            case "logen" : // 로젠 택배
                data = await this.getLogenData(orderData);
                break;
            case "daesin" : // 대신 택배 
                data = await this.getDasinData(orderData);
                break;

        } 

        if (!data) {
            return false;
        }
        const { headers, bodies } = data;
        excel.download(res, title, fileName, headers, bodies);
    },
    /**
     * 주문 품목 데이터 
     * 
     */
    async getItemsData(orderData) {
       const headers = [
            { header : "주문번호", key : "orderNo" },
            { header : "품주번호", key : "id"},
            { header : "묶음배송코드", key : "deliveryBundleCode"},
            { header : "구분", key : "pItemType"},
            { header : "품목분류", key : "pCateNm"},
            { header : "품목명", key : "pItemNm"},
            { header : "판매원가", key : "itemPrice"},
            { header : "수량", key : "itemCnt"},
            { header : "사이즈", key : "itemSize"},
            { header : "문구", key : "itemText"},
            { header : "폰트", key : "itemFont"},
            { header : "기본옵션", key : "options"},
            { header : "추가옵션", key : "subOptions"},
            { header : "샘플이미지", key : "samples"},
            { header : "첨부파일", key : "attachFiles"},
            { header : "디자인상태", key : "designStatusStr"},
            { header : "상품합계", key : "itemTotalPrice"},
            { header : "할인합계", key : "itemDiscount"},
            { header : "배송비", key : "deliveryCharge"},
            { header : "총합", key : "totalPayPrice"},
       ];

        const bodies = [];
        orderData.forEach (order => {
            order.items.forEach(item => {
                let pItemNm = item.itemNm;
                if (item.itemNmSub) pItemNm += " / " + item.itemNmSub;
                let itemSize = "";
                if (item.itemSizeWidth) itemSize += item.itemSizeWidth.toLocaleString() + "Cm";
                if (item.itemSizeWidth  && item.itemSizeHeight) itemSize += " X";
                if (item.itemSizeHeight) itemSize += item.itemSizeHeight + "Cm";
                
                /** 기본 옵션 S  */
                let options = [], subOptions = [], samples = [], attachFiles = [];
                if (item.options && item.options.length > 0) {
                    for (opt of item.options) {
                        options.push(`[${opt.optionCd} : ${opt.optionNm}]`);
                    }
                }

                options = options.join("");
                /** 기본 옵션 E  */

                /** 추가 옵션  S */
                if (item.subOptions && item.subOptions.length > 0) {
                    for(opt of item.subOptions) {
                        subOptions.push(`[${opt.optionCd} : ${opt.optionNm}]`);
                    }
                }

                subOptions = subOptions.join("");
                /** 추가 옵션 E */

                /** 샘플 이미지 S */

                if (item.samples && item.samples.length > 0) {
                    for (sample of item.samples) {                      
                        samples.push(`[${sample.itemCd}:${sample.itemNm}]`);
                    }
                }

                samples.join("");
                /** 샘플 이미지 E */ 
                
                /** 첨부 파일 S */
                if (item.attachFiles) {
                    for (file in item.attachFiles) {
                        attachFiles.push(`[${file.fileName}]`);
                    }
                } 
                attachFiles = attachFiles.join("");
                /** 첨부 파일 E */
                let pItemType = "";
                switch (item.productItemInfo.itemType) {
                    case "branch" : pItemType = "지사"; break;
                    case "company" : 
                        pItemType = "거래처";
                        if (item.productItemInfo['Company.companyNm']) {
                            pItemType += "(" + tem.productItemInfo['Company.companyNm'] + ")";
                        }
                        break;
                    default :
                        pItemType = "본사";
                }

                bodies.push({
                    orderNo : order.orderNo,
                    id : item.id,
                    deliveryBundleCode : item.deliveryBundleCode,
                    pItemType,
                    pCateNm :  item.productItemInfo['ProductCategory.cateNm'],
                    pItemNm,
                    itemPrice : item.itemPrice,
                    itemCnt : item.itemCnt,
                    itemSize, 
                    itemText : item.itemText, 
                    itemFont : item.itemFont,
                    options,
                    subOptions,
                    samples,
                    attachFiles,
                    designStatusStr : item.designStatusStr,
                    itemTotalPrice : item.itemTotalPrice,
                    itemDiscount : item.itemDiscount,
                    deliveryCharge : item.deliveryCharge,
                    totalPayPrice : item.itemTotalPrice - item.itemDiscount + item.deliveryCharge,
                });
            });
        });
       return { headers, bodies };
    },
    /**
     * 주문 목록 데이터
     * 
     */
    async getOrdersData(orderData) {
        const headers = [
            { header : "주문번호", key : "orderNo" },
            { header : "처리상태", key : "orderStatus" },
            { header : "최종금액", key : "totalPayPrice" },
            { header : "접수상담원", key : "manager" },
            { header : "접수일시", key : "createdAt" },
            { header : "주문자", key : "orderNm" },
            { header : "주문자휴대전화", key: "orderCellPhone" },
            { header : "수령인/업체명", key : "receiverNm" },
            { header : "수령인 휴대전화", key : "receiverCellPhone" },
            { header : "배송지 주소", key : "receiverAddress" },
            { header : "배송메시지", key : "deliveryMemo" },
        ];

        const bodies = [];
        orderData.forEach (item => {
            const manager = item['Manager.managerNm']  + "(" + item['Manager.managerId'] + ")";
            const createdAt = getLocalDate(item.createdAt, "%Y.%m.%d %H:%i:%s");
            let receiverAddress = "";
            if (item.receiverZonecode) receiverAddress += "[" + item.receiverZonecode + "]";
            if (item.receiverAddress) receiverAddress += item.receiverAddress;
            if (item.receiverAddressSub) receiverAddress += " " + item.receiverAddressSub;

            bodies.push({
                orderNo : item.orderNo,
                orderStatus : item.orderStatus,
                totalPayPrice : item.totalPayPrice,
                manager,
                createdAt,
                orderNm : item.orderNm,
                orderCellPhone : item.orderCellPhone,
                receiverNm : item.receiverNm,
                receiverCellPhone : item.receiverCellPhone,
                receiverAddress,
                deliveryMemo : item.deliveryMemo,
            });
        });

        return { headers, bodies };
    },
    /**
     * 롯데 택배 
     * 
     */
    async getLotteData(orderData) {
        const headers = [
            { header : "주문번호", key : "orderNo" },
            { header : "받는사람", key : "receiverNm" },
            { header : "전화번호1", key : "tel1" },
            { header : "전화번호2", key : "tel2" },
            { header : "우편번호", key : "receiverZonecode" },
            { header : "주소", key : "receiverAddress" },
            { header : "상품명1", key : "itemNm" },
            { header : "상품상세1", key : "itemSub" },
            { header : "수량(A타입)", key : "itemCnt" },
            { header : "배송메세지", key : "deliveryMemo" },
            { header : "운임구분", key : "deliveryType" },
            { header : "운임", key : "deliveryCharge" },
            { header : "운송장번호", key : "deliveryInvoice" },
            { header : "", key : "bundleCodeForUpdate" },
        ];

        const bodies = [];
        for await (order of orderData) {
            const deliveryInfo = await orderDao.getDeliveryInfo(order.orderNo);
            for (item of deliveryInfo) {
                 // 롯데 택배로 한정
                 if (!item.deliveryCompany || item.deliveryCompany.trim() == "" || item.deliveryCompany.indexOf("롯데") == -1) {
                    continue;
                }

                let receiverAddress = item.receiverAddress;
                if (item.receiverAddressSub) receiverAddress += " " + item.receiverAddressSub;
                /** 상품 상세 S  */
                let itemNm = [];
                if (item.deliveryItems && item.deliveryItems.length > 0) {  
                    item.deliveryItems.forEach(ditem => {
                        let _itemNm = ditem.itemNm;
                        if (ditem.itemNmSub) _itemNm + "/" + ditem.itemNmSub;
                        if (ditem.optionInfo && ditem.optionInfo.length > 0) {
                            const opts = [];
                            for (opt of ditem.optionInfo) {
                                opts.push(`[${opt.optionNm}]`);
                            }
                            _itemNm += "/" + opts.join("");
                        }
                        if (ditem.subOptionInfo && ditem.subOptionInfo.length > 0) {
                            const opts = [];
                            for (opt of ditem.subOptionInfo) {
                                opts.push(`[${opt.optionNm}]`);
                            }
                            _itemNm += "/" + opts.join("");
                        }

                        _itemNm += "/" + ditem.itemCnt + "개";
                        itemNm.push(_itemNm);
                    });
                }

                itemNm = itemNm.join("\r\n");

                /** 상품 상세 E */
                let deliveryType = "선불";
                let deliveryCharge = '';
                if (item.deliveryPolicy) {
                    const deliveryPolicy = item.deliveryPolicy;
                    if (deliveryPolicy.deliveryCollectType == 'pre' ) {
                        deliveryCharge = deliveryPolicy.deliveryCharge;
                    } else {
                        deliveryType = "착불";
                    }
                }


                bodies.push({
                    orderNo : order.orderNo,
                    receiverNm : item.receiverNm,
                    tel1 : item.receiverCellPhone,
                    tel2 : "",
                    receiverZonecode : item.receiverZonecode,
                    receiverAddress,
                    itemNm,
                    deliveryType,
                    deliveryCharge,
                    deliveryInvoice : item.deliveryInvoice,
                    bundleCodeForUpdate : item.bundleCodeForUpdate,
                });
            }
        }

        return {headers, bodies};
    },
    /**
     * 로젠 택배
     * 
     */
    async getLogenData(orderData) {
        const headers = [
            { header : "수화주명", key : "receiverNm" },
            { header : "우편", key : "receiverZonecode" },
            { header : "주소", key : "receiverAddress" },
            { header : "휴대폰", key : "receiverCellPhone" },
            { header : "택배수량", key : "deliveryCnt" },
            { header : "택배운임", key : "deliveryCharge" },
            { header : "선착불", key : "deliveryType" },
            { header : "물품명", key : "itemNm" },
            { header : "메세지", key : "deliveryMemo" },
            { header : "주문번호", key : "orderNo" },
            { header : "송하인명", key : "etc1" },
            { header : "주소", key : "etc2" },
            { header : "전화", key : "etc3" },
            { header : "핸드폰번호", key : "etc4" },
            { header : "제주선착불", key : "etc5" },
            { header : "", key : "bundleCodeForUpdate" },
        ];

        const bodies = [];
        for await (order of orderData) {
            const deliveryInfo = await orderDao.getDeliveryInfo(order.orderNo);
            for (item of deliveryInfo) {
                // 로젠 택배로 한정
                if (!item.deliveryCompany || item.deliveryCompany.trim() == "" || item.deliveryCompany.indexOf("로젠") == -1) {
                    continue;
                }

                let receiverAddress = item.receiverAddress;
                if (item.receiverAddressSub) receiverAddress += " " + item.receiverAddressSub;
                /** 상품 상세 S  */
                let itemNm = [];
                if (item.deliveryItems && item.deliveryItems.length > 0) {  
                    item.deliveryItems.forEach(ditem => {
                        let _itemNm = ditem.itemNm;
                        if (ditem.itemNmSub) _itemNm + "/" + ditem.itemNmSub;
                        if (ditem.optionInfo && ditem.optionInfo.length > 0) {
                            const opts = [];
                            for (opt of ditem.optionInfo) {
                                opts.push(`[${opt.optionNm}]`);
                            }
                            _itemNm += "/" + opts.join("");
                        }
                        if (ditem.subOptionInfo && ditem.subOptionInfo.length > 0) {
                            const opts = [];
                            for (opt of ditem.subOptionInfo) {
                                opts.push(`[${opt.optionNm}]`);
                            }
                            _itemNm += "/" + opts.join("");
                        }

                        _itemNm += "/" + ditem.itemCnt + "개";
                        itemNm.push(_itemNm);
                    });
                }

                itemNm = itemNm.join("\r\n");

                /** 상품 상세 E */
                let deliveryType = "선불";
                let deliveryCharge = '';
                if (item.deliveryPolicy) {
                    const deliveryPolicy = item.deliveryPolicy;
                    if (deliveryPolicy.deliveryCollectType == 'pre' ) {
                        deliveryCharge = deliveryPolicy.deliveryCharge;
                    } else {
                        deliveryType = "착불";
                    }
                }


                bodies.push({
                    receiverNm : item.receiverNm,
                    receiverZonecode : item.receiverZonecode,
                    receiverAddress,
                    receiverCellPhone : item.receiverCellPhone,
                    deliveryCnt : 1,
                    deliveryCharge,
                    deliveryType,
                    itemNm,
                    deliveryMemo : item.deliveryMemo,
                    orderNo : order.orderNo,
                    etc1 : "",
                    etc2 : "",
                    etc3 : "",
                    etc4 : "",
                    etc5 : "",
                    bundleCodeForUpdate : item.bundleCodeForUpdate,
                });
            }
        }

        return {headers, bodies};
    },
    /**
     * 대신 택배
     * 
     */
    async getDasinData(orderData) {
        const headers = [
            { header : "품명", key : "itemNm" },
            { header : "", key : "blank1" },
            { header : "상호", key : "receiverNm" },
            { header : "전화번호", key : "receiverCellPhone" },
            { header : "도착지(주소 및 영업소)", key : "receiverAddress" },
            { header : "운송", key : "transit" },
            { header : "포장", key : "package" },
            { header : "택배비", key : "deliveryType" },
            { header : "보관료", key : "storeCharge" },
            { header : "운송료", key : "deliveryCharge" },
            { header : "", key : "deliveryMemo" },
            { header : "", key : "bundleCodeForUpdate" },
        ];

        const bodies = [];
        for await (order of orderData) {
            const deliveryInfo = await orderDao.getDeliveryInfo(order.orderNo);
            for (item of deliveryInfo) {
                 // 대신 택배로 한정
                 if (!item.deliveryCompany || item.deliveryCompany.trim() == "" || item.deliveryCompany.indexOf("대신") == -1) {
                    continue;
                }
                
                let receiverAddress = item.receiverAddress;
                if (item.receiverAddressSub) receiverAddress += " " + item.receiverAddressSub;
                /** 상품 상세 S  */
                let itemNm = [];
                if (item.deliveryItems && item.deliveryItems.length > 0) {  
                    item.deliveryItems.forEach(ditem => {
                        let _itemNm = ditem.itemNm;
                        if (ditem.itemNmSub) _itemNm + "/" + ditem.itemNmSub;
                        if (ditem.optionInfo && ditem.optionInfo.length > 0) {
                            const opts = [];
                            for (opt of ditem.optionInfo) {
                                opts.push(`${opt.optionNm}]`);
                            }
                            _itemNm += "/" + opts.join("");
                        }
                        if (ditem.subOptionInfo && ditem.subOptionInfo.length > 0) {
                            const opts = [];
                            for (opt of ditem.subOptionInfo) {
                                opts.push(`[${opt.optionNm}]`);
                            }
                            _itemNm += "/" + opts.join("");
                        }

                        _itemNm += "/" + ditem.itemCnt + "개";
                        itemNm.push(_itemNm);
                    });
                }

                itemNm = itemNm.join("\r\n");

                /** 상품 상세 E */
                let deliveryType = "선불";
                let deliveryCharge = '';
                if (item.deliveryPolicy) {
                    const deliveryPolicy = item.deliveryPolicy;
                    if (deliveryPolicy.deliveryCollectType == 'pre' ) {
                        deliveryCharge = deliveryPolicy.deliveryCharge;
                    } else {
                        deliveryType = "착불";
                    }
                }


                bodies.push({
                    itemNm,
                    blank1 : "",
                    receiverNm : item.receiverNm,
                    receiverCellPhone : item.receiverCellPhone,
                    receiverAddress,
                    transit : "",
                    package : "",
                    deliveryType,
                    storeCharge : "",
                    deliveryCharge : "",
                    deliveryMemo : item.deliveryMemo,
                    bundleCodeForUpdate : item.bundleCodeForUpdate,
                });
            }
        }
        return {headers, bodies};
    }
};

module.exports = excelService;