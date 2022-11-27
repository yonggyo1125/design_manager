/**
 * 작업 관리 
 * 
 */
const workManager = {
    /**
     * 진행상황 변경
     * 
     */
    changeStatus(e) {
        if (!confirm('정말 수정하시겠습니까?')) {
            return;
        }

        const el = e.currentTarget;
        const parentEl = el.parentElement;
        const idOrderItem = parentEl.dataset.idOrderItem;
        const workStatusEl = parentEl.querySelector(".workStatus");
        const workStatus = workStatusEl.value;
        const xhr = new XMLHttpRequest();
        const data = {
            mode : "status_change",
            idOrderItem,
            workStatus,
        };

        xhr.open("POST", "/work");
        xhr.setRequestHeader("Content-Type", "application/json; charset=UTF-8");

        xhr.onreadystatechange = function() {
            if (xhr.status == 200 && xhr.readyState == XMLHttpRequest.DONE) {
                const result = JSON.parse(xhr.responseText);
                if (!result.isSuccess) {
                    alert(result.message);
                    return;
                }

                alert("변경되었습니다.");
            }
        };

        xhr.send(JSON.stringify(data));
    }
};

/** 이벤트 처리  */
window.addEventListener("DOMContentLoaded", function() {
    /** 작업자 진행상황 변경 처리 S  */
    const changeWorkStatusEls = document.getElementsByClassName("change_work_status");
    for (let el of changeWorkStatusEls) {
        el.addEventListener("click", workManager.changeStatus);
    } 
    /**  작업자 진행상황 변경 처리 E  */

    /** 작업자 업로드  파일 삭제 S */
    const removeFileEls = document.getElementsByClassName("remove_files");
    for (let el of removeFileEls) {
        el.addEventListener("click", codefty.fileUpload.delete);
    }
    /** 작업자 업로드  파일 삭제 E */
});

/** 파일 업로드 및 삭제 콜백 처리 S */
window.addEventListener("message", async function(e) {
    const mode = e.data.mode;
    switch (mode) {
        // 파일 업로드 콜백
        case "fileUpload_callback" : 
             const data  = e.data.data;
            const fileTplEl = document.getElementById("fileTpl");
            if (!fileTplEl || !data) {
                return;
            }

            const domParser = new DOMParser();
            for await (file of data) {
                let html = fileTplEl.innerHTML;
                const uid = file.gid.replace("work_", "");
                const attachFilesEl = document.getElementById(`attached_files_${uid}`);
                if (!attachFilesEl) {
                    continue;
                }

                html = html.replace(/#\[id\]/g, file.id)
                                    .replace(/#\[fileName\]/g, file.fileName);
                
                const dom = domParser.parseFromString(html, "text/html");
                const liEl = dom.querySelector("li");

                /**  삭제 이벤트 처리 S */
                const removeEl = liEl.querySelector(".remove_files");
                removeEl.addEventListener("click", codefty.fileUpload.delete);
               /**  삭제 이벤트 처리 E */

               attachFilesEl.appendChild(liEl);
        
               await codefty.fileUpload.doneUploadFiles(file.gid);
            }

            break;
    }
});
