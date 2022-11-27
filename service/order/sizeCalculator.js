const { logger } = require('../../library/common');
const { sequelize, Sequelize : { QueryTypes } } = require('../../models');
const sizeConfigSvc = require('../product/sizeConfig');
const boardSizeSvc = require('../product/boardSize');

/**
 * 사이즈 계산기 금액 계산 
 * 
 */
const sizeCalculator = {
    /**
     * 사이즈 계산 처리 
     * 
     */
    async process(itemId, width, height) {
        if (!itemId) {
            return false;
        }
        
          /** 사이즈 설정 조회  */
        const data = await this.getConfig(itemId);
        if (!data) { 
            return false;
        }
        width = width || 0;
        height = height || 0;
        width = Number(width);
        height = Number(height);

        if (data.basicSize && data.basicSize.length > 0 && (!width && !height)) {
            width = data.basicSize[0]?Number(data.basicSize[0]):0;
            height = data.basicSize[1]?Number(data.basicSize[1]):0;
        }

        let size = Math.round(width * height / 10) / 1000;

        /** 보드형 추가 사이즈 설정이 있는 경우  */
        let isBasicSizeApplicable = true;
        if (data.boardSizeAdd) {
            const boardSizeAdd = data.boardSizeAdd;

            /** 기본 헤배 적용 여부 체크 */
            if (boardSizeAdd.exceptMinSize) {
                isBasicSizeApplicable = false;
            }
            
            /** 보드형 최소 사이즈 적용 */
            if (boardSizeAdd.minSize > 0) {
                data.minSqm = boardSizeAdd.minSize / 10000;
            }
        } 

        const basicSize = data.minSqm || 1;

        if (isBasicSizeApplicable && size < basicSize) {
            size = basicSize;
        } 

        data.cutUnit = data.cutUnit || 1;
        let price = data.sqmPrice * size / data.cutUnit;
        switch(data.cutType) {
            case "round" : 
                price = Math.round(price);
                break;
            case "ceil" : 
                price = Math.ceil(price);
                break;
            case "floor" : 
                price = Math.floor(price);
                break;
        }

        price *= data.cutUnit;

        /** 보드형 사이즈 추가 설정 S */
        if (data.boardSizeAdd) {
            const boardSizeAdd = data.boardSizeAdd;

            /**  최소 금액 처리 S */
            if (boardSizeAdd.minPrice > 0 && price < boardSizeAdd.minPrice ) {
                price = boardSizeAdd.minPrice;
            }
            /** 최소 금액 처리 E */

            /** 면적별 추가 금액 처리 S */
            if (boardSizeAdd.addPriceByArea && boardSizeAdd.addPriceByArea.length > 0) {
                size = width * height;
                let addPrice = 0;
                for (add of boardSizeAdd.addPriceByArea) {
                    if (!isNaN(add[0]) && size >= Number(add[0])) {
                        const _addPrice = isNaN(add[1])?0:Number(add[1]);
                        addPrice = _addPrice;
                    }
                }
   
                price += addPrice;
            }
            /** 면적별 추가 금액 처리 E */
          
        } // endif 
        /** 보드형 사이즈 추가 설정 E */
        
        /** 사이즈별 추가 배송비 처리 S */
        let addDeliveryPrice = 0;
        if (data.sizeDeliveryConfig) {
            const sizeDeliveryConfig = data.sizeDeliveryConfig;
            const size = sizeDeliveryConfig.size;
            const addPrice = sizeDeliveryConfig.addPrice;
            if (size > 0 && addPrice > 0) { // 사이즈와 추가 가격이 있는 경우 
                const sizeType = sizeDeliveryConfig.sizeType;
                switch (sizeType) {
                    case "width" : // 너비 기준
                        if (width >= size) addDeliveryPrice = addPrice;
                        break;
                    case "height" : // 높이 기준 
                        if (height >= size) addDeliveryPrice = addPrice;
                        break;
                    default :  // 작은 사이즈 기준
                        const _size = width > height?width:height;
                        if (_size >= size) addDeliveryPrice = addPrice;
                }
            }
        }
        /** 사이즈별 추가 배송비 처리 E */
        return { price,  config : data, addDeliveryPrice };
    },
    /**
     * 사이즈 설정 조회
     * 
     */
    async getConfig(itemId) {
        if (!itemId) {
            return false;
        }
        try {
          
            /** 
             * 상품별 개별 사이즈 설정이 있다면 상품별로 사용, 없다면 분류에 지정된 사이즈 계산설정 사용 
             * 
             */
            let sql = `SELECT a.id FROM sizeConfigs a
                            INNER JOIN productItems b ON a.id = b.idSizeCOnfig
                            WHERE b.id = ?`;

            let result = await sequelize.query(sql, {
                replacements : [itemId],
                type : QueryTypes.SELECT,
            });


            if (!result || result.length == 0)  {
                sql = `SELECT a.id FROM sizeConfigs a 
                                        INNER JOIN productCategories b ON a.id = b.idSizeConfig 
                                        INNER JOIN productItems c ON idProductCategory = b.id
                                    WHERE c.id = ?`;
                result = await sequelize.query(sql, {
                    replacements : [itemId],
                    type : QueryTypes.SELECT,
                });
            }

            if (!result || result.length == 0)  {
                return false;
            }

            const id = result[0].id;

            const data = await sizeConfigSvc.get(id);
            if (!data) {
                return false;
            }

            /** 보드형 사이즈가 있는 경우  */
            if (data.boardSizeNm) {
                const portrait = await boardSizeSvc.gets(data.boardSizeNm, 'portrait');
                const landscape = await boardSizeSvc.gets(data.boardSizeNm, 'landscape');
                data.boardSizes = { portrait, landscape };
            }
 
            /** 보드형 사이즈 추가 설정  */
            if (data.idBoardSizeAdd) {
                const _data = await boardSizeSvc.getConfig(data.idBoardSizeAdd);

                if (_data && _data.addPriceByArea) {
                    _data.addPriceByArea = _data.addPriceByArea.split(",").map(v => v.split("|"));
                }

                data.boardSizeAdd = _data;
            }
  
            /** 사이즈별 추가배송비 설정 */
            if (data.idSizeDeliveryConfig) {
                data.sizeDeliveryConfig = await sizeConfigSvc.getSizeDelivery(data.idSizeDeliveryConfig);
            }

            data.basicSize = data.basicSize?data.basicSize.split("|"):[];
            data.maxSize = data.maxSize?data.maxSize.split("|"):[];
            data.sampleSize = data.sampleSize?data.sampleSize.split("|"):[];

            return data;
        } catch (err) {
            logger(err);
            return false;
        }
    }
};

module.exports = sizeCalculator;