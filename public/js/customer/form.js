var codefty = codefty || {};
/**
 * 상담 등록/수정 양식 관련 
 * 
 */
codefty.customerFrm = {
    /**
     * 상담기록조회 
     * 
     * @param {Object} params 
     */
    loadHistory : function(params) {
        var qs = [];
        for(key in params) {
            qs.push(key + "=" + params[key]);
        }
        var url = "/customer/search";
        if (qs.length > 0) url += "?" + qs.join("&");
        codefty.popup
            .setCallback(this.callbackLoadHistory)
            .open(url, "상담 기록 조회", 550, 550);
    },
    /**
     * 상담기록 조회  콜백 처리 
     * 
     */
    callbackLoadHistory : function() {
        var submitEl = document.querySelector("#frmSearch [type='submit']");
        if (!submitEl) {
            return;
        }
        
        submitEl.addEventListener("click", function(e) {
            e.preventDefault();
            var isPass = false;
            var searchFields = ['orderNo', 'customerNm', 'cellPhone', 'email'];
            for (var i = 0; i < searchFields.length; i++) {
                var el = document.querySelector("#frmSearch input[name='" + searchFields[i] + "']");
                if (el && el.value.trim() != "") {
                    isPass = true;
                    break;
                }
            } // endfor 

            if (!isPass) {
                alert('조회할 키워드를 한개 이상 입력하세요.');
                return;
            }

            var params = [];
            var list = document.querySelectorAll("#frmSearch input");
            for (var i = 0; i < list.length; i++) {
                var el = list[i];
                if (el.type == 'text' && el.value.trim() != "") {
                    params.push(el.name + "=" + encodeURIComponent(el.value));
                } else if (el.type == 'radio') {
                    if (el.checked) {
                        params.push(el.name + "=" + encodeURIComponent(el.value));
                    }
                }
            }

            params = params.join("&");
            var url = "/customer/search_result?" + params;

            codefty.popup.close();
            var xhr = new XMLHttpRequest();
            xhr.open("GET", url);
            xhr.onreadystatechange = function() {
                if (xhr.readyState == XMLHttpRequest.DONE && xhr.status == 200) {
                   var searchHtmlEl = document.getElementById("search_html");
                    if (searchHtmlEl) {
                        searchHtmlEl.innerHTML = xhr.responseText;

                        /** 이벤트 바인딩 처리  S */
                        var updateCsInfoEls = document.querySelectorAll(".update_cs_info");
                        for (var i = 0; i < updateCsInfoEls.length; i++) {
                            updateCsInfoEls[i].addEventListener("click", function() {
                                var dataset = this.dataset;
                                for (key in dataset) {
                                    var el = document.querySelector("#frmCustomer input[name='" + key + "']");
                                    if (el) {
                                        el.value = dataset[key];
                                    }
                                }
                            });
                        }

                        var viewCsEls = document.querySelectorAll(".view_cs");
                        for (var i = 0; i < viewCsEls.length; i++) {
                            viewCsEls[i].addEventListener("click", function() {
                                var id = this.dataset.id;
                                var url = "/customer/view/" + id;
                                codefty.popup.open(url, "상담내역 확인", 750, 800);
                            });
                        }

                        /** 구 디자인관리자 클릭 처리 S */
                        const changeHistoryTabEls = document.querySelectorAll("#search_html .change_history .tab");
                        const historyListEls = document.querySelectorAll("#search_html .history_list");
                        for (const el of changeHistoryTabEls) {
                            el.addEventListener("click", function() {
                                for (const _el of changeHistoryTabEls) {
                                    _el.classList.remove("on");
                                }    
                                
                                el.classList.add("on");

                                for (const _el of  historyListEls) {
                                    _el.classList.remove("dn");
                                    _el.classList.add("dn");
                                }
                                let type = "new";
                                if (el.classList.contains("old")) {
                                    codefty.customerFrm.loadOldHistory(params);
                                    type = "old";
                                }

                                const targetEl = document.querySelector(`#search_html .history_list.${type}`);
                                if (targetEl) {
                                    targetEl.classList.remove("dn");
                                }
                                

                            });
                        }
                        /** 구 디자인관리자 클릭 처리 E */
                        
                        /** 이벤트 바인딩 처리  E */ 
                    }
                }
            };

            xhr.send(null);
            
        });
    },
    /**
     * 구 디자인관리자 조회
     * 
     * @param {*} params 
     */
    loadOldHistory(params) {
        const url = "/customer/search_old_result?" + params;
        const xhr = new XMLHttpRequest();
        xhr.open("GET", url);
        xhr.onreadystatechange = function() {
            if (xhr.status == 200 && xhr.readyState == XMLHttpRequest.DONE) {
                const el = document.querySelector("#search_html .history_list.old");
                if (el) {
                    el.innerHTML = xhr.responseText;

                    var updateCsInfoEls = document.querySelectorAll(".update_cs_info");
                    for (var i = 0; i < updateCsInfoEls.length; i++) {
                        updateCsInfoEls[i].addEventListener("click", function() {
                            var dataset = this.dataset;
                            for (key in dataset) {
                                var el = document.querySelector("#frmCustomer input[name='" + key + "']");
                                if (el) {
                                    el.value = dataset[key];
                                }
                            }
                        });
                    }

                    var viewCsEls = document.querySelectorAll(".view_cs");
                    for (var i = 0; i < viewCsEls.length; i++) {
                        viewCsEls[i].addEventListener("click", function() {
                            var idx = this.dataset.idx;
                            var url = "/customer/view_old/" + idx;
                            codefty.popup.open(url, "(구) 상담내역 확인", 750, 800);
                        });
                    }

                }
            }
        };
        xhr.send(null);

    }
};

