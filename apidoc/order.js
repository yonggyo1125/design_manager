/**
 * @api {get/post} /api/v1/order/list 1. 주문목록 조회
 * @apiVersion 0.0.1
 * @apiName 주문목록 조회
 * @apiGroup Order
 * @apiDescription 각 제휴사의 주문목록을 조회합니다. 
 *                             주문목록은 1달(31일) 간격으로 조회가 가능합니다.<br>
 *                             조회 요청시 반드시 createSdate, createEdate의 범위를 1달 이내로 할 것  
 * 
 * @apiHeader (요청헤더) {String} Content-Type application/x-www-form-urlencoded
 * @apiHeader (요청헤더) {String} Authorization Bearer 발급받은 access_token
 * @apiHeaderExample {Request} 요청헤더
 *          Content-Type: application/x-www-form-urlencoded
 *          Authorization : Bearer ca594442-ce6c-4303-943d-f407aecdb543
 * 
 * @apiParam (필수) {String} createSdate 주문접수일 시작일(형식 yyyy-MM-dd) 
 * @apiParam (필수) {String} createEdate 주문접수일 종료일(형식 yyyy-MM-dd)
 * @apiParam (선택) {String} orderNo 주문번호
 * @apiParam (선택) {String} orderNm 주문자명(키워드 포함 형태로 검색)
 * @apiParam (선택) {String} orderCellPhone 주문자 휴대전화
 * @apiParam (선택) {String} orderStatus 처리상태
 * 
 * @apiSuccess {Object} response 주문목록
 * @apiSuccessExample {json} 응답 예시
 *      HTTP/1.1 200 OK
 *      [
 *           {
 *               "orderNo": 1646639570062,
 *                "channel": "본사",
 *                "orderStatus": "ready",
 *                 "orderNm": "테스트",
 *                "ordererType": "private",
 *                "companyNm": "테스트",
 *                "orderCellPhone": "01012341234",
 *                "receiverNm": "테스트",
 *                "receiverCellPhone": "01012341234",
 *                "receiverZonecode": "00000",
 *                "receiverAddress": "주소...",
 *                "receiverAddressSub": "1",
 *                "deliveryMemo": "2",
 *                "receiptType": "tax",
 *                "taxReceiptBusinessNo": "1",
 *                "taxReceiptCompanyNm": "2",
 *                "taxReceiptEmail": "이메일 주소",
 *                "businessCertFileId": 0,
 *                "cashReceiptType": "none",
 *                "cashReceiptNo": "",
 *                "payType": "lbt",
 *                "depositor": "1",
 *                "itemsTotalPrice": 19000,
 *                "totalDiscount": 0,
 *                "totalDeliveryCharge": 0,
 *                "totalVat": 1727,
 *                "totalPayPrice": 19000,
 *                "createdAt": "2022-03-07T07:53:53.000Z",
 *                "updatedAt": "2022-03-07T07:53:54.000Z",
 *                "deletedAt": null,
 *                "idManager": 1,
 *                "Manager.managerId": "manager",
 *                "Manager.managerNm": "관리자",
 *                "items": [
 *                {
 *                    "id": 1,
 *                    "itemUid": "1_1646639581510",
 *                    "itemCode": "1646639397723",
 *                    "itemNm": "1",
 *                    "itemNmSub": "테스트",
 *                    "itemSizeWidth": 150,
 *                    "itemSizeHeight": 100,
 *                    "itemText": "",
 *                    "itemFont": "",
 *                    "providerPrice": 10000,
 *                    "itemPrice": 19000,
 *                    "basicOptionPrice": 0,
 *                    "subOptionPrice": 0,
 *                    "itemDiscount": 0,
 *                    "itemDiscountVat": 0,
 *                    "itemAdjust": 0,
 *                    "itemCnt": 1,
 *                    "itemTotalPrice": 19000,
 *                    "itemTotalPriceVat": 1727,
 *                    "deliveryChargeType": "pre",
 *                    "idDeliveryPolicy": 0,
 *                    "deliveryCompany": "1",
 *                    "deliveryInvoice": "",
 *                    "preferredDeliveryReleasedDate": "2022-03-16T00:00:00.000Z",
 *                    "deliveryReleasedDate": "2022-03-07T00:00:00.000Z",
 *                    "deliveryBundleCode": "",
 *                    "deliveryCharge": 0,
 *                    "deliveryChargeVat": 0,
 *                    "receiverNm": "",
 *                    "receiverCellPhone": "",
 *                    "receiverZonecode": "",
 *                    "receiverAddress": "",
 *                    "receiverAddressSub": "",
 *                    "deliveryMemo": "",
 *                    "designStatus": "draft1",
 *                    "optionCds": [],
 *                    "optionInfo": [],
 *                    "subOptionCds": [],
 *                    "subOptionInfo": [],
 *                    "createdAt": "2022-03-07T07:53:54.000Z",
 *                    "updatedAt": "2022-03-07T07:53:54.000Z",
 *                    "deletedAt": null,
 *                    "orderNo": 1646639570062,
 *                    "idProductItem": 1,
 *                    "productItemInfo": {
 *                    "id": 1,
 *                    "itemType": "head",
 *                    "itemCode": "1646639397723",
 *                    "itemNm": "1",
 *                    "provider": "1",
 *                    "providerPrice": 10000,
 *                    "itemPrice": 19000,
 *                    "texture": "1",
 *                    "itemSize": "2",
 *                    "itemSaleUnit": 10,
 *                    "stockType": "ea",
 *                    "useStock": 0,
 *                    "memo": "1",
 *                    "designAmPm": "pm",
 *                    "designHour": 0,
 *                    "deliveryAddDay": 1,
 *                    "deliveryHour": 0,
 *                    "idOptions": [],
 *                    "idSubOptions": [],
 *                    "listOrder": 0,
 *                    "createdAt": "2022-03-07T07:50:27.000Z",
 *                    "updatedAt": "2022-03-07T07:50:27.000Z",
 *                    "deletedAt": null,
 *                    "idProductCategory": 1,
 *                    "idCompany": null,
 *                    "ProductCategory.cateType": "sale",
 *                    "ProductCategory.cateCd": "1646639386277",
 *                    "ProductCategory.cateNm": "현수막",
 *                    "Company.companyNm": null,
 *                    "Company.businessNo": null,
 *                    "Company.ownerNm": null,
 *                    "stock": null,
 *                    "options": [],
 *                    "subOptions": []
 *                    },
 *                    "samples": [],
 *                    "preferredDeliveryReleasedDateStr": "2022-03-16",
 *                    "deliveryReleasedDateStr": "2022-03-07",
 *                    "attachFiles": [],
 *                    "options": [],
 *                    "subOptions": [],
 *                    "optionsJson": "[]",
 *                    "subOptionsJson": "[]",
 *                    "designStatusStr": "시안1",
 *                    "designStatusInfo": {
 *                    "statusCd": "draft1",
 *                    "statusNm": "시안1",
 *                    "isUse": 1,
 *                    "listOrder": 0,
 *                    "tmpltCode": "",
 *                    "createdAt": "2022-03-07T07:52:24.000Z",
 *                    "updatedAt": "2022-03-07T07:52:36.000Z"
 *                    }
 *                }
*               ]
*             }
*         ]
* @apiError (Erorr 400 | 401) {Number} error 요청 실패시 반환받는 에러코드
* @apiError (Erorr 400 | 401) {String} error_description 요청 실패시 반환받는 에러메세지
 */

