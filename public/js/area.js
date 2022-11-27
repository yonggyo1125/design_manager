/**
 * 시도, 시구군 선택 관련 
 * 
 */
var codefty = codefty || {};
codefty.area = {
    /** 
     * 시구군 
     *  
     * @param {Object} el 시구군 출력할 element
     * @param {String} sido 시도 
     */
    loadSigugun : function(el, sido) {
        if (!el || !sido) {
            return;
        }
        var url = "/ajax/sigugun/" + encodeURIComponent(sido);
        var xhr = new XMLHttpRequest();
        xhr.open("GET", url);
        xhr.onreadystatechange = function() {
            if (xhr.readyState == XMLHttpRequest.DONE && xhr.status == 200) {
                if (!xhr.responseText) {
                    return;
                }

                el.innerHTML = "";
                var list = JSON.parse(xhr.responseText);
                if (list.length == 0) {
                    var option = document.createElement("option");
                    option.value = "";
                    option.appendChild(document.createTextNode("시도를 먼저 선택하세요."));
                    el.appendChild(option);
                } else {
                    for (var i = 0; i < list.length; i++) {
                        var option = document.createElement("option");
                        option.value = list[i];
                        option.appendChild(document.createTextNode(list[i]));
                        el.appendChild(option);
                    }
                }
            }
        };
        xhr.send(null);   
    }
};

window.addEventListener("DOMContentLoaded", function() {
    var sidos = document.getElementsByName("sido");
    for (var i = 0; i < sidos.length; i++) {
        /** 시도 선택 처리 S */
        sidos[i].addEventListener("change", function(e) {
            var sido = this.value;
            var el = this.nextElementSibling;
            if (!el.name == 'sigugun')
                return;
            
            codefty.area.loadSigugun(el, sido);
        });
        /** 시도 선택 처리 E */
    }
});