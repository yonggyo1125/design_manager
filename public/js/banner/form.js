/**
 * 배너 등록/수정
 * 
 */

/**
 * 파일 업로드 후 콜백처리 
 * 
 * @param {Object} data 업로드 데이터
 * @param {Object} el 파일 업로드 요소 
 */
 function fileUploadCallback(data, el) {
    if (!data || data.fileType.indexOf("image") == -1 || !el) {
        return;
    }

    /** 기 업로드 요소 삭제 S */
    var bannerImages = document.getElementsByClassName("bannerImages");
    for (var i = 0; i < bannerImages.length; i++) {
        bannerImages[i].parentElement.removeChild(bannerImages[i]);
    }
    /** 기 업로드 요소 삭제 E */
    var div = document.createElement("div");
    var br = document.createElement("br")
    var span = document.createElement("span");
    var img = document.createElement("img");
    var remove = document.createElement("i");
    var downloadBtn = document.createElement("a");
    div.className = "bannerImages";
    span.className = "images";
    remove.className = "xi-close deleteFile";
    remove.dataset.id = data.id;
   
    div.style.marginTop = "10px";

    span.style.display = "inline-block";
    span.style.border = "2px solid #000000";
    span.style.position = "relative";
    
    img.src = data.uploadUrl;
    img.style.maxHeight='200px';
    img.style.display = "block";

    remove.style.position = "absolute";
    remove.style.top="0px";
    remove.style.right="0px";
    remove.style.fontSize="1rem";
    remove.style.color="#ffffff";
    remove.style.backgroundColor = "#000000";
    remove.style.cursor = "pointer";
    remove.style.padding = "5px";

    remove.addEventListener("click", codefty.fileUpload.delete);

    downloadBtn.href='/file/download/' + data.id
    downloadBtn.className = "sbtn";
    downloadBtn.appendChild(document.createTextNode("다운로드"));
    span.appendChild(img);
    span.appendChild(remove);
    div.appendChild(span);
    div.appendChild(br);
    div.appendChild(downloadBtn);
    el.parentElement.appendChild(div);
 }