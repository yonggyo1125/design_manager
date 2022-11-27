window.addEventListener("DOMContentLoaded", function() {
    CKEDITOR.replace("content");
    CKEDITOR.config.height=350;
    CKEDITOR.config.font_names="나눔고딕; 맑은고딕; 굴림체; 명조체; 바탕체; 돋움체; 궁서체; Arial/Arial, Helvetica, sans-serif;Comic Sans MS/Comic Sans MS, cursive;Courier New/Courier New, Courier, monospace;Georgia/Georgia, serif;Lucida Sans Unicode/Lucida Sans Unicode, Lucida Grande, sans-serif;Tahoma/Tahoma, Geneva, sans-serif;Times New Roman/Times New Roman, Times, serif;Trebuchet MS/Trebuchet MS, Helvetica, sans-serif;Verdana/Verdana, Geneva, sans-serif";


    /** 파일 첨부 클릭 처리 S */
    const attachFileEls = document.getElementsByClassName("attach_file");
    for (const el of attachFileEls) {
        el.addEventListener("click", function() {
            const fileEl = el.querySelector(".uploadFile");
            if (fileEl) {
                fileEl.click();
            }

        });
    }
    /** 파일 첨부 클릭 처리 E */

    /** 이미지 본문 추가 S */
    const insertImageEls = document.getElementsByClassName("insetImage");
    console.log(insertImageEls);
    for (const el of insertImageEls) {
        el.addEventListener("click", insertImage);
    }
    /** 이미지 본문 추가 E */
});

/** 파일 업로드 콜백 처리 */
window.addEventListener("message", function(e) {
    const mode = e.data.mode;
    const data = e.data.data;
    const movieEl = document.querySelector(".uploaded_files.movie");
    const imageEl = document.querySelector(".uploaded_files.image");
    console.log(data);
    switch(mode) {
        // 파일 업로드 콜백 
        case "fileUpload_callback" : 
            
            for (const file of data) {

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
                
                remove.addEventListener("click", function(e) {
                    codefty.fileUpload.delete(e, li);
                });

                const gid = file.gid
                if (gid.indexOf("movie") != -1) { // 동영상
                    movieEl.appendChild(li);
                } else { // 안내배너  
                    imageEl.appendChild(li);
                }
            }

            break;
    }
});

/** 파일 업로드 콜백 처리 S */
function fileUploadCallback(data, el) {
    if (!data || !el) {
        return;
    }
    const attachFilesEl = el.parentElement.parentElement.querySelector(".attach_files");
    const tplEl = document.getElementById("fileTpl");

    const gid = data.gid;
    if (gid.indexOf("editor") != -1) { // 이미지 첨부
        const ckeEl = document.getElementById("cke_content");
        if (ckeEl) {
            const w = ckeEl.clientWidth - 20;
            const imgTag = `<img src='${data.uploadUrl}' style='max-width: ${w}px;'>`;
            CKEDITOR.instances.content.insertHtml(imgTag);
        }
    } 

    if (attachFilesEl && tplEl) {
        const domParser = new DOMParser();
        let html = tplEl.innerHTML;
        html = html.replace(/<%=id%>/g, data.id)
                .replace(/<%=fileName%>/g, data.fileName);

        const dom = domParser.parseFromString(html, "text/html");
        const liEl = dom.querySelector("li");
        attachFilesEl.appendChild(liEl);

        /** 삭제 이벤트 처리 S */
        const deleteFileEl = liEl.querySelector(".deleteFile");
        deleteFileEl.addEventListener("click", codefty.fileUpload.delete);
        const insertImageEl = document.createElement("i");
        insertImageEl.dataset.id=data.id;
        insertImageEl.className = "insetImage xi-file-upload";
        liEl.insertBefore(insertImageEl, deleteFileEl);
        insertImageEl.addEventListener("click", insertImage);
        /** 삭제 이벤트 처리 E */
    } // endif 
}
/** 파일 업로드 콜백 처리 E */

/** 이미지 본문 추가 */
function insertImage(e) {
    console.log(e);
    if (typeof CKEDITOR == 'undefined') {
        return;
    }

    const id = e.currentTarget.dataset.id;
    const folder = id % 10;
    const imageSrc = `/upload/${folder}/${id}`;
    const image = new Image();
    image.src=imageSrc;
    image.onload = function() {
        const ckeEl = document.getElementById("cke_content");
        if (ckeEl) {
            const w = ckeEl.clientWidth - 20;
            image.style.maxWidth=w + "px";
        }

        const img = image.outerHTML;
        CKEDITOR.instances.content.insertHtml(img);
    };
}