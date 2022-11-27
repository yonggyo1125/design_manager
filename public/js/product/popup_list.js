window.addEventListener("DOMContentLoaded", function() {
    /** 전체 선택 S */
    var jsCheckAll = document.querySelector(".popup_product_items .js-checkall");
    if (jsCheckAll) {
        jsCheckAll.addEventListener("click", function(e) {
            var target = e.currentTarget;
            var targetName = target.dataset.targetName;
            if (!targetName)
                return;
            
            var list = document.querySelectorAll(".popup_product_items input[name='" + targetName + "']");
            
            for (var i = 0; i < list.length; i++) {
                list[i].checked = target.checked;
            }
        });
    } // endif 
    /** 전체 선택 E */

    /** 품목 선택 S */
    var selectProductItems = document.getElementById("select_product_items");
    if (selectProductItems) {
        selectProductItems.addEventListener("click", function() {
            var list = document.querySelectorAll(".popup_product_items input[name='id']:checked");
            if (list.length == 0) {
                alert("품목을 선택하세요.");
                return;
            }

            var data = [];
            for(var i = 0; i < list.length; i++) {
                var dataset = list[i].dataset;
                if (dataset) {
                    var params = {id : list[i].value};
                    for(key in dataset) {
                        params[key] = dataset[key];
                    }

                    data.push(params);
                }
            }
            if (typeof parent.codefty.order.callbackSelectedItems == 'function') {
                parent.codefty.order.callbackSelectedItems(data); 
            }
        });
    }
    /** 품목 선택 E */
});