/**
 * 댓글 관련
 * 
 */
var codefty = codefty || {};
codefty.comment = {
        /** 이미지 본문 추가 */
    insertImage(e) {
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
            CKEDITOR.instances.comment_form.insertHtml(img);
        };
    }
};


window.addEventListener("DOMContentLoaded", function() {
    if (typeof CKEDITOR != 'undefined') {
        CKEDITOR.replace("comment_form");
        CKEDITOR.config.height=90;
        CKEDITOR.config.extraAllowedContent ='img[src,width,height,maxWidth,alt,title]';
    }

    /** 파일첨부 버튼 클릭 처리 S */
    const attachFileEls = document.getElementsByClassName("attach_comment_files");
    for (const el of attachFileEls) {
        el.addEventListener("click", function() {
            const fileEl = el.querySelector(".uploadFile");
            if (fileEl) {
                fileEl.click();
            }

        });
    }
    /** 파일첨부 버튼 클릭 처리 E */

    /** 에디터 사이즈 통제 S */
    const editorSizeEls = document.querySelectorAll(".editor_size i");
    for (const el of editorSizeEls) {
        el.addEventListener("click", function() {

            if (this.classList.contains("minus")) { // 축소
                CKEDITOR.config.height -= 100;
                if (CKEDITOR.config.height < 90) CKEDITOR.config.height = 90;
            } else { // 확대
              CKEDITOR.config.height += 100;
            }
            const editor = CKEDITOR.instances.comment_form;
            if (editor) { 
                const html = editor.getData();
                editor.destroy(true); 
                CKEDITOR.replace("comment_form", CKEDITOR.config);
                setTimeout(function() {
                    CKEDITOR.instances.comment_form.insertHtml(html);
                }, 600);
            }
            
        });
     }
     /** 에디터 사이즈 통제 E */

     /** 댓글 작성 후 해당 댓글 위치로 이동 S */
     const idCommentEl = document.querySelector("input[name='idComment']");
     if (idCommentEl) {
        const idComment = idCommentEl.value;
        const el = document.getElementById(`comment_${idComment}`);
        if (el) {
            const rect = el.getBoundingClientRect();
            const top = window.pageYOffset + rect.top - 100;
            setTimeout(function() {
                scrollTo(0, top);
            }, 700);
        }
     }
     /** 댓글 작성 후 해당 댓글 위치로 이동 E */

     /** 이미지 본문 추가 S */
    const insertImageEls = document.getElementsByClassName("insetImage");
    for (const el of insertImageEls) {
        el.addEventListener("click", codefty.comment.insertImage);
    }
    /** 이미지 본문 추가 E */
});

/** 파일 업로드 콜백 처리 S */
function fileUploadCallback(data, el) {
    if (!data || !el) {
        return;
    }
   
    const gid = data.gid;
    if (gid.indexOf("images") != -1) { // 이미지 첨부
        const ckeEl = document.getElementById("cke_comment_form");
        if (ckeEl) {
            const w = ckeEl.clientWidth - 20;
            const imgTag = `<img src='${data.uploadUrl}' style='max-width: ${w}px;'>`;
            CKEDITOR.instances.comment_form.insertHtml(imgTag);
        }
    }

    const attachFilesEl = el.parentElement.parentElement.querySelector(".attach_files");
    const tplEl = document.getElementById("fileTpl");

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
        deleteFileEl.addEventListener("click", codefty.fileUpload.delete)
        /** 삭제 이벤트 처리 E */

        const insertImageEl = document.createElement("i");
        insertImageEl.dataset.id=data.id;
        insertImageEl.className = "insetImage xi-file-upload";
        liEl.insertBefore(insertImageEl, deleteFileEl);
        insertImageEl.addEventListener("click", codefty.comment.insertImage);
    } // endif  
}