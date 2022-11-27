const Sequelize = require("sequelize");

module.exports = class Manager extends Sequelize.Model {
    static init(sequelize) {
        return super.init({
            managerId : { // 관리자 아이디 
                type : Sequelize.STRING(20),
                allowNull: false,
                unique: true,
            },
            managerNm : { // 관리자명
                type : Sequelize.STRING(20),
                allowNull : false,
            },
            managerPw : { // 관리자 로그인 비밀번호
                type : Sequelize.STRING(65),
                allowNull : false,
            },
            managerType : { // 내부 직원(admin), 제휴업체(associate)
                type : Sequelize.ENUM('admin', 'associate'),
                allowNull : false,
                defaultValue : "associate",
            },
            email : { // 이메일 
                type : Sequelize.STRING(100),
                allowNull : false,
            },
            mobile : { // 휴대전화 번호
                type : Sequelize.STRING(11),
                allowNull : false,
            },
            useTerms : { // 이용약관 동의 여부
                type : Sequelize.ENUM('y', 'n'),
                allowNull : false,
                defaultValue : 'n',
            },
            privateTerms : { // 개인정보처리방침 동의 여부
                type : Sequelize.ENUM('y', 'n'),
                allowNull : false,
                defaultValue : 'n',
            },
            withdrawalAt : { // 탈퇴 시간
                type : Sequelize.DATE,
            },
            stopUntil: {  // 이용제한 일자
                type : Sequelize.DATE,
            }
        }, {
            sequelize,
            paranoid : true,
            timestamps : true,
            modelName : "Manager",
            tableName : "managers",
            charset: "utf8mb4",
            collate : "utf8mb4_general_ci",
            indexes : [ { unique : false, fields : ['mobile'] }],
        });
    }

    static associate(db) {
        // API 키 
        db.Manager.hasMany(db.ApiKey, { foreignKey : 'idManager', sourceKey : 'id'});

        // 고객 상담
        db.Manager.hasMany(db.CustomerService, { foreignKey : "idManager", sourceKey : "id"});

        // 주문 정보
        db.Manager.hasMany(db.OrderInfo, { foreignKey : 'idManager', sourceKey : 'id'});

        // 시안 정보
        db.Manager.hasMany(db.DesignDraft, { foreignKey : 'idManager', sourceKey : 'id'});

        // 기본옵션
        db.Manager.hasMany(db.ProductOption, { foreignKey : 'idManager', sourceKey : 'id'});

        // 추가옵션
        db.Manager.hasMany(db.ProductSubOption, { foreignKey : 'idManager', sourceKey : 'id' });

        // 결제 생성 품목 
        db.Manager.hasMany(db.PaymentItem, { foreignKey : 'idManager', sourceKey : 'id' });

        // 추가 금액 품목
        db.Manager.hasMany(db.OrderAddPayment, { foreignKey : 'idManager', sourceKey : 'id' });

        // 현금영수증 
        db.Manager.hasMany(db.CashReceipt, { foreignKey : 'idManager', sourceKey : 'id' });

        // 검색순위 작업
        db.Manager.hasMany(db.SearchRankJob, { foreignKey : 'idManager', sourceKey : 'id' });

        // 검색순위 작업 V2
        db.Manager.hasMany(db.SearchRankJobV2, { foreignKey : 'idManager', sourceKey : 'id' });

        // 카카오 알림톡 템플릿
        db.Manager.hasMany(db.KakaoAlimTalkTemplate, { foreignKey : 'idManager', sourceKey : 'id' });

        // 관리레벨
        db.Manager.belongsTo(db.Level, { foreignKey : 'managerLv', targetKey : 'level'});

        // 주문 상품 디자이너 할당
        db.Manager.hasOne(db.OrderItem, { foreignKey : "idDesigner", sourceKey: "id"});

        // 디자이너 변경 처리 담당자 추가
        db.Manager.hasMany(db.DesignerChange, { foreignKey :  "idManager", sourceKey : 'id'});

        // 운송장 업데이트 처리 담당자 추가
        db.Manager.hasMany(db.InvoiceUpload, { foreignKey : 'idManager', sourceKey : 'id' });

        // 게시판 등록 담당자 추가
        db.Manager.hasMany(db.Board, { foreignKey : 'idManager', sourceKey : 'id' });

        // 스킨 등록 담당자 추가
        db.Manager.hasMany(db.Skin, { foreignKey : 'idManager', sourceKey : 'id' });

        // 게시판 글쓴이 추가
        db.Manager.hasMany(db.BoardData, { foreignKey : 'idManager', sourceKey : 'id' });

        // 댓글 글쓴이 추가
        db.Manager.hasMany(db.Comment, { foreignKey : 'idManager', sourceKey : 'id'});

        // 카카오 알림톡 전송 예약 설정
        db.Manager.hasMany(db.KakaoAlimTalkReservation, { foreignKey : 'idManager', sourceKey : 'id' });
    }
}