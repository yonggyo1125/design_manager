/** 
 * 전화상담 예약
 * 
 */
window.addEventListener("DOMContentLoaded", function() {
    /** 상담 구분 처리 S */
    var csTypes = document.getElementsByName("csType");
    for (var i = 0; i < csTypes.length; i++) {
        csTypes[i].addEventListener("click", function(e) {
            var target = e.currentTarget;
            var v = target.value;
            var kakaoWrap = document.getElementById("kakao_id_wrap");
            if (kakaoWrap) {
                var classList = kakaoWrap.classList;
                if (v == 'kakao') {
                    if (classList.contains('dn'))
                        classList.remove('dn');
                } else {
                    if (!classList.contains('dn'))
                        classList.add('dn');
                }
            }
        });
    }

    /** 상담 구분 처리 E */

    /** 팝업 닫기 버튼 처리  */
    var popupCloses = document.querySelectorAll("#close_popup, .cancel_btn");

    for (var i = 0; i < popupCloses.length; i++) {
        popupCloses[i].addEventListener("click", function() {
            let target;
            if (parent) {
               target = parent;
            }

            if (opener) {
                target = opener;
            }

            target.postMessage({mode : "close_popup"}, "*");
        });
    }
});

/**
 * 날짜 선택 콜백 
 * 
 * @param {Object} data 
 */
function callbackDatepicker(data) {
    var preferredDateText = document.querySelector(".preferred_date");
    var preferredDate = document.getElementById("preferredDate");
    if (data && preferredDateText && preferredDate) {
        preferredDateText.innerText = data.date + "(" + data.yoil + ")";
        preferredDate.value = data.stamp;
    } 
}