window.addEventListener("DOMContentLoaded", function() {
    /** 처리상태 일괄 선택 변경 처리 S */
    const orderStatusAllEl = document.querySelector(".orderStatusAll");
    if (orderStatusAllEl) {
        orderStatusAllEl.addEventListener("change", function() {
            const status = this.value;
            if (status == "") {
                return;
            }

            const orderNoEls = document.querySelectorAll("input[name='orderNo']:checked");
            if (orderNoEls.length == 0) {
                alert("처리상태를 변경할 주문을 선택하세요.");
                return;
            }

            for (let el of orderNoEls) {
                const orderNo = el.value;
                const orderStatusEl = document.querySelector(`select[name='orderStatus_${orderNo}']`);
                if (orderStatusEl) {
                    orderStatusEl.value = status;
                }
            }
        });
    }
    /** 처리상태 일괄 선택 변경 처리 E */

    /** 인수증 일괄 출력 처리 S */
    const printDeliveryReceiptEl = document.getElementsByClassName("print_delivery_receipt");
    for (const el of printDeliveryReceiptEl) {
        el.addEventListener("click", function() {
            const orderNoEls = document.querySelectorAll("#frmList input[name='orderNo']:checked");
            if (orderNoEls.length == 0) {
                alert("인수증을 출력할 주문을 선택하세요.");
                return;
            }

            let orderNos = [];
            for (const el of orderNoEls) {
                orderNos.push(el.value);
            }

            orderNos = orderNos.join("_");
           
            const url = `/order/delivery_receipt/${orderNos}`;
            open(url);
            
        });
    }
    /** 인수증 일괄 출력 처리 E */

    /** 목록에서 바로 주문 상태 변경 처리 S */
    const changeOrderStatusEls = document.getElementsByClassName("change_orderStatus");
    for (const el of changeOrderStatusEls) {
        el.addEventListener("change", function() {
            if (!confirm("정말 변경하시겠습니까?")) {
                return;
            }

            const orderNo = this.dataset.orderNo;
            const orderStatus = this.value;
            if (!orderNo || !orderStatus) {
                alert("잘못된 접근입니다.");
                return;
            }
            
            const params = {
                mode : "change_order_status",
                orderNo,
                orderStatus,
            };
            const url = `/order/${orderNo}`;
            const xhr = new XMLHttpRequest();
            xhr.open("POST", url);
            xhr.setRequestHeader("Content-Type", "application/json; charset=utf-8");
            xhr.onreadystatechange = function() {
                if (xhr.status == 200 && xhr.readyState == XMLHttpRequest.DONE) {
                    const result = JSON.parse(xhr.responseText);
                    let msg;
                    if (result.isSuccess) {
                        msg = "주문상태가 변경되었습니다.";
                    } else {
                        msg = "주문상태 변경에 실패하였습니다.";
                    }
                    alert(msg);
                }
            };

            
            xhr.send(JSON.stringify(params));

        });
    }
    /** 목록에서 바로 주문 상태 변경 처리 E */
});