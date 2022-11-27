window.addEventListener("DOMContentLoaded", function() {
    const idDeliveryPolicyEls = document.getElementsByClassName("idDeliveryPolicy");
    for (const el of idDeliveryPolicyEls) {
        el.addEventListener("change", function() {
            const id = this.value;
            const key = this.dataset.key;
            const targetEl = document.getElementById(`deliveryTypeHtml_${key}`);
            
            if (!targetEl) {
                return;
            }

            if (!id) {
                targetEl.innerHTML = "";
                return;
            }

            const url = `/order/delivery_policy/${id}`;
            const domParser = new DOMParser();
            const xhr = new XMLHttpRequest();
            xhr.open("GET", url);
            xhr.onreadystatechange = function() {
                if (xhr.status == 200 && xhr.readyState == XMLHttpRequest.DONE) {
                    const types = JSON.parse(xhr.responseText);
                    const tpl = document.getElementById("template_deliveryType").innerHTML;
                    targetEl.innerHTML = "";

                    if (types && types.length > 0) {
                        for (let i = 0; i < types.length; i++) {
                            let tplHtml = tpl;
                            const t = types[i];
        
                            tplHtml = tplHtml.replace(/<%=type%>/g, t.type)
                                            .replace(/<%=name%>/g, t.name)
                                            .replace(/<%=id%>/g, key)
                                            .replace(/<%=no%>/g, i);
        
                                
                            const dom = domParser.parseFromString(tplHtml, "text/html");
                            const spanEl = dom.querySelector("span");
                            targetEl.appendChild(spanEl);
                            const el = spanEl.querySelector("input");
                            if (i == 0) {
                                el.checked = true;
                            }
                        }
                    }
                }
            };
            xhr.send(null);

        });
    }
});