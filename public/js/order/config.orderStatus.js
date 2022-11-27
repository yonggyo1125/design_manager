window.addEventListener("DOMContentLoaded", function() {
    /** 처리구분 선택 처리 S */
    var statusTypeEl = document.querySelector("select[name='statusType']");
    if (statusTypeEl) {
        statusTypeEl.addEventListener("change", function() {
            var statusType = this.value;
            var statusCdEl = document.querySelector("#frmRegist input[name='statusCd']");
            var statusNm = document.querySelector("#frmRegist input[name='statusNm']");
            if (!statusCdEl || !statusNm) {
                return;
            }

            if (statusType == 'etc') { // 처리구분이 기타일때 
                statusCdEl.removeAttribute("readonly");
                statusCdEl.value = statusNm.value = "";
            } else { // 처리 구분이 지정된 주문 처리 상태인 경우 
                statusCdEl.setAttribute("readonly", true);
                statusCdEl.value = statusType;
                var options = statusTypeEl.children;
                for (var i = 0; i < options.length; i++) {
                    if (options[i].value == statusType) {
                        statusNm.value = options[i].textContent;
                        break;
                    }
                }
            }
        });
    }
    /** 처리구분 선택 처리 E */

    /** 기능설정하기 버튼 클릭 처리 S */
    var settings = document.querySelectorAll("#frmList .setting");
    for (var i = 0; i < settings.length; i++) {
        settings[i].addEventListener("click", function() {
            var statusCd = this.dataset.statusCd;
            codefty.popup.open("/order/popup_config?type=orderStatus&statusCd=" + statusCd, "주문처리상태 설정 - " + statusCd, 700, 650, true);

        });
    }
    /** 기능설정하기 버튼 클릭 처리 E */
});