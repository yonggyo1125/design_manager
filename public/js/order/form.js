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
    init() {
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
    showProductItems() {
        var url = "/popup/product_items";
        codefty.popup.open(url, "품목 선택", 1000, 800,  true);
    },
    /**
     * 품목  선택 콜백
     * 
     * @param {Array} items 
     */
    callbackSelectedItems(items) {
        if (items && items.length > 0) {
            var tpl = document.getElementById("template_item");
            var productItemsEl = document.getElementById("product_items");
            if (!tpl || !productItemsEl) 
                return;

            var domParser = new DOMParser();
            var tplHtml = tpl.innerHTML;
            for (let item of items) {
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
                /** HTML 치환 부분 S */
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
                .replace(/<%=itemMemo%>/g, item.itemMemo)
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
                .replace(/<%=addSubOptions%>/g, item.addSubOptions)
                .replace(/<%=addTextOptions%>/g, item.addTextOptions);
                /** HTML 치환 부분 E */

                var div = document.createElement("div");
                div.className = "product_item";
                div.id = 'product_item_' + id;
               
                var htmlDoc = domParser.parseFromString(html, "text/html");
                
                var itemTxtEl = htmlDoc.querySelector(".item_no_box .item_txt");
                if (itemTxtEl) {
                    if (item.idOrderItem) { // 주문서 수정인 경우 
                        itemTxtEl.innerText=`품주번호 ${item.idOrderItem}`;
                    } else { // 주문서 등록인 경우 
                        itemTxtEl.innerText="품목추가";
                    }
                }
                
                /** 품목 삭제 버튼 처리 S */
                var removeEl = htmlDoc.querySelector(".remove");
                if (removeEl) {
                    if (item.idOrderItem) { // 주문서 수정인 경우 
                        removeEl.addEventListener("click", function() {
                            if (confirm('삭제하시면 주문품목을 복구할수 없습니다. 정말 삭제하시겠습니까?')) {
                                codefty.order.deleteOrderItem(item.idOrderItem, div);
                            }
                        });
                        
                    } else { // 주문서 등록인 경우
                        removeEl.addEventListener("click", function() {
                            if (confirm("정말 삭제하시겠습니까?")) {
                                div.parentElement.removeChild(div);
                            }
                        });
                    }
                }
                /** 품목 삭제 버튼 처리 E */

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
                            
                            const targetEl = htmlDoc.getElementById(`deliveryTypeHtml_${id}`);
                            getDeliveryTypeHtml(el.parentElement, item.deliveryType, targetEl);
                        } else {
                            el.removeAttribute("selected");
                        }

                       
                    }
                }

                const idDeliveryPolicyEls = htmlDoc.querySelectorAll("select[name^='idDeliveryPolicy']");
                for (const el of idDeliveryPolicyEls) {
                    el.addEventListener("change", function() {
                        getDeliveryTypeHtml(this);
                    });
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
                
                /** 묶음배송 클릭 이벤트 처리 S */
                const packageDeliveryEls = htmlDoc.querySelectorAll(".packageDelivery");
                const eachDeliveryInfoEl = htmlDoc.querySelector(".each_delivery_info");
               
                for (let el of packageDeliveryEls) {
                    el.addEventListener("click", function() {
                        eachDeliveryInfoEl.classList.remove("dn");
                        eachDeliveryInfoEl.classList.add("dn");
                        const v = this.value;
                        if (v == 'each') { // 개별배송인 경우
                            eachDeliveryInfoEl.classList.remove("dn");
                        }

                        codefty.order.updateDeliveryCharge();
                    });

                    /** 묶음 배송 선택 처리 S */
                    const packageDelivery = item.packageDelivery || "package";
                    if (el.value == packageDelivery) {
                            el.checked = true;
                    } else {
                        el.checked = false;
                    }

                    // 개별 배송인 경우 개별 배송 주소 노출
                    eachDeliveryInfoEl.classList.remove("dn");
                    eachDeliveryInfoEl.classList.add("dn");
                    if (packageDelivery == 'each') {
                        eachDeliveryInfoEl.classList.remove("dn");
                    }
                    /**  묶음 배송 선택 처리 E */ 
                }
                
                /** 묶음배송 클릭 이벤트 처리 E */

                var productItem = htmlDoc.querySelector(".inner");
                div.appendChild(productItem);
                
                productItemsEl.appendChild(div);

                /** 품목별 개별 배송 정책이 있는 경우 개별배송에 해당하지 않는 배송정책 제거 S */
                if (item.deliveryPolicies && item.deliveryPolicies.length > 0) {
                    const deliveryPolicyEl = productItem.querySelector(".idDeliveryPolicy");
                    const deliveryPolicyOptionsEls = deliveryPolicyEl.getElementsByTagName("option");
                    for (let el of deliveryPolicyOptionsEls) {
                        if (el.value.trim() != "" && item.deliveryPolicies.indexOf(el.value) == -1) {
                            el.disabled = true;
                        }
                    }
                }
                /** 품목별 개별 배송 정책이 있는 경우 개별배송에 해당하지 않는 배송정책 제거 E */

            } // endfor 

            var inputs = document.querySelectorAll("input[name^='itemPrice'], input[name^='itemCnt'], input[name^='itemDiscount'], input[name^='itemAdjust'], input[name^='textOptionTexts'], input[name^='subOptionCdsCnt']");
            var selects = document.querySelectorAll("select");

            for (var i = 0; i < inputs.length; i++) {
                inputs[i].addEventListener("focus", this.updateDeliveryCharge);
                inputs[i].addEventListener("blur", this.updateDeliveryCharge);
                inputs[i].addEventListener("change", this.updateDeliveryCharge);

                inputs[i].addEventListener("focus", this.updateSummary);
                inputs[i].addEventListener("blur", this.updateSummary);
                inputs[i].addEventListener("change", this.updateSummary);

                
            }

            for (var i = 0; i < selects.length; i++) {
                selects[i].addEventListener("change", this.updateDeliveryCharge);
                selects[i].addEventListener("change", this.updateSummary);
            }
            
            /** 사이즈 계산기 사용 품목인 경우 계산 설정 및 금액 계산 S */
            for (let item of items) {
                let itemUid = item.itemUid;
                this.getSizeCalcualtorPrice(item.id, item.itemSizeWidth, item.itemSizeHeight)
                .then(function(data) {
                    const itemPriceEls = document.getElementsByName("itemPrice_" + itemUid);
                    if (itemPriceEls.length > 0) {
                        if (data.price > 0)
                            itemPriceEls[0].value = data.price;
                        
                        itemPriceEls[0].setAttribute("readonly", true); // 사이즈 계산기 사용 설정이 있는 경우는 가격은 읽기 전용으로 변경
                    }
                    
                    const itemSizeWidthEls = document.getElementsByName("itemSizeWidth_" + itemUid);
                    const itemSizeHeightEls = document.getElementsByName("itemSizeHeight_" + itemUid);

                    if (!item.itemSizeHeight && !item.itemSizeWidth && data.config.basicSize) {
                       
                        if (itemSizeWidthEls.length > 0 && itemSizeHeightEls.length > 0) {
                            itemSizeWidthEls[0].value = isNaN(data.config.basicSize[0])?0:Number(data.config.basicSize[0]);
                            itemSizeHeightEls[0].value = isNaN(data.config.basicSize[1])?0:Number(data.config.basicSize[1]);
                        }
                    }
                    
                    function checkMaxSize(wEl, hEl) {
                        let width = isNaN(wEl.value)?0:Number(wEl.value);
                        let height = isNaN(hEl.value)?0:Number(hEl.value);
                        if (width > 0 && height > 0 && data.config) {
                            if (data.config.maxSqm && width * height > data.config.maxSqm * 10000) {
                                alert("최대 주문가능 사이즈는 " + data.config.maxSqm * 100 + "c㎡ 입니다.");
                                wEl.value = "";
                                hEl.value = "";
                                return;
                            }
                            if (data.config.maxSize && data.config.maxSize.length > 0) {
                                let maxSize = data.config.maxSize;
                                let maxSizeWidth = isNaN(maxSize[0])?0:Number(maxSize[0]);
                                let maxSizeHeight = isNaN(maxSize[1])?0:Number(maxSize[1]);
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
                        let width = itemSizeWidthEls[0].value;
                        let height = itemSizeHeightEls[0].value;
                               
                        codefty.order.updateSizeCalculatorPrice(item.id, width, height, itemPriceEls[0]);
                    });

                    itemSizeWidthEls[0].addEventListener("change", function() {
                        checkMaxSize(itemSizeWidthEls[0], itemSizeHeightEls[0]);
                        let width = itemSizeWidthEls[0].value;
                        let height = itemSizeHeightEls[0].value;
                        codefty.order.updateSizeCalculatorPrice(item.id, width, height, itemPriceEls[0]);
                    });
 
                    itemSizeHeightEls[0].addEventListener("blur", function() {
                        checkMaxSize(itemSizeWidthEls[0], itemSizeHeightEls[0]);
                        let width = itemSizeWidthEls[0].value;
                        let height = itemSizeHeightEls[0].value;
                        codefty.order.updateSizeCalculatorPrice(item.id, width, height, itemPriceEls[0]);
                    });

                    itemSizeHeightEls[0].addEventListener("change", function() {
                        checkMaxSize(itemSizeWidthEls[0], itemSizeHeightEls[0]);
                        let width = itemSizeWidthEls[0].value;
                        let height = itemSizeHeightEls[0].value;
                        codefty.order.updateSizeCalculatorPrice(item.id, width, height, itemPriceEls[0]);
                    });
                    
                    /** 보드형 사이즈인 경우 사이즈 선택 추가 S */
                    let boardSizeWrapEl = document.getElementById("board_size_" + itemUid);
                    if (data.config && data.config.boardSizes && boardSizeWrapEl) {
                        itemSizeWidthEls[0].value = itemSizeHeightEls[0].value = "";

                        let boardSizes = data.config.boardSizes;
                        let boardSizeTypes = Object.keys(data.config.boardSizes);
                        if (boardSizeTypes.length > 0) {
                            /** 사이즈 타입  */
                            let boardSizeTypeEl = document.createElement("select");
                            boardSizeTypeEl.name = `boardSizeType_${itemUid}`;
                            boardSizeTypeEl.className='board_size_type';
  
                            for (let j = 0; j < boardSizeTypes.length; j++) {
                                let type = boardSizeTypes[j];
                                let optionEl = document.createElement("option");
                                optionEl.value = type;
                                if (item.boardSizeType && item.boardSizeType == type) {
                                    optionEl.selected = true;
                                }
                                let optionTextEl = document.createTextNode((type == "portrait")?"세로형":"가로형");
                                optionEl.appendChild(optionTextEl);
                                boardSizeTypeEl.appendChild(optionEl);
                            }
                            boardSizeWrapEl.appendChild(boardSizeTypeEl);
                            boardSizeTypeEl.addEventListener("change", function() {
                                let v = this.value;
                                let sizes = boardSizes[v];
                                updateBoardSize(sizes);
                            });
                            
                            /** 사이즈 목록 */
                            let sizes = boardSizes[boardSizeTypes[0]];
                            if (item.boardSizeType) {
                                sizes = boardSizes[item.boardSizeType];
                            }
                            updateBoardSize(sizes);


                            function updateBoardSize(sizes) {
                                if (sizes.length > 0) {
                                    let els = boardSizeWrapEl.getElementsByClassName("board_size");
                                    if (els.length > 0) {
                                        for (let j = 0; j < els.length; j++) {
                                            els[j].parentElement.removeChild(els[j]);
                                        }
                                    }
                                    let boardSizeEl = document.createElement("select");
                                    boardSizeEl.name=`boardSize_${itemUid}`;
                                    boardSizeEl.className="board_size";
                                    let optionEl = document.createElement("option");
                                    optionEl.value="direct";
                                    let optionTextEl = document.createTextNode("직접입력");
                                    if (item.boardSize && item.boardSize == 'direct') {
                                        optionEl.selected = true;
                                        itemSizeWidthEls[0].value = item.itemSizeWidth;
                                        itemSizeHeightEls[0].value = item.itemSizeHeight;
                                    }
                                    
                                    optionEl.appendChild(optionTextEl);
                                    boardSizeEl.appendChild(optionEl);
                                    let isSelected = false;
                                    for (let j = 0; j < sizes.length; j++) {
                                        let optionEl = document.createElement("option");
                                        optionEl.value = sizes[j].width + "_" + sizes[j].height;
                                        let optionTextEl = document.createTextNode(sizes[j].sizeType);
                                        if (j == 0 && !item.boardSize) {
                                            optionEl.selected = true;
                                            itemSizeWidthEls[0].value = sizes[j].width;
                                            itemSizeHeightEls[0].value = sizes[j].height;
                                            isSelected = true;
                                        } else if (item.boardSize && item.boardSize == optionEl.value) {
                                            optionEl.selected = true;
                                            itemSizeWidthEls[0].value = sizes[j].width;
                                            itemSizeHeightEls[0].value = sizes[j].height;
                                            isSelected = true;
                                        }
                                        
                                        optionEl.appendChild(optionTextEl);
                                        boardSizeEl.appendChild(optionEl);
                                    }
                                    if (isSelected) {
                                        itemSizeWidthEls[0].setAttribute("readonly", true);
                                        itemSizeHeightEls[0].setAttribute("readonly", true);
                                    }
                                    boardSizeWrapEl.appendChild(boardSizeEl);
                                    
                                    codefty.order.updateSizeCalculatorPrice(item.id, itemSizeWidthEls[0].value, itemSizeHeightEls[0].value, itemPriceEls[0]);

                                    boardSizeEl.addEventListener("change", function() {
                                        let v = this.value;
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
                let itemUid = item.itemUid;
                let deliveryChargeTypeEls = document.getElementsByName('deliveryChargeType_' + itemUid);
                if (deliveryChargeTypeEls.length > 0) {
                    for (let i = 0; i < deliveryChargeTypeEls.length; i++) {
                        let el = deliveryChargeTypeEls[i];
                        el.addEventListener("click", this.updateDeliveryCharge);
                    }
                }

                let idDeliveryPolicyEl = document.querySelector("select[name='idDeliveryPolicy_" + itemUid + "']");
                if (idDeliveryPolicyEl) {
                    idDeliveryPolicyEl.addEventListener("change",this.updateDeliveryCharge);
                }
            }
            /** 배송비 이벤트 처리 E */

            /** 추가 옵션 선택시 항목을 선택하지 않은 경우 수량 0개, 항목을 선택한 경우 수량이 0이면 1로 변경 */
            const subOptionCdsEls = document.querySelectorAll("select[name^='subOptionCds_'], input[name^='subOptionCdsCnt_']");
            for (let el of subOptionCdsEls) {
                el.addEventListener("change", checkSubOptionCds);
            }
            const subOptionCdsCntEls = document.querySelectorAll("input[name^='subOptionCdsCnt_']");
            for (let el of subOptionCdsCntEls) {
                el.addEventListener("blur", checkSubOptionCds);
            }

            function checkSubOptionCds(e) {
                const target = e.currentTarget;

                let cntEl, selectEl;
                if (target.nodeName == 'INPUT') {
                    cntEl  = target;
                    selectEl = target.parentElement.previousElementSibling;
                } else {
                    selectEl = this;
                    cntEl = target.nextElementSibling.children[0];
                }

                if (!cntEl) {
                    return;
                }

                if (selectEl.value == "") {
                    cntEl.value = 0;
                } else {
                    let cnt = cntEl.value;
                    if (isNaN(cnt)) cnt = 1;
                    if (cnt == 0) cnt = 1;
                    cntEl.value = cnt;
                }
            }
            
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
    deleteOrderItem(idOrderItem, el) {
        if (!idOrderItem) {
            return;
        }

        const url = "/order/delete/items";
        const params = "id="+idOrderItem + "&isAjax=1";
        const xhr = new XMLHttpRequest();
        xhr.open("POST", url);
        xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
        xhr.onreadystatechange = function() {
            if (xhr.readyState == XMLHttpRequest.DONE && xhr.status == 200) {
                const json = JSON.parse(xhr.responseText);
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
    convertTplItem(item) {
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
            'itemMemo',
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
            'packageDelivery',
            'deliveryMemo',
            'addOptions',
            'addSubOptions',
            'addTextOptions',
            'textOptionTexts',
            "deliveryPolicies",
        ];
        

        const options = JSON.parse(item.optionsJson);
        const subOptions = JSON.parse(item.subOptionsJson);
        const textOptions = JSON.parse(item.textOptionsJson);
        item.deliveryPolicies = item.deliveryPoliciesJson?JSON.parse(item.deliveryPoliciesJson):[];

        item.addOptions = item.addSubOptions = item.addTextOptions = "";

         /** 기본 옵션 처리 S */
        if (options && options.length > 0) {
            for (let i = 0; i < options.length; i++) {
                if (!options[i].options || options[i].options.length == 0)  {
                    continue;
                }
                item.addOptions += "<div class='select_opts'><select name='optionCds_" + item.itemUid + "'>";
                item.addOptions += "<option value=''>" + options[i].cateNm + " 선택</option>";
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
        let cntNo = 0;
        if (subOptions && subOptions.length > 0) {
            for (let i = 0; i < subOptions.length; i++) {
                if (!subOptions[i].options || subOptions[i].options.length == 0)  {
                    continue;
                }

                /** 추가 옵션 선택 갯수 S */
                let ea = 0;
                if (item.subOptionCdsCnt && item.subOptionCdsCnt.length > 0) {
                    ea = item.subOptionCdsCnt[cntNo++];
                    if (isNaN(ea)) ea = 1;
                    ea = Number(ea);
                }
                /** 추가 옵션 선택 갯수 E */
                item.addSubOptions += "<div class='select_opts select_addopts'><select name='subOptionCds_" + item.itemUid + "'>";
                item.addSubOptions += "<option value=''>" + subOptions[i].cateNm + " 선택 -</option>";
          
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
                
                item.addSubOptions += "</select>";
                item.addSubOptions += `<div class='optCnt'>
                    <input type='number' name='subOptionCdsCnt_${item.itemUid}' value='${ea}' min='0'>개
                </div>`;
                item.addSubOptions += "</div>";
            }
        }
        /** 추가 옵션 처리 E */

        /** 텍스트 옵션 처리 S */
        if (textOptions && textOptions.length > 0) {
            for (let i = 0; i < textOptions.length; i++) {
                if (!textOptions[i].options || textOptions[i].options.length == 0)  {
                    continue;
                }
                /**
                item.addTextOptions += `<div class='input_opts'>
                   <div class='opt_tit'>${textOptions[i].cateNm}</div>`;
                */
                item.addTextOptions += `<div class='opts'>`;
                for (let j = 0; j < textOptions[i].options.length; j++) {
                    let opt = textOptions[i].options[j];
                    let maxLengthStr = "";
                    let placeHolderMsg = `${opt.optionNm} (을)를 입력하세요`;
                    if (opt.maxLength) {
                        maxLengthStr += ` maxlength=${opt.maxLength}`;
                        placeHolderMsg += `(최대 ${opt.maxLength}자)`;
                    }
                    placeHolderMsg += ".";
                    let value = "";
                    if (item.textOptionTexts && item.textOptionTexts.length > 0) {
                        for (let textOpt of item.textOptionTexts) {
                            if (opt.optionCd == textOpt.optionCd) {
                                value = textOpt.text;
                                break;
                            }
                        }
                    }
                    item.addTextOptions += `<div class='opt'>
                        <input type='hidden' name='textOptionCds_${item.itemUid}' value='${opt.optionCd}'>
                        <input type='text' name='textOptionTexts_${item.itemUid}_${opt.optionCd}' value='${value}' data-add-price='${opt.addPrice}' placeholder='${placeHolderMsg}'${maxLengthStr}>
                    </div>`;
                }

                item.addTextOptions += "</div>";

            } // endfor 
        } // endif
        /** 텍스트 옵션 처리 E */ 

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
                const htmlDOM = [];
                const domParser = new DOMParser();
                for (let i = 0; i < item.attachFiles.length; i++) {
                    const file = item.attachFiles[i];
                    let html = "<li class='fileItem' id='fileItem_" + file.id + "'><a href='/file/download/" + file.id + "'>" + file.fileName + "</a><i class='xi-minus-square remove' data-id='" + file.id + "'></i></li>";
                    const doc = domParser.parseFromString(html, "text/html");
                    const remove = doc.querySelector(".remove");
                    const li = doc.querySelector(".fileItem");
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
                const sampleDOM = [];
                for (let i = 0; i < item.samples.length; i++) {
                    const sample = item.samples[i];
                    const dom = codefty.order.createSelectedSampleDOM(item.itemUid, sample);
                    sampleDOM.push(dom);
                }
                item.sampleDOM = sampleDOM;
            } 
            /** 샘플 이미지 처리 E */
        }

        for(let i = 0; i < required.length; i++) {
            const field = required[i];
            if (!item[field]) item[field] = "";
        }
    },
    /**
     * 샘플 선택 팝업  
     * @param {String} cateNm 품목 분류 
     * @param {String} id 품목번호_순번
     */
    showSamplePopup(cateNm, id) {
        this.id = id;
        const url = "/popup/sample/" + cateNm + "?isPopup=1&userSelect=1&copy=1";
        codefty.popup.open(url, null, 850, 700, true);
    },
    /**
     * 시안등록/수정 팝업 
     * 
     * @param {String} id 품목번호_순번
     */
    showDraftPopup(id) {
        this.id = id;
        const url = "/popup/draft/" + id;
        codefty.popup.open(url, "시안 등록/수정", 950, 650, true);
    },
    /**
     * 선택된 샘플 DOM 
     * 
     * @param {String} id  itemUid
     * @param {Object} data 샘플 데이터 
     */
    createSelectedSampleDOM(id, data) {
        const div = document.createElement("div");
        div.className = "sample";
        const remove = document.createElement("i");
        remove.className = "xi-minus-square remove"
        div.appendChild(remove);

        remove.addEventListener("click", function(e) {
            const parent = e.currentTarget.parentElement;
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
        
        const input = [];
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
    updateSummary() {
        // 묶음배송 조건 업데이트 
        codefty.order.updateDeliveryPolicy();
        
        const el = document.getElementById("product_items");
        if (!el) {
            return;
        }

        

        const idProductItemEls = document.getElementsByName("idProductItem");
        const itemTotalPriceEl = document.querySelectorAll(".itemTotalPrice");
        const itemPriceEls = document.querySelectorAll("input[name^='itemPrice']");
        const itemCntEls = document.querySelectorAll("input[name^='itemCnt']");
        const itemDiscountEls = document.querySelectorAll("input[name^='itemDiscount']");
        const itemAdjustEls = document.querySelectorAll("input[name^='itemAdjust']");
       
        let itemsTotalPrice = deliveryCharge = totalDiscount = 0;
        for (let i = 0; i < idProductItemEls.length; i++) {
            const itemUid = idProductItemEls[i].value;
            /** 판매원가 처리 S */
            let itemPrice = 0;
            if (itemPriceEls[i]) {
                itemPrice = Number(itemPriceEls[i].value);
                if (itemPrice < 0) {
                    itemPrice = 0;
                    itemPriceEls[i].value = 0;
                }
            }
            /** 판매원가 처리 E */

            /** 판매수량 S */
            let itemCnt = 1;
            if (itemCntEls[i]) {
                itemCnt = Number(itemCntEls[i].value);
                if (itemCnt < 1) {
                    itemCnt = 1;
                    itemCntEls[i].value = 1;
                }
            }
            /** 판매수량 E */

            /** 할인금액 S */
            let itemDiscount = 0;
            if (itemDiscountEls[i]) {
                itemDiscount = Number(itemDiscountEls[i].value);
                if (itemDiscount < 1) {
                    itemDiscount = 0;
                    itemDiscountEls[i].value = 0;
                }
            }
            /** 할인금액 E */
            /** 금액조정 S */
            let itemAdjust = 0;
            if (itemAdjustEls[i]) {
                itemAdjust = Number(itemAdjustEls[i].value);
            }
            /** 금액조정 E */

            /** 기본, 추가,텍스트 옵션 S */
            let basicOptionPrice = 0;
            let optionCdEls = document.querySelectorAll("select[name='optionCds_" + itemUid + "']");
            for (let j = 0; j < optionCdEls.length; j++) {
                const options = optionCdEls[j].children;
                for (let k = 0; k < options.length; k++) {
                    if (options[k].selected) {
                        let addPrice = Number(options[k].dataset.addPrice);
                        if (isNaN(addPrice)) addPrice = 0;
                        basicOptionPrice += addPrice;
                    }
                }
            }
            let subOptionPrice = 0;
            optionCdEls = document.querySelectorAll("select[name='subOptionCds_" + itemUid + "']");
            var optionCdCntEls = document.querySelectorAll(`input[name='subOptionCdsCnt_${itemUid}']`);
            for (var j = 0; j < optionCdEls.length; j++) {
                var options = optionCdEls[j].children;
                var ea = 0;
                if (optionCdCntEls.length > 0) {
                    ea = optionCdCntEls[j].value;
                    if (isNaN(ea)) ea = 1;
                    ea = Number(ea);
                    optionCdCntEls[j].value = ea;
                }

                for (var k = 0; k < options.length; k++) {
                    if (options[k].selected) {
                        var addPrice = Number(options[k].dataset.addPrice);
                        if (isNaN(addPrice)) addPrice = 0;
                        subOptionPrice += addPrice * ea;
                    }
                }
            }
            let textOptionPrice = 0;
            optionCdEls = document.querySelectorAll("input[name='textOptionCds_" + itemUid + "']");
            for (let el of optionCdEls) {
                const textEl = document.querySelector("input[name='textOptionTexts_" + itemUid + "_" + el.value + "']");
                if (textEl && textEl.value.trim() != "") {
                    let addPrice = Number(textEl.dataset.addPrice);
                    if (isNaN(addPrice)) addPrice = 0;
                    textOptionPrice += addPrice;
                }
            }
            /** 기본, 추가, 텍스트 옵션 E */

            /** 배송비 S  */
            let itemDeliveryCharge = 0;
            const itemDeliveryChargeEl = document.getElementById('deliveryCharge_' + itemUid);
            if (itemDeliveryChargeEl) {
                itemDeliveryCharge = Number(itemDeliveryChargeEl.value);

                if (isNaN(itemDeliveryCharge)) itemDeliveryCharge = 0;
                deliveryCharge += itemDeliveryCharge;
            }
            /** 배송비 E  */

            
            let itemTotalPrice = (itemPrice + basicOptionPrice + textOptionPrice) * itemCnt + subOptionPrice + itemAdjust - itemDiscount + itemDeliveryCharge; 
            if (itemTotalPrice < 0) { // 전체 금액이 음수인경우 금액조정으로 0으로 맞춤
                itemAdjust += itemTotalPrice;
                itemAdjustEls[i].value = itemAdjust;
                itemTotalPrice = 0;
            }

            // 상품 합계 
            itemsTotalPrice += (itemPrice + basicOptionPrice + textOptionPrice) * itemCnt + subOptionPrice + itemAdjust;
           
            // 할인 합계 
            totalDiscount += itemDiscount;

            
            if (itemTotalPriceEl[i]) {
                let str = itemTotalPrice.toLocaleString() + "원";
      
                itemTotalPriceEl[i].innerHTML = str;
            }
        }

        /** 묶음 배송비 추가 처리 S */
        const deliveryCharge2El = document.getElementById("deliveryCharge2");
        if (deliveryCharge2El) {
            let packageDeliveryCharge = Number(deliveryCharge2El.value);
            if (isNaN(packageDeliveryCharge)) packageDeliveryCharge = 0;
            deliveryCharge += packageDeliveryCharge; 
        }
        /** 묶음 배송비 추가 처리 E */

        /** 부가세 계산 S */
        let vat = 0; 
        let itemsTotalPriceWithoutVat = (itemsTotalPrice > 0)?Math.round(itemsTotalPrice / 1.1):0;
        if (itemsTotalPrice > 0) vat += itemsTotalPrice - itemsTotalPriceWithoutVat;
        let totalDiscountWithoutVat = (totalDiscount > 0)?Math.round(totalDiscount / 1.1):0;
        if (totalDiscount > 0) vat -= totalDiscount - totalDiscountWithoutVat;
        
        let deliveryChargeWithoutVat = (deliveryCharge > 0)?Math.round(deliveryCharge / 1.1):0;
        if (deliveryCharge > 0) vat -= deliveryCharge - deliveryChargeWithoutVat;

        /** 부가세 계산 E */

        let totalPayPrice = itemsTotalPrice + deliveryCharge - totalDiscount;

        /** 결제정보 출력 S */
        let itemsTotalPriceEl = document.getElementById("itemsTotalPrice");
        if (itemsTotalPriceEl) itemsTotalPriceEl.textContent = itemsTotalPrice.toLocaleString();
        let deliveryChargeEl = document.getElementById("deliveryCharge");
        if (deliveryChargeEl) deliveryChargeEl.textContent = deliveryCharge.toLocaleString();
        let totalDiscountEl = document.getElementById("totalDiscount");
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
    async getSizeCalcualtorConfig(id) {
        return new Promise(function(resolve, reject) {
            if (!id) {
                reject(new Error('품목 ID 누락'));
                return;
            }

            const xhr = new XMLHttpRequest();
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
    async getSizeCalcualtorPrice(id, width, height) {
        return new Promise(function (resolve, reject) {
            if (!id) {
                reject(new Error('품목 ID 누락'));
                return;
            }

            const xhr = new XMLHttpRequest();
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
    async updateSizeCalculatorPrice(id, width, height, el) {
        const data = await codefty.order.getSizeCalcualtorPrice(id, width, height)
        if (data && el) {
            el.value = data.price;
        }

        await codefty.order.updateDeliveryCharge();
        
    },
    /** 
     * 배송비 업데이트
     * 
     */
    updateDeliveryCharge(e) {
        return new Promise((resolve, reject) => {
            if (codefty.order.isUpdateDeliveryChargeProcessing) {
                return;
            }
            codefty.order.isUpdateDeliveryChargeProcessing = true;
        
            var frm = document.getElementById("frmOrder");
            if (!frm) {
                return;
            }
            
            const formData = new FormData(frm);
            const xhr = new XMLHttpRequest();
            xhr.open("POST", "/ajax/delivery_charge");
            xhr.onreadystatechange = function() {
                if (xhr.status == 200 && xhr.readyState == XMLHttpRequest.DONE) {
                    const data = JSON.parse(xhr.responseText);
                    let totalDeliveryCharge = 0, packageTotalDeliveryCharge = 0;
                    if (data && data.deliveryChargeItems && data.deliveryChargeItems.length > 0) {
                        const itemDeliveryChargeEls = document.querySelectorAll("input[name^='deliveryCharge_']");
                        for (let el of itemDeliveryChargeEls) {
                            const names = el.name.split("_");
                            names.shift();
                            const uid = names.join("_");
                            let deliveryCharge = 0;
                            for (let item of data.deliveryChargeItems) {
                                if (uid == item.id) {
                                    deliveryCharge = item.packageDelivery == 'each'?item.deliveryCharge:0;
                                    break;
                                }
                            }
                            el.value = deliveryCharge;
                            const strEl = el.nextElementSibling;
                            if (strEl) {

                                let str = deliveryCharge > 0 ? "(배송비 : " + deliveryCharge.toLocaleString() + "원 포함)":"";
                                strEl.innerHTML = "<div>" + str + "</div>";
                                const el = document.getElementById(`itemTotalDeliveryCharge_${uid}`);
                                if (el) el.innerHTML = str;
                            }
                            
                        }
                        totalDeliveryCharge = data.totalDeliveryCharge; // 총 배송비
                        packageTotalDeliveryCharge = data.packageTotalDeliveryCharge; // 묶음 배송비 
                     }

                    const deliveryChargeEl = document.getElementById("deliveryCharge2");
                    const deliveryChargeStrEl = document.getElementById("deliveryCharge_str");
                    if (deliveryChargeEl) deliveryChargeEl.value = packageTotalDeliveryCharge;
                    if (deliveryChargeStrEl) {
                        let str = packageTotalDeliveryCharge.toLocaleString() + "원"; 
                        
                        deliveryChargeStrEl.innerHTML = str;
                    }


                    codefty.order.updateSummary();
                    codefty.order.isUpdateDeliveryChargeProcessing = false;
                }
            };
            xhr.send(formData);
        });
    },
    /**
     * 묶음배송 배송조건 업데이트 
     * 
     * 주문상품이 1개인 경우는 묶음 배송이며, 배송 정책을 동일하게 맞춤 
     * 주문상품이 여러개인 경우는 모두 노출
     */
    updateDeliveryPolicy() {

        const el = document.querySelector("select[name='idDeliveryPolicy']");
        if (!el) {
            return;
        }
        
        const optionEls = el.getElementsByTagName("option");
        const productItemEls = document.getElementsByClassName("product_item");
  
        if (!productItemEls) {
            return;
        }
        
        if (productItemEls.length == 1) {
            const itemDeliveryOptionEls = productItemEls[0].querySelectorAll(".idDeliveryPolicy option");
            for (let el of optionEls) {
                for (let itemEl of itemDeliveryOptionEls) {
                    if (el.value == itemEl.value) {
                        if (itemEl.disabled) {
                            el.disabled = true;
                        }
                    }
                }
            }

        } else {
            for (let el of optionEls) {
                el.removeAttribute("disabled");
            }
        }
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
    const receiptTypes = document.getElementsByName("receiptType");
    for (let i = 0; i < receiptTypes.length; i++) {
        receiptTypes[i].addEventListener("click", function(e) {
            const el = e.currentTarget;
            if (['tax', 'cash'].indexOf(el.value) == -1)
                return;

            const receiptForms = document.querySelectorAll(".receiptForm");
            for (let j = 0; j < receiptForms.length; j++) {
                const _el = receiptForms[j];
                const classList = _el.classList;
                classList.remove("dn");
                classList.add("dn");
            }
            if (el.checked) {
                if (el.value == 'tax') {
                    const receiptTypeCashEl = document.getElementById("receiptType_cash");
                    if (receiptTypeCashEl) receiptTypeCashEl.checked = false;
                    const receiptForm = document.querySelector(".receiptForm.tax");
                    if (receiptForm) receiptForm.classList.remove("dn");
                } else if (el.value == 'cash') {
                    const receiptTypeTaxEl = document.getElementById("receiptType_tax");
                    if (receiptTypeTaxEl) receiptTypeTaxEl.checked = false;
                    const receiptForm = document.querySelector(".receiptForm.cash");
                    if (receiptForm) receiptForm.classList.remove("dn");
                }
            }
        });
    }
    /** 증빙자료(세금계산서, 현금영수증) 클릭 처리 E */
    /** 결제수단 클릭 처리 S */
    const payTypes = document.getElementsByName("payType");
    for (let i = 0; i < payTypes.length; i++) {
        payTypes[i].addEventListener("click", function(e) {
            const lbtDepositorEl = document.getElementById("lbt_depositor");
            if (!lbtDepositorEl)
                return;

            const classList =  lbtDepositorEl.classList;
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
        const mode = e.data.mode;
        let data, id;
        switch (mode) {
            // 파일 업로드 콜백
            case "fileUpload_callback" : 
                 data = fileData = e.data.data;
                if (!(data instanceof Array)) {
                    data = [data];
                }

                for (let i = 0; i < data.length; i++) {
                    const file = data[i];
                    const gids = file.gid.split("_");
                    const idProduct = gids[2] + "_" + gids[3];
                    if (!idProduct) continue;

                    const el = document.querySelector("#product_item_" + idProduct + " .uploaded_files");
                    const li = document.createElement("li");
                    li.className = 'fileItem';
                    li.id = 'fileItem_' + file.id;
                    const a = document.createElement("a");
                    a.href='/file/download/' + file.id;
                    const fileName = document.createTextNode(file.fileName);
                    const remove = document.createElement("i");
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
                id = e.data.id;
                if (!id) return;
                const el = document.getElementById("fileItem_" + id);
                if (el) el.parentElement.removeChild(el);
                break;
            /** 샘플 이미지 선택 */
            case "popup_select_item" : 
                data = e.data;
                id = codefty.order.id;                
                if (!data || !id) return;
                
                el = document.querySelector("#product_item_" + id + " .sample_images");
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
            const target = this;
            const file = this.files[0];
            const orderNo = this.dataset.orderNo;
            if (!file || !orderNo) return;
            const url = "/order/business_cert_upload?gid=business_cert_" + orderNo + "&isSingle=1";
            const formData = new FormData();
            formData.enctype="multipart/form-data";
            formData.append("file", file);

            const xhr = new XMLHttpRequest();
            xhr.open("POST", url);
            xhr.onreadystatechange = function() {
                if (xhr.readyState == XMLHttpRequest.DONE && xhr.status == 200) {
                   const result = JSON.parse(xhr.responseText);
                   if (!result.isSuccess) {
                        alert(result.message);
                        return;
                   }

                   const businessCertFileIdEl = document.querySelector("input[name='businessCertFileId']");
                   if (businessCertFileIdEl) businessCertFileIdEl.value = result.data.id;
                   const businessCertFileEl = document.getElementById("business_cert_file");
                   if (businessCertFileEl) {
                       const fileBox = document.createElement("span");
                       fileBox.className = "file_box";
                       const fileLink = document.createElement("a");
                       fileLink.textContent = result.data.fileName;
                       fileLink.href= "/file/download/" + result.data.id;
                       const remove = document.createElement("i");
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
    const sameWithOrdererEl = document.getElementById("same_with_orderer");
    if (sameWithOrdererEl) {
        sameWithOrdererEl.addEventListener("click", function() {
            const receiverNmEl = document.querySelector("input[name='receiverNm']");
            const receiverCellPhoneEl = document.querySelector("input[name='receiverCellPhone']");

            if (this.classList.contains("on")) {
                this.classList.remove("on");
                if (receiverNmEl) receiverNmEl.value = "";
                if (receiverCellPhoneEl) receiverCellPhoneEl.value = "";
            } else {
                this.classList.add("on");
                const orderNmEl = document.querySelector("input[name='orderNm']");
                const orderCellPhoneEl = document.querySelector("input[name='orderCellPhone']");
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

    /** 묶음 배송 선불, 후불 클릭시, 배송조건 선택시 배송비 업데이트 처리 S */
    const deliveryChargeTypeEls = document.getElementsByClassName("deliveryChargeType");
    for (let el of deliveryChargeTypeEls) {
        el.addEventListener("click", codefty.order.updateDeliveryCharge);
    }
    const idDeliveryPolicyEl = document.querySelector("select[name='idDeliveryPolicy']");
    if (idDeliveryPolicyEl) {
        idDeliveryPolicyEl.addEventListener("change", codefty.order.updateDeliveryCharge);
    }
    /** 묶음 배송 선불, 후불 클릭시, 배송조건 선택시 배송비 업데이트 처리 E */


    window.addEventListener("scroll", function() {
        const pageYOffset = window.pageYOffset;
        const submitBtnsEl = document.querySelector(".submit_btns");
        const el = document.getElementById("product_items");
        if (!submitBtnsEl || !el) {
            return;
        }

        /** 하단 클릭 버튼 처리 S */
        const fullHeight = document.querySelector("body").clientHeight;
        const gap = fullHeight - (pageYOffset + window.innerHeight);
        /** 하단 클릭 버튼 처리 E */

         /** 하단 공간이 한 페이지 정도 공간 정도 남았을때 워래 위치에 버튼 노출  */
         submitBtnsEl.classList.remove("fixed");
         submitBtnsEl.classList.add("fixed");
         if (gap < window.innerHeight) {
             submitBtnsEl.classList.remove("fixed");
         }

        /** 품목 추가 버튼 플로팅 처리 S */
        
        const addProductEl = document.getElementById("add_product");
        if (!el || !addProductEl) {
            return;
        }
        const rect = el.getBoundingClientRect();
        const top = rect.top + pageYOffset + 400;
        const classList = addProductEl.classList;
        classList.remove("fixed");
        submitBtnsEl.classList.remove("right137");
        if (pageYOffset > top) {
            classList.add("fixed");
            submitBtnsEl.classList.add("right137");
        }
        /** 품목 추가 버튼 플로팅 처리 E */
    });
   
    /** 배송조건 선택시 배송 조건별 배송방식 출력 S */
    const idDeliveryPolicyEls = document.getElementsByClassName("idDeliveryPolicy");
    for (const el of idDeliveryPolicyEls) {
        el.addEventListener("change", function() {
            getDeliveryTypeHtml(this);
        });
    }
    /** 배송조건 선택시 배송 조건별 배송방식 출력 E */
    /** 배송방식 클릭 이벤트 처리 S */
    const deliveryTypeHtmlEls = document.querySelectorAll("input[name^='deliveryType']");
    for (const el of deliveryTypeHtmlEls) {
        el.addEventListener("click", codefty.order.updateDeliveryCharge);
    }
    /** 배송방식 클릭 이벤트 처리 E */
});

function getDeliveryTypeHtml(el, deliveryType, targetEl) {
    const id = el.value;

    const url = `/order/delivery_policy/${id}`;
    const itemUid = el.dataset.id ? `_` + el.dataset.id  : "";
        
    targetEl = targetEl ? targetEl : document.getElementById(`deliveryTypeHtml${itemUid}`);
    if (!targetEl) {
        return;
    }
    if (!id) {
        targetEl.innerHTML = "";
        codefty.order.updateDeliveryCharge();
        return;
    }

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
                                    .replace(/<%=id%>/g, itemUid)
                                    .replace(/<%=no%>/g, i);

                        
                    const dom = domParser.parseFromString(tplHtml, "text/html");
                    const spanEl = dom.querySelector("span");
                    targetEl.appendChild(spanEl);
                    const el = spanEl.querySelector("input");
                    if ((deliveryType && deliveryType == t.type) || !deliveryType && i == 0) {
                        el.checked = true;
                    }

                    el.addEventListener("click", codefty.order.updateDeliveryCharge);
                }
            }
            
            codefty.order.updateDeliveryCharge();        
        }
    };
    xhr.send(null);
}