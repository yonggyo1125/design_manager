const Sequelize = require('sequelize');
const Manager = require('./manager/db');
const Level = require('./manager/levelDb');

const ApiKey = require('./api/keydb');
const ApiCode = require('./api/codeDb');
const ApiToken = require('./api/tokenDb');

const ProductItem = require('./product/itemDb'); // 품목
const ProductItemStock = require('./product/itemStockDb'); // 품목 재고
const ProductCategory = require('./product/categoryDb'); // 품목분류
const ProductOption = require('./product/optionDb'); // 기본옵션
const ProductOptionItem = require('./product/optionItemDb'); // 기본옵션 항목
const ProductSubOption = require('./product/optionSubDb'); // 추가옵션
const ProductSubOptionItem = require('./product/optionSubItemDb'); // 추가옵션 항목
const ProductTextOption = require('./product/optionTextDb'); // 텍스트 옵션
const ProductTextOptionItem = require('./product/optionTextItemDb'); // 텍스트옵션 항목

const Company = require('./product/companyDb'); // 거래처
const Holiday = require('./holiday/db'); // 배송휴무일

/** 사이즈 계산기 설정 */
const SizeConfig = require('./product/sizeConfigDb'); // 사이즈 설정
const SizeConfigDelivery = require('./product/sizeConfigDeliveryDb'); // 사이지별 추가배송비
const BoardSize = require('./product/boardSizeDb'); // 보드형 사이즈
const BoardSizeAdd = require('./product/boardSizeAddDb'); // 보드형 사이즈 추가 설정 

const ProductGuide = require('./product/guideDb'); // 사용방법 안내

const BannerGroup = require('./banner/groupDb'); // 배너 그룹 
const Banner = require('./banner/db'); // 배너

const FileInfo = require('./file/db'); // 파일 업로드 정보
const Config = require('./config/db'); // 설정 

const Menu = require('./menu/db'); // 관리자 메뉴

const CustomerService = require('./customer/db'); // 고객 상담 관련
const CustomerApply = require('./customer/applyDb'); // 전화상담예약 관련

const OrderInfo = require('./order/orderInfoDb'); // 주문정보
const OrderItem = require('./order/orderItemsDb'); // 주문품목
const OrderItemSample = require('./order/orderItemSampleDb'); // 주문품목 샘플
const OrderStatus = require('./order/orderStatusDb'); // 주문 처리상태
const OrderAddPayment =  require('./order/orderAddPaymentDb'); // 주문서 추가금액
const DesignStatus = require('./order/designStatusDb'); // 디자인 처리상태
const DesignDraft = require('./order/designDraftDb'); // 디자인 시안
const DeliveryCompany = require('./delivery/deliveryCompanyDb'); // 배송업체 
const DeliveryPolicy = require('./delivery/deliveryPolicyDb'); // 배송조건
const DeliveryAreaPolicy = require('./delivery/deliveryAreaPolicyDb'); // 지역별 배송조건 
const DeliveryAreaCharge = require('./delivery/deliveryAreaChargeDb'); // 지역별 추가배송비

const Payment = require('./payment/db'); // 결제 관리
const PaymentItem = require('./payment/itemDb'); // 결제 상품 
const CashReceipt = require('./cashReceipt/db'); // 현금영수증

const SearchRankJob = require('./searchRankJob/db'); // 검색 순위 작업
const SearchRankJobStat = require('./searchRankJob/statDb'); // 검색 순위 작업 통계 
const SearchRankJobV2 = require('./searchRankJob/dbV2'); // 검색 순위 작업
const SearchRankLog = require("./searchRankJob/logDb"); // 검색 로그

const KakaoAlimTalkTemplate = require('./kakaoAlimTalk/templateDb'); // 카카오 알림톡 템플릿
const KakaoAlimTalkHistory = require('./kakaoAlimTalk/db'); // 카카오 알림톡 전송기록 
const KakaoAlimTalkReservation = require('./kakaoAlimTalk/reservationDb'); // 카카오 알림톡 전송예약 설정
const KakaoAlimTalkReserved = require("./kakaoAlimTalk/reservedDb"); // 예약전송목록 


const DesignerChange = require('./order/designerChangeDb'); // 디자이너 변경 신청 및 처리 결과

const InvoiceUpload = require('./order/invoiceUploadDb'); // 운송장 번호 업로드 

