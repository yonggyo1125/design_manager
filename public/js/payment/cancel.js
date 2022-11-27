window.addEventListener("DOMContentLoaded", function() {
    var submitEl = document.querySelector("#frmCancel input[type='submit']");
    if (submitEl) {
        submitEl.addEventListener("click", function(e) {
            try {
                var refundAcctNumEl = document.querySelector("input[name='refundAcctNum']");
                if (refundAcctNumEl && refundAcctNumEl.value == "") {
                    refundAcctNumEl.focus();
                    throw new Error("환불계좌번호를 입력하세요.");
                }

                var refundAcctNameEl = document.querySelector("input[name='refundAcctName']");
                if (refundAcctNameEl && refundAcctNameEl.value == "") {
                    refundAcctNameEl.focus();
                    throw new Error("환불계좌 예금주명을 입력하세요.");
                }

                if (!confirm('정말 취소하시겠습니까?')) {
                    e.preventDefault();
                }
            } catch (err) {
                e.preventDefault();
                alert(err.message);
            }
        });
    }
});