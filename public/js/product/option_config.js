/**
 * 옵션 설정
 * 
 */

window.addEventListener("DOMContentLoaded", function() {
    /** 옵션 선택 S */
    var optionConfigs = document.querySelectorAll(".option_config");
    for (var i = 0; i < optionConfigs.length; i++) {
        optionConfigs[i].addEventListener("click", function(e) {
            var url = "/product/option_config";
            if (this.dataset.id) {
                url += "?id=" + this.dataset.id;
            }

            codefty.popup
                .setCallback(function() {
                    var changeOption = document.getElementById("change_option");
                    if (!changeOption) {
                        return;
                    }
                    
                    changeOption.addEventListener("click", function(e) {
                        e.preventDefault();
             
                        var options = [], optionCateNms = [], subOptions = [], subOptionCateNms = [], textOptions = [], textOptionCateNms = [];
                        var optionEls = document.getElementsByName("idOptions");
                        var subOptionEls = document.getElementsByName("idSubOptions");
                        var textOptionEls = document.getElementsByName("idTextOptions");    
                    
                        for (var i = 0; i < optionEls.length; i++) {
                            if (optionEls[i].checked) {
                                options.push(optionEls[i].value);
                                optionCateNms.push(optionEls[i].dataset.cateNm);
                            }
                        }

                        for (var i = 0; i < subOptionEls.length; i++) {
                            if (subOptionEls[i].checked) {
                                subOptions.push(subOptionEls[i].value);
                                subOptionCateNms.push(subOptionEls[i].dataset.cateNm);
                            }
                        }
                        
                        for (var i = 0; i < textOptionEls.length; i++) {
                            if (textOptionEls[i].checked) {
                                textOptions.push(textOptionEls[i].value);
                                textOptionCateNms.push(textOptionEls[i].dataset.cateNm);
                            }
                        }

                        if (typeof callbackOptionConfig == 'function') {
                            const data = { options, subOptions, optionCateNms, subOptionCateNms, textOptions, textOptionCateNms };
                            
                            /**
                            var idEl = document.querySelector("input[name='id']");
                            if(idEl) {
                                data.id = idEl.value;
                            }
                            */
                            data.id = this.dataset.id;
                            
                            callbackOptionConfig(data);
                        }
                    });

                })
                .open(url, "옵션설정", 1100, 750);
        });
    }
    /** 옵션 선택 E */
});