const Board = require('./board/boardDb'); // 게시판 설정
const Skin = require('./board/skinDb'); // 게시판 스킨
const BoardData = require('./board/boardDataDb'); // 게시글
const BoardView = require('./board/boardViewDb'); // 게시글 조회 로그
const Comment = require('./board/commentDb'); // 댓글
const BoardTemplate = require('./board/boardTemplateDb'); // 게시글 양식


const TransientAccess = require("./transientAccess/transientAccessDb"); // 임시 접속 코드 발급

const SimpleOrder = require("./simple/simpleOrderDb"); // 간편 주문서

const env = process.env.NODE_ENV || "development";
const config = require("../config/config")[env];

const db = {};

const sequelize = new Sequelize(config.database, config.username, config.password, config);

db.sequelize = sequelize;
db.Sequelize = Sequelize;

/** 모델 연결 및 초기화 S */
// 기본설정 
db.Config = Config;
db.Holiday = Holiday
db.BannerGroup = BannerGroup;
db.Banner = Banner;
db.Menu = Menu;

// 파일 업로드 정보
db.FileInfo = FileInfo;


// 관리자
db.Manager = Manager;
db.Level = Level;

// API 관련
db.ApiKey = ApiKey;
db.ApiCode = ApiCode;
db.ApiToken = ApiToken;

// 품목관리
db.ProductItem = ProductItem;
db.ProductItemStock = ProductItemStock;
db.ProductCategory = ProductCategory;
db.ProductOption = ProductOption;
db.ProductOptionItem = ProductOptionItem;
db.ProductSubOption = ProductSubOption;
db.ProductSubOptionItem = ProductSubOptionItem;
db.ProductTextOption = ProductTextOption;
db.ProductTextOptionItem = ProductTextOptionItem;
db.Company = Company;
db.ProductGuide = ProductGuide;

// 상담관리 
db.CustomerService = CustomerService;
db.CustomerApply = CustomerApply;

// 사이즈 계산기 설정
db.SizeConfig = SizeConfig; // 사이즈 설정 
db.SizeConfigDelivery = SizeConfigDelivery; // 사이즈별 추가배송비
db.BoardSize = BoardSize; // 보드형 사이즈
db.BoardSizeAdd = BoardSizeAdd; // 보드형 사이즈 추가설정

// 주문관리
db.OrderInfo = OrderInfo;
db.OrderItem = OrderItem;
db.OrderItemSample = OrderItemSample;
db.OrderStatus = OrderStatus;
db.OrderAddPayment = OrderAddPayment;
db.DesignStatus = DesignStatus;
db.DesignDraft = DesignDraft;
db.DeliveryCompany = DeliveryCompany;
db.DeliveryPolicy = DeliveryPolicy;
db.DeliveryAreaPolicy = DeliveryAreaPolicy;
db.DeliveryAreaCharge = DeliveryAreaCharge;

// 결제관련
db.Payment = Payment;
db.PaymentItem = PaymentItem;
db.CashReceipt = CashReceipt;

// 검색순위 작업
db.SearchRankJob = SearchRankJob;
db.SearchRankJobStat = SearchRankJobStat;
db.SearchRankJobV2 = SearchRankJobV2;
db.SearchRankLog = SearchRankLog;

// 카카오 알림톡
db.KakaoAlimTalkTemplate = KakaoAlimTalkTemplate;
db.KakaoAlimTalkHistory = KakaoAlimTalkHistory;
db.KakaoAlimTalkReservation = KakaoAlimTalkReservation;
db.KakaoAlimTalkReserved = KakaoAlimTalkReserved;

// 디자이너 변경
db.DesignerChange = DesignerChange;

// 운송장 번호 업로드
db.InvoiceUpload = InvoiceUpload;

// 게시판 설정
db.Board = Board;
db.Skin = Skin;
db.BoardData = BoardData;
db.BoardView = BoardView;
db.Comment = Comment;
db.BoardTemplate = BoardTemplate;


// 기타
db.TransientAccess = TransientAccess;
db.SimpleOrder = SimpleOrder; // 간편주문서 


// 기본설정
Config.init(sequelize);
Holiday.init(sequelize);
BannerGroup.init(sequelize);
Banner.init(sequelize);
Menu.init(sequelize);

// 파일업로드 정보
FileInfo.init(sequelize);

// 관리자
Manager.init(sequelize);
Level.init(sequelize);

// API 관련
ApiKey.init(sequelize);
ApiCode.init(sequelize);
ApiToken.init(sequelize);

