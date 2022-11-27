/**
 * 주문서 관리(view)
 * 
 */
var codefty = codefty || {};
codefty.orderView = {
    /**
     * 주문처리상태 변경 
     * 
     * @param {Event Object} e 
     */
    changeOrderStatus : function(e) {
        if (!confirm('정말 주문처리상태를 변경하시겠습니까?')) {
            return;
        }

        var target = e.currentTarget;
        var orderNo = target.dataset.orderNo;
        var status = target.value;
        if (!orderNo || !status) {
            alert('잘못된 접근입니다.');
        }
        var url = "/order/" + orderNo;
        var params = "mode=change_order_status&orderStatus=" + status;
        var xhr = new XMLHttpRequest();
        xhr.open("POST", url);
        xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
        xhr.onreadystatechange = function() {
            if (xhr.readyState == XMLHttpRequest.DONE && xhr.status == 200) {
                var result = JSON.parse(xhr.responseText);
                if (result.message) {
                    alert(result.message);
                }
            }
        };
        xhr.send(params);
    },
    /**
     * 디자인상태 변경 
     * 
     * @param {Event Object} e 
     */
    changeDesignStatus(e) {
        if (!confirm('정말 변경하시겠습니까?')) {
            return;
        }

        var dataset = e.currentTarget.dataset;
        var orderNo = dataset.orderNo;
        var idOrderItem = dataset.idOrderItem;
        if (!orderNo || !idOrderItem) {
            alert("잘못된 접근입니다.");
        }

        var designStatus = e.currentTarget.value;
        var params = "mode=change_design_status&idOrderItem=" + idOrderItem + "&designStatus=" + designStatus;
        var url = "/order/" + orderNo;

        var xhr = new XMLHttpRequest();
        xhr.open("POST", url);
        xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
        xhr.onreadystatechange = function() {
            if (xhr.readyState == XMLHttpRequest.DONE && xhr.status == 200) {
                const result = JSON.parse(xhr.responseText);
                if (result.message) {
                    alert(result.message);
                }
            }
        };
        xhr.send(params);
    },
    /**
     * 배송지 정보 변경하기 팝업 
     * 
     * @deprecated
     * @param {Event Object} e 
     */
    changeDelivery : function(e) {
        var orderNo = e.currentTarget.dataset.orderNo;
        if (!orderNo) {
            return;
        }
        
        codefty.popup
            .setCallback(function() {
                var submitBtn = document.querySelector("#frmChangeDelivery input[type='submit']");
                submitBtn.addEventListener("click", function(e) {
                    e.preventDefault();
                    var form = document.getElementById("frmChangeDelivery");
                    var orderNoEl = document.querySelector("#frmChangeDelivery input[name='orderNo']");
                    if (!form || !orderNoEl) {
                        return;
                    }

                    var orderNo = orderNoEl.value;
                    var formData = new FormData(form);
                    var params = new URLSearchParams(formData).toString();
                    var url = "/order/change_delivery/" + orderNo;

                    var xhr = new XMLHttpRequest();
                    xhr.open("POST", url);
                    xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
                    xhr.onreadystatechange = function() {
                        if (xhr.readyState == XMLHttpRequest.DONE && xhr.status == 200) {
                            var result = JSON.parse(xhr.responseText);
                            if (result.message) {
                                alert(result.message);
                            }

                            if (result.isSuccess) {
                                location.reload();
                            }
                        }
                    };
                    xhr.send(params);
                    
                });
            })
            .open("/order/change_delivery/" + orderNo, "배송지 변경하기", 850, 650);
    },
    /**
     *  작업 파일명, 작업자 전달사항 저장 처리 
     * 
     */
    updateWork : function(e) {
        const el = e.currentTarget;
        const idOrderItem = el.dataset.idOrderItem;

        const workFileNameEl = document.getElementById(`workFileName_${idOrderItem}`);
        const workMemoEl = document.getElementById(`workMemo_${idOrderItem}`);


        const params = {
            mode : "update_info",
            idOrderItem,
            workFileName : workFileNameEl.value.trim(),
            workMemo : workMemoEl.value.trim()
        };


        const xhr = new XMLHttpRequest();
        xhr.open("POST", "/work");
        xhr.setRequestHeader("Content-Type", "application/json; charset=utf-8");
        xhr.onreadystatechange = function() {
            if (xhr.status == 200 && xhr.readyState == XMLHttpRequest.DONE) {
                const result = JSON.parse(xhr.responseText);
                if (!result.isSuccess) {
                    alert(result.message);
                    return;
                }
            }
        };

        xhr.send(JSON.stringify(params));  
    },
    /**
     * 관리자 메모 업데이트 
     * 
     */
    updateMemo() {
      
        const orderNoEl = document.querySelector("input[name='orderNo']");

        if (!orderNoEl) {
            return;
        }

        const orderNo = orderNoEl.value;
        if (!orderNo) {
            return;
        }

        let data = { mode : "change_memo", orderNo };
        /** 관리자 메모 메인 S */
        const csMemoEl = document.querySelector(".csMemo");
        if (csMemoEl) {
            data.memo = csMemoEl.value;
        }
        /** 관리자 메모 메인 E */

        /** 품목별 관리자 메모 S */
        data.items = [];
        const itemMemoEls = document.getElementsByClassName("itemMemo ");
        for (let el of itemMemoEls) {
            const idOrderItem = el.dataset.idOrderItem;
            data.items.push({
                idOrderItem,
                itemMemo : el.value,
            });
        }
        /** 품목별 관리자 메모 E */
        data = JSON.stringify(data);
        
        const xhr = new XMLHttpRequest();
        xhr.open("POST", "/order/" + orderNo);
        xhr.setRequestHeader("Content-Type", "application/json; charset=utf-8");
        xhr.addEventListener("readystatechange", function() {
            if (xhr.status == 200 && xhr.readyState == XMLHttpRequest.DONE) {
                const result = JSON.parse(xhr.responseText);
                if (!result.isSuccess) {
                    alert(result.messsage);
                }
            }
        }); 
        xhr.send(data);
    }
};



