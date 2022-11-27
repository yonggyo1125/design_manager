window.addEventListener("DOMContentLoaded", function() {
    CKEDITOR.replace("text1");
    CKEDITOR.config.height=300;
    CKEDITOR.config.font_names="나눔고딕; 맑은고딕; 굴림체; 명조체; 바탕체; 돋움체; 궁서체; Arial/Arial, Helvetica, sans-serif;Comic Sans MS/Comic Sans MS, cursive;Courier New/Courier New, Courier, monospace;Georgia/Georgia, serif;Lucida Sans Unicode/Lucida Sans Unicode, Lucida Grande, sans-serif;Tahoma/Tahoma, Geneva, sans-serif;Times New Roman/Times New Roman, Times, serif;Trebuchet MS/Trebuchet MS, Helvetica, sans-serif;Verdana/Verdana, Geneva, sans-serif";

     /** 파일첨부 버튼 클릭 처리 S */
     const attachFileEls = document.getElementsByClassName("attach_file");
     for (const el of attachFileEls) {
         el.addEventListener("click", function() {
             const fileEl = el.querySelector(".uploadFile");
             if (fileEl) {
                 fileEl.click();
             }
 
         });
     }
});

function fileUploadCallback(data, el) {
    if (!data || !el) {
        return;
    }

    const attachFilesEl = el.parentElement.parentElement.querySelector(".attach_files");
    const tplEl = document.getElementById("fileTpl");

    const ckeEl = document.getElementById("cke_text1");
    
    if (ckeEl) {
        const w = ckeEl.clientWidth - 20;
        const imgTag = `<img src='${data.uploadUrl}' style='max-width: ${w}px;'>`;
        CKEDITOR.instances.text1.insertHtml(imgTag);
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
        /** 삭제 이벤트 처리 E */
    } // endif 
}