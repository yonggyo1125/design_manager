const customerDao = require("../../models/customer/dao");
const fileDao = require("../../models/file/dao");
const path = require('path');
const axios = require("axios");
const fs = require('fs').promises;
const fs2 = require('fs');

/**
 * 고객 상담 API Service
 * 
 */
const customerService = {
    /**
     * 상담 등록
     * 
     */
    async add(req) {
        const gid = Date.now();
        req.body.gid = gid;
        req.body.isApi = true;
        const result = await customerDao.add(req);
        if (!result) {
            throw new Error("등록에 실패하였습니다.");
        }

        const id = result.id;
        const data = await customerDao.get(id);

        /** 첨부 파일 처리 S */
        let files = req.body.files;
        if (files && typeof files == 'string') {
            files = JSON.parse(files);
        }

        if (files && files.length > 0) {
            for await (const file of files) {
                const fileData = {
                    gid,
                    fileName : file.uploadFileNm,
                    fileType : "text/plain",
                    channel : data.channel,
                    isSucces : true,
                    idManager : 0,
                };
                const fileInfo = await fileDao.saveInfo(fileData);
                if (fileInfo) {
                    const id = fileInfo.id;
                    const folder = id % 10;
                    const dirPath = path.join(__dirname, `../../public/upload/${folder}/`);
                    try {
                        await fs.access(dirPath, constants.F_OK);
                    } catch (err) {
                        if (err.code == 'ENOENT') {
                            await fs.mkdir(dirPath);
                        }
                    }

                    const filePath = dirPath + id;

                    const response = await axios({ 
                        method : 'get',
                        url : file.fileUrl,
                        responseType : 'stream',
                    });
                    response.data.pipe(fs2.createWriteStream(filePath));
                } // endif 
            }

            
        }
        /** 첨부 파일 처리 E */

        return data;
    },
    /**
     * 상담 조회
     * 
     */
    async get(req) {
        const id = req.params.id || req.query.id;
        if (!id) {
            throw new Error("잘못된 접근입니다.");
        }

        const data = await customerDao.get(id);
        if (!data) {
            throw new Error("등록된 상담이 아닙니다.");
        }

        return data;
    },
    /**
     * 상담 삭제
     * 
     * @param {*} req 
     */
    async delete(req) {
        const id = req.params.id || req.query.id;
        if (!id) {
            throw new Error("잘못된 접근입니다.");
        }

        const result = await customerDao.delete(id);
        if (!result) {
            throw new Error("상담에 실패하였습니다.");
        }
        
        return true;
    },
    /**
     * 상담 분류 조회
     * 
     */
    async getCategories() {
        const data = await customerDao.getCategories();
        return data;
    }
};  

module.exports = customerService;