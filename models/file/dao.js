const { getException, logger } = require('../../library/common');
const sharp = require('sharp');

/** 예외 S */
const FileUploadException = getException("File/FileUploadException");
const FileDeleteException = getException("File/FileDeleteException");
/** 예외 E */

const { FileInfo, Sequelize : { Op } } = require('../index');
const fs = require('fs').promises;
const constants = require('fs').constants;
const path = require('path');

/**
 * 파일 관련 
 * 
 */
const fileDao = {
    // 최대 업로드 가능 파일 용량
    maxFileSize : 1024 * 1024 * 1024,
    /**
     * ajax 파일 업로드 처리 
     * 
     * @param {Object} data 
     * @throws {FileUploadException}
     */
    async updateAjax(data) {
        const isSingle = (data.isSingle == "1")?true:false;
        if (isSingle && data.gid) { // 단일 파일 업로드인 경우 기 업로드 파일 삭제 
            await this.deletes(data.gid);
        }
        
        if (!data.fileData) {
            throw new FileUploadException("파일데이터(fileData)가 누락되었습니다.");
        }

        const fileInfo = await this.saveInfo(data);
        if (!fileInfo) {
            throw new FileUploadException("파일정보 저장에 실패하였습니다.");
        }

        const id = fileInfo.id;
        const folder = id % 10;
        const dirPath = path.join(__dirname, `../../public/upload/${folder}`);
        try {
            await fs.access(dirPath, constants.F_OK);
        } catch (err) {
            if (err.code == 'ENOENT') {
                await fs.mkdir(dirPath);
            } else {
                throw new FileUploadException("파일업로드에 실패하였습니다.");
            }
        }

        const buffer = Buffer.from(data.fileData, 'base64');
        await fs.writeFile(dirPath + "/" + id, buffer);
       

        /** Thumbail 이미지 처리 S */ 
        if (fileInfo.fileType.indexOf("image") != -1) {
            const thumbDirPath = path.join(__dirname, `../../public/upload/${folder}/thumbs`);
            try {
                await fs.access(thumbDirPath, constants.F_OK);
            } catch (err) {
                if (err.code == 'ENOENT') {
                    await fs.mkdir(thumbDirPath);
                }
            }
            
            await sharp(buffer) 
                    .resize(200, 200, { fit : sharp.fit.cover })
                    .toFile(thumbDirPath + `/${id}.png`);
        }
        /** Thumbail 이미지 처리 E */ 
        
        /** 업로드 후 바로 완료처리인 경우  */
        if (data.isSuccess && data.gid) {
            this.updateDone(data.gid);
        }

        const info = await this.get(id);
        return info;
    },
    /**
     * 파일 업로드 정보 저장 
     * 
     * @param {Object} data 
     * @return {Boolean}
     * @throws {FileUploadException}
     */
    async saveInfo(data) {
        /** 필수 항목 체크  */
        if (!data.gid || !data.fileName || !data.fileType) {
            throw new FileUploadException("필수 파일 정보 누락(gid, fileName, fileType)");
        }
        
        try {
            const params = {
                gid : data.gid,
                fileName : data.fileName,
                fileType : data.fileType,
                channel : data.channel || "본사",
                isSuccess : data.isSucces || false,
                idManager : data.idManager,
            };
            const fileInfo = await FileInfo.create(params);

            if (!fileInfo) {
                return false;
            }

            return fileInfo;
        } catch (err) {
            logger(err);
            return false;
        }
        
    },
    /**
     * 파일 정보 조회
     * 
     * @param {int} id 파일 등록번호 
     * @return {Array|Boolean}
     */
    async get(id) {
        if (!id) {
            return false;
        }

        try {
            const fileInfo = await FileInfo.findOne({
                 where : { id },
                 raw : true,
            });
            if (fileInfo) {
                fileInfo.uploadPath = this.getUploadPath(id);
                fileInfo.uploadUrl = this.getUploadUrl(id);
                // 이미지인 경우 thumbnail URL, PATH 함께 조회 */
                if (fileInfo.fileType.indexOf("image") != -1) {
                    fileInfo.thumbImageUrl = this.getThumbImageUrl(id);
                    fileInfo.thumbImagePath = this.getThumbImagePath(id);
                }
                return fileInfo;
            }
        } catch (err) {
            logger(err);
        }
        return false;
    },
    /**
     * 업로드 파일 목록 
     * 
     * @param {String} gid 그룹아이디
     * @param {Boolean} isSucess true - 완료처리된 파일만 조회 
     */
    async gets(gid, isSuccess, transaction) {
        if (!gid) {
            return false;
        }
        try {
            const where = {};
            if (String(gid).indexOf("order_") == -1) { 
                where.gid = gid;
            } else { // 주문서 첨부 파일인 경우 
                where.gid = { [Op.like] : `${gid}%` };
            }

            if (isSuccess) {
                where.isSuccess = true;
            }   
            const params = {
                where,
                order : [[ 'id', 'ASC' ]],
                raw : true,
            };
            
            if (transaction) params.transaction = transaction;

            const list = await FileInfo.findAll(params);
            if (!list) {
                return false;
            }
           
            list.forEach((v, i, _list) => {
                _list[i].uploadUrl = fileDao.getUploadUrl(v.id);
                _list[i].uploadPath = fileDao.getUploadPath(v.id);
                // 이미지를 업로드한 경우 thumb 이미지 경로 생성 
                if (v.fileType.indexOf("image") != -1) { 
                    _list[i].thumbImageUrl = fileDao.getThumbImageUrl(v.id);
                    _list[i].thumbImagePath = fileDao.getThumbImagePath(v.id);
                }
            });

            return list;
        } catch (err) {
            logger(err);
            return false;
        }
    },
    /**
     * 업로드된 파일 완료 처리
     *  - isSuccess를 true로 변경
     * 
     * @param {String} gid 그룹 ID 
     */
    async updateDone(gid, transaction ) {
        try {
            const params = { where : { gid }};
            if (transaction) params.transaction = transaction;
            
            await FileInfo.update({
                isSuccess : true,
            }, params);
        } catch (err) {
            logger(err);
            return false;
        }
    },
    /**
     * 파일 삭제 처리 
     * 
     * @param {Int} id 파일 등록번호 
     * @return {Boolean}
     * @throws {FileDeleteException}
     */
    async delete(id, transaction) {
        if (!id) {
            throw new FileDeleteException("잘못된 접근입니다.");
        }

        const info = await this.get(id);
        if (!info) {
            throw new FileDeleteException("삭제할 파일이 없습니다.");
        }

        try {
            try {
                await fs.unlink(info.uploadPath);
                if (info.thumbImagePath) {
                    await fs.unlink(info.thumbImagePath);
                }
            } catch (err) {
                logger(err);
            } 

            const params = { where : { id }};
            if (transaction) params.transaction = transaction;
            const result = await FileInfo.destroy(params);
            return result > 0;
        } catch (err) {
            logger(err);
            return false;
        }
    },
    /**
     * 파일 목록 삭제
     * 
     * @param {String} gid 그룹ID 
     * @throws {FileDeleteException}
     */
    async deletes(gid, transaction) {
        if (!gid) {
            throw new FileDeleteException("잘못된 접근입니다.");
        }

        try {
            const list = await this.gets(gid, false, transaction);
            const ids = [];
            for await (v of list) {
                ids.push(v.id);
                try {
                    await fs.unlink(v.uploadPath);
                    if (v.thumbImagePath) {
                        await fs.unlink(v.thumbImagePath);
                    }
                } catch (err) {}
            }

            if (ids.length > 0) {
                const params = {
                    where : {
                        id : { [Op.in] : ids }
                    }
                };
                
                if (transaction) params.transaction = transaction;

                await FileInfo.destroy(params);
            }

            return true;
        } catch(err) {
            logger(err);
            return false;
        }
    },
    /**
     * 업로드 URL 
     * 
     * @param {int} id 
     */
    getUploadUrl(id) {
        const folder = id % 10;
        const url = `/upload/${folder}/${id}`;
        return url;
    },
    /**
     * 업로드 Path
     * 
     * @param {int} id 
     * @returns 
     */
    getUploadPath(id) {
        const folder = id % 10;
        const _path = path.join(__dirname, `../../public/upload/${folder}/${id}`);
        return _path;
    },
    /**
     * thumbnail 이미지 URL 조회 
     * 
     * @param {int} id 
     */
    getThumbImageUrl(id) {
        const folder = id % 10;
        const url = `/upload/${folder}/thumbs/${id}.png`;
        return url;
    },
    /**
     * thumbnail 이미지 Path
     * 
     * @param {int} id 
     */
    getThumbImagePath(id) {
        const folder = id % 10;
        const _path = path.join(__dirname, `../../public/upload/${folder}/thumbs/${id}.png`);
        return _path;
    },
    /**
     * multer 파일 업로드 미들웨어 
     * 
     */
     getUploads() {
        const multer = require('multer');
        const upload = multer({
            storage : multer.diskStorage({
                async destination(req, file, done) {
                    const gid = req.body.gid || req.query.gid;
                    const isSingle = req.body.isSingle || req.query.isSingle;
                    
                    if (isSingle && gid) { // 단일 파일 업로드인 경우 기 업로드 파일 삭제 
                        await fileDao.deletes(gid);
                    }

                    const channel = req.body.channel || "본사";
                    const data = { 
                        gid,
                        fileName : file.originalname,
                        fileType : file.mimetype,
                        channel,
                    };
                    if (req.isLogin) {
                        data.idManager = req.manager.id;
                    }
                    
                    const fileInfo  =  await fileDao.saveInfo(data);
                    if (!fileInfo) {
                        throw new FileUploadException("파일 정보 저장에 실패하였습니다.");                    
                    }

                    const id = fileInfo.id;
                    const folder = id % 10;
                    const dirPath = path.join(__dirname, `../../public/upload/${folder}`);
                    try {
                        await fs.access(dirPath, constants.F_OK);
                    } catch (err) {
                        if (err.code == 'ENOENT') {
                            await fs.mkdir(dirPath);
                        } else {
                            throw new FileUploadException("파일업로드에 실패하였습니다.");
                        }
                    }
                    file.idFile = id;
                    done(null, dirPath);
                },
                filename(req, file, done) { 
                   done(null, "" + file.idFile);
                },
            }),
            limits : { fileSize : fileDao.maxFileSize },
        });

        return upload;
    }
};

module.exports = fileDao;