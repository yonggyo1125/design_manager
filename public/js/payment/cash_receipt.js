window.addEventListener("DOMContentLoaded", function() {
    var crPriceEl = document.querySelector("input[name='crPrice']");
    if (crPriceEl) {
        updateSrcvPrice();
        crPriceEl.addEventListener("blur", updateSrcvPrice);
    }

    /** 간이사업자 클릭 시 - 부가세 없음 처리  */
    var simpleBusinessTypeEl = document.getElementById("simpleBusinessType");
    if (simpleBusinessTypeEl) {
        simpleBusinessTypeEl.addEventListener("click", updateSrcvPrice);
    }

    var submitEl = document.querySelector("input[type='submit']");
    if (submitEl) {
        submitEl.addEventListener("click", function(e) {
            updateSrcvPrice();
        });
    }


    /** 발급 내역 상세 보기 S */
    var viewIssuedEls = document.getElementsByClassName("view_issued");
    for (var i = 0; i < viewIssuedEls.length; i++) {
        viewIssuedEls[i].addEventListener("click", function() {
            var id = this.dataset.id;
            var url = "/payment/cash_receipt/" + id;
            codefty.popup.open(url, "현금영수증 발급내역", 600, 750)
        });
    }
    /** 발급 내역 상세 보기 E */


});
 
/**
 * 공급가액 업데이트 
 * 
 * @param {Object}
 */
function updateSrcvPrice() {
    var crPriceEl = document.querySelector("input[name='crPrice']");
    var supPriceEl = document.querySelector("input[name='supPrice']");
    var taxEl = document.querySelector("input[name='tax']");

    if (!crPriceEl || !supPriceEl || !taxEl) {
        return;
    }

    var price = Number(crPriceEl.value);


    var simpleBusinessTypeEl = document.getElementById("simpleBusinessType");
    if (simpleBusinessTypeEl && simpleBusinessTypeEl.checked) {
        var supPrice = price;
    } else {
        var supPrice = Math.round(price / 1.1);
    }
    
    supPriceEl.value = supPrice;

    taxEl.value = price - supPrice;
}