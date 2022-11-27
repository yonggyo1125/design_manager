window.addEventListener("DOMContentLoaded", function() {
    updateTotalAmount();
    var amountEls = document.getElementsByName("amount");
    for (var i = 0; i < amountEls.length; i++) {
        amountEls[i].addEventListener("click", updateTotalAmount);
    }

    /** 다음으로 버튼 처리 S */
    var nextBtnEl= document.getElementById("next_btn");
    if (nextBtnEl) {
        nextBtnEl.addEventListener("click", function(e) {
            e.preventDefault();
            
            var totalAmountEl = document.getElementById("totalAmount");
            if (!totalAmountEl) {
                return;
            }

            var total = totalAmountEl.dataset.amount;
            var orderNo = totalAmountEl.dataset.orderNo;
            var name = totalAmountEl.dataset.name;
            var cellPhone = totalAmountEl.dataset.cellPhone;

            var url = "/payment/add?gid=" + orderNo + "&amount=" + total + "&name=" + name + "&cellPhone=" + cellPhone; 
            location.replace(url);
        });
    }
    /** 다음으로 버튼 처리 E */
});

/**
 * 총 결제금액 업데이트 
 * 
 */
function updateTotalAmount() {
    var amountEls = document.getElementsByName("amount");
    var total = 0;
    for (var i = 0; i < amountEls.length; i++) {
        if (amountEls[i].checked) {
            total += Number(amountEls[i].value);
        }
    }
    
    var totalAmountEl = document.getElementById("totalAmount");
    if (totalAmountEl) {
        totalAmountEl.textContent = total.toLocaleString() + "원";
        totalAmountEl.dataset.amount = total;
    }
}