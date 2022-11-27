const Exception = require('../../core/exception');
const { getException } = require('../../library/common');
const SizeConfigRegisterException = getException("Product/SizeConfigRegisterException");
const SizeConfigUpdateException = getException("Product/SizeConfigUpdateException");
const SizeConfigDeleteException = getException("Product/SizeConfigDeleteException");
const SizeConfigNotFoundException = getException("Product/SizeConfigNotFoundException");

/** DAO */
const sizeConfigDao = require('../../models/product/sizeConfigDao');

/** 
 * 사이즈 설정 관리 Service
 * 
 */
const SizeConfigService = {
    /**
     * 설정 추가
     * 
     * @param {Object} req
     */
    async add(req) {
        const data = req.body;
        await this.validator("add", data);
        const result = await sizeConfigDao.add(data);
        if (!result) {
            throw new SizeConfigRegisterException();
        }
    },
    /**
     * 설정 수정
     * 
     * @param {Object} req
     */
    async edits(req) {
        const data = req.body;
        if (!data.id) {
            throw new SizeConfigRegisterException("수정할 설정을 선택하세요.");
        }

        if (!Array.isArray(data.id)) {
            data.id = [data.id];
        }

        for await (id of data.id) {
            const upData = {
                configNm : data[`configNm_${id}`],
                sqmPrice : data[`sqmPrice_${id}`],
                sqmPriceB2B : data[`sqmPriceB2B_${id}`],
                minSqm : data[`minSqm_${id}`],
                maxSqm : data[`maxSqm_${id}`],
                basicSize : data[`basicSize_${id}`],
                maxSize : data[`maxSize_${id}`],
                sampleSize : data[`sampleSize_${id}`],
                boardSizeNm : data[`boardSizeNm_${id}`],
                idBoardSizeAdd : data[`idBoardSizeAdd_${id}`] || 0,
                idSizeDeliveryConfig : data[`idSizeDeliveryConfig_${id}`] || 0,
            };

            await sizeConfigDao.edit(id, upData);
        }
    },
    /**
     * 설정 수정
     * 
     * @param {Object} req
     */
    async edit(req) {
        const data = req.body;
        data.id = req.params.id || req.body.id; 
        await this.validator("update", data);

        data.idBoardSizeAdd = data.idBoardSizeAdd || 0;
        data.idSizeDeliveryConfig = data.idSizeDeliveryConfig || 0;
        const id = data.id;
        delete data.id;
        await sizeConfigDao.edit(id, data);
    },
    /**
     * 사이즈 설정 삭제
     * 
     */
    async delete(req) {
        const data = req.body;
        if (!data.id) {
            throw new SizeConfigDeleteException("삭제할 설정을 선택하세요.");
        }

        await sizeConfigDao.delete(data.id);
    },
    /**
     * 추가,  데이터 검증 
     * 
     * 
     */
    async validator(mode, data) {
        const required = {
            configNm : "설정이름을 입력하세요.",
            sqmPrice : "1헤베 단가를 입력하세요.",  
        };
    
        let Exception;
        switch (mode) {
            case "update": 
                Exception = SizeConfigUpdateException;
                required.id = "잘못된 접근입니다.";
                break;
            case "delete" : 
                Exception = SizeConfigDeleteException;
                break;
            default : 
                Exception = SizeConfigRegisterException;
        }

        for (key in required) {
            if (!data[key] || data[key].trim()  == "") {
                throw new Exception(required[key]);
            } 
        }
    },
    /**
     * 설정 목록 조회
     * 
     */
    async gets() {
        return sizeConfigDao.gets();
    },
    /**
     * 설정 조회
     * 
     * @param {int} id 설정 등록 id 
     * @returns {Object}
     */
    async get(id) {
        if (!id) {
            throw new SizeConfigNotFoundException("잘못된 접근입니다.");
        }

        const data = await sizeConfigDao.get(id);
        if (!data) {
            throw new SizeConfigNotFoundException();
        }
        return data;
    },
    /**
     * 사이즈별 추가배송비 등록
     * 
     * @param {Object} req
     */
    async addSizeDelivery(req) {
        const data = req.body;
        if (!data.configNm) {
            throw new Exception("설정이름을 입력하세요.");
        }

        const result = await sizeConfigDao.addSizeDelivery(data);
        if (!result) {
            throw new Exception("사이즈별 추가 배송비 등록에 실패하였습니다.");
        }
    },
    /**
     * 사이즈별 추가 배송비 수정
     * 
     * @param {Object} req
     */
    async editSizeDelivery(req) {
        const data = req.body;
        if (!data.id) {
            throw new Exception("수정할 설정을 선택하세요.");
        }

        if (!Array.isArray(data.id)) {
            data.id = [data.id];
        }

        for await (id of data.id) {
            const upData = {
                configNm : data[`configNm_${id}`],
                sizeType : data[`sizeType_${id}`],
                size : data[`size_${id}`],
                addPrice : data[`addPrice_${id}`],
            };

            await sizeConfigDao.editSizeDelivery(id, upData);
        }
    },
    /**
     * 사이즈별 추가 배송비 삭제
     * 
     * @param {Object} req
     */
    async deleteSizeDelivery(req) {
        const data = req.body;
        if (!data.id) {
            throw new Exception("삭제할 설정을 선택하세요.");
        }

        await sizeConfigDao.deleteSizeDelivery(data.id);

    },
    /**
     * 사이즈별 추가배송비 목록
     * 
     */
    async getSizeDeliveries() {
        return await sizeConfigDao.getSizeDeliveries();
    },
    /**
     * 사이즈별 추가 배송비 조회
     * 
     * @param {int} id
     */
    async getSizeDelivery(id) {
        return await sizeConfigDao.getSizeDelivery(id);
    }
};

module.exports = SizeConfigService;