window.addEventListener("DOMContentLoaded", function() {
    /** 파일 추가 버튼 클릭 처리 S */
    var addFiles = document.getElementById("add_files");
    if (addFiles) {
        addFiles.addEventListener("click", function() {
            var div = document.createElement("div");
            div.className='item';
            var input = document.createElement("input");
            input.type = 'file';
            input.name = 'attachFiles';
            
            var span = document.createElement("span");
            span.className = 'sbtn remove'; 
            var i = document.createElement("i")
            i.className = 'xi-minus-square';
            var text = document.createTextNode("파일삭제");
            span.appendChild(i);
            span.appendChild(text);
            div.appendChild(input);
            div.appendChild(span);
            
            var wrap = document.getElementById("attach_files_wrap");
            if (wrap) {
                wrap.appendChild(div);
            }

            /** 파일 삭제 클릭 처리 S */
            span.addEventListener("click", function(e) {
                var target = e.currentTarget.parentElement;
                if (target) target.parentElement.removeChild(target);
            });
            /** 파일 삭제 클릭 처리 E */
        });
    }
    /** 파일 추가 버튼 클릭 처리 E */
    /** 주문 자세히 버튼 클릭 처리 S */
    const viewOrder = document.querySelector(".view_order");
    if (viewOrder) {
        viewOrder.addEventListener("click", function() {
            var orderNoEl = document.querySelector("#frmCustomer input[name='orderNo']");
            if (!orderNoEl)
                return;
        
            var orderNo = orderNoEl.value;
            if (!orderNo) 
                return;
            
            var url = "/order/" + orderNo;
            open(url);
        });
    }
    /** 주문 자세히 버튼 클릭 처리 E */

    /** 상담기록 조회 버튼 클릭 처리 S */
    var searchHistories = document.querySelectorAll(".search_history");
    for (var i = 0; i < searchHistories.length; i++) {
        searchHistories[i].addEventListener("click", function() {
            var params = {};
            var orderNoEl = document.querySelector("#frmCustomer input[name='orderNo']");
            if (orderNoEl && orderNoEl.value.trim()) {
                params.orderNo = orderNoEl.value;
            } 

            var customerNmEl = document.querySelector("#frmCustomer input[name='customerNm']");
            if (customerNmEl && customerNmEl.value.trim() ) {
                params.customerNm = customerNmEl.value;
            }

            var cellPhoneEl = document.querySelector("#frmCustomer input[name='cellPhone']");
            if (cellPhoneEl && cellPhoneEl.value.trim()) {
                params.cellPhone = cellPhoneEl.value;
            }

            var emailEl = document.querySelector("#frmCustomer input[name='email']");
            if (emailEl && emailEl.value.trim()) {
                params.email = emailEl.value;
            }
            /** 상담기록 조회하기 */
            codefty.customerFrm.loadHistory(params);

        });
    }
    /** 상담기록 조회 버튼 틀릭 처리 E */

    /** 카카오 알림톡 전송 S */
    var sendMessageEls = document.getElementsByClassName("send_message");
    for (var i = 0; i < sendMessageEls.length; i++) {
        sendMessageEls[i].addEventListener("click", function() {
            
            var name = "";
            var customerNmEl = document.querySelector("input[name='customerNm']");
            if (customerNmEl) {
                name = customerNmEl.value.trim();
            }

            var cellPhone = "";
            var cellPhoneEl = document.querySelector("input[name='cellPhone']");
            if (cellPhoneEl) {
                cellPhone = cellPhoneEl.value.replace(/[^\d]/g, "");
            }

            
            if (codefty && codefty.kakaoAlimTalk) {
                codefty.kakaoAlimTalk.selectPopup(cellPhone, name);
            }
        });
    }
    /** 카카오 알림톡 전송 E */

    /** 간편주문서 전송하기 S */
    const sendSimpleOrderEl = document.querySelector(".sendSimpleOrder");
    if (sendSimpleOrderEl) {
        sendSimpleOrderEl.addEventListener("click", function() {
            const name = frmCustomer.customerNm.value;
            if (!name || name.trim() == "") {
                alert("고객명을 입력하세요.");
                frmCustomer.customerNm.focus();
                return;
            }

            const mobile = frmCustomer.cellPhone.value;
            if (!mobile || mobile.trim() == "") {
                alert("연락처를 입력하세요.");
                frmCustomer.cellPhone.focus();
                return;
            }

            if (!confirm('정말 전송하시겠습니까?')) {
                return;
            }

            const url = `/customer/send_simple_order?name=${name}&mobile=${mobile}`;
            const xhr = new XMLHttpRequest();
            xhr.open("GET", url);
            xhr.onreadystatechange = function() {
                if (xhr.status == 200 && xhr.readyState == XMLHttpRequest.DONE) {
                    const result = JSON.parse(xhr.responseText);
                    if (result.isSuccess) {
                        alert("전송되었습니다.");
                    } else {
                        alert(result.message);
                    }
                }
            };
            xhr.send(null);
        });
    }
    /** 간편주문서 전송하기 E */
});