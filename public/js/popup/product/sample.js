/**
 * 디자인 샘플 팝업 처리 
 * 
 */

window.addEventListener("DOMContentLoaded", function() {
    /** 2차 분류 클릭 이벤트 처리 S */
    var subCategories = document.querySelectorAll(".body-popup-sample .subCategory");
    for (var i = 0; i < subCategories.length; i++) {
        subCategories[i].addEventListener("click", function(e) {
            var subCategory = e.currentTarget.dataset.subCategory;
            if (subCategory) {
                var el = document.querySelector(".frmSearch input[name='subCategory']");
                el.value = subCategory;
                var frm = document.querySelector(".frmSearch");
                if (frm) frm.submit();
            }
        });
    }
    /** 2차 분류 클릭 이벤트 처리 E */

    /**  팝업 닫기 이벤트 처리 S */
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
    /**  팝업 닫기 이벤트 처리 E */

    /** 디자인 선택 이벤트 처리 S */
    var selectItems = document.querySelectorAll(".body-popup-sample .select_item");
    for (var i = 0; i < selectItems.length; i++) {
        selectItems[i].addEventListener("click", function(e) {
            var dataset = e.currentTarget.dataset;
            var data = { mode : "popup_select_item" };
            for(key in dataset) {
                data[key] = dataset[key];
            }
            
            let target;
            if (parent) {
                target = parent;
            }
    
            if (opener) {
                target = opener;
            }
            
            target.postMessage(data, "*");
        });
    }
    /** 디자인 선택 이벤트 처리 E */
});