// 품목관리
ProductItem.init(sequelize);
ProductItemStock.init(sequelize);
ProductCategory.init(sequelize);
ProductOption.init(sequelize);
ProductOptionItem.init(sequelize);
ProductSubOption.init(sequelize);
ProductSubOptionItem.init(sequelize);
ProductTextOption.init(sequelize);
ProductTextOptionItem.init(sequelize);
Company.init(sequelize);
ProductGuide.init(sequelize);

// 상담관리
CustomerService.init(sequelize);
CustomerApply.init(sequelize);

// 사이즈 계산기  관리
SizeConfig.init(sequelize);
SizeConfigDelivery.init(sequelize);
BoardSize.init(sequelize);
BoardSizeAdd.init(sequelize);

// 주문관리
OrderInfo.init(sequelize);
OrderItem.init(sequelize);
OrderItemSample.init(sequelize);
OrderStatus.init(sequelize);
OrderAddPayment.init(sequelize);
DesignStatus.init(sequelize);
DesignDraft.init(sequelize);
DeliveryCompany.init(sequelize);
DeliveryPolicy.init(sequelize);
DeliveryAreaPolicy.init(sequelize);
DeliveryAreaCharge.init(sequelize);

// 결제 관련
Payment.init(sequelize);
PaymentItem.init(sequelize);
CashReceipt.init(sequelize);

// 검색 순위 작업
SearchRankJob.init(sequelize);
SearchRankJobStat.init(sequelize);
SearchRankJobV2.init(sequelize);
SearchRankLog.init(sequelize);

// 카카오 알림톡
KakaoAlimTalkTemplate.init(sequelize);
KakaoAlimTalkHistory.init(sequelize);
KakaoAlimTalkReservation.init(sequelize);
KakaoAlimTalkReserved.init(sequelize);

// 디자이너 변경
DesignerChange.init(sequelize);

// 운송장 번호 업로드
InvoiceUpload.init(sequelize);

// 게시판 설정
Board.init(sequelize);
Skin.init(sequelize);
BoardData.init(sequelize);
BoardView.init(sequelize);
Comment.init(sequelize);
BoardTemplate.init(sequelize);


// 기타 설정
TransientAccess.init(sequelize);
SimpleOrder.init(sequelize); // 간편주문서

// 기본설정
Config.associate(db);
Holiday.associate(db);
BannerGroup.associate(db);
Banner.associate(db);
Menu.associate(db);

// 파일업로드 정보
FileInfo.associate(db);

// 관리자
Manager.associate(db);
Level.associate(db);

// API 관련
ApiKey.associate(db);
ApiCode.associate(db);
ApiToken.associate(db);

// 품목관리
ProductItem.associate(db);
ProductItemStock.associate(db);
ProductCategory.associate(db);
ProductOption.associate(db);
ProductOptionItem.associate(db);
ProductSubOption.associate(db);
ProductSubOptionItem.associate(db);
ProductTextOption.associate(db);
ProductTextOptionItem.associate(db);
Company.associate(db);
ProductGuide.associate(db);

// 상담관리
CustomerService.associate(db);
CustomerApply.associate(db);

// 사이즈 계산기 관리
SizeConfig.associate(db);
SizeConfigDelivery.associate(db);
BoardSize.associate(db);
BoardSizeAdd.associate(db);

// 주문관리
OrderInfo.associate(db);
OrderItem.associate(db);
OrderItemSample.associate(db);
OrderStatus.associate(db);
OrderAddPayment.associate(db);
DesignStatus.associate(db);
DesignDraft.associate(db);
DeliveryCompany.associate(db);
DeliveryPolicy.associate(db);
DeliveryAreaPolicy.associate(db);
DeliveryAreaCharge.associate(db);

// 결제관련
Payment.associate(db);
PaymentItem.associate(db);
CashReceipt.associate(db);

// 검색순위 작업
SearchRankJob.associate(db);
SearchRankJobStat.associate(db);
SearchRankJobV2.associate(db);
SearchRankLog.associate(db);

// 카카오 알림톡 
KakaoAlimTalkTemplate.associate(db);
KakaoAlimTalkHistory.associate(db);
KakaoAlimTalkReservation.associate(db);
KakaoAlimTalkReserved.associate(db);

// 디자이너 변경
DesignerChange.associate(db);

// 운송장 번호 업로드
InvoiceUpload.associate(db);

// 게시판 설정
Board.associate(db);
Skin.associate(db);
BoardData.associate(db);
BoardView.associate(db);
Comment.associate(db);
BoardTemplate.associate(db);

// 기타
TransientAccess.associate(db);
SimpleOrder.associate(db); // 간편주문서

/** 모델 연결 및 초기화 E */

module.exports = db;