window.addEventListener("DOMContentLoaded", function() {
    /** 주문처리상태 변경 이벤트 처리 S */
    var orderStatusEl = document.querySelector("select[name='orderStatus']");
    if (orderStatusEl) {
        orderStatusEl.addEventListener("change", codefty.orderView.changeOrderStatus)
    }
    /** 주문처리상태 이벤트 처리 E */

    /** 디자인상태 변경 이벤트 처리 S */
    var designStatusEls = document.getElementsByName("designStatus");
    for (var i = 0; i < designStatusEls.length; i++) {
        designStatusEls[i].addEventListener("change", codefty.orderView.changeDesignStatus);
    }
    /** 디자인상태 변경 이벤트 처리 E */

    /** 배송지 변경하기 버튼 클릭 처리 S */
    /**  deprecated
    var changeDeliveryEl = document.getElementById("change_delivery");
    if (changeDeliveryEl) {
        changeDeliveryEl.addEventListener("click", codefty.orderView.changeDelivery);
    }
    */
    /** 배송지 변경하기 버튼 클릭 처리 E */

    /** 묶음배송코드 변경 버튼 클릭 처리 S */
    var changeBundleCodeEls = document.querySelectorAll(".change_bundleCode");
    for (var i = 0; i < changeBundleCodeEls.length; i++) {
        changeBundleCodeEls[i].addEventListener("click", function(e) {
            var orderNo = this.dataset.orderNo;
            var idOrderItem = this.dataset.idOrderItem;
            var bundleCode = this.dataset.bundleCode || "";
            if (!orderNo || !idOrderItem) {
                alert("잘못된 접근입니다.");
            }

            var el = this.previousElementSibling;
            if (!el || !el.classList.contains("deliveryBundleCode")) { // 추가 
                var input = document.createElement("input");
                input.type = 'text';
                input.className = "deliveryBundleCode w150";
                input.value = bundleCode;
                this.parentElement.insertBefore(input, this);
            } else { // 수정 처리 
                var bundleCode = el.value;
                if (bundleCode.trim() == "") {
                    if (!confirm('묶음배송코드를 미입력하시면 공통배송주소를 사용합니다.\n정말 변경하시겠습니까?')) {
                        el.focus();
                        return;
                    }
                }

                if (!confirm('정말 변경하시겠습니까?')) {
                    return;
                }

                var url = "/order/" + orderNo;
                var params = "mode=change_bundle_code&idOrderItem=" + idOrderItem + "&bundleCode=" + encodeURIComponent(bundleCode);
                var xhr = new XMLHttpRequest();
                xhr.open("POST", url);
                xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
                xhr.onreadystatechange = function() {
                    if (xhr.readyState == XMLHttpRequest.DONE && xhr.status == 200) {
                        var result = JSON.parse(xhr.responseText);
                        if (result.message) {
                            alert(result.message);
                        }

                        if (result.isSuccess) {
                            location.reload();
                        }
                    }
                };
                xhr.send(params);

            }
        });
    }
    /** 묶음배송코드 변경 버튼 클릭 처리 E */

    /** 증빙자료 변경하기 버튼 클릭 처리 S */
    var changeReceiptTypeEl = document.getElementById("change_receipt_type");
    if (changeReceiptTypeEl) {
        changeReceiptTypeEl.addEventListener("click", function() {
            var orderNo = this.dataset.orderNo;
            if (!orderNo) {
                return;
            }

            codefty.popup.open('/order/change_receipt_type/' + orderNo, "증방자료 변경", 600, 600, true);
        });
    }
    /** 증빙자료 변경하기 버튼 클릭 처리 E */

    /** 추가금액 등록 버튼 클릭 처리 S */
    var addPaymentEl = document.getElementById("add_payment");
    if (addPaymentEl) {
        addPaymentEl.addEventListener("click", function() {
            var orderNo = this.dataset.orderNo;
            if (!orderNo) {
                return;
            }

            codefty.popup.open("/order/add_payment/" + orderNo, "추가금액 등록(주문번호 : " + orderNo + ")", 600,  650, true);
        });
    }
    /** 추가금액 등록 버튼 클릭 처리 E */
    /** 추가금액 수정 버튼 클릭 처리 S */
    var updateAddPaymentEls = document.getElementsByClassName("update_add_payment");
    for (var i = 0; i < updateAddPaymentEls.length; i++) {
        updateAddPaymentEls[i].addEventListener("click", function() {
            var id = this.dataset.id;
            codefty.popup.open("/order/update_payment/" + id, "추가금액 수정", 600, 650, true);
        });
    }
    /** 추가금액 수정 버튼 클릭 처리 E */

    /** 결제 생성하기 버튼 클릭 처리 S */
    var createPaymentEl = document.getElementById("create_payment");
    if (createPaymentEl) {
        createPaymentEl.addEventListener("click", function() {
            var orderNo = this.dataset.orderNo;
            if (!orderNo) {
                return;
            }

            codefty.popup.open("/order/create_payment/" + orderNo, "결제생성하기(주문번호 : " + orderNo + ")", 600, 740,  true);
        });
    }
    /** 결제 생성하기 버튼 클릭 처리 E */

    /** 생성된 결제 수정하기 S */
    var updateCreatedPaymentEls = document.getElementsByClassName("update_created_payment");
    for (var i = 0; i < updateCreatedPaymentEls.length; i++) {
        updateCreatedPaymentEls[i].addEventListener("click", function() {
            var id = this.dataset.id;
            if (!id) {
                return;
            }    
            
            codefty.popup.open("/payment/update/"+ id, "결제 수정하기", 600, 740, true);
        });
    }
    /** 생성된 결제 수정하기 E */

    /** 알림톡 주문상태 메세지 수동 전송 S */
    var sendOrderStatusMessageEls = document.getElementsByClassName("send_order_status_message");
    for (var i = 0; i < sendOrderStatusMessageEls.length; i++) {
        sendOrderStatusMessageEls[i].addEventListener("click", function() {
            const orderNo = this.dataset.orderNo;
            if (!orderNo) {
                return;
            }

            if (!confirm('정말 전송하시겠습니까?')) {
                return;
            }
            var url = "/order/message";
            var xhr = new XMLHttpRequest();
            xhr.open("POST", url);
            xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
            xhr.responseType = 'json';
            xhr.onreadystatechange = function() {
                if (xhr.readyState == XMLHttpRequest.DONE && xhr.status == 200) {
                    var result = xhr.response;
                    if (result.isSuccess) {
                        alert('알림톡이 전송되었습니다.');
                    } else {
                        alert(result.message);
                    }
                }
            };
            xhr.send("mode=orderStatusChange&orderNo=" + orderNo);
        });
    }
    /** 알림톡 주문상태 메세지 수동 전송 E */

    /** 알림톡 디자인 상태  메세지 수동 전송 S */
    var sendDesignStatusMessageEls = document.querySelectorAll(".send_design_status_message, .send_design_confirm_message");
    for (var i = 0; i < sendDesignStatusMessageEls.length; i++) {
        sendDesignStatusMessageEls[i].addEventListener("click", function() {
            var id = this.dataset.id;
            if (!id) {
                return;
            }

            if (!confirm('정말 전송하시겠습니까?')) {
                return;
            }
            
            let mode = this.classList.contains("send_design_confirm_message")?"designConfirm":"designStatusChange";
            var url = "/order/message";
            var xhr = new XMLHttpRequest();
            xhr.open("POST", url);
            xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
            xhr.responseType = 'json';
            xhr.onreadystatechange = function() {
                if (xhr.readyState == XMLHttpRequest.DONE && xhr.status == 200) {
                    var result = xhr.response;
                    if (result.isSuccess) {
                        alert('알림톡이 전송되었습니다.');
                    } else {
                        alert(result.message);
                    }
                }
            };
            xhr.send(`mode=${mode}&id=${id}`);
        });
    }
    /** 알림톡 디자인 상태 메세지 수동 전송 E */

    /** 작업  파일명, 작업자 전달사항 저장 처리 S */
    const workEls = document.querySelectorAll(".workFileName, .workMemo");
    for (let el of workEls) {
        el.addEventListener("blur", codefty.orderView.updateWork);
        el.addEventListener("focus", codefty.orderView.updateWork);
    }
    /** 작업  파일명, 작업자 전달사항 저장 처리 S */

    /** 디자인 시안 등록/수정 버튼 클릭 처리 S */
    const addDesignDraftEls = document.querySelectorAll(".add_design_draft");
    for (let addDesignDraftEl of addDesignDraftEls) {
   
        addDesignDraftEl.addEventListener("click", function() {
            const itemUid = this.dataset.itemUid;
            const el = document.querySelector("[name='designStatus']");
            if (!el || !itemUid) {
                return;
            }

            const designStatus = el.value;
            const draftUid = `${itemUid}_${designStatus}`;
            codefty.order.showDraftPopup(draftUid);
        });

    }
    /** 디자인 시안 등록/수정 버튼 클릭 처리 E */


    /** 디자이너 선택 버튼 처리 S */
    const idDesignerEls = document.getElementsByClassName("idDesigner");
    for (let el of idDesignerEls) {
        el.addEventListener("change", function() {
            const idOrderItem = this.dataset.idOrderItem;
            const idDesigner = this.value;
            if (!idOrderItem)
                return;

            const mode = this.classList.contains("assigned") ? "변경":"배정";
            if (!confirm(`정말 디자이너를 ${mode}하시겠습니까?`)) {
                return;
            }

            let params = { idOrderItem, idDesigner };
            params = JSON.stringify(params);

            const xhr = new XMLHttpRequest();
            xhr.open("POST", "/order/change_designer");
            xhr.setRequestHeader("Content-Type", "application/json; charset=utf-8");
            xhr.addEventListener("readystatechange", function() {
                if (xhr.status == 200 && xhr.readyState == XMLHttpRequest.DONE) {
                    const result = JSON.parse(xhr.responseText);
                    if (result.isSuccess) {
                        location.reload();
                    } else {
                        alert(result.message);
                    }
                }
            });
            xhr.send(params);
        });
    }
    /** 디자이너 선택 버튼 처리 E */
    /** 관리자 메모 변경 S */
    const memoEls = document.querySelectorAll(".csMemo, .itemMemo");
    for (let el of memoEls) {
        el.addEventListener("blur", codefty.orderView.updateMemo);
        el.addEventListener("focus", codefty.orderView.updateMemo);
    }
    /** 관리자 메모 변경 E */

});