/**
 * @api {get} /api/v1/order/:orderNo 2. 주문 단건 조회
 * @apiVersion 0.0.1
 * @apiName 주문 단건 조회
 * @apiGroup Order
 * 
 * @apiDescription 각 제휴사의 주문만 조회가 가능하며 URL 파라미터 :order에 주문번호를 입력하여 요청 
 * 
 * @apiHeader (요청헤더) {String} Content-Type application/x-www-form-urlencoded
 * @apiHeader (요청헤더) {String} Authorization Bearer 발급받은 access_token
 * @apiHeaderExample {Request} 요청헤더
 *          Content-Type: application/x-www-form-urlencoded
 *          Authorization : Bearer ca594442-ce6c-4303-943d-f407aecdb543
 * 
 * 
 * @apiExample 요청예시
 *          /api/v1/order/1646639570062
 * 
 * @apiSuccess {Object} response 조회 주문데이터 
 * @apiSuccessExample {json} 응답 예시
 *        HTTP/1.1 200 OK
 * 
 * @apiError (Erorr 400 | 401) {Number} error 요청 실패시 반환받는 에러코드
 * @apiError (Erorr 400 | 401) {String} error_description 요청 실패시 반환받는 에러메세지
 */

/**
 * @api {get} /api/v1/order/orderStatuses 3. 주문처리상태 목록
 * @apiVersion 0.0.1
 * @apiName 주문처리상태 목록
 * @apiGroup Order
 * 
 * @apiSuccess {String} statusCd 주문상태 코드 
 * @apiSuccess {String} statusNm 주문상태명
 * 
 * @apiSuccessExample {json} 응답예시
 *      HTTP/1.1 200 OK
 *      [
 *          {
 *               "statusCd": "ready",
 *              "statusNm": "주문접수"
 *          },
 *          {
 *              "statusCd": "requestCash",
 *              "statusNm": "입금요청"
 *          },
 *          ....
*      ]
 */

/**
 * @api {get} /api/v1/order/designStatuses 4. 디자인처리상태 목록
 * @apiVersion 0.0.1
 * @apiName 디자인처리상태 목록
 * @apiGroup Order
 * 
 * @apiSuccess {String} statusCd 디자인상태 코드 
 * @apiSuccess {String} statusNm 디자인상태명
 * 
 * @apiSuccessExample {json} 응답예시
 *      HTTP/1.1 200 OK
 *      [
 *          {
 *               "statusCd": "draft1",
 *              "statusNm": "시안"
 *          },
 *          {
 *              "statusCd": "draft2",
 *              "statusNm": "시안2"
 *          },
 *          ....
*      ]
 */

/**
 * @api {post} /api/v1/order 5. 주문등록
 * @apiVersion 0.0.1
 * @apiName 주문등록
 * @apiGroup Order
 * 
 * @apiHeader (요청헤더) {String} Content-Type application/x-www-form-urlencoded
 * @apiHeader (요청헤더) {String} Authorization Bearer 발급받은 access_token
 * @apiHeaderExample {Request} 요청헤더
 *          Content-Type: application/x-www-form-urlencoded
 *          Authorization : Bearer ca594442-ce6c-4303-943d-f407aecdb543
 * 
 * @apiParam (필수) {String} shopOrderNo 쇼핑몰 접수 주문번호
 * @apiParam (필수) {String} orderStatus 처리상태
 * @apiParam (필수) {String} orderNm 주문자명
 * @apiParam (필수) {String="private", "company"} ordererType 주문자구분 (private - 일반, company - 사업자)
 * @apiParam (필수) {String} companyNm 업체명
 * @apiParam (필수) {String} orderCellPhone 주문자 휴대전화
 * @apiParam (필수) {String} receiverNm 수령인/업체명
 * @apiParam (필수) {String} receiverCellPhone 수령인 휴대전화
 * @apiParam (필수) {String} receiverZonecode 배송지 주소 우편번호
 * @apiParam (필수) {String} receiverAddress 배송지 주소
 * @apiParam (필수) {String} receiverAddressSub 배송지 나머지 주소
 * 
 * @apiParam (선택) {String} deliveryMemo 배송메세지
 * @apiParam (선택) {String="tax", "cash", "estimate"} receiptType 증빙자료
 * @apiParam (선택) {String} taxReceiptBusinessNo 사업자등록번호
 * @apiParam (선택) {String} taxReceiptCompanyNm 업체명/대표자명
 * @apiParam (선택) {String} taxReceiptEmail 담당자 이메일
 * @apiParam (선택) {String="jumin", "cellPhone", "businessNo"} cashReceiptType 발급유형
 * @apiParam (선택) {String} cashReceiptNo 주민번호/휴대전화번호/사업자번호
 * @apiParam (필수) {String="lbt", "card"} payType 결제수단
 * @apiParam (선택) {String} depositor 입금자명
 * 
 * @apiParam (필수) {Array} items 주문 상품
 * 
 * @apiParam (필수 - items) {String} itemCode 품목코드
 * @apiParam (필수 - items) {String} itemNmSub 쇼핑몰 주문 품목명
 * @apiParam (필수 - items) {Number} itemPrice 판매원가
 * @apiParam (필수 - items) {Number} itemCnt 수량
 * @apiParam (필수 - items) {Number} itemSizeWidth 사이즈(너비)
 * @apiParam (필수 - items) {Number} itemSizeHeight 사이즈(높이)
 * @apiParam (필수 - items) {Number} itemDiscount 할인금액
 * @apiParam (필수 - items) {Number} itemAdjust 금액조정
 * @apiParam (선택 - items) {Array} optionCds 기본옵션(수량별 적용)
 * @apiParam (선택 - items) {Array} subOptionCds 추가옵션
 * @apiParam (선택 - items) {String="pre", "post"} deliveryChargeType 배송비구분
 * @apiParam (선택 - items) {Number} idDeliveryPolicy 배송정책
 * @apiParam (선택 - items) {String} deliveryCompany 배송업체
 * @apiParam (선택 - items) {String} deliveryInvoice 운송장
 * @apiParam (선택 - items) {String} deliveryReleasedDate 실제출고일 (형식 - yyyy-MM-dd)
 * @apiParam (선택 - items) {String} preferredDeliveryReleasedDate 희망출고일(형식 - yyyy-MM-dd)
 * @apiParam (선택 - items) {String} deliveryBundleCode 묶음배송코드
 * @apiParam (선택 - items) {String} receiverNm 수령인/업체명
 * @apiParam (선택 - items) {String} receiverCellPhone 수령인 휴대전화번호
 * @apiParam (선택 - items) {String} receiverZonecode 수령인 주소 우편번호
 * @apiParam (선택 - items) {String} receiverAddress 수령인 주소
 * @apiParam (선택 - items) {String} receiverAddressSub 수령인 나머지 주소
 * @apiParam (선택 - items) {String} deliveryMemo 배송메시지
 * @apiParam (선택 - items) {String} designStatus 디자인상태
 * 
 * @apiSuccess {String} orderNo 등록된 주문번호
 * @apiError (Error 401) {Number}  error 인증실패시 반환받는 에러코드
 * @apiError (Error 401) {String} error_description 인증실패시 반환받는 에러메세지
 */