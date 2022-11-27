/**
 * 샘플상품관리 
 * 
 */
var codefty = codefty || {};
codefty.sample = {
    // api 요청 URL 
    apiURL : "http://n-mk.kr/apis/",

    /**
     * 샘플 2차 분류 조회 
     * 
     * @param {String} category 1차 분류명 
     * @param {Object} subEl 2차 분류 요소 
     */
    getSubCategory : function(category, subEl) {
        try {
            if (!subEl) {
                throw new Error("2차 분류를 출력할 요소를 선택하세요.");
            }

            subEl.innerHTML = "";
            subEl.value = "";
            var url = this.apiURL + "get_sub_categories.php?category=" + encodeURIComponent(category);
            var xhr = new XMLHttpRequest();
            xhr.open("GET", url);
            xhr.onreadystatechange = function() {
                if (xhr.readyState == XMLHttpRequest.DONE && xhr.status == 200) {
                    var list = JSON.parse(xhr.responseText);
                    if (list.length > 0) {
                        var option = document.createElement('option');
                        var textNode = document.createTextNode("- 2차 분류 선택 -");
                        option.appendChild(textNode);
                        option.value="";
                        subEl.appendChild(option);
                        for (var i = 0; i < list.length; i++) {
                            var option = document.createElement("option");
                            option.value = list[i];
                            var textNode = document.createTextNode(list[i]);
                            option.appendChild(textNode);
                            subEl.appendChild(option);
                        }
                    } else {
                        var option = document.createElement('option');
                        var textNode = document.createTextNode("- 1차 분류를 먼저 선택 -");
                        option.appendChild(textNode);
                        option.value="";
                        subEl.appendChild(option);
                    }
                }
            };

            xhr.send(null);

        } catch (err) {
            console.error(err);
            return false;
        }
    },
    /**
     * 샘플상품 조회 유효성 검사
     * @param {Object} e 
     */
    validateSubmit : function(e) {
        var categoryEl = document.querySelector(".frmSearch select[name='category']");
        var subEl = document.querySelector(".frmSearch select[name='subCategory']");
        if (!categoryEl || categoryEl.value == "") {
            alert("1차 분류를 선택하세요.");
            categoryEl.focus();
            e.preventDefault();
            return;
        }
    }
};

window.addEventListener("DOMContentLoaded", function() {
    var categoryEl = document.querySelector(".frmSearch select[name='category']");
    if (categoryEl) {
        categoryEl.addEventListener("change", function(e) {
            var category = e.currentTarget.value;
            var subEl = document.querySelector(".frmSearch select[name='subCategory']");
            if (!subEl)
                return;

            codefty.sample.getSubCategory(category, subEl);
        });
    }

    /** 검색하기 유효성 검사 */
    var frmSearch = document.querySelector(".frmSearch");
    if (frmSearch) {
        frmSearch.addEventListener("submit", codefty.sample.validateSubmit);
    }
});



/**
 * 팝업 URL 설정하기 팝업 콜백 처리 
 * 
 */
 function callbackSamplePopupUrl() {
    var frmSampleUrl = document.getElementById("frmSampleUrl");
    if (frmSampleUrl) {
        frmSampleUrl.addEventListener("submit", function(e) {
            e.preventDefault();
            var qs = [];
            var inputs = document.querySelectorAll("#frmSampleUrl input[type='number'], #frmSampleUrl input[type='checkbox']");
            for(var i = 0; i < inputs.length; i++) {
                var el = inputs[i];
                if (el.type == 'checkbox') {
                    if (el.checked) {
                        qs.push(el.name + "=" + el.value);
                    }
                } else {
                    qs.push(el.name + "=" + el.value);
                }
            }
            
            var category = e.currentTarget.dataset.category;
            var url = location.origin + "/popup/sample/" + category;
            if (qs) url += "?" + qs.join("&");
            var htmlEl = document.getElementById("generated_sample_url");
            if (htmlEl) {
                htmlEl.innerHTML = "";
                var a = document.createElement("a");
                var urlText = document.createTextNode(url);
                var span = document.createElement("span");
                var i = document.createElement("i");
                var buttonText = document.createTextNode("URL 복사");
                i.className="xi-paperclip";
                span.className="sbtn";
                a.appendChild(urlText);
                a.href=url;
                a.target='_blank';
                span.appendChild(i);
                span.appendChild(buttonText);
                htmlEl.appendChild(a);
                htmlEl.appendChild(span);
                span.addEventListener("click", function(e) {
                    codefty.common.copyToClipBoard(url);
                });
            }
        });
    }
}