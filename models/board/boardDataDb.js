const Sequelize = require('sequelize');

module.exports = class BoardData extends Sequelize.Model {
    static init(sequelize) {
        return super.init({
            gid : { // 그룹 ID 
                type : Sequelize.STRING(40),
                allowNull : false,
            },
            poster : { // 작성자
                type : Sequelize.STRING(40),
                allowNull : false,
            },
            guestPw : { // 비회원 비밀번호
                type : Sequelize.STRING(65),
            },
            isNotice : { // 공지사항 여부
                type : Sequelize.BOOLEAN,
                defaultValue : false,
            },
            category : { // 게시글 분류
                type : Sequelize.STRING(60), 
            },
            subject : { // 게시글 제목
                type : Sequelize.STRING(255),
                allowNull : false,
            },
            content : { // 게시글 본문
                type : Sequelize.TEXT,
                allowNull : false,
            },
            idParent : { // 답글인 경우 부모 게시글 번호    
                type : Sequelize.INTEGER.UNSIGNED,
                defaultValue : 0,
            },
            hit : {
                type : Sequelize.INTEGER.UNSIGNED,
                defaultValue : 0,
            },
            ipAddr : { // IP 주소
                type : Sequelize.STRING(30),
            },
            userAgent : {
                type : Sequelize.STRING(255),
            },
            useEditor : { 
                type : Sequelize.BOOLEAN, // 에디터 사용 여부
                defaultValue : false,
            },
            totalComments : {
                type : Sequelize.INTEGER.UNSIGNED, // 댓글 총 갯수 
                defaultValue : 0,
            },
            email : { // 이메일
                type : Sequelize.STRING(100), 
            },
            mobile : { // 휴대전화 번호
                type : Sequelize.STRING(11), 
            },
            extra1 : { // 추가 항목1
                type : Sequelize.STRING(100),
            },
            extra2 : { // 추가 항목2
                type : Sequelize.STRING(100),
            },
            extra3 : { // 추가 항목3
                type : Sequelize.STRING(100),
            },
            extra4 : { // 추가 항목4
                type : Sequelize.STRING(100),
            },
            extra5 : { // 추가 항목5
                type : Sequelize.STRING(100),
            },
            text1 : { // 추가 텍스트 항목1
                type : Sequelize.TEXT,
            },
            text2 : { // 추가 텍스트 항목2
                type : Sequelize.TEXT,
            },
            text3 : { // 추가 텍스트 항목3
                type : Sequelize.TEXT, 
            },
            depth : { // 답글 작성시 들여쓰기 정도
                type : Sequelize.INTEGER.UNSIGNED,
                defaultValue : 0,
            },
            idOrderItem : { // 후기 작성 품주 번호 
                type : Sequelize.INTEGER,
            },
            itemCode : { // 품목 코드
                type : Sequelize.STRING(20),
            },
            reviewPt : { // 평점
                type : Sequelize.TINYINT,
                defaultValue : 0,
            },
            listOrder : { // 정렬 순서 - 내림차순
                type : Sequelize.BIGINT.UNSIGNED,
                defaultValue : Date.now(),
            },
            listOrder2 : { 
                type : Sequelize.STRING(60),
                defaultValue : "",
            },
            isSentReplyKakaoAlimTalk : { // 답글 알림톡 전송 여부
                type : Sequelize.BOOLEAN,
                defaultValue : false,
            },
            isSentAdminKakaoAlimTalk : { // 관리자 알림톡 전송 여부
                type : Sequelize.BOOLEAN,
                defaultValue : false,
            }
        }, {
            sequelize, 
            paranoid : true,
            timestamps : true,
            modelName : "BoardData",
            tableName : "boardDatas",
            charset : "utf8mb4",
            collate : "utf8mb4_general_ci",
            indexes : [
                { unique : false, fields : ['idOrderItem'] },
                { unique : false, fields : ['itemCode'] }   
            ]
        });
    }

    static associate(db) {
        db.BoardData.belongsTo(db.Board, { foreignKey : 'idBoard', targetKey : 'id' });
        db.BoardData.belongsTo(db.Manager, { foreignKey : 'idManager', targetKey : 'id' });
        db.BoardData.hasMany(db.Comment, { foreignKey : 'idBoardData', sourceKey : 'id'});
    }
}