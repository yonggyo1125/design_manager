/**
 * 배송조건 관련
 * 
 */
var codefty = codefty || {};
codefty.deliveryPolicy = {
    /**
     * 초기로딩 처리 
     * 
     */
    init : function() {
        var deliveryChargeType = document.getElementById("deliveryChargeType");
        var type = deliveryChargeType?deliveryChargeType.value:undefined;
        this.updateDeliveryChargeConfig(type);

        /** 배송조건 수정 및 구간별 배송비 설정이 있을 경우 추가 처리 */
        var rangeDeliveryCharge = document.getElementById("rangeDeliveryCharge");
        if (!rangeDeliveryCharge) return;
        var jsonData = rangeDeliveryCharge.value;
        var list = JSON.parse(jsonData);
        if (!list || list.length == 0 || typeof list == 'string' ) {
            return;
        }

        for (var i = 1; i < list.length - 1; i++) {
            var item = list[i];
            this.add(type, item);
        }
        
    },
    /**
     * 배송비 설정
     * 
     * @param {String} type fixed(고정배송비), free(배송비무료)
     *                      price(금액별배송비), count(수량별배송비),
     *                      weight(무게별배송비) 
     *                      기본값 - fixed
     */
    updateDeliveryChargeConfig : function(type) {
        type = type || 'fixed';
        const deliveryChargeConf = document.getElementById("deliveryChargeConf");
        if (!deliveryChargeConf) {
            return;
        }

        deliveryChargeConf.classList.remove("dn");

       
        if (type == 'free') { // 배송비 무료 
            deliveryChargeConf.innerHTML = "";
            deliveryChargeConf.classList.add("dn");
            return;
        }

       
        const tpl = document.getElementById("template_" + type);
        if (!tpl) {
            return;
        }

        deliveryChargeConf.innerHTML = tpl.innerHTML;
        const el = document.getElementById("useRangeRepeat");
        if (el) {
            el.addEventListener("click", this.updateRangeRepeat);
            
        }
    },
    /**
     * 범위 반복 설정 처리 
     * 
     */
    updateRangeRepeat : function(e) {
        const el = e.currentTarget;
        const textEl = document.getElementById("rangeRepeatText");
        const type = textEl.dataset.type;
        const typeStr = type == 'count' ? "개" : "원";
        const text = `${typeStr} 마다 반복 부과`;
        const trEls = document.querySelectorAll("#deliveryChargeConf table tbody tr");
        const prevEl = textEl.previousElementSibling;
        const unitStartEl = prevEl.previousElementSibling;
        const unitEndEl = trEls[0].querySelector("input[name='unitEnd']");
        if (el.checked) {
            textEl.innerHTML = text;
            if (trEls.length > 1) {
                for (let i = 1; i < trEls.length; i++) {
                    trEls[i].parentElement.removeChild(trEls[i]);
                }
            }

            prevEl.type='text';
            unitStartEl.value = unitEndEl.value;
            unitStartEl.setAttribute("readonly", true);
            unitEndEl.addEventListener("keyup", updateStartRange);
        } else {
            textEl.innerText="";
            prevEl.type='hidden';
            prevEl.value = 0;
            unitStartEl.removeAttribute("readonly");
            unitEndEl.removeEventListener("keyup", updateStartRange);
            
        }

        function updateStartRange() {
            if (unitStartEl.hasAttribute("readonly")) {
                const v = this.value;
                unitStartEl.value = v;
            }
        }
    },
    /**
     * 항목 추가 
     * 
     * @param {String} tplType
     * @param {Object} data 완성할 데이터 
     */
    add : function(tplType, data) {
        if (!tplType)
            return;

        var target = document.querySelector("#deliveryChargeConf tbody");
        if (!target)
            return;

        var tr = document.createElement("tr");
        var tds = [], inputs = [];
        tds[0] = document.createElement("td");
        tds[1] = document.createElement("td");
        tds[2] = document.createElement("td");

        inputs[0] = document.createElement("input");
        inputs[1] = document.createElement("input");
        inputs[2] = document.createElement("input");

        inputs[0].type = 'text';
        inputs[0].name = "unitStart";
        inputs[0].className = "w100 right";

        if (data && typeof data.unitStart != 'undefined') {
            inputs[0].value = data.unitStart;
        } 

        inputs[1].type = 'text';
        inputs[1].name = "unitEnd";
        inputs[1].className = "w100 right";

        if (data && typeof data.unitEnd != 'undefined') {
            inputs[1].value = data.unitEnd;
        } 

        inputs[2].type = 'text';
        inputs[2].name = "price";
        inputs[2].className = "w100 right";

        if (data && typeof data.price != 'undefined') {
            inputs[2].value = data.price;
        } 

        var texts = [];
        switch(tplType) {
            case "count" :  // 수량별 배송비
                texts[0] = "개 이상 ~ ";
                texts[1] = "개 미만일 때";
                break;
            case "weight" : // 무게별 배송비
                texts[0] = "g 이상 ~ ";
                texts[1] = "g 미만일 때";
                break;
            default : // 금액별 배송비
                texts[0] = "원 이상 ~ ";
                texts[1] = "원 미만일 때";

        }

        tds[0].appendChild(inputs[0]);
        tds[0].appendChild(document.createTextNode(texts[0]));
        tds[0].appendChild(inputs[1]);
        tds[0].appendChild(document.createTextNode(texts[1]));
        tds[1].appendChild(inputs[2]);
        tds[1].appendChild(document.createTextNode("원"));

        var span = document.createElement("span");
        span.className="del_rows sbtn";
        span.addEventListener("click", codefty.deliveryPolicy.delete);

        var i = document.createElement("i");
        i.className = "xi-minus-square";
        span.appendChild(i);
        span.appendChild(document.createTextNode("삭제"));
        tds[2].appendChild(span);
        
        tr.appendChild(tds[0]);
        tr.appendChild(tds[1]);
        tr.appendChild(tds[2]);
    
        target.appendChild(tr);

    },
    /**
     * 항목 삭제 
     * 
     * @param {Object} e 
     */
    delete : function(e) {
        if (!e || !e.currentTarget) {
            return;
        }

        var tr = e.currentTarget.parentElement.parentElement;
        if (tr) {
            tr.parentElement.removeChild(tr);
        }
    }
};


window.addEventListener("DOMContentLoaded", function() {
    /** 초기 로딩 처리 */
    codefty.deliveryPolicy.init();

    /** 배송비 유형 선택 이벤트 처리 S */
    var deliveryChargeType = document.getElementById("deliveryChargeType");
    if (deliveryChargeType) {
        deliveryChargeType.addEventListener("change", function() {
            codefty.deliveryPolicy.updateDeliveryChargeConfig(this.value);
        });
    }
    /** 배송비 유형 선택 이벤트 처리 E */


});
