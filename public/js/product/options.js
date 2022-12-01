/**
 * 옵션관리 
 * 
 */
var codefty = codefty || {};
codefty.options = {
    /**
     * 초기화
     * 
     */
    init : function() {
        var optionsEl = document.getElementById("optionsJson");
        if (!optionsEl) {
            return false;
        }

        var items = optionsEl.value?JSON.parse(optionsEl.value):[];
        if (!items || !(items instanceof Array)) {
            return;
        }

        for (var i = 0; i < items.length; i++) {
            var item = items[i];
            this.addBasic(item);
        }
    },
    /**
     * 기본옵션 추가 처리
     * 
     * @param {Object} item 
     */
    addBasic : function(item) {
        var tplEl = document.getElementById("template_option");
        var optionsEl = document.querySelector("#table_options #options");
        if (!tplEl || !optionsEl) {
            return;
        }

        item = item || {};
        item.optionCd = item.optionCd || "";
        item.optionNm = item.optionNm || "";
        item.addPrice = item.addPrice || 0;
        item.maxLength = item.maxLength || 0;
        item.listOrder = item.listOrder || 0;
        item.isUse = item.isUse || 0;

        var tpl = tplEl.innerHTML;
        var html = tpl;
        html = html
                    .replace(/<%=optionCd%>/g, item.optionCd)
                    .replace(/<%=optionNm%>/g, item.optionNm)
                    .replace(/<%=addPrice%>/g, item.addPrice)
                    .replace(/<%=listOrder%>/g, item.listOrder)
                    .replace(/<%=maxLength%>/g, item.maxLength);
       
        
        var parser = new DOMParser();
        var dom = parser.parseFromString(html, "text/html");
        var selectOptions = dom.querySelectorAll("select[name='isUse'] option");
        for (var i = 0; i < selectOptions.length; i++) {
            var option = selectOptions[i];
            if (item.optionCd && option.value == item.isUse) {
                option.setAttribute("selected", true);
            } else {
                option.removeAttribute("selected");
            }
        }

        /** 옵션 코드 처리 */
        var optionCdEl = dom.querySelector("input[name='optionCd']");
        if (item.optionCd) {
            optionCdEl.type = 'hidden';
            optionCdEl.parentElement.appendChild(document.createTextNode(item.optionCd));
        }

        var tr = dom.querySelector("tr");
        var td = document.createElement("td");
        var span = document.createElement("span");
        var i = document.createElement("i");
        i.className = "xi-minus-square";
        span.className = "sbtn remove";
        span.appendChild(i);
        span.append(document.createTextNode('삭제하기'));
        td.appendChild(span);
        tr.appendChild(td);
        optionsEl.appendChild(tr);

        span.addEventListener("click", function() {
            if (confirm('정말 삭제하시겠습니까?')) {
                /** DB 처리된건인경우 ajax 에서 삭제 */
                if (item.optionCd) {
                    var mode = (location.href.indexOf('sub_options') == -1)?"options":"sub_options";
                    if (location.href.indexOf('text_options') != -1) {
                        mode = "text_options";
                    }
                    
                    var url = "/product/" + mode + "/delete_item/" + item.optionCd;
                    var xhr = new XMLHttpRequest();
                    xhr.open("GET", url);
                    xhr.onreadystatechange = function() {
                        if (xhr.readyState == XMLHttpRequest.DONE && xhr.status == 200) {
                            var result = JSON.parse(xhr.responseText);
                            if (result.message) {
                                alert(result.message);
                            }
                        }
                    };
                    xhr.send(null);
                }

                tr.parentElement.removeChild(tr);
            }
        });
    },
};

window.addEventListener("DOMContentLoaded", function() {
    codefty.options.init();

    var addOptions = document.getElementById("addOptions");
    if (addOptions) {
        addOptions.addEventListener("click", codefty.options.addBasic);
    }
});