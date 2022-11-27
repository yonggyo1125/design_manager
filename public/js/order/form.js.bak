/**
 * 주문서 양식 
 * 
 */
var codefty = codefty || {};
codefty.order = {
    id : "",
    /**
     * 사이트 로딩시 초기화 
     * 
     */
    init : function() {
        try {
            /** 주문품목 완성 처리 S */
            var itemsJsonEl = document.getElementById("itemsJson");
            if (itemsJsonEl) {
                var items = JSON.parse(itemsJsonEl.value);
                if (items) this.callbackSelectedItems(items);
            } // endif 
            /** 주문품목 완성 처리 E */

            /** 결제정보 업데이트 */
            this.updateSummary();
        } catch (err) {
            console.error(err);
        }
    },
    /**
     * 품목 선택 팝업 노출
     * 
     */
    showProductItems : function() {
        var url = "/popup/product_items";
        codefty.popup.open(url, "품목 선택", 1000, 800,  true);
    },
    /**
     * 품목  선택 콜백
     * 
     * @param {Array} items 
     */
    callbackSelectedItems : function(items) {
        if (items && items.length > 0) {
            var tpl = document.getElementById("template_item");
            var productItemsEl = document.getElementById("product_items");
            if (!tpl || !productItemsEl) 
                return;

            var domParser = new DOMParser();
            var tplHtml = tpl.innerHTML;
            for (var i = 0; i < items.length; i++) {
                var item = items[i];
                var  itemUid = item.itemUid || item.id + "_" + Date.now();
                item.itemUid = itemUid;
                this.convertTplItem(item);
                var itemType = "";
                switch(item.itemType) {
                    case "company":
                        itemType = "거래처";
                        break;
                    case "branch":
                        itemType = "지사";
                        break;
                    default : 
                        itemType = "본사";
                }

                var itemPrice = Number(item.itemPrice);
                if (isNaN(itemPrice)) itemPrice = 0;
                var itemCnt = item.itemCnt || 1;
                var deliveryCharge = Number(item.deliveryCharge);
                if (isNaN(item.deliveryCharge)) deliveryCharge = 0;

                var itemTotalPrice = itemPrice * itemCnt + deliveryCharge;

                var html = tplHtml;
                var id = itemUid;
                html = html.replace(/<%=id%>/g, id)
                            .replace(/<%=itemType%>/g, itemType)
                            .replace(/<%=cateNm%>/g, item.cateNm)
                            .replace(/<%=itemCode%>/g, item.itemCode)
                            .replace(/<%=itemNm%>/g, item.itemNm)
                            .replace(/<%=itemNmSub%>/g, item.itemNmSub)
                            .replace(/<%=itemPrice%>/g, item.itemPrice)
                            .replace(/<%=itemCnt%>/g, itemCnt)
                            .replace(/<%=itemSizeWidth%>/g, item.itemSizeWidth)
                            .replace(/<%=itemSizeHeight%>/g, item.itemSizeHeight)
                            .replace(/<%=itemText%>/g, item.itemText)
                            .replace(/<%=itemFont%>/g, item.itemFont)
                            .replace(/<%=itemDiscount%>/g, item.itemDiscount)
                            .replace(/<%=itemAdjust%>/g, item.itemAdjust)
                            .replace(/<%=itemTotalPrice%>/g, itemTotalPrice)
                            .replace(/<%=deliveryCharge%>/g, deliveryCharge)
                            .replace(/<%=deliveryChargeStr%>/g, deliveryCharge.toLocaleString() + "원")
                            .replace(/<%=deliveryInvoice%>/g, item.deliveryInvoice)
                            .replace(/<%=deliveryReleasedDate%>/, item.deliveryReleasedDate)
                            .replace(/<%=preferredDeliveryReleasedDate%>/, item.preferredDeliveryReleasedDate)
                            .replace(/<%=deliveryBundleCode%>/g, item.deliveryBundleCode)
                            .replace(/<%=idOrderItem%>/g, item.idOrderItem)
                            .replace(/<%=receiverNm%>/g, item.receiverNm)
                            .replace(/<%=receiverCellPhone%>/g, item.receiverCellPhone)
                            .replace(/<%=receiverZonecode%>/g, item.receiverZonecode)
                            .replace(/<%=receiverAddress%>/g, item.receiverAddress)
                            .replace(/<%=receiverAddressSub%>/g, item.receiverAddressSub)
                            .replace(/<%=deliveryMemo%>/g, item.deliveryMemo)
                            .replace(/<%=addOptions%>/g, item.addOptions)
                            .replace(/<%=addSubOptions%>/g, item.addSubOptions);

                var div = document.createElement("div");
                div.className = "product_item";
                div.id = 'product_item_' + id;
               
                var htmlDoc = domParser.parseFromString(html, "text/html");
                /** 주문서 수정인 경우 */
                if (item.idOrderItem) { 
                    var tableEl = htmlDoc.querySelector(".order_item");
                    var tableTbodyEl = htmlDoc.querySelector(".order_item tbody");
                    var tr = document.createElement("tr");
                    var th = document.createElement("th");
                    th.appendChild(document.createTextNode("품주번호"));
                    var td = document.createElement("td");
                    td.appendChild(document.createTextNode(item.idOrderItem));
                    td.setAttribute("colspan", 2);
                    var td2 = document.createElement("td");
                    td2.setAttribute("align", "right");
                    var removeBtn = document.createElement("span");
                    removeBtn.className = "sbtn";
                    var removeIcon = document.createElement("i");
                    removeIcon.className = "xi-trash-o";
                    removeBtn.appendChild(removeIcon);
                    removeBtn.appendChild(document.createTextNode("삭제하기"));
                    removeBtn.dataset.id = item.idOrderItem;
                    td2.appendChild(removeBtn);
                    tr.appendChild(th);
                    tr.appendChild(td);
                    tr.appendChild(td2);
                    tableTbodyEl.insertBefore(tr, tableTbodyEl.children[0]);

                    removeBtn.addEventListener("click", function(e) {
                        if (confirm('삭제하시면 주문품목을 복구할수 없습니다. 정말 삭제하시겠습니까?')) {
                            const id = this.dataset.id;
                            codefty.order.deleteOrderItem(id, div);
                        }
                    });
                }

                /** 첨부 파일 처리 S */
                if (item.uploadedFiles && item.uploadedFiles.length > 0) {
                    var uploadFilesEl = htmlDoc.querySelector(".uploaded_files");
                    if (uploadFilesEl) {
                        for (var j = 0; j < item.uploadedFiles.length; j++) {
                            uploadFilesEl.appendChild(item.uploadedFiles[j]);
                        }
                    }
                }
                /** 첨부 파일 처리 E */
                /** 샘플 이미지 처리 S */
                if (item.sampleDOM && item.sampleDOM.length > 0) {
                    var sampleImagesEl = htmlDoc.querySelector(".sample_images");
                    if (sampleImagesEl) {
                        for (var j = 0; j < item.sampleDOM.length; j++) {
                            sampleImagesEl.appendChild(item.sampleDOM[j]);
                        }
                    }
                }
                /** 샘플 이미지 처리 E */

                /** 배송료 선택 처리 S */
                if (item.deliveryChargeType) {
                    var deliveryChargeTypeEls = htmlDoc.querySelectorAll("input[name^='deliveryChargeType']");
                    for (var j = 0; j < deliveryChargeTypeEls.length; j++) {
                        var el = deliveryChargeTypeEls[j];
                        if (el.value == item.deliveryChargeType) {
                            el.checked = true;
                        } else {
                            el.checked = false;
                        }
                    }
                }
                /** 배송료 선택 처리 E */
                /** 배송조건 선택 처리 S */
                if (item.idDeliveryPolicy) {
                    var idDeliveryPolicies = htmlDoc.querySelectorAll("select[name^='idDeliveryPolicy'] option");
                    for (var j = 0; j < idDeliveryPolicies.length; j++) {
                        var el = idDeliveryPolicies[j];
                        if (el.value == item.idDeliveryPolicy) {
                            el.setAttribute("selected", true);
                        } else {
                            el.removeAttribute("selected");
                        }
                    }
                }
                /** 배송조건 선택 처리 E */

                /** 택배회사 선택 처리 S */
                if (item.deliveryCompany) {
                    var deliveryCompanies = htmlDoc.querySelectorAll("select[name^='deliveryCompany'] option");
                    for (var j = 0; j < deliveryCompanies.length; j++) {
                        var el = deliveryCompanies[j];
                        if (el.value == item.deliveryCompany) {
                            el.setAttribute("selected", true);
                        } else {
                            el.removeAttribute("selected");
                        }
                    }
                }
                /** 택배회사 선택 처리 E */

                /** 디자인상태 선택 처리 S */
                if (item.designStatus) {
                    var designStatuses = htmlDoc.querySelectorAll("select[name^='designStatus'] option");
                    for (var j = 0; j < designStatuses.length; j++) {
                        var el = designStatuses[j];
                        if (el.value == item.designStatus) {
                            el.setAttribute("selected", true);
                        } else {
                            el.removeAttribute("selected");
                        }
                    }
                }
                /** 디자인상태 선택 처리 E */

                var productItem = htmlDoc.querySelector(".inner");
                div.appendChild(productItem);
                if (!item.orderNo) {
                    var remove = document.createElement("i");
                    remove.className = "xi-close remove_items";
                    div.appendChild(remove);
                    remove.addEventListener("click", function(e) {
                        if (confirm('정말 제거하시겠습니까?')) {
                            var parentEl = e.currentTarget.parentElement;
                            parentEl.parentElement.removeChild(parentEl);
                        }
                    });
                } // endif 
                productItemsEl.appendChild(div);
            }
            
            var dom = domParser.parseFromString(productItemsEl.innerHTML, "text/html");
            var inputs = document.querySelectorAll("input[name^='itemPrice'], input[name^='itemCnt'], input[name^='itemDiscount'], input[name^='itemAdjust']");
            var selects = document.querySelectorAll("select");

            for (var i = 0; i < inputs.length; i++) {
                inputs[i].addEventListener("focus", this.updateSummary);
                inputs[i].addEventListener("blur", this.updateSummary);
                inputs[i].addEventListener("change", this.updateSummary);
            }

            for (var i = 0; i < selects.length; i++) {
                selects[i].addEventListener("change", this.updateSummary);
            }
            
            /** 사이즈 계산기 사용 품목인 경우 계산 설정 및 금액 계산 S */
            for (item of items) {
                var itemUid = item.itemUid;
                this.getSizeCalcualtorPrice(item.id, item.itemSizeWidth, item.itemSizeHeight)
                .then(function(data) { 
                    var itemPriceEls = document.getElementsByName("itemPrice_" + itemUid);
                    if (itemPriceEls.length > 0) {
                        if (data.price > 0)
                            itemPriceEls[0].value = data.price;
                        
                        itemPriceEls[0].setAttribute("readonly", true); // 사이즈 계산기 사용 설정이 있는 경우는 가격은 읽기 전용으로 변경
                    }
                    
                    var itemSizeWidthEls = document.getElementsByName("itemSizeWidth_" + itemUid);
                    var itemSizeHeightEls = document.getElementsByName("itemSizeHeight_" + itemUid);

                    if (!item.itemSizeHeight && !item.itemSizeWidth && data.config.basicSize) {
                       
                        if (itemSizeWidthEls.length > 0 && itemSizeHeightEls.length > 0) {
                            itemSizeWidthEls[0].value = isNaN(data.config.basicSize[0])?0:Number(data.config.basicSize[0]);
                            itemSizeHeightEls[0].value = isNaN(data.config.basicSize[1])?0:Number(data.config.basicSize[1]);
                        }
                    }
                    
                    function checkMaxSize(wEl, hEl) {
                        var width = isNaN(wEl.value)?0:Number(wEl.value);
                        var height = isNaN(hEl.value)?0:Number(hEl.value);
                        if (width > 0 && height > 0 && data.config) {
                            if (data.config.maxSqm && width * height > data.config.maxSqm * 10000) {
                                alert("최대 주문가능 사이즈는 " + data.config.maxSqm * 100 + "c㎡ 입니다.");
                                wEl.value = "";
                                hEl.value = "";
                                return;
                            }
                            if (data.config.maxSize && data.config.maxSize.length > 0) {
                                var maxSize = data.config.maxSize;
                                var maxSizeWidth = isNaN(maxSize[0])?0:Number(maxSize[0]);
                                var maxSizeHeight = isNaN(maxSize[1])?0:Number(maxSize[1]);
                                if (maxSizeWidth > 0 && width > maxSizeWidth) {
                                    alert("최대 주문 가능 너비는 " + maxSizeWidth + "cm 입니다.");
                                    wEl.value  = maxSizeWidth;
                                }

                                if (maxSizeHeight > 0 && height > maxSizeHeight) {
                                    alert("최대 주문 가능 높이는 " + maxSizeHeight + "cm 입니다.");
                                    hEl.value  = maxSizeHeight;
                                }
                            }
                        }
                    }
                          
                    itemSizeWidthEls[0].addEventListener("blur", function() {
                        checkMaxSize(itemSizeWidthEls[0], itemSizeHeightEls[0]);
                        var width = itemSizeWidthEls[0].value;
                        var height = itemSizeHeightEls[0].value;
                               
                        codefty.order.updateSizeCalculatorPrice(item.id, width, height, itemPriceEls[0]);
                    });

                    itemSizeWidthEls[0].addEventListener("change", function() {
                        checkMaxSize(itemSizeWidthEls[0], itemSizeHeightEls[0]);
                        var width = itemSizeWidthEls[0].value;
                        var height = itemSizeHeightEls[0].value;
                        codefty.order.updateSizeCalculatorPrice(item.id, width, height, itemPriceEls[0]);
                    });
 
                    itemSizeHeightEls[0].addEventListener("blur", function() {
                        checkMaxSize(itemSizeWidthEls[0], itemSizeHeightEls[0]);
                        var width = itemSizeWidthEls[0].value;
                        var height = itemSizeHeightEls[0].value;
                        codefty.order.updateSizeCalculatorPrice(item.id, width, height, itemPriceEls[0]);
                    });

                    itemSizeHeightEls[0].addEventListener("change", function() {
                        checkMaxSize(itemSizeWidthEls[0], itemSizeHeightEls[0]);
                        var width = itemSizeWidthEls[0].value;
                        var height = itemSizeHeightEls[0].value;
                        codefty.order.updateSizeCalculatorPrice(item.id, width, height, itemPriceEls[0]);
                    });
                    
                    /** 보드형 사이즈인 경우 사이즈 선택 추가 S */
                    var boardSizeWrapEl = document.getElementById("board_size_" + itemUid);
                    if (data.config && data.config.boardSizes && boardSizeWrapEl) {
                        itemSizeWidthEls[0].value = itemSizeHeightEls[0].value = "";

                        var boardSizes = data.config.boardSizes;
                        var boardSizeTypes = Object.keys(data.config.boardSizes);
                        if (boardSizeTypes.length > 0) {
                            /** 사이즈 타입  */
                            var boardSizeTypeEl = document.createElement("select");
                            boardSizeTypeEl.className='board_size_type';
                            for (var j = 0; j < boardSizeTypes.length; j++) {
                                var type = boardSizeTypes[j];
                                var optionEl = document.createElement("option");
                                optionEl.value = type;
                                var optionTextEl = document.createTextNode((type == "portrait")?"세로형":"가로형");
                                optionEl.appendChild(optionTextEl);
                                boardSizeTypeEl.appendChild(optionEl);
                            }
                            boardSizeWrapEl.appendChild(boardSizeTypeEl);
                            boardSizeTypeEl.addEventListener("change", function() {
                                var v = this.value;
                                var sizes = boardSizes[v];
                                updateBoardSize(sizes);
                            });
                            
                            /** 사이즈 목록 */
                            var sizes = boardSizes[boardSizeTypes[0]];
                            updateBoardSize(sizes);


                            function updateBoardSize(sizes) {
                                if (sizes.length > 0) {
                                    var els = boardSizeWrapEl.getElementsByClassName("board_size");
                                    if (els.length > 0) {
                                        for (var j = 0; j < els.length; j++) {
                                            els[j].parentElement.removeChild(els[j]);
                                        }
                                    }
                                    var boardSizeEl = document.createElement("select");
                                    boardSizeEl.className="board_size";
                                    var optionEl = document.createElement("option");
                                    optionEl.value="direct";
                                    var optionTextEl = document.createTextNode("직접입력");
                                    optionEl.appendChild(optionTextEl);
                                    boardSizeEl.appendChild(optionEl);
    
                                    for (var j = 0; j < sizes.length; j++) {
                                        var optionEl = document.createElement("option");
                                        optionEl.value = sizes[j].width + "_" + sizes[j].height;
                                        var optionTextEl = document.createTextNode(sizes[j].sizeType);
                                        if (j == 0) {
                                            optionEl.setAttribute("selected", true);
                                            itemSizeWidthEls[0].value = sizes[j].width;
                                            itemSizeHeightEls[0].value = sizes[j].height;
                                        }
                                        optionEl.appendChild(optionTextEl);
                                        boardSizeEl.appendChild(optionEl);
                                    }
                                    boardSizeWrapEl.appendChild(boardSizeEl);
                                    
                                    codefty.order.updateSizeCalculatorPrice(item.id, itemSizeWidthEls[0].value, itemSizeHeightEls[0].value, itemPriceEls[0]);

                                    boardSizeEl.addEventListener("change", function() {
                                        var v = this.value;
                                        if (v == 'direct') {
                                            itemSizeWidthEls[0].value = itemSizeHeightEls[0].value = "";
                                            itemSizeWidthEls[0].removeAttribute("readonly");
                                            itemSizeHeightEls[0].removeAttribute("readonly");
                                        } else {
                                            v = v.split("_");
                                            itemSizeWidthEls[0].value = v[0];
                                            itemSizeHeightEls[0].value = v[1];
                                            itemSizeWidthEls[0].setAttribute("readonly", true);
                                            itemSizeHeightEls[0].setAttribute("readonly", true);
                                        }

                                        codefty.order.updateSizeCalculatorPrice(item.id, itemSizeWidthEls[0].value, itemSizeHeightEls[0].value, itemPriceEls[0]);
                                    });
                                } // endif 
                            }
                            /** 사이즈 목록 E */
                        } // endif 
                        
                    } // endif 
                    /** 보드형 사이즈인 경우 사이즈 선택 추가 E */

                    /** 사이즈 계산기 사용 품목인 경우 계산 설정 및 금액 계산 E */
                    
                    codefty.order.updateSummary();
                });
            }

             /** 배송비 이벤트 처리 S */
             for (item of items) {
                var itemUid = item.itemUid;
                var deliveryChargeTypeEls = document.getElementsByName('deliveryChargeType_' + itemUid);
                if (deliveryChargeTypeEls.length > 0) {
                    for (var i = 0; i < deliveryChargeTypeEls.length; i++) {
                        var el = deliveryChargeTypeEls[i];
                        el.addEventListener("click", this.updateDeliveryCharge);
                    }
                }

                var  idDeliveryPolicyEl = document.querySelector("select[name='idDeliveryPolicy_" + itemUid + "']");
                if (idDeliveryPolicyEl) {
                    idDeliveryPolicyEl.addEventListener("change",this.updateDeliveryCharge);
                }
            }
           
             /** 배송비 이벤트 처리 E */

        } // endif

        codefty.popup.close();
        this.updateSummary();
    },
    /**
     * 주문품목 삭제 
     * 
     * @param {int} idOrderItem 품주번호
     * @param {Object} el 제거 요소
     */
    deleteOrderItem : function (idOrderItem, el) {
        if (!idOrderItem) {
            return;
        }

        var url = "/order/delete/items";
        var params = "id="+idOrderItem + "&isAjax=1";
        var xhr = new XMLHttpRequest();
        xhr.open("POST", url);
        xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
        xhr.onreadystatechange = function() {
            if (xhr.readyState == XMLHttpRequest.DONE && xhr.status == 200) {
                var json = JSON.parse(xhr.responseText);
                if (json.message) {
                    alert(json.message);
                }
                if (el && json.isSuccess) { // 삭제 성공시 
                    el.parentElement.removeChild(el);
                }
            }
        };
        xhr.send(params);
    },
    /**
     * 템플릿 변경 항목으로 데이터 변경 
     * 
     * @param {Object} item 
     */
    convertTplItem : function(item) {
        if (!item) 
            return;

        const required = [
            'id',
            'idOrderItem',
            'itemType',
            'cateNm',
            'itemCode',
            'itemNm',
            'itemNmSub',
            'itemPrice',
            'itemCnt',
            'itemSizeWidth',
            'itemSizeHeight',
            'itemText',
            'itemFont',
            'itemDiscount',
            'itemAdjust',
            'deliveryInvoice',
            'deliveryReleasedDate',
            'preferredDeliveryReleasedDate',
            'deliveryBundleCode',
            'idOrderItem',
            'receiverNm',
            'receiverCellPhone',
            'receiverZonecode',
            'receiverAddress',
            'receiverAddressSub',
            'deliveryMemo',
            'addOptions',
            'addSubOptions',
        ];
        
       
        var options = JSON.parse(item.optionsJson);
        var subOptions = JSON.parse(item.subOptionsJson);
        item.addOptions = item.addSubOptions = "";
         /** 기본 옵션 처리 S */
        if (options && options.length > 0) {
            for (var i = 0; i < options.length; i++) {
                if (!options[i].options || options[i].options.length == 0)  {
                    continue;
                }
                item.addOptions += "<div class='stitle'>" + (i + 1) + ". [" + options[i].cateNm + "] 선택</div>";
                item.addOptions += "<div class='select_opts'><select name='optionCds_" + item.itemUid + "'>";
                item.addOptions += "<option value=''>- [" + options[i].cateNm + "] 선택 -</option>";
                for (var j = 0; j < options[i].options.length; j++) {
                    var opt = options[i].options[j];
                    item.addOptions += "<option value='" + opt.optionCd + "' data-add-price='" + opt.addPrice + "'";
                    if (item.orderNo && item.optionCds && item.optionCds.length > 0) {
                        if (item.optionCds.indexOf(opt.optionCd) != -1) {
                            item.addOptions += " selected";
                        }
                    }
                    item.addOptions += ">" + opt.optionNm;
                    if (opt.addPrice != 0) item.addOptions += "(" + opt.addPrice.toLocaleString() + "원)";
                    item.addOptions += "</option>";
                }
                item.addOptions += "</select></div>";
            }
        }
        /** 기본 옵션 처리 E */

        /** 추가 옵션 처리 S */
        if (subOptions && subOptions.length > 0) {
            for (var i = 0; i < subOptions.length; i++) {
                if (!subOptions[i].options || subOptions[i].options.length == 0)  {
                    continue;
                }
                item.addSubOptions += "<div class='stitle'>" + (i + 1) + ". [" + subOptions[i].cateNm + "] 선택</div>";
                item.addSubOptions += "<div class='select_opts'><select name='subOptionCds_" + item.itemUid + "'>";
                item.addSubOptions += "<option value=''>- [" + subOptions[i].cateNm + "] 선택 -</option>";
          
                for (var j = 0; j < subOptions[i].options.length; j++) {
                    var opt = subOptions[i].options[j];
                    item.addSubOptions += "<option value='" + opt.optionCd + "' data-add-price='" + opt.addPrice + "'"
                    if (item.orderNo && item.subOptionCds && item.subOptionCds.length > 0) {
                        if (item.subOptionCds.indexOf(opt.optionCd) != -1) {
                            item.addSubOptions += " selected";
                        }
                    }
                    
                    item.addSubOptions += ">" + opt.optionNm;
                    if (opt.addPrice != 0) item.addSubOptions += "(" + opt.addPrice.toLocaleString() + "원)";
                    item.addSubOptions += "</option>";
                }
                item.addSubOptions += "</select></div>";
            }
        }
        /** 추가 옵션 처리 E */

        // 주문서 수정인 경우 
        if (item.orderNo) {
            item.idOrderItem = item.id;
            item.id = item.idProductItem;
            item.cateNm = item.productItemInfo['ProductCategory.cateNm'];
            item.itemType = item.productItemInfo['ProductItemInfo.itemType'];
            if (item.preferredDeliveryReleasedDate) item.preferredDeliveryReleasedDate =  item.preferredDeliveryReleasedDateStr;
            if (item.deliveryReleasedDate) item.deliveryReleasedDate =  item.deliveryReleasedDateStr;

            /** 첨부파일 처리 S */
            if (item.attachFiles && item.attachFiles.length > 0) {
                var htmlDOM = [];
                var domParser = new DOMParser();
                for (var i = 0; i < item.attachFiles.length; i++) {
                    var file = item.attachFiles[i];
                    var html = "<li class='fileItem' id='fileItem_" + file.id + "'><a href='/file/download/" + file.id + "'>" + file.fileName + "</a><i class='xi-minus-square remove' data-id='" + file.id + "'></i></li>";
                    var doc = domParser.parseFromString(html, "text/html");
                    var remove = doc.querySelector(".remove");
                    var li = doc.querySelector(".fileItem");
                    remove.addEventListener("click", function(e) {
                        codefty.fileUpload.delete(e, li);
                    });

                    htmlDOM.push(li);
                }

                item.uploadedFiles = htmlDOM;
            } 
            /** 첨부파일 처리 E */

            /** 샘플 이미지 처리 S */
            if (item.samples && item.samples.length > 0) {
                var sampleDOM = [];
                for (var i = 0; i < item.samples.length; i++) {
                    var sample = item.samples[i];
                    var dom = codefty.order.createSelectedSampleDOM(item.itemUid, sample);
                    sampleDOM.push(dom);
                }
                item.sampleDOM = sampleDOM;
            } 
            /** 샘플 이미지 처리 E */
        }

        for(var i = 0; i < required.length; i++) {
            var field = required[i];
            if (!item[field]) item[field] = "";
        }
    },
    /**
     * 샘플 선택 팝업  
     * @param {String} cateNm 품목 분류 
     * @param {String} id 품목번호_순번
     */
    showSamplePopup : function(cateNm, id) {
        this.id = id;
        var url = "/popup/sample/" + cateNm + "?isPopup=1&userSelect=1&copy=1";
        codefty.popup.open(url, null, 850, 700, true);
    },
    /**
     * 시안등록/수정 팝업 
     * 
     * @param {String} id 품목번호_순번
     */
    showDraftPopup : function(id) {
        this.id = id;
        var url = "/popup/draft/" + id;
        codefty.popup.open(url, "시안 등록/수정", 850, 650, true);
    },
    /**
     * 선택된 샘플 DOM 
     * 
     * @param {String} id  itemUid
     * @param {Object} data 샘플 데이터 
     */
    createSelectedSampleDOM : function(id, data) {
        var div = document.createElement("div");
        div.className = "sample";
        var remove = document.createElement("i");
        remove.className = "xi-minus-square remove"
        div.appendChild(remove);

        remove.addEventListener("click", function(e) {
            var parent = e.currentTarget.parentElement;
            parent.parentElement.removeChild(parent);
        });

        var dl = [], dt = [], dd = [];
        dl[0] = document.createElement("dl");
        dt[0] = document.createElement("dt");
        dd[0] = document.createElement("dd");
        dt[0].appendChild(document.createTextNode("샘플번호"));
        dd[0].appendChild(document.createTextNode(data.itemCd));
        dl[0].appendChild(dt[0]);
        dl[0].appendChild(dd[0]);

        dl[1] = document.createElement("dl");
        dt[1] = document.createElement("dt");
        dd[1] = document.createElement("dd");
        dt[1].appendChild(document.createTextNode("샘플명"));
        dd[1].appendChild(document.createTextNode(data.itemNm));
        dl[1].appendChild(dt[1]);
        dl[1].appendChild(dd[1]);

        dl[2] = document.createElement("dl");
        dt[2] = document.createElement("dt");
        dd[2] = document.createElement("dd");
        dt[2].appendChild(document.createTextNode("다운로드"));
        var imageLink = document.createElement("a");
        imageLink.href=data.itemDownloadUrl;
        imageLink.className = "sbtn";
        var dnIcon = document.createElement("i");
        dnIcon.className = "xi-file-download-o";
        imageLink.appendChild(dnIcon);
        imageLink.appendChild(document.createTextNode("이미지"));
        dd[2].appendChild(imageLink);

        var aiLink = document.createElement("a");
        aiLink.href=data.itemDownloadAiUrl;
        aiLink.className = "sbtn black";
        var dnIcon2 = document.createElement("i");
        dnIcon2.className = "xi-file-download-o";
        aiLink.appendChild(dnIcon2);
        aiLink.appendChild(document.createTextNode("ai파일"));
        dd[2].appendChild(aiLink);

        dl[2].appendChild(dt[2]);
        dl[2].appendChild(dd[2]);

        div.appendChild(dl[0]);
        div.appendChild(dl[1]);
        div.appendChild(dl[2]);
        
        var input = [];
        input[0] = document.createElement("input");
        input[0].name="sampleItemCd_" + id;
        input[0].type="hidden";
        input[0].value = data.itemCd;

        input[1] = document.createElement("input");
        input[1].name="sampleItemNm_" + id;
        input[1].type="hidden";
        input[1].value = data.itemNm;
        
        input[2] = document.createElement("input");
        input[2].name="sampleItemDownloadLink_" + id;
        input[2].type="hidden";
        input[2].value = data.itemDownloadUrl;
        
        input[3] = document.createElement("input");
        input[3].name="sampleItemAiDownloadLink_" + id;
        input[3].type="hidden";
        input[3].value = data.itemDownloadAiUrl;

        div.appendChild(input[0]);
        div.appendChild(input[1]);
        div.appendChild(input[2]);
        div.appendChild(input[3]);

        return div;
    },
    /**
     * 선택 요약 업데이트 
     * 
     */
    updateSummary : function() {
        var el = document.getElementById("product_items");
        if (!el) {
            return;
        }
        var idProductItemEls = document.getElementsByName("idProductItem");
        var itemTotalPriceEl = document.querySelectorAll(".itemTotalPrice");
        var itemPriceEls = document.querySelectorAll("input[name^='itemPrice']");
        var itemCntEls = document.querySelectorAll("input[name^='itemCnt']");
        var itemDiscountEls = document.querySelectorAll("input[name^='itemDiscount']");
        var itemAdjustEls = document.querySelectorAll("input[name^='itemAdjust']");
       
        var itemsTotalPrice = deliveryCharge = totalDiscount = 0;
        for (var i = 0; i < idProductItemEls.length; i++) {
            var itemUid = idProductItemEls[i].value;
            /** 판매원가 처리 S */
            var itemPrice = 0;
            if (itemPriceEls[i]) {
                itemPrice = Number(itemPriceEls[i].value);
                if (itemPrice < 0) {
                    itemPrice = 0;
                    itemPriceEls[i].value = 0;
                }
            }
            /** 판매원가 처리 E */

            /** 판매수량 S */
            var itemCnt = 1;
            if (itemCntEls[i]) {
                itemCnt = Number(itemCntEls[i].value);
                if (itemCnt < 1) {
                    itemCnt = 1;
                    itemCntEls[i].value = 1;
                }
            }
            /** 판매수량 E */

            /** 할인금액 S */
            var itemDiscount = 0;
            if (itemDiscountEls[i]) {
                itemDiscount = Number(itemDiscountEls[i].value);
                if (itemDiscount < 1) {
                    itemDiscount = 0;
                    itemDiscountEls[i].value = 0;
                }
            }
            /** 할인금액 E */
            /** 금액조정 S */
            var itemAdjust = 0;
            if (itemAdjustEls[i]) {
                itemAdjust = Number(itemAdjustEls[i].value);
            }
            /** 금액조정 E */

            /** 기본, 추가 옵션 S */
            var basicOptionPrice = 0;
            var optionCdEls = document.querySelectorAll("select[name='optionCds_" + itemUid + "']");
            for (var j = 0; j < optionCdEls.length; j++) {
                var options = optionCdEls[j].children;
                for (var k = 0; k < options.length; k++) {
                    if (options[k].selected) {
                        var addPrice = Number(options[k].dataset.addPrice);
                        if (isNaN(addPrice)) addPrice = 0;
                        basicOptionPrice += addPrice;
                    }
                }
            }
            var subOptionPrice = 0;
            var optionCdEls = document.querySelectorAll("select[name='subOptionCds_" + itemUid + "']");
            for (var j = 0; j < optionCdEls.length; j++) {
                var options = optionCdEls[j].children;
                for (var k = 0; k < options.length; k++) {
                    if (options[k].selected) {
                        var addPrice = Number(options[k].dataset.addPrice);
                        if (isNaN(addPrice)) addPrice = 0;
                        subOptionPrice += addPrice;
                    }
                }
            }
            /** 기본, 추가 옵션 E */

            /** 배송비 S  */
            var itemDeliveryCharge = 0;
            var itemDeliveryChargeEl = document.getElementById('deliveryCharge_' + itemUid);
            if (itemDeliveryChargeEl) {
                itemDeliveryCharge = Number(itemDeliveryChargeEl.value);
                if (isNaN(itemDeliveryCharge)) itemDeliveryCharge = 0;
                deliveryCharge += itemDeliveryCharge;
            }
            /** 배송비 E  */

            var itemTotalPrice = (itemPrice + basicOptionPrice) * itemCnt + subOptionPrice + itemAdjust - itemDiscount + itemDeliveryCharge; 
            if (itemTotalPrice < 0) { // 전체 금액이 음수인경우 금액조정으로 0으로 맞춤
                itemAdjust += itemTotalPrice;
                itemAdjustEls[i].value = itemAdjust;
                itemTotalPrice = 0;
            }

            // 상품 합계 
            itemsTotalPrice += (itemPrice + basicOptionPrice) * itemCnt + subOptionPrice + itemAdjust;

            // 할인 합계 
            totalDiscount += itemDiscount;

            
            if (itemTotalPriceEl[i]) {
                itemTotalPriceEl[i].textContent = itemTotalPrice.toLocaleString();
            }
        }
        /** 부가세 계산 S */
        var vat = 0; 
        var itemsTotalPriceWithoutVat = (itemsTotalPrice > 0)?Math.round(itemsTotalPrice / 1.1):0;
        if (itemsTotalPrice > 0) vat += itemsTotalPrice - itemsTotalPriceWithoutVat;
        var totalDiscountWithoutVat = (totalDiscount > 0)?Math.round(totalDiscount / 1.1):0;
        if (totalDiscount > 0) vat -= totalDiscount - totalDiscountWithoutVat;
        
        var deliveryChargeWithoutVat = (deliveryCharge > 0)?Math.round(deliveryCharge / 1.1):0;
        if (deliveryCharge > 0) vat -= deliveryCharge - deliveryChargeWithoutVat;

        /** 부가세 계산 E */

        var totalPayPrice = itemsTotalPrice + deliveryCharge - totalDiscount;

        /** 결제정보 출력 S */
        var itemsTotalPriceEl = document.getElementById("itemsTotalPrice");
        if (itemsTotalPriceEl) itemsTotalPriceEl.textContent = itemsTotalPrice.toLocaleString();
        var deliveryChargeEl = document.getElementById("deliveryCharge");
        if (deliveryChargeEl) deliveryChargeEl.textContent = deliveryCharge.toLocaleString();
        var totalDiscountEl = document.getElementById("totalDiscount");
        if (totalDiscountEl) totalDiscountEl.textContent = totalDiscount.toLocaleString();
        //var totalVatEl = document.getElementById("totalVat");
        //if (totalVatEl) totalVatEl.textContent = vat.toLocaleString();

        var totalPayPriceEl = document.getElementById("totalPayPrice");
        if (totalPayPriceEl) totalPayPriceEl.textContent = totalPayPrice.toLocaleString();
        /** 결제정보 출력 E */
    },
    /**
     * 사이즈 계산기 설정 조회
     * 
     */
    getSizeCalcualtorConfig : async function(id) {
        return new Promise(function(resolve, reject) {
            if (!id) {
                reject(new Error('품목 ID 누락'));
                return;
            }

            var xhr = new XMLHttpRequest();
            xhr.open("GET","/ajax/size_calculator/config/" + id);
            xhr.addEventListener("readystatechange", function() {
                if (xhr.status == 200 && xhr.readyState == XMLHttpRequest.DONE) {
                    var data = JSON.parse(xhr.responseText);
                    resolve(data);
                }
            }); 
            xhr.send(null);
        });
    },
    /**
     * 사이즈 계산기 
     * 
     * @param {int} id
     * @param {int} width
     * @param {int} height
     */
    getSizeCalcualtorPrice : async function(id, width, height) {
        return new Promise(function (resolve, reject) {
            if (!id) {
                reject(new Error('품목 ID 누락'));
                return;
            }

            var xhr = new XMLHttpRequest();
            xhr.open("GET","/ajax/size_calculator/price/" + id + "?width=" + width + "&height=" + height);
            xhr.addEventListener("readystatechange", function() {
                if (xhr.status == 200 && xhr.readyState == XMLHttpRequest.DONE) {;
                    var data = JSON.parse(xhr.responseText);
                    if (data.isSuccess) {
                        resolve(data.data);
                    } else {
                        reject(new Error(data.message));
                    }  
                }
            }); 
            xhr.send(null);
        });
    },
    /**
     * 사이즈 계산기 사이즈 변동 처리
     * 
     */
    updateSizeCalculatorPrice : function(id, width, height, el) {
        this.getSizeCalcualtorPrice(id, width, height)
            .then(function(data) {
                if (data) {
                    if (el) { 
                        el.value = data.price;
                    }

                    codefty.order.updateSummary();
                }
            });
    }, 
    /** 
     * 배송비 업데이트
     * 
     */
    updateDeliveryCharge : function(e) {
        var frm = document.getElementById("frmOrder");
        if (!frm) {
            return;
        }

        var formData = new FormData(frm);

        var xhr = new XMLHttpRequest();
        xhr.open("POST", "/ajax/delivery_charge");
        xhr.onreadystatechange = function() {
            if (xhr.status == 200 && xhr.readyState == XMLHttpRequest.DONE) {
                var data = JSON.parse(xhr.responseText);
                if (data && data.deliveryChargeItems && data.deliveryChargeItems.length > 0) {
                    for (item of data.deliveryChargeItems) {
                        var el = document.getElementById("deliveryCharge_" + item.id);
                        if (el) {
                            el.value = item.deliveryCharge;
                        }

                        var elStr = document.getElementById("deliveryCharge_str_" + item.id);
                        if (elStr) {
                            elStr.innerText = item.deliveryCharge.toLocaleString() + "원";
                        }
                    } // endfor
                }

                codefty.order.updateSummary();
            }
        };
        xhr.send(formData);
    }
};


window.addEventListener("DOMContentLoaded", function() {
    // 사이트 초기화 
    codefty.order.init();

    /** 품목등록 버튼 클릭 처리 S */
    var addProduct = document.getElementById("add_product");
    if (addProduct) {
        addProduct.addEventListener("click", function() {
            codefty.order.showProductItems();
        });
    }
    /** 품목등록 버튼 클릭 처리 E */
   
    /** 증빙자료(세금계산서, 현금영수증) 클릭 처리 S */
    var receiptTypes = document.getElementsByName("receiptType");
    for (var i = 0; i < receiptTypes.length; i++) {
        receiptTypes[i].addEventListener("click", function(e) {
            var el = e.currentTarget;
            if (['tax', 'cash'].indexOf(el.value) == -1)
                return;

            var receiptForms = document.querySelectorAll(".receiptForm");
            for (var j = 0; j < receiptForms.length; j++) {
                var _el = receiptForms[j];
                var classList = _el.classList;
                classList.remove("dn");
                classList.add("dn");
            }
            if (el.checked) {
                if (el.value == 'tax') {
                    var receiptTypeCashEl = document.getElementById("receiptType_cash");
                    if (receiptTypeCashEl) receiptTypeCashEl.checked = false;
                    var receiptForm = document.querySelector(".receiptForm.tax");
                    if (receiptForm) receiptForm.classList.remove("dn");
                } else if (el.value == 'cash') {
                    var receiptTypeTaxEl = document.getElementById("receiptType_tax");
                    if (receiptTypeTaxEl) receiptTypeTaxEl.checked = false;
                    var receiptForm = document.querySelector(".receiptForm.cash");
                    if (receiptForm) receiptForm.classList.remove("dn");
                }
            }
        });
    }
    /** 증빙자료(세금계산서, 현금영수증) 클릭 처리 E */
    /** 결제수단 클릭 처리 S */
    var payTypes = document.getElementsByName("payType");
    for (var i = 0; i < payTypes.length; i++) {
        payTypes[i].addEventListener("click", function(e) {
            var lbtDepositorEl = document.getElementById("lbt_depositor");
            if (!lbtDepositorEl)
                return;

            var classList =  lbtDepositorEl.classList;
            classList.remove("dn");
            classList.add("dn");
            if (this.value == 'lbt') { // 무통장
                classList.remove("dn");
            }
        });
    }
    /** 결제수단 클릭 처리 E */

    /** 파일 업로드 및 삭제 콜백 처리 S */
    window.addEventListener("message", function(e) {
        var mode = e.data.mode;

        switch (mode) {
            // 파일 업로드 콜백
            case "fileUpload_callback" : 
                var data = fileData = e.data.data;
                if (!(data instanceof Array)) {
                    data = [data];
                }

                for (var i = 0; i < data.length; i++) {
                    var file = data[i];
                    var gids = file.gid.split("_");
                    var idProduct = gids[2] + "_" + gids[3];
                    if (!idProduct) continue;

                    var el = document.querySelector("#product_item_" + idProduct + " .uploaded_files");
                    var li = document.createElement("li");
                    li.className = 'fileItem';
                    li.id = 'fileItem_' + file.id;
                    var a = document.createElement("a");
                    a.href='/file/download/' + file.id;
                    var fileName = document.createTextNode(file.fileName);
                    var remove = document.createElement("i");
                    remove.className = "xi-minus-square remove";
                    remove.dataset.id = file.id;
                    a.appendChild(fileName);
                    li.appendChild(a);
                    li.appendChild(remove);
                    el.appendChild(li);

                    remove.addEventListener("click", function(e) {
                        codefty.fileUpload.delete(e, li);
                    });
                }
                break;
            // 파일 삭제 콜백
            case "fileDelete_callback" : 
                var id = e.data.id;
                if (!id) return;
                var el = document.getElementById("fileItem_" + id);
                if (el) el.parentElement.removeChild(el);
                break;
            /** 샘플 이미지 선택 */
            case "popup_select_item" : 
                var data = e.data;
                var id = codefty.order.id;                
                if (!data || !id) return;
                
                var el = document.querySelector("#product_item_" + id + " .sample_images");
                if (!el) return;
                var div = codefty.order.createSelectedSampleDOM(id, data);
               
                el.appendChild(div);
                codefty.popup.close();
                break;  
        }
    });
    /** 파일 업로드 및 삭제 콜백 처리 E */

    /** 사업자 등록증 파일 업로드 처리 S */
    var businessCertUploadEl = document.getElementById("businessCertUpload");
    if (businessCertUploadEl) {
        businessCertUploadEl.addEventListener("change", function() {
            var target = this;
            var file = this.files[0];
            var orderNo = this.dataset.orderNo;
            if (!file || !orderNo) return;
            var url = "/order/business_cert_upload?gid=business_cert_" + orderNo + "&isSingle=1";
            var formData = new FormData();
            formData.enctype="multipart/form-data";
            formData.append("file", file);

            var xhr = new XMLHttpRequest();
            xhr.open("POST", url);
            xhr.onreadystatechange = function() {
                if (xhr.readyState == XMLHttpRequest.DONE && xhr.status == 200) {
                   var result = JSON.parse(xhr.responseText);
                   if (!result.isSuccess) {
                        alert(result.message);
                        return;
                   }

                   var businessCertFileIdEl = document.querySelector("input[name='businessCertFileId']");
                   if (businessCertFileIdEl) businessCertFileIdEl.value = result.data.id;
                   var businessCertFileEl = document.getElementById("business_cert_file");
                   if (businessCertFileEl) {
                       var fileBox = document.createElement("span");
                       fileBox.className = "file_box";
                       var fileLink = document.createElement("a");
                       fileLink.textContent = result.data.fileName;
                       fileLink.href= "/file/download/" + result.data.id;
                       var remove = document.createElement("i");
                       remove.className = "xi-minus-square";
                       remove.dataset.id = result.data.id;

                       fileBox.appendChild(fileLink);
                       fileBox.appendChild(remove);

                       businessCertFileEl.innerHTML = "";
                       businessCertFileEl.appendChild(fileBox);
                       target.value = "";

                       remove.addEventListener("click", function(e) {
                            codefty.fileUpload.delete(e, fileBox);
                       });
                   } // endif 
                }
            };
            xhr.send(formData);
        });
    }
    /** 사업자 등록증 파일 업로드 처리 E */

    /** 주문자 정보와 동일 클릭 처리 S */
    var sameWithOrdererEl = document.getElementById("same_with_orderer");
    if (sameWithOrdererEl) {
        sameWithOrdererEl.addEventListener("click", function() {
            var receiverNmEl = document.querySelector("input[name='receiverNm']");
            var receiverCellPhoneEl = document.querySelector("input[name='receiverCellPhone']");

            if (this.classList.contains("on")) {
                this.classList.remove("on");
                if (receiverNmEl) receiverNmEl.value = "";
                if (receiverCellPhoneEl) receiverCellPhoneEl.value = "";
            } else {
                this.classList.add("on");
                var orderNmEl = document.querySelector("input[name='orderNm']");
                var orderCellPhoneEl = document.querySelector("input[name='orderCellPhone']");
                if (receiverNmEl && orderNmEl) {
                    receiverNmEl.value = orderNmEl.value;
                }

                if (receiverCellPhoneEl && orderCellPhoneEl) {
                    receiverCellPhoneEl.value = orderCellPhoneEl.value;
                }
            }
        });
    }
    /** 주문자 정보와 동일 클릭 처리 E */
});