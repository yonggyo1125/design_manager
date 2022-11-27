/**
 * 출고예정일 안내
 * 
 */
window.addEventListener("DOMContentLoaded", function() {
    var tabs = document.querySelectorAll(".delivery_info .tab");
    for (var i = 0; i < tabs.length; i++) {
        tabs[i].addEventListener("click", function(e) {
            var target = e.currentTarget;

            for (var j = 0; j < tabs.length; j++) {
                if (tabs[j].classList.contains("on")) {
                    tabs[j].classList.remove("on");
                }
            }

            target.classList.add("on");

            var cateCd = target.dataset.cateCd;
            if (!cateCd) {
                return;
            }

           
            var url = "/popup/delivery_guide/" + cateCd;
            location.href=url;
        
            /** 
             *  var xhr = new XMLHttpRequest();
            xhr.open("GET", url + "?isAjax=1");
            xhr.onreadystatechange = function() {
                if (xhr.readyState == XMLHttpRequest.DONE && xhr.status == 200) {
                    var info = document.querySelector(".delivery_info .info");
                    if (info) info.innerHTML = xhr.responseText;
                }
            };
            xhr.send(null);

            var xhr2 = new XMLHttpRequest();
            xhr2.open("GET", url + "?isBanner=1");
            xhr2.onreadystatechange = function() {
                if (xhr2.readyState == XMLHttpRequest.DONE && xhr2.status == 200) {
                    var banner = document.querySelector(".wrap .banner");
                    if (banner) banner.innerHTML = xhr2.responseText;
                    
                }
            };
            xhr2.send(null);
            */

        });
    }

    /** 팝업 닫기 이벤트 처리 S */
    var closePopup = document.getElementById("close_popup");
    if (closePopup) {
        closePopup.addEventListener("click", function() {
            let target;
            if (parent) {
               target = parent;
            }

            if (opener) {
                target = opener;
            }

            target.postMessage({ mode : "close_popup"}, "*");
        });
    }
    /** 팝업 닫기 이벤트 처리 E */
});