/**
 * 공통 편의 기능 
 * 
 */
var codefty = codefty || {};
codefty.common = {
    /**
     * 텍스트 클립보드에 복사하기
     * 
     * @param {String} text 
     */
    copyToClipBoard : function(text) {
        var t = document.createElement("textarea");
        document.body.appendChild(t);
        t.value = text
        t.select();
        document.execCommand('copy');
        document.body.removeChild(t);
        alert('복사되었습니다. Ctrl+V를 눌러 원하는 곳에 붙여넣기 하세요.');
    },
    /**
     * 주소 찾기 팝업
     * 
     * @param {String} zonecodeField 우편번호 name값
     * @param {String} addressField 주소 name 값 
     * @param {Function} callback 주소 찾기 후 콜백 함수
     */
    showSearchAddress(zonecodeField, addressField, callback) {
        new daum.Postcode({
            oncomplete : function(data) {
                if (data) {
                    var zonecode = document.getElementsByName(zonecodeField);
                    if (zonecode.length > 0) {
                        zonecode[0].value = data.zonecode; 
                    } 

                    var address = document.getElementsByName(addressField);
                    if (address.length > 0) {
                      address[0].value = data.address;
                      if (data.buildingName) address[0].value += " (" + data.buildingName + ")";
                    }
                }

                if (typeof callback == 'function') {
                    callback(data);
                } else {
                    if (typeof callbackSearchAddress == 'function') {
                        callbackSearchAddress(data);
                    }
                }
            }
        }).open();
    },
    /**
     * 관리자 선택 팝업
     * 
     * @param {*} e 
     */
    showManagersPopup(e) {
        const targetEl = e.currentTarget;
        const id = targetEl.dataset.id;
        if (!id) {
            return;
        }

        codefty.popup.open(`/manager/popup_select/${id}`, "관리자 선택", 700, 550, true);
    }
};

/** 
 * 공통 이벤트 처리 
 */
window.addEventListener("DOMContentLoaded", function() {
    /** 체크박스 전체 선택 S */
    var jsCheckAlls = document.querySelectorAll(".js-checkall");
    for (let jsCheckAll of jsCheckAlls) {
        jsCheckAll.addEventListener("click", function(e) {
            /** name 값으로 전체 선택 S */
            let targetNames = e.currentTarget.dataset.targetName;
            if (targetNames) {
                targetNames = targetNames.split(",");
                for (let targetName of targetNames) {
                    const list = document.querySelectorAll("input[name^='" + targetName + "']");

                    for(let i = 0; i < list.length; i++) {
                        list[i].checked = e.currentTarget.checked;
                    }
                }
            }
            /** name 값으로 전체 선택 E */
            /** id 값으로 전체 선택 S */
            let targetIds = e.currentTarget.dataset.targetId;
            if (targetIds) {
                targetIds = targetIds.split(",");
                for (let id of targetIds) {
                    const list = document.querySelectorAll(`input[id^='${id}']`);
                    for (let el of list) {
                        el.checked = e.currentTarget.checked;
                    }
                }
            }
            /** id 값으로 전체 선택 E */
        });
    } // endfor  
    /** 체크박스 전체 선택 E */

    /** 취소하고 뒤로가기 S */
    var cancelBacks = document.getElementsByClassName("cancel_back");
    if (cancelBacks.length > 0) {
        for (var i = 0; i < cancelBacks.length; i++) {
            cancelBacks[i].addEventListener("click", function() {
                history.back();
            });
        }
    }
    /** 취소하고 뒤로가기 E */

    /** 링크 이동 버튼 S */
    var goLinks = document.getElementsByClassName("go_link");
    for (var i = 0; i < goLinks.length; i++) {
        goLinks[i].addEventListener("click", function() {
            var url = this.dataset.url;
            if (!url) {
                return;
            }

            location.replace(url);
        });
    }
    /** 링크 이동 버튼 E */

    /** 양식 수정, 삭제 버튼, 엑셀다운로드 처리 S */
    var formUploads = document.querySelectorAll(".form_update, .form_delete, .form_soft_delete, .form_excel");
    if (formUploads.length > 0) {
        for(var i = 0; i < formUploads.length; i++) {
            formUploads[i].addEventListener("click", function(e) {
                var target = e.currentTarget;
                var formId = target.dataset.id;
                if (!formId) 
                    return;
                  
                var type = target.dataset.type;

                var form = document.getElementById(formId);
                form.action = form.action.split("_method")[0];
                /** 검색 search 항목 */
                var search = document.querySelector("#" + formId + " input[name='search']");
                if (search) search.value = ""; // 초기화

                if (form.action.indexOf("?") == -1) {
                    form.action += "?";
                }

                if (!target.classList.contains('form_excel')) {
                    form.action += "_method=";
                }

                var msg; 
                if (target.classList.contains("form_delete")) { // 삭제 버튼 클릭시 
                    msg = '정말 삭제하시겠습니까?';
                   form.action += "DELETE";
                } else if (target.classList.contains('form_soft_delete')) { // Soft 삭제 버튼 클릭시
                    msg = "정말 삭제하시겠습니까?";
                    form.action += "DELETE&isSoft=1";
                } else if (target.classList.contains('form_excel')) { // 엑셀 다운로드 클릭시 
                    if (form.action.indexOf("mode=dnXls") == -1) {
                        form.action += "mode=dnXls";
                    }

                    if (type && form.type)  {
                        form.type.value = type;
                    }

                    /**  검색 URL 추가 */
                    if (search) {
                        search.value = location.search.replace("?", "") || "";
                    }
                    form.submit();
                    return;
                } else { // 수정 버튼 클릭시 
                    msg = '정말 수정하시겠습니까?';
                    form.action += "PATCH";
                }

                if (confirm(msg)) {
                    
                    if (form) {
                        form.submit();
                    }
                } // endif 
            });
        }
    } // endif 
    /** 양식 수정, 삭제 버튼 처리 E */

    /** 난수 자동 생성 처리 S */
    var generateUids = document.getElementsByClassName("generate_uid");
    if (generateUids.length > 0) {
        for (var i = 0; i < generateUids.length; i++) {
            generateUids[i].addEventListener("click", function(e) {
                var target = e.currentTarget.previousElementSibling;
                if (target.nodeName == 'INPUT' && target.type.toUpperCase() == 'TEXT') { 
                    target.value = Date.now();
                }
            });
        }
    }
    /** 난수 자동 생성 처리 E */
    /** 주소 검색 처리 S */
    var searchAddresses = document.getElementsByClassName("searchAddress");
    for (var i = 0; i < searchAddresses.length; i++) {
        searchAddresses[i].addEventListener("click", function(e) {
           var dataset = e.currentTarget.dataset;
           var zonecode = dataset.zonecode || 'zonecode';
           var address = dataset.address || 'address';

           codefty.common.showSearchAddress(zonecode, address);
        });
    }
    /** 주소 검색 처리 E */

    /** 상담기록 조회 S */
    var csSearches = document.querySelectorAll(".cs_search");
    for (var i = 0; i < csSearches.length; i++) {
        csSearches[i].addEventListener("click", function(e) {
            var dataset = this.dataset;
            var url = "/customer?isPopup=1&withOldDesignManager=1";
            if (dataset.targetCustomerNm) {
                var customerNmEl = document.querySelector("[name='" + dataset.targetCustomerNm + "']");
                if (customerNmEl) dataset.customerNm = customerNmEl.value;
            }

            if (dataset.targetCellPhone) {
                var cellPhoneEl = document.querySelector("[name='" + dataset.targetCellPhone + "']");
                if (cellPhoneEl) dataset.cellPhone = cellPhoneEl.value;
            }

            var qs = [];
            for (key in dataset) {
                qs.push(key + "=" + dataset[key]);
            }
            
            if (qs.length > 0) url += "&" + qs.join("&");

           codefty.popup.open(url, "상담기록조회", 1000, 650, true);
        });
    }
    /** 상담기록 조회 E */

    /** 배송조회 버튼 처리 S */
    var deliveryTraces = document.getElementsByClassName("delivery_trace");
    for (var i = 0; i < deliveryTraces.length; i++) {
        deliveryTraces[i].addEventListener("click", function() {
            var companyNm = this.dataset.companyNm;
            var invoice = this.dataset.invoice;
            if (!companyNm || !invoice) {
                return;
            }

            var url = "/popup/delivery_trace?companyNm=" + companyNm + "&invoice=" + invoice + "&isAjax=1";
            //codefty.popup.open(url, '배송조회', 400, 450, true);
            var xhr = new XMLHttpRequest();
            xhr.open("GET", url);
            xhr.onreadystatechange = function() {
                if (xhr.readyState == XMLHttpRequest.DONE && xhr.status == 200) {
                    var url = xhr.responseText.trim();
                    if (url) open(url);
                }
            };
            xhr.send(null);
        });
    }
    /** 배송조회 버튼 처리 E */

    /** 날짜 기간 선택 버튼클릭 처리 S  */
    const quickDates = document.querySelectorAll(".quick_date .date_span");
    for (var i = 0; i < quickDates.length; i++) {
        quickDates[i].addEventListener("click", processQuickDateSearch);
    }

    const quickDateSelEls = document.getElementsByClassName("quick_date_sel");
    for (let el of quickDateSelEls) {
        el.addEventListener("change", processQuickDateSearch);
    }


    function processQuickDateSearch(e) {
        const targetEl = e.currentTarget;
       

        var span, quickDateEl;
        if (targetEl.nodeName == 'SELECT') {
            span = targetEl.value;
            quickDateEl = targetEl;
        } else {
            span = targetEl.dataset.span;
            quickDateEl = targetEl.parentElement;
        }

        
        var targetName = quickDateEl.dataset.targetName;

        if (!span || !targetName) return;

        var date = new Date();
        span = span.split("_");
        var num = parseInt(span[0]);
        switch(span[1]) {
            case "week" : 
                date.setDate(date.getDate() - (num * 7));
                break;
            case "month" : 
                date.setMonth(date.getMonth() - num);
                break;
            case "year" : 
                date.setFullYear(date.getFullYear() - num);
                break;
            case "day" :
                date.setDate(date.getDate() - num); 
                break;
        }
        var month  =  (date.getMonth() + 1);
        month = (month < 10)?"0" + month:month;
        var day = date.getDate();
        day = (day < 10)?"0" + day:day;
        var dateStr = date.getFullYear() + "-" + month+ "-" + day;
        targetName = targetName.split(",");
        var el1 = document.querySelector("input[name='" + targetName[0] + "']");
        if (el1) el1.value = dateStr;

        var el2 = document.querySelector("input[name='" + targetName[1] + "']");
        if (el2) el2.value = "";
            
        // 전체 검색
        if (targetEl.dataset.span == 'all') {
            if (el1) el1.value = "";
            if (el2) el2.value = "";
        }

        for (let el of quickDates) {
            el.classList.remove("on");
        }
            
        targetEl.classList.add("on");
    }
    /** 날짜 기간 선택 버튼클릭 처리 E */
     /**  결제 취소  S */
     var cancelOrderPayEls = document.getElementsByClassName("cancel_payment");
     for (var i = 0; i < cancelOrderPayEls.length; i++) {
         cancelOrderPayEls[i].addEventListener("click", function() {
             var id = this.dataset.id;
             var url = "/payment/cancel/" + id;
             codefty.popup.open(url, "환불/취소하기",  500, 550, true);
         });
     }
     /** 결제 취소 E */
     /** 결제 내역 확인 S */
     var viewPaymentEls = document.getElementsByClassName("view_payment");
     for (var i = 0; i < viewPaymentEls.length; i++) {
        viewPaymentEls[i].addEventListener("click", function() {
            var id = this.dataset.id;
            var url = "/payment/view/" + id + "?isAdmin=1";
            codefty.popup.open(url, "결제내역 확인", 1000, 700, true);
        });
     }
     /** 결제 내역 확인 E */

    /** 몇 개씩 보기 처리 S */
    const limitsTabEls = document.querySelectorAll(".limits_tab .tab");
    for (let el of limitsTabEls) {
        el.addEventListener("click", function() {
            console.log(this);
            const limit = this.dataset.limit || 20;
            const targetId = this.parentElement.dataset.targetId;
            const limitEl = document.querySelector("#" + targetId + " input[name='limit']");
            if (limitEl) {
                limitEl.value = limit;
                const targetEl = document.getElementById(targetId);
                targetEl.submit();
            }

        });
    }
    /** 몇 개씩 보기 처리 E */

    /** 상단 으로 이동  S */
    const goTopEls = document.getElementsByClassName("goTop");
    for (let el of goTopEls) {
        el.addEventListener("click", function() {
            scrollTo(0,0);
        });
    }
    /** 상단 으로 이동  E */

    /** 디자이너 변경 요청 버튼 클릭 처리 S */
    const bodyEl = document.querySelector("body");
    if (!bodyEl.classList.contains("body-mypage")) {
        const changeDesignerEls = document.getElementsByClassName("change_designer");
        for (let el of changeDesignerEls) {
            el.addEventListener("click", function() {
                const idOrderItem = this.dataset.idOrderItem;
                codefty.popup.open("/order/request_change_designer/" + idOrderItem, "디자이너 변경", 320, 240);
            });
        }
    }
    /** 디자이너 변경 요청 버튼 클릭 처리 E */

    /** 바코드 다운로드 처리 S */
    const barcodeEls = document.getElementsByClassName("barcode");
    for (const el of barcodeEls) {
        el.addEventListener("click", function() {
            const { width, height } = this.getBBox();
            const svgEl = this.cloneNode(true);
            const svgHTML = svgEl.outerHTML;
            const blob = new Blob([svgHTML], {type: 'image/svg+xml; charset=utf-8'});
            const URL = window.URL || window.webkitURL || window;
            const blobURL = URL.createObjectURL(blob);

            const image = new Image();
            image.onload = function() {
                const canvas = document.createElement('canvas');
                canvas.width = width;
                canvas.height = height;

                const ctx = canvas.getContext('2d');
                ctx.drawImage(image, 0, 0, width, height);
                
                let dataURL = canvas.toDataURL("image/png");
                dataURL = dataURL.replace(/^data:image\/[^;]*/, 'data:application/octet-stream');
                dataURL = dataURL.replace(/^data:application\/octet-stream/, 'data:application/octet-stream;headers=Content-Disposition%3A%20attachment%3B%20filename=barcode.png');
                const aLink = document.createElement("a");
                aLink.download = `barcode_${width}_${height}.png`;
                aLink.href=dataURL;
                aLink.click();
            };

            image.src = blobURL;


        });
    }
    /** 바코드 다운로드 처리 E */
    /** 회원 선택 버튼 처리 S */
    const selectManagersEls = document.getElementsByClassName("select_managers");
    for (const el of selectManagersEls) {
        el.addEventListener("click", codefty.common.showManagersPopup);
    }
    /** 회원 선택 버튼 처리 E */

    /** 포커스 이벤트 처리 S */
    const focusEl = document.querySelector(".focus");
    if (focusEl) focusEl.focus();
    /** 포커스 이벤트 처리 E */

    /** 이미지 확대 보기 S */
    const maginfyImageEls = document.querySelectorAll(".maginfy_images img");
    for (const el of maginfyImageEls) {
        el.addEventListener("click", function() {
            const src = this.src;
            let width = this.naturalWidth;
            let height = this.naturalHeight;

            const maxWidth = window.innerWidth - 40;
            let more = Math.round(height / 2);
            if (width > maxWidth) {
                width = maxWidth;
            }

            if (height > window.innerHeight) {
                more = 20;
            }

            const ypos = window.pageYOffset + more;
            const xpos = Math.round((window.innerWidth - width) / 2) - 5;
            console.log(xpos, ypos);
            const image = new Image();
            image.src = src;
            image.width = width;
            image.id = "maginfied"
            image.style.position = "absolute";
            image.style.left = xpos + "px";
            image.style.top = ypos + "px";
            image.style.zIndex = 1000;
            image.style.cursor = "pointer";
            image.onload = function() {
                const layerDim = document.createElement("div");
                layerDim.id = 'layer_dim';
                layerDim.addEventListener("click", removePopup);
                image.addEventListener("click", removePopup);
                document.body.appendChild(layerDim);
                document.body.appendChild(image);
                function removePopup() {
                    const removeEls = document.querySelectorAll("#maginfied, #layer_dim");
                    for (const el of removeEls) {
                        el.parentElement.removeChild(el);
                    }
                }
            };

        });
    }
    /** 이미지 확대 보기 E */

    /** 게시판 템플릿 선택 처리 S */
    const selectBoardTemplateEls = document.getElementsByClassName("selectBoardTemplate");
    for (const el of selectBoardTemplateEls) {
        el.addEventListener("change", function() {
            const id = this.value;
            const targetName = this.dataset.targetName;
            if (!id || !targetName) {
                return;
            }

            const xhr = new XMLHttpRequest();
            xhr.open("GET", "/board/template/" + id);
            xhr.onreadystatechange = function() {
                if (xhr.status == 200 && xhr.readyState == XMLHttpRequest.DONE) {
                    const result = JSON.parse(xhr.responseText);
                    if (!result.success) {
                        alert(result.message);
                        return;
                    }

                    if (typeof CKEDITOR != 'undefined' && CKEDITOR) { // 에디터 사용중인 경우 
                        CKEDITOR.instances[targetName].setData(result.data.content);
                    } else {
                        const targetEl = document.querySelector(`textarea[name='${targetName}']`);
                        if (targetEl) targetEl.value = result.data.content;
                    }
                }
            };
            xhr.send(null);
        });
    }
    /** 게시판 템플릿 선택 처리 E */

    /** API 연동 쇼핑몰 주문상세 보기 처리 S */
    const showShopOrderDetailEls = document.getElementsByClassName("showShopOrderDetail");
    for (const el of showShopOrderDetailEls) {
        el.addEventListener("click", function() {
            const orderNo = this.dataset.orderNo;
            if (!orderNo) {
                alert("잘못된 접근입니다.");
                return;
            }

            const params = {
                mode : "get_shopOrderViewUrl",
            };
            const url = `/order/${orderNo}`;
            const xhr = new XMLHttpRequest();
            xhr.open("POST", url);
            xhr.setRequestHeader("Content-Type", "application/json; charset=utf-8");
            xhr.onreadystatechange = function() {
                if (xhr.status == 200 && xhr.readyState == XMLHttpRequest.DONE) {
                    const result = JSON.parse(xhr.responseText);
                    if (result.isSuccess) {
                        const url = result.url;
                        codefty.popup.open(url, "주문상세보기", 1000, 750, true);
                    }
                }
            };
            xhr.send(JSON.stringify(params));
        });
    }

    /** API 연동 쇼핑몰 주문상세 보기 처리 E */
    
    /** 게시판 더보기 버튼 클릭 처리 S */
    const moreBoardEl = document.querySelector("nav .more_board");
    const moreBoardContentEl = document.querySelector("nav .board_links_more");
    if (moreBoardEl && moreBoardContentEl) {
        moreBoardEl.addEventListener("click", function() {
            const classList = moreBoardContentEl.classList;
            classList.toggle("dn");
        });

        moreBoardContentEl.addEventListener("mouseleave", function() {
            this.classList.remove("dn");
            this.classList.add("dn");
        });
    }
    /** 게시판 더보기 버튼 클릭 처리 E */
}); 