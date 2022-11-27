window.addEventListener("DOMContentLoaded", function() {
    /** 법인인감 이미지 등록  S */
    var companyStampUploadEl = document.getElementById("companyStampUpload");
    if (companyStampUploadEl) {
        companyStampUploadEl.addEventListener("change", function(e) {
            try {
                var file =  this.files[0];
                if (!file) return;
                if (file.type.indexOf("image") == -1) {
                    throw new Error('이미지 형식만 업로드하세요.');
                }

                var formData = new FormData();
                formData.enctype="multipart/form-data";
                formData.append("image", file);
                formData.append("gid", "company_stamp");
                var xhr = new XMLHttpRequest();
                xhr.open("POST", "/basic/company_stamp?gid=company_stamp&isSingle=1");
                xhr.onreadystatechange = function() {
                    if (xhr.readyState == XMLHttpRequest.DONE && xhr.status == 200) {
                        var result = JSON.parse(xhr.responseText);
                        if (result.isSuccess) {
                            var data = result.data;
                            var companyStampFileId = document.querySelector("input[name='companyStampFileId']");
                            if (companyStampFileId) companyStampFileId.value = data.id;

                            var companyStampImage = document.getElementById("companyStampImage");
                            if (companyStampImage) {
                                var imgLink = document.createElement("a");
                                imgLink.href = "/file/download/" + data.id;
                                imgLink.target = "_blank";
                                var img = document.createElement("img");
                                img.src = data.uploadUrl;
                                img.width=100;
                                imgLink.appendChild(img);
                                companyStampImage.innerHTML = "";
                                companyStampImage.appendChild(imgLink);
                            }
                           
                        } else {
                            if (result.message) {
                                alert(result.message);
                            }
                        }
                        e.target.value = "";
                    }
                };
                xhr.send(formData);
            } catch (err) {
                alert(err.message);
            }
        });
    }
    /** 법인 인감 이미지 등록 E */
});