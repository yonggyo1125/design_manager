/**
 * 시안등록/수정관리 
 * 
 */
var codefty = codefty || {};
codefty.draft = {
    maxSize : 0, // 최대 업로드 가능 mb
    channel : "본사", // 유입채널
    /**
     * 드래그앤 드롭 업로드 처리 
     * 
     * @param {Object} el 선택 요소
     */
    dragDropUpload : function(el) {
        if (!el) {
            return;
        }

        el.addEventListener("dragover", function(e) {
            e.preventDefault();
        });

        el.addEventListener("drop", function(e) {
            e.preventDefault();
            var files = e.dataTransfer.files;
            codefty.draft.upload(e, files);
        });
    },
    /**
     * 일반 업로드 처리 
     * 
     * @param {Object} el 
     */
    generalUpload : function(el) {
        if (!el) {
            return;
        }

        el.addEventListener("change", function(e) {
            var files = e.currentTarget.files;
            codefty.draft.upload(e, files);
        });
     },
     /**
      * 공통 업로드 처리 
      * @param {Object} e 이벤트 객체 
      * @param {Object} files 파일 객체 
      */
     upload : function(e, files) {
        var target = e.currentTarget;
        var dataset = target.dataset;
        var gid = dataset.gid;
        var maxSize = dataset.maxSize || 20;
        var channel = dataset.channel || "본사";
        var draftNo = dataset.draftNo;

        try {
            if (!draftNo) {
                throw new Error('잘못된 접근입니다.');
            }

            /** 파일업로드 유효성 검사  */
            codefty.draft.validate(files, maxSize);
        } catch (err) {
            alert(err.message);
            return;
        }
        

        for (var i = 0; i < files.length; i++) {
           codefty.draft.fileUpload(files[i], gid, draftNo, channel);
        }
     },
    /**
     * 
     * @param {Object} files 
     * @param {int} maxSize 최대 업로드 가능 mb
     * @throws {Error}
     */
    validate : function(files, maxSize) {
        if (!files || files.length == 0) {
            throw new Error('파일을 업로드 하세요.');
        }

        /** 업로드 가능 용량 및 이미지 형식 체크 S */
        var maxSizeBytes = parseInt(maxSize) * 1024 * 1024;
        var totalSize = 0;
        for (var i = 0; i < files.length; i++) {
            if (files[i].type.indexOf('image') == -1) {
                throw new Error('이미지 형식의 파일만 업로드하세요.');
            }

            totalSize += files[i].size;
        }

        if (totalSize > maxSizeBytes) {
            throw new Error("최대 업로드 용량은 " + this.maxSize + "Mb 입니다.");
        }
        /** 업로드 가능 용량 및 이미지 형식 체크 E */
    },
    /**
     * 파일 업로드 처리 
     * 
     * @param {Object} file 파일 객체
     * @param {String} gid 그룹아이디
     * @param {int} draftNo 시안번호
     * @param {String} channel 유입채널
     */
    fileUpload : function(file, gid, draftNo, channel) {
        if (!file || !gid) {
            return;
        }

        var reader = new FileReader();

        // 파일 읽기 완료시
        reader.onload = function() {
            var params = {
                gid : gid,
                fileName : file.name,
                fileType : file.type,
                fileData : reader.result.split("base64,")[1],
                channel : channel || '본사',
                isSingle : 1, // 싱글 파일 업로드,
                isSuccess : 1, // 업로드 후 완료 처리 
            };

            var qs = [];
            for (key in params) {
                qs.push(key + "=" + encodeURIComponent(params[key]));
            }

            params = qs.join("&");
            var xhr = new XMLHttpRequest();
            xhr.open("POST", "/file/ajax");
            xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
            xhr.onreadystatechange = function() {
                if (xhr.readyState == XMLHttpRequest.DONE && xhr.status == 200) {
                    var result = JSON.parse(xhr.response);
                    if (result.message) {
                        alert(result.message);
                        return;
                    }

                    if (result.success && result.data) {
                        var el = document.getElementById("preview_draft_" + draftNo);
                        if (!el) {
                            return;
                        }
                        el.innerHTML = "";
                        
                        var data = result.data;
                        var div = document.createElement("div");
                        var btnWrap = document.createElement("div");
                        btnWrap.className = "controls";

                        /** 미리보기 버튼 처리 S */
                        var imgLink = document.createElement("a");
                        imgLink.href = "/file/view_image/" + data.id;
                        imgLink.target = "_blank";
                        imgLink.className = "sbtn";
                        imgLink.textContent = "미리보기";
                        /** 미리보기 버튼 처리 E */

                        /** 다운로드 버튼 처리 S  */
                        var downloadBtn = document.createElement("a");
                        downloadBtn.href='/file/download/' + data.id;
                        downloadBtn.className = "sbtn";
                        downloadBtn.textContent = "다운로드";
                        /** 다운로드 버튼 처리 E */

                        /** 파일 삭제 버튼 처리 S */
                        var removeBtn = document.createElement("span");
                        removeBtn.className = "sbtn";
                        removeBtn.dataset.id = data.id;
                        removeBtn.textContent = "삭제";
                        removeBtn.addEventListener("click", function(e) {
                            codefty.fileUpload.delete(e, div);
                        });
                        /** 파일 삭제 버튼 처리 E */

                        btnWrap.appendChild(imgLink);
                        btnWrap.appendChild(downloadBtn);
                        btnWrap.appendChild(removeBtn);

                        var img = document.createElement("img");    
                        img.src = data.thumbImageUrl || data.uploadUrl;
                        var input = document.createElement("input");
                        input.type = 'hidden';
                        input.name = 'draftFile' + draftNo;
                        input.value = data.id;
                        
                        div.appendChild(img);
                        div.appendChild(input);
                        div.appendChild(btnWrap);
                        el.appendChild(div);

                        var fileEl = document.getElementById("draftFile_" + draftNo);
                        if (fileEl) fileEl.value = "";

                    }
                }
            };
            xhr.onerror = function(err) {
                console.error(err);
            };
            xhr.send(params);
        };

        reader.onerror = function(err) {
            console.error("파일 업로드 오류", err);
        };
        reader.readAsDataURL(file);
    }
};

window.addEventListener("DOMContentLoaded", function() {
    /** 드래그앤 드롭 처리 S */
    var dropBoxes = document.querySelectorAll(".drop_box");
    for (var i = 0; i < dropBoxes.length; i++) {
        codefty.draft.dragDropUpload(dropBoxes[i]);
    }
    /** 드래그앤 드롭 처리 E */

    /** 파일 업로드 처리 S */
    var fileEls = document.querySelectorAll(".draftFile");
    for(var i = 0; i < fileEls.length; i++) {
        codefty.draft.generalUpload(fileEls[i]);
    }
    /** 파일 업로드 처리 E */

    /** 파일 삭제 처리 S */
    var removes = document.querySelectorAll(".preview_draft .remove");
    for (var i = 0; i < removes.length; i++) {
        removes[i].addEventListener("click", function(e) {
            target = this.parentElement.parentElement;
            codefty.fileUpload.delete(e, target);
        });
    }
    /** 파일 삭제 처리 E */

});