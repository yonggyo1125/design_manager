const express = require('express');
const { alert, getException, getConfig } = require('../../library/common');
/** 예외 S */
const FileUploadException = getException("File/FileUploadException");
const FileDeleteException = getException("File/FileDeleteException");
const FileDownloadException = getException("File/FileDownloadException");
const FileTypeException = getException("File/FileTypeException");
const FileNotFoundException = getException("File/FileNotFoundException");
/** 예외 E */

const fileDao = require('../../models/file/dao'); 
const router = express.Router();

/** 파일 업로드 설정  */
const upload = fileDao.getUploads();

/**
 * ajax 파일 업로드 
 * 
 */
router.post("/ajax", async (req, res) => {
    let result = {};
     try {
        req.body.channel = req.body.channel || "본사";
        const fileInfo = await fileDao.updateAjax(req.body);
        
        if (!fileInfo) {
            throw new FileUploadException("파일업로드에 실패하였습니다.");
        }
       
        result = {
            success : true,
            data : fileInfo,
        };
     } catch (err) {
        result = {
            success : false,
            message : err.message
         };
     }
     res.json(result);
});

/** 파일 삭제 */
router.get("/delete/:id", async (req, res) => {
    let message, data;
    let success = false;
    const id = req.params.id;
    try {
        const result = await fileDao.delete(id);
        if (!result) {
            throw new FileDeleteException("파일삭제에 실패하였습니다.");
        }

        success = true;
    } catch(err) {
        success = false;
        message = err.message;
    }

    res.json({ success, message, data});
});

/** 파일 다운로드  */
router.get("/download/:id", async (req, res) => {
    try {
        const id = req.params.id;
        const fileInfo = await fileDao.get(id);
        if (!fileInfo) {
            throw new FileDownloadException("존재하지 않는 파일입니다.");
        }

        res.header("Content-Description", "File Transfer");
		res.header("Content-Type", "application/octet-stream");
		res.header("Content-Disposition", "attachment; filename=" + encodeURIComponent(fileInfo.fileName));
		res.header("Expires", 0);
		res.header("Cache-Control", "must-revalidate");
		res.header("Pragma", "public");
		res.sendFile(fileInfo.uploadPath);

    } catch (err) {
        alert(err.message, res, -1);
    }
});


/**
 * 파일 업로드 팝업
 * 
 */
router.route("/upload")
    .get(async (req, res) => {
        var gid = req.query.gid || Date.now();
        var isPopup = req.query.isPopup?true:false;
        var channel = req.query.channel || "본사";
        const data = {
            gid,
            isPopup,
            channel,
            addScript : ['fileUpload'], 
        };
     
        res.render("file/form", data);
    })
    .post(upload.array('attachFiles'), async (req, res) => {
        try {
            if (req.files.length == 0 && !req.body.idFileInfo) {
                throw new FileUploadException("파일을 업로드하세요.");
            }

            let data = [];
            if (req.files) {
                for (var i = 0; i < req.files.length; i++) {
                    const file = req.files[i];
                    const id = file.idFile;
                    if (!id) continue;

                    const _data = await fileDao.get(id);
                    if (!_data) continue;

                    data.push(_data);
                }
            }
            let script = "<script>";
            if (data.length > 0) {
                data = JSON.stringify(data);
                script += `
                    let target;
                    if (parent.parent) target = parent.parent;

                    if (parent.opener) target = parent.opener;
                    target.postMessage({ mode : "fileUpload_callback", data : ${data}});`;
                    
                    
            }
            script += `
                if (typeof parent.parent.codefty.popup.close == 'function') {
                    parent.parent.codefty.popup.close();
                } else {
                    target.postMessage({mode : "close_popup"}, "*");
                }
                </script>`;
            res.send(script);
        } catch (err) { 
            alert(err.message, res);
        }
    });

/**
 * 이미지 미리 보기 
 * 
 */
router.get("/view_image/:id", async (req, res) => {
    try {
        var id = req.params.id;
        const info = await fileDao.get(id);
        if (!info) {
            throw new FileNotFoundException("등록되지 않은 파일입니다.");
        }

        if (info.fileType.indexOf("image") == -1) {
            throw new FileTypeException("이미지 형식의 파일이 아닙니다.");
        }

        res.send(`<img src='${info.uploadUrl}'>`);
    }  catch (err) {
        alert(err.message, res);
    }
});


/**
 * 파일 업로드 완료 처리 
 * 
 */
router.get("/done/:gid", async (req, res) => {
    try {
        const gid = req.params.gid;
        if (!gid) {
            throw new Error("잘못된 접근입니다.");
        }
        
        await fileDao.updateDone(gid);

    } catch (err) {
        logger(err);
        res.json({ isSuccess : false, message : err.message});
    }
});

module.exports = router;