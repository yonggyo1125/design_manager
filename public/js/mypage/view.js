const mypageView = {
    _orderNo : "", // 주문번호
    get orderNo() {
        if (!this._orderNo) {
            const mypageViewEl = document.getElementById("mypage_view");
            if (mypageViewEl) {
                this._orderNo = mypageViewEl.dataset.orderNo;
            }
        }
        
        return this._orderNo;
    },
    set orderNo(orderNo) {
        this._orderNo = orderNo;
    },
    /**
     * 고객 요청 사항 저장 처리
     * 
     * @param {event} e 
     */
    updateClientRequest(e) {
        e.preventDefault();
        let uid;
        const bodyEl = document.querySelector("body");
        if (bodyEl.classList.contains("body-mobile")) {
            uid = this.parentElement.parentElement.dataset.uid
        } else {
            uid = this.parentElement.dataset.uid
        }
       

        const frmEl = document.getElementById(`frm_${uid}`);
        
        const formData = new FormData(frmEl);
        const clientRequest = formData.get("clientRequest");
        if (!clientRequest || clientRequest.trim() == "") {
            alert("수정하실 내용을 입력해 주세요.");
            return;
        }

        const params = {
            draftUid  : uid,
            clientRequest,
        };


        const xhr = new XMLHttpRequest();
        xhr.open("POST", "/mypage/client_request");
        xhr.setRequestHeader("Content-Type", "application/json; charset=utf-8");
        xhr.addEventListener("readystatechange", function() {
            if (xhr.status == 200 && xhr.readyState == XMLHttpRequest.DONE) {
                const result = JSON.parse(xhr.responseText);
                if (result.isSuccess) {
                    alert("수정 내용이 등록 되었습니다.")
                } else {
                    alert(result.message);
                }
            }
        });

        xhr.send(JSON.stringify(params));
    },
    /**
     * 시안 확정하기 팝업 띄우기
     * 
     * @param {*} e 
     */
    confirmDesignDraftPopup(e) {
        const uid = this.dataset.uid;
        if (!uid) {
            alert("잘못된 접근입니다.");
            return;
        }

        codefty.popup
            .setCallback(function() {
                const el = document.getElementById("design_confirm");
                if (el) {
                    el.addEventListener("click", function(e) {
                        const chkEl = document.getElementById("agree_design_confirm");
                        if (chkEl && !chkEl.checked) {
                            alert("주의사항을 확인해 주세요.");
                            return;
                        }
                        
                        mypageView.confirmDesignDraft(e);
                        
                    });
                }
            })
            .open(`/mypage/confirm_design/${uid}`, "확정하기", 480, 590);

    },
    /**
     * 시안 확정하기 처리 
     * 
     * @param {*} e 
     */
    confirmDesignDraft(e) {
        const uid = e.currentTarget.dataset.uid;
        if (!uid) {
            return;
        }

        if (!confirm('시안을 확정하시면 인쇄가 시작됩니다. 정말 시안을 확정하시겠습니까?')) {
            return;
        }

        const designChoiceEl = document.querySelector(`input[name='designChoice_${uid}']:checked`);
        if (!designChoiceEl) {
            alert("확정할 시안을 선택하세요.");
            return;
        }

        const designChoice = designChoiceEl.value;
        
        const params = {
            draftUid : uid,
            designChoice
        };

        const xhr = new XMLHttpRequest();
        xhr.open("POST", "/mypage/confirm_design_draft");
        xhr.setRequestHeader("Content-Type", "application/json; charset=utf-8");
        xhr.addEventListener("readystatechange", function() {
            if (xhr.status == 200 && xhr.readyState == XMLHttpRequest.DONE) {
                const result = JSON.parse(xhr.responseText);
                if (result.isSuccess) {
                    alert("시안이 확정되었습니다.");
                    location.reload();
                } else {
                    alert(result.message);
                }
            }
        });

        xhr.send(JSON.stringify(params));
    },
    /**
     * 디자이너 변경 팝업
     * 
     */
    changeDesignerPopup() {
        orderNo = mypageView.orderNo;
        codefty.popup.close();
        codefty.popup.open(`/mypage/change_designer/${orderNo}`, "디자이너 변경", 480, 590);

    }
};

window.addEventListener("DOMContentLoaded", function() {
    /** 고객 요청 사항 수정 하기 버튼 클릭 처리 S */
    const feedbackFrmEls = document.querySelectorAll(".feedbackFrm button[type='submit']");
    
    for (let el of feedbackFrmEls) {
        el.addEventListener("click", mypageView.updateClientRequest);
    }
    /** 고객 요청 사항 수정 하기 버튼 클릭 처리 E */

    /** 시안 확정하기 버튼 클릭 처리 S */
    const confirmEls = document.querySelectorAll(".confirm button");
    for (let el of confirmEls) {
        el.addEventListener("click", mypageView.confirmDesignDraftPopup);
    }
    /** 시안 확정하기 버튼 클릭 처리 E */

    /** 업로드 파일 삭제 버튼 처리 S */
    const removeEls = document.querySelectorAll(".attach_files .remove");
    for (let el of removeEls) {
        el.addEventListener("click", codefty.fileUpload.delete);
    }
    /** 업로드 파일 삭제 버튼 처리 E */

    /** 파일 업로드 및 삭제 콜백 처리 S */
    window.addEventListener("message", function(e) {
        const mode = e.data.mode;
        switch (mode) {
            // 파일 업로드 콜백
            case "fileUpload_callback" : 
                let fileData = e.data.data;
                if (!(fileData instanceof Array)) {
                    fileData = [fileData];
                }

                const tpl = document.getElementById("fileTpl").innerHTML;
                
                const domParser = new DOMParser();
                for (file of fileData) {
                    let html = tpl;
                    const gids = file.gid.split("client_");
                    const draftUid = gids[1];
                    const attachFiles = document.getElementById(`attach_files_${draftUid}`);
                    if (!attachFiles) {
                        continue;
                    }

                    html = html.replace(/#\[id\]/g, file.id)
                                .replace(/#\[fileName\]/g, file.fileName);
                        
                    const dom = domParser.parseFromString(html, "text/html");
                    const liEl = dom.querySelector("li");
                    attachFiles.appendChild(liEl);

                    /** 업로드 완료 처리 S */
                    try {
                        codefty.fileUpload.doneUploadFiles(file.gid);
                    } catch (err) {}

                    const removeEl = liEl.querySelector(".remove");
                    if (removeEl) {
                        removeEl.addEventListener("click", codefty.fileUpload.delete);
                    }
                }
                break;

        }
    });
    /** 파일 업로드 및 삭제 콜백 처리 E */
    /** 디자이너 변경 버튼 클릭 처리 S */
    const changeDesignerEls = document.getElementsByClassName("change_designer");
    for (let el of changeDesignerEls) {
        el.addEventListener("click", function() {
            if (!this.classList.contains("possible")) {
                alert("디자이너 변경이 불가합니다.");
                return;
            }
            
            mypageView.changeDesignerPopup();
        });
    }
    /** 디자이너 변경 버튼 클릭 처리 E */

    /** 외부 iframe 연동시 사이즈 조정 postMessage 전달 S */
    let _target;
    if (parent) _target = parent;
    if (opener) _target = opener;

    _target.postMessage({ mode : "resize_height", height : document.body.clientHeight }, "*");
    /** 외부 iframe 연동시 사이즈 조정 postMessage 전달 E */
});