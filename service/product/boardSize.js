const { getException } = require('../../library/common');
/** 예외 */
const BoardSizeRegisterException = getException("Product/BoardSizeRegisterException");
const BoardSizeUpdateException = getException("Product/BoardSizeUpdateException");
const BoardSizeDeleteException = getException("Product/BoardSizeDeleteException");

const BoardSizeAddRegisterException = getException("Product/BoardSizeAddRegisterException");
const BoardSizeAddUpdateException = getException("Product/BoardSizeAddUpdateException");
const BoardSizeAddDeleteException = getException("Product/BoardSizeAddDeleteException");

/** Dao */
const boardSizeDao = require('../../models/product/boardSizeDao');

/**
 * 보드형 사이즈 관리 Service
 * 
 */
const BoardSizeService = {
    /**
     * 보드형 사이즈 등록 
     * 
     * @param {Object} req
     */
    async add (req) {
        const data = req.body;
        this.validator(data, BoardSizeRegisterException);
        const result = await boardSizeDao.add(data);
        if (!result) {
            throw new BoardSizeRegisterException();
        }
    },
    /**
     * 보드형 사이즈 수정 
     * 
     * @param {Object} req
     */
    async edit(req) {
        const data = req.body;
        if (!data.id) {
            throw new BoardSizeUpdateException("수정할 사이즈를 선택하세요.");
        }

        if  (!Array.isArray(data.id)) {
            data.id = [data.id];
        }
        
        for await (id of data.id) {
            const upData = {
                sizeNm : data[`sizeNm_${id}`],
                sizeDirection : data[`sizeDirection_${id}`],
                sizeType : data[`sizeType_${id}`],
                width : data[`width_${id}`],
                height : data[`height_${id}`],
            };
            await boardSizeDao.edit(id, upData);
        }
    },
    /**
     * 보드형 사이즈 삭제 
     * 
     * @param {Object} req
     */
    async delete(req) {
        const data = req.body;
        if (!data.id) {
            throw new BoardSizeDeleteException("삭제할 사이즈를 선택하세요.");
        }

        await boardSizeDao.delete(data.id);       
    },
    /**
     * 사이즈 목록 
     * @param {string} sizeNm : 설정이름 
     * @param {string} direction : portaint 세로형, landscape 가로형
     * @returns {Boolean|Array}
     */
    async gets(sizeNm, direction) {
        return await boardSizeDao.gets(sizeNm, direction);
    },
    /**
     * 보드형 사이즈 이름 목록 
     * 
     */
    async getSizeNms() {
        return await boardSizeDao.getSizeNms();
    },
    /**
     * 보드형 사이즈 추가설정 등록
     * 
     * @param {Object} req : 요청 데이터
     */
    async addConfig(req) {
        const data = req.body;
        await this.validatorAdd(data, BoardSizeAddRegisterException);

        const result = await boardSizeDao.addConfig(data);
        if (!result) {
            throw new BoardSizeAddRegisterException();
        }
    },
    /**
     * 보드형 사이즈 추가설정 수정 
     * 
     * @param {Object} req : 요청 데이터
     */
    async editConfig(req) {
        const data = req.body;
        let ids = data.id;
        if (!ids) {
            throw new BoardSizeAddUpdateException("수정할 추가설정을 선택하세요.");
        }

        if (!(ids instanceof Array)) {
            ids = [ids];
        }

        for await (id of ids) {
            const upData = {
                configNm : data[`configNm_${id}`],
                minPrice : data[`minPrice_${id}`] || 0, 
                addPriceByArea : data[`addPriceByArea_${id}`],
                exceptMinSize : data[`exceptMinSize_${id}`] || 0,
                minSize : data[`minSize_${id}`] || 0,
                maxSize : data[`maxSize_${id}`] || 0,
            };

            await boardSizeDao.editConfig(id, upData);
        }
    },
    /**
     * 보드형 사이즈 추가설정 삭제
     * 
     * @param {Object} req : 요청 데이터
     */
    async deleteConfig(req) {
        const data = req.body;
        const ids = data.id;
        if (!ids) {
            throw new BoardSizeAddDeleteException("삭제할 추가설정을 선택하세요.");
        }

        await boardSizeDao.deleteConfig(ids);
    },
    /** 
     * 보드형 사이즈 추가설정 목록 
     * 
     */
    async getConfigs() {
        return await boardSizeDao.getConfigs();
    },
    /**
     * 보드형 사이즈 추가 설정 조회
     * 
     * @param {int} id
     */
    async getConfig(id) {
        return await boardSizeDao.getConfig(id);
    },
    /**
     * 유효성 검사
     * 
     * @param {object} data
     * @param {Object} Exception
     * 
     * @throws {Error} BoardSizeRegisterException|BoardSizeUpdateException,BoardSizeDeleteException
     */
     validator(data, Exception) {
        Exception = Exception || Error;
        const required = {
            sizeNm : '설정이름을 입력하세요',
            sizeDirection : '사이즈방향을 선택하세요',
            sizeType : '사이즈 종류를 입력하세요',
        };
        
        for (key in required) {
            if (!data[key] || data[key].trim() == "") {
                throw new Exception(required[key]);
            }
        }
    },
    /**
     * 보드형 사이즈 추가 설정 유효성 검사
     * 
     * @param {object} data
     * @param {Object} Exception
     * 
     * @throws {Error} BoardSizeAddRegisterException|BoardSizeAddUpdateException,BoardSizeAddDeleteException
     */
    async validatorAdd(data, Exception) {
        Exception = Exception || Error;
        const required = {
            configNm : "설정명을 입력하세요",
        };

        for (key in required) {
            if (!data[key] || data[key].trim() == "") {
                throw new Exception(required[key]);
            }
        }
    }
};

module.exports = BoardSizeService;