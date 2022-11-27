 /**
  * 결제양식 관련 
  * 
  */
 var codefty = codefty || {};
codefty.payment = {
    /**
     * DOM 로드시 처리 
     */
    init :  function() {
        var gopaymethodEls = document.getElementsByName("gopaymethod");
        if (gopaymethodEls.length == 0) {
            alert("결제가능한 방법이 없습니다.");
            self.close();
        }

        gopaymethodEls[0].checked = true;
    },
    /**
     * PG 결제 팝업 처리 
     * 
     * 1. 팝업 로드 전 주문 DB 처리 
     * 2. DB 처리 후 생성된 id 값을  merchantData에 넣어준다
     * 3. pg 팝업 열기
     */
    pgProcess : function(e) {
        if (!INIStdPay || typeof INIStdPay.pay != 'function') {
            return;
        }
        try {
            var buyernameEl = document.querySelector("input[name='buyername']");
            var buyertelEl = document.querySelector("input[name='buyertel']");
            var buyeremailEl = document.querySelector("input[name='buyeremail']");
            if (buyernameEl.value == "") {
                var error =  new Error("입금자명을 입력하세요.");
                error.targetEl = buyernameEl;
                throw error;
            }

            if (buyertelEl.value == "") {
                var error =  new Error("휴대전화번호를 입력하세요.");
                error.targetEl = buyertelEl;
                throw error;
            }

            if (buyeremailEl.value == "") {
                var error =  new Error("이메일을 입력하세요.");
                error.targetEl = buyeremailEl;
                throw error;
            }

            if (buyertelEl.value != "") {
                var tel = buyertelEl.value.replace(/[^\d]/g, "");
                buyertelEl.value = tel;
            }

            /** 약관 동의 체크 S */
            var agreePaymentEl = document.getElementById("agreePayment");
            if (agreePaymentEl && !agreePaymentEl.checked) {
                throw new Error("결제내용에 동의하세요.");
            }

            var agreePrivateEl = document.getElementById("agreePrivate");
            if (agreePrivateEl && !agreePrivateEl.checked) {
                throw new Error("개인정보 제3자 제공 및 위탁에 동의하세요.");
            }
            /** 약관 동의 체크 E */

            var list = document.querySelectorAll("#SendPayForm_id input");
            if (list.length == 0)  {
                return;
            }
            let params = [];
            for (var i = 0; i < list.length; i++) {
                var el = list[i];
                if (el.nodeName == 'INPUT') {
                    if (['HIDDEN', 'TEXT', 'EMAIL', 'NUMBER'].indexOf(el.type.toUpperCase()) != -1) {
                        params.push(el.name + "=" + encodeURIComponent(el.value));
                    } else if (el.type.toUpperCase() == 'RADIO') {
                        if (el.checked) {
                            params.push(el.name + "=" + encodeURIComponent(el.value));
                        }
                    }
                }
            }
            
            if (params.length == 0) {
                return;
            }

            params = params.join("&");

            var xhr = new XMLHttpRequest();
            xhr.open("POST", "/payment");
            xhr.responseType = "json";
            xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
            xhr.onreadystatechange = function() {
                if (xhr.readyState == XMLHttpRequest.DONE && xhr.status == 200) {
                    var result = xhr.response;
                    if (result.isSuccess)  {
                        var merchantDataEl = document.querySelector("input[name='merchantData']");
                        if (merchantDataEl) merchantDataEl.value = result.idPayment;

                        INIStdPay.pay('SendPayForm_id');
                    } else { 
                        alert(result.message);
                        return;
                    }
                }
            };
            xhr.send(params);
        } catch (err) {
            if (err.targetEl) err.targetEl.focus();
            alert(err.message);
        }
    },
    /**
     * PG 팝업 닫기
     * 
     */
    pgPopupClose : function() {
        var modalBg = document.querySelector(".inipay_modal-backdrop");
        var modal = document.getElementById("inicisModalDiv");
        if (modalBg) modalBg.parentNode.removeChild(modalBg);
        if (modal) modal.parentNode.removeChild(modal);
    }
};

window.addEventListener("DOMContentLoaded", function() {
    /** DOM 로드시 초기화  */
    codefty.payment.init();

    /** 결제하기 버튼 클릭 처리 S */
    var payProcessEl = document.getElementById("pay_process");
    if (payProcessEl) {
        payProcessEl.addEventListener("click", codefty.payment.pgProcess);
    }
    /** 결제하기 버튼 클릭 처리 E */

    /** 약관 전체 동의 처리 S */
    var agreeAllEl = document.getElementById("agreeAll");
    if (agreeAllEl) {
        agreeAllEl.addEventListener("click", function() {
            var checks = document.querySelectorAll("#agreePayment, #agreePrivate");
            for (var i = 0; i < checks.length; i++) {
                checks[i].checked = this.checked;
            }
        });
    }
    /** 약관 전체 동의 처리 E */
    /** 약관 보기 처리 S */
    var viewTermsEls = document.getElementsByClassName("view_terms");
    for (var i = 0; i < viewTermsEls.length; i++) {
        viewTermsEls[i].addEventListener("click", function() {
            var type = this.dataset.type;
            var url = "/payment/terms/" + type;
            var title = (type == 'private')?"개인정보 제3자 제공 및 위탁동의":"결제 내용 동의";
            codefty.popup.open(url,  title, 340, 500);
        });
    }
    /** 약관 보기 처리 E */

    /** 닫기 처리 S */
    var cancelEls = document.querySelectorAll(".cancel_pay, #close_popup");
    for (var i = 0; i < cancelEls.length; i++) {
        cancelEls[i].addEventListener("click", function() {
            self.close();
        });
    }
    /** 닫기 처리  E */
});
