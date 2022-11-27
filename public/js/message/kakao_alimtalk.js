/**
 * 카카오 알림톡 관련
 * 
 */
var codefty = codefty || {};
codefty.kakaoAlimTalk = {
    /**
     * 알림톡 전송 팝업
     * 템플릿 치환코드에 전송할 문구 대입  및 전송 처리
     *  
     * @param {String} code 템플릿 코드 
     */
    sendPopup : function(code) {
        if (!code) {
            return;
        }
        var url = "/kakao_alimtalk/send_popup?tmpltCode=" + code;
        codefty.popup.open(url, "알림톡 메세지 전송", 650, 650, true);
    },
    /**
     * 알림톡 템플릿 선택 팝업
     * 
     * @param {String} cellPhone 수신휴대전화 번호
     * @param {String} name 수신자명
     */
    selectPopup : function(cellPhone, name) {
        var url = "/kakao_alimtalk/message";
        var qs = [];
        if (cellPhone) qs.push("cellPhone=" + cellPhone);
        if (name) qs.push("name=" + encodeURIComponent(name));
        if (qs.length > 0) url += "?" + qs.join("&");

        codefty.popup.open(url, "알림톡 메세지 전송", 650, 650, true);
    }
};

window.addEventListener("DOMContentLoaded", function() {
    var list = document.getElementsByClassName("send_kakao_alimtalk");
    for (var i = 0; i < list.length; i++) {
        list[i].addEventListener("click", function() {
            var code = this.dataset.code;
            codefty.kakaoAlimTalk.sendPopup(code);
        });
    }
});