const Sequelize = require('sequelize');

module.exports = class Board extends Sequelize.Model {
    static init(sequelize) {
        return super.init({
            id : { // 게시판 아이디
                type : Sequelize.STRING(30),
                primaryKey : true,
                allowNull : false,
            },
            title : { // 게시판명
                type : Sequelize.STRING(100),
                allowNull : false,
            },
            isUse : { // 사용 여부
                type : Sequelize.BOOLEAN,
                defaultValue : 0,
            },
            rowsPerPage : { // 1페이지 게시글 수
                type : Sequelize.INTEGER.UNSIGNED,
                defaultValue : 20,
            },
            useViewList : { // 게시글 하단 목록 노출
                type : Sequelize.BOOLEAN,
                default : false,
            },
            category : { // 분류
                type : Sequelize.STRING(1000),  
            },
            listAccessLevel : { // 접근가능 관리레벨 - 목록
                type : Sequelize.STRING(100),
            },
            viewAccessLevel : { // 접근가능 관리레벨 - 게시글
                type : Sequelize.STRING(100),
            },
            writeAccessLevel : { // 접근가능 관리레벨 - 글쓰기
                type : Sequelize.STRING(100),
            },
            replyAccessLevel : { // 접근가능 관리레벨 - 답글
                type : Sequelize.STRING(100),
            },
            commentAccessLevel : { // 접근가능 관리레벨 - 답글
                type : Sequelize.STRING(100),
            },
            listAccessManagers : { // 접근가능 관리자 - 목록 
                type : Sequelize.STRING(500),
            },
            viewAccessManagers : { // 접근가능 관리자 - 게시글
                type : Sequelize.STRING(500),
            },
            writeAccessManagers : { // 접근가능 관리자 - 글쓰기
                type : Sequelize.STRING(500),
            },
            replyAccessManagers : { // 접근가능 관리자 - 답글
                type : Sequelize.STRING(500),
            },
            commentAccessManagers : { // 접근가능 관리자 - 댓글
                type : Sequelize.STRING(500),
            },
            viewType : { //출력 구분, admin - 관리자페이지, member - 회원페이지
                type : Sequelize.ENUM('admin', 'member'),
                defaultValue : 'admin',
            },
            useEditor : { // 에디터 사용 여부
                type : Sequelize.BOOLEAN,
                defaultValue : 0,
            },
            useFileAttach : { // 파일첨부 여부
                type : Sequelize.BOOLEAN,
                defaultValue : 0,
            },
            useImageAttach : { // 이미지 첨부 여부
                type : Sequelize.BOOLEAN,
                defaultValue : 0,
            },
            afterWriteTarget : { // 글작성 후 이동
                type : Sequelize.ENUM('view', 'list'),
                defaultValue : 'view',
            },
            useReply : { // 답글 사용 여부,
                type : Sequelize.BOOLEAN,
                defaultValue : false,
            },
            useReplyMessage : { // 답글알림
                type : Sequelize.BOOLEAN,
                defaultValue : false,
            },
            useComment : { // 댓글 사용 여부
                type : Sequelize.BOOLEAN,
                defaultValue : false,
            },
            useCommentMessage : { // 댓글알림
                type : Sequelize.BOOLEAN,
                defaultValue : false,
            },
            useAdminMessage : { // 관리자 알림
                type : Sequelize.BOOLEAN,
                defaultValue : false,
            },
            useTemplate : { // 자동 완성 템플릿 사용
                type : Sequelize.BOOLEAN,
                defaultValue : false,
            },
            skin : { // 게시판 스킨
                type : Sequelize.STRING(40),
                defaultValue : 'default',
            }, 
            useEmail : { // 이메일 사용 여부
                type : Sequelize.BOOLEAN,
                defaultValue : false,
            },
            useMobile : { // 휴대전화 사용 여부
                type : Sequelize.BOOLEAN,
                defaultValue : false,
            },
            replyKakaoTmpltCode : { // 답글 알림 알림톡 템플릿 
                type : Sequelize.STRING(40),
            },
            commentKakaoTmpltCode : { // 댓글 알림 알림톡 템플릿 
                type : Sequelize.STRING(40),
            },
            answerKakaoTmpltCode : { // 문의 답변 알림 알림톡 템플릿
                type : Sequelize.STRING(40),
            },
            adminKakaoTmpltCode : { // 관리자 알림 알림톡 템플릿 사용    
                type : Sequelize.STRING(40),
            },
            alimTalkManagers : { // 알림톡 전송받을 관리자
                type : Sequelize.STRING(500),
            },
            alimTalkMobiles : { // 알림톡 전송 받을 추가 휴대전화 번호
                type : Sequelize.TEXT,
            },
            showConfig : { // 노출 위치, 노출 관리 레벨 
                type : Sequelize.JSON,
            },
            webhookUrls : { // 웹훅 URL
                type : Sequelize.TEXT, 
            },
            isReview : { // 후기 게시판 여부
                type : Sequelize.BOOLEAN,
                defaultValue : false,
            },
            isReviewOrderOnly : { // 주문한 상품만 후기 작성 가능 여부 
                type : Sequelize.BOOLEAN,
                default : false,
            },
        }, {
            sequelize,
            paranoid : true,
            timestamps : true,
            modelName : "Board",
            tableName : "boards",
            charset : "utf8mb4",
            collate : "utf8mb4_general_ci",
        });
    }

    static associate(db) {
        db.Board.belongsTo(db.Manager, { foreignKey : 'idManager', targetKey : 'id' });
        db.Board.belongsTo(db.Skin, { foreignKey : 'skin', targetKey : 'id' });
    }
}