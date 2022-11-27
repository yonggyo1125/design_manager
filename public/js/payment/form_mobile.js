 /**
 * 결제양식 관련(모바일)
 * 
*/
 var codefty = codefty || {};
codefty.payment = {
    /**
     * DOM 로드시 처리 
     */
     init :  function() {
        var P_INI_PAYMENT = document.getElementsByName("P_INI_PAYMENT");
        if (P_INI_PAYMENT.length == 0) {
            alert("결제가능한 방법이 없습니다.");
            self.close();
        }

        P_INI_PAYMENT[0].checked = true;
    },
    /**
     * PG 결제 팝업 처리 
     * 
     * 1. 팝업 로드 전 주문 DB 처리 
     * 2. DB 처리 후 생성된 id 값을  merchantData에 넣어준다
     * 3. pg 팝업 열기
     */
     pgProcess : function(e) {

        try {
            var P_GOODS = document.querySelector("input[name='P_GOODS']");
            var P_AMT = document.querySelector("input[name='P_AMT']");
            var P_UNAME = document.querySelector("input[name='P_UNAME']");
            var buyertelEl = document.querySelector("input[name='buyertel']");
            var buyeremailEl = document.querySelector("input[name='buyeremail']");
            var P_INI_PAYMENT = document.querySelector("input[name='P_INI_PAYMENT']:checked").value;
            var idPaymentItemEl = document.querySelector("input[name='idPaymentItem']");

            if (P_UNAME.value == "") {
                var error =  new Error("입금자명을 입력하세요.");
                error.targetEl = P_UNAME;
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

            var goodsname = P_GOODS?P_GOODS.value:"";
            var price = P_AMT?P_AMT.value:0;
            var buyername = P_UNAME?P_UNAME.value:"";
            var buyertel = buyertelEl?buyertelEl.value:"";
            var buyeremail = buyeremailEl?buyeremailEl.value:"";
            var gopaymethod = "Card";
            var idPaymentItem = idPaymentItemEl?idPaymentItemEl.value:0;

            switch(P_INI_PAYMENT) {
                case "CARD" : 
                    gopaymethod = "Card";
                    break;
                case "BANK" : 
                    gopaymethod = "DirectBank";
                    break;
                case "VBANK" :
                    gopaymethod = "VBank";
                    break; 
            }

            var data = {
                pg : "inicis",
                goodname : goodsname,
                price : price,
                buyername : buyername,
                buyertel : buyertel,
                buyeremail : buyeremail,
                gopaymethod : gopaymethod,
                idPaymentItem : idPaymentItem,
            };

            let params = [];
            for (key in data) {
                params.push(key + "=" + encodeURIComponent(data[key]));
            }

            params = params.join("&");
            
            var xhr = new XMLHttpRequest();
            xhr.open("POST", "/payment");
            xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
            xhr.responseType = "json";
            xhr.onreadystatechange = function() {
                if (xhr.readyState == XMLHttpRequest.DONE && xhr.status == 200) {
                    var result = xhr.response;
                    if (result.isSuccess)  {
                        var P_NOTI = document.querySelector("input[name='P_NOTI']");
                        if (P_NOTI) P_NOTI.value = result.idPayment;
                        document.mobileweb.action="https://mobile.inicis.com/smart/payment/";
                        document.mobileweb.submit();
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