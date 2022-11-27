const Sequelize = require('sequelize');

module.exports = class Comment extends Sequelize.Model {
    static init(sequelize) {
        return super.init({
            gid : { // 그룹 ID 
                type : Sequelize.STRING(40),
                allowNull : false,
            },
            commenter : { // 댓글 작성자
                type : Sequelize.STRING(40),
                allowNull : false,
            },
            guestPw : { // 비회원 비밀번호
                type : Sequelize.STRING(65),
            },
            content : { // 댓글 본문 
                type : Sequelize.TEXT,
                allowNull : false,
            },
            idParent : { // 대댓글인 경우 부모 댓글 번호
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
            depth : { // 댓글 작성시 들여쓰기 정도
                type : Sequelize.INTEGER.UNSIGNED,
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
            isSentCommentKakaoAlimTalk : { // 댓글 알림톡 전송 여부
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
            modelName : "Comment",
            tableName : "boardComments",
            charset : "utf8mb4",
            collate : "utf8mb4_general_ci",
        });
    }

    static associate(db) {
        db.Comment.belongsTo(db.BoardData, { foreignKey : 'idBoardData', target : 'id' });
        db.Comment.belongsTo(db.Manager, { foreignKey : 'idManager', targetKey : 'id' });
    }
}