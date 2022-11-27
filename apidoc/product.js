/**
 * @apiVersion 0.0.1
 * @api {get} /api/v1/product/categories 1. 품목 분류 조회
 * @apiGroup Product
 * @apiName 품목 분류 조회
 * @apiDescription 본사에서 제공하는 품목 분류를 조회할 수 있으며 실 운영 쇼핑몰도 이 분류를 참고하여 상품을 등록 관리하셔야 API 요청시에 매칭할 수 있습니다.
 * 
 * @apiHeader (요청헤더) {String} Authorization Bearer 발급받은 access_token
 * @apiHeaderExample {Request} 요청헤더
 *          Authorization : Bearer ca594442-ce6c-4303-943d-f407aecdb543
 * 
 * @apiSuccessExample {json} 응답예시
 *      HTTP/1.1 200 OK
 *      [
 *          {
 *              "cateCd": "1646639386277",
 *              "cateNm": "현수막"
 *          },
 *          .....
 *      ]
 */

/**
 * @apiVersion 0.0.1
 * @api {get} /api/v1/product/list 2. 품목 리스트 
 * @apiGroup Product
 * @apiName 품목 리스트
 * @apiDescription 본사에서 제공하는 품목을 조회할 수 있으며, 실 운영 쇼핑몰에도 조회된 품목을 참고하여 상품을 등록관리하셔야 API 요청시에 매칭할 수 있습니다.
 * 
 * @apiParam (필수) {String} cateCd 품목분류코드
 * @apiParam (선택) {String="head", "branch", "company"} itemType 업체구분<br>1) head : 본사<br>2) branch : 지사<br>3) company 거래처
 * @apiParam (선택) {String} itemCode 품목코드 (키워드 포함 LIKE 검색)
 * @apiParam (선택) {String} itemNm 품목명 (키워드 포함 LIKE 검색)
 * 
 * @apiHeader (요청헤더) {String} Authorization Bearer 발급받은 access_token
 * @apiHeaderExample {Request} 요청헤더
 *          Authorization : Bearer ca594442-ce6c-4303-943d-f407aecdb543
 * 
 * @apiSuccessExample {json} 응답예시
 *      HTTP/1.1 200 OK
 *      [
 *           {
 *               "id": 1,
 *               "itemType": "head",
 *               "itemCode": "1646639397723",
 *               "itemNm": "1",
 *               "provider": "1",
 *               "providerPrice": 10000,
 *               "itemPrice": 19000,
 *               "texture": "1",
 *               "itemSize": "2",
 *               "itemSaleUnit": 10,
 *               "stockType": "ea",
 *               "useStock": 0,
 *               "memo": "1",
 *               "designAmPm": "pm",
 *               "designHour": 0,
 *               "deliveryAddDay": 1,
 *               "deliveryHour": 0,
 *               "idOptions": [],
 *               "idSubOptions": [],
 *               "listOrder": 0,
 *               "createdAt": "2022-03-07T07:50:27.000Z",
 *               "updatedAt": "2022-03-07T07:50:27.000Z",
 *               "deletedAt": null,
 *               "idProductCategory": 1,
 *               "idCompany": null,
 *               "ProductCategory.cateType": "sale",
 *               "ProductCategory.cateCd": "1646639386277",
 *               "ProductCategory.cateNm": "현수막",
 *               "Company.companyNm": null,
 *               "Company.businessNo": null,
 *               "Company.ownerNm": null,
 *               "stock": null,
 *               "options": [],
 *               "subOptions": [],
 *               "optionsJson": "[]",
 *               "subOptionsJson": "[]"
 *           },
 *           ...
 *      ]
 */