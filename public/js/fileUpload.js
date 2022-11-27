/**
 * ajax 파일 업로드 
 * 
 */
var codefty = codefty || {};
codefty.fileUpload = {
    /**
     * 파일 Ajax 업로드 처리 
     * 
     * @param {Object} e 이벤트 객체
     */
    processAjax : function(e) {
        try {
            var target = e.currentTarget;
            var fileType = target.dataset.fileType;
            var gid = target.dataset.gid;
            var channel = target.dataset.channel || "본사";
            var isSingle = target.dataset.isSingle?1:0;
            if (!gid) {
                throw new Error('잘못된 접근입니다.');
            }


            var file = target.files[0];
            if (fileType == 'image' && file.type.indexOf("image") == -1) {
                throw new Error("이미지형식의 파일만 업로드 가능합니다.");
            };

            var reader = new FileReader();
            reader.onload = function() {
                var base64 = reader.result.split("base64,")[1];
                var params = 'gid=' + encodeURIComponent(gid) + '&fileName='+ encodeURIComponent(file.name) + "&fileType=" + encodeURIComponent(file.type) + "&fileData=" + encodeURIComponent(base64) + "&isSingle=" + isSingle + "&channel=" + encodeURIComponent(channel);
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

                        if (result.success && result.data && typeof fileUploadCallback == 'function') {
                            fileUploadCallback(result.data, target);
                        }

                        target.value = "";
                    }
                };
                xhr.onerror = function(err) {
                    console.error(err);
                    throw new Error("파일 업로드 실패하였습니다.");
                };

                xhr.send(params);
            };

            reader.readAsDataURL(file);
        } catch (err) {
            alert(err.message);
        }
    },
    /**
     * 파일 삭제 처리 
     * 
     * @param {Object} e 
     * @param {Object} parentEl 삭제후 제거할 부모 요소
     */
    delete : function(e, parentEl) {
        if (!confirm('정말 삭제하시겠습니까?')) {
            return;
        }
        
        try {
            var target = e.currentTarget || e.target;
            var id = target.dataset.id;
            if (!id) {
                throw new Error("잘못된 접근입니다.");
            }

            var xhr = new XMLHttpRequest();
            xhr.open("GET", "/file/delete/" + id);
            xhr.onreadystatechange = function() {
                if (xhr.readyState == XMLHttpRequest.DONE && xhr.status == 200) {
                    var result = JSON.parse(xhr.responseText);
                    if (result.message) {
                        alert(result.message);
                        return;
                    }

                    if (result.success) {
                        parentEl = parentEl || target.parentElement;
                        parentEl.parentElement.removeChild(parentEl);

                        /** 파일 삭제 후 콜백 처리 S */
                        let _target;
                        if (parent) _target = parent;

                        if (opener) _target = opener;
                        
                        _target.postMessage({ mode : "fileDelete_callback", id : id }, "*");
                        /** 파일 삭제 후 콜백 처리 E */
                    }
                }
            };
            xhr.send(null);
        } catch (err) {
            alert(err.message);
        }
    },
    /**
     * 파일 업로드 팝업 
     * 
     * @param {String} gid 
     * @param {function} callback 
     */
    
    showPopup : function(gid) {
        gid = gid || Date.now();
        var url = "/file/upload?gid=" + gid+"&isPopup=1";
        var popup = codefty.popup;
        popup.open(url, "파일업로드", 320, 500, true);

    },
    /**
     * 드래그앤 드롭 파일 업로드 
     * 
     * @param {Object} el 
     */
    dragDropUpload : function(el) {
        if (!el) {
            return;
        }

        var gid = el.dataset.gid || Date.now();
        var channel = el.dataset.channel || "본사";
        
        el.addEventListener("dragover", function(e) {
            e.preventDefault();
        });

        el.addEventListener("drop", function(e) {
            e.preventDefault();
            var maxSize = e.currentTarget.dataset.maxSize || 20;
            var maxSizeBytes = parseInt(maxSize) * 1024 * 1024;
            
           
            var files = e.dataTransfer.files;
            if (!files) return;
            // 업로드 총 용량 
            var totalSize = 0;
            for (var i = 0; i < files.length; i++) {
                totalSize += files[i].size;
            }
            if (totalSize > maxSizeBytes) {
                alert("최대 업로드 용량은 " + maxSize + "Mb 입니다.");
                return;
            }
            
            for (var i = 0; i < files.length; i++) {
                upload(files[i], gid);
            }
        });
        
        /**
         * 파일 업로드 처리 
         * 
         * @param {Object} file
         * @param {String} gid 그룹아이디
         */
        function upload(file, gid) {
           if (!file || !gid)
                return;

            
            var progressBar, fileBox;
            var fileList = document.getElementById("file_list");

            var reader = new FileReader();
            // 파일 읽기 시작
            reader.onloadstart = function(e) {
                fileBox = document.createElement("li");
                var div1 = document.createElement("div");
                div1.className = "file_name";
                progressBar = document.createElement("div");
                progressBar.className = "progress";
                
                var fileName = document.createTextNode(file.name);
                div1.appendChild(fileName);
                fileBox.appendChild(div1);
                fileBox.appendChild(progressBar);
                fileList.appendChild(fileBox);
            };

            // 파일 읽기 진행 
            reader.onprogress = function(e) {
                var loaded = e.loaded;
                var total = e.total;
                var per = Math.round(loaded / total * 10000) / 100;
                if (progressBar) progressBar.innerHTML = per + "%";
            };

            // 파일 읽기 완료 
            reader.onload = function() {
                var params = {
                    gid : gid,
                    fileName : file.name,
                    fileType : file.type,
                    fileData : reader.result.split("base64,")[1],
                    channel : channel,                    
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
                            /** 삭제버튼 처리 S */
                            if (fileBox) {
                                var input = document.createElement("input");
                                input.type = "hidden";
                                input.name = "idFileInfo";
                                input.value = result.data.id;
                                var div = document.createElement("div");
                                var remove = document.createElement("i");
                                remove.className = "xi-minus-square remove";
                                remove.dataset.id = result.data.id;
                                div.appendChild(remove);
                                fileBox.appendChild(div);
                                fileBox.appendChild(input);
                                remove.addEventListener("click", function(e) {
                                    codefty.fileUpload.delete(e, fileBox);
                                });
                            }
                            /** 삭제버튼 처리 E */
                            /** 파일 업로드 후 콜백 처리 S */
                            let target;
                            if (parent) target = parent;

                            if (opener) target = opener;
                            
                            target.postMessage({ mode : "fileUpload_callback", data : result.data}, "*");
                            /** 파일 업로드 후 콜백 처리 E */
                        }
                    }
                };

                xhr.onerror = function(err) {
                    console.error(err);
                };
                xhr.send(params);
            };
            reader.readAsDataURL(file);
        }
    },
    /**
     * 파일 업로드 완료 처리 
     * 
     * @param String {gid}
     */
    async doneUploadFiles(gid) {
        return new Promise((resolve, reject) => {
            const url = `/file/done/${gid}`;
            const xhr = new XMLHttpRequest();
            xhr.open("GET", url);
            xhr.onreadystatechange = function() {
                if (xhr.status == 200 && xhr.readyState == XMLHttpRequest.DONE) {
                    resolve(xhr.responseText);
                }
            };

            xhr.onerror = function(err) {
                reject(err);
            };
            xhr.send(null);
        });
        

    }
};

window.addEventListener("DOMContentLoaded", function() {
    /** Ajax 파일 업로드 처리 S */
    var uploadFiles = document.getElementsByClassName("uploadFile");
    for(var i = 0; i < uploadFiles.length; i++) {
        uploadFiles[i].addEventListener("change", codefty.fileUpload.processAjax);
    }
    /** Ajax 파일 업로드 처리 E */

    /** 파일 삭제 처리 S */
    var deleteFiles = document.getElementsByClassName("deleteFile");
    for(var i = 0; i < deleteFiles.length; i++) {
        deleteFiles[i].addEventListener("click", codefty.fileUpload.delete);
    }
    /** 파일 삭제 처리 E */

    /** 팝업 파일 업로드 파일 추가 버튼 처리 S */
    var addFiles = document.querySelector(".body-file-upload #add_files");
    if (addFiles) {
        addFiles.addEventListener("click", function() {
            var attaches = document.querySelector(".body-file-upload #attaches");
            if (!attaches)
                return;

            var li = document.createElement("li");
            var input = document.createElement("input");
            input.type = "file";
            input.name = "attachFiles";
            var remove = document.createElement("i");
            remove.className = "xi-minus-square remove_files";
            li.appendChild(input);
            li.appendChild(remove);

            attaches.appendChild(li);

            remove.addEventListener("click", function() {
            var parent = this.parentElement;
            parent.parentElement.removeChild(parent);
            });
        });
    }
    /** 팝업 파일 업로드 파일 추가 버튼 처리 E */
    
    /** 드래그앤 드롭 파일 업로드 처리 S */
    var dropBox = document.querySelector(".body-file-upload .drop_box");
    if (dropBox) {
        codefty.fileUpload.dragDropUpload(dropBox);
    }
    /** 드래그앤 드롭 파일 업로드 처리 E */
});