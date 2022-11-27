const { BannerGroup, Banner, FileInfo, Sequelize : { Op } } = require("../index");
const { getException, logger } = require('../../library/common');
/** 예외 S */
const BannerGroupAddException = getException("Banner/BannerGroupAddException");
const BannerGroupDeleteException = getException("Banner/BannerGroupDeleteException");
const BannerRegisterException = getException("Banner/BannerRegisterException");
const BannerUpdateException = getException("Banner/BannerUpdateException");
/** 예외 E */

const fileDao = require("../file/dao"); // 파일 관련
const Pagination = require("../../library/pagination");
const BannerDeleteException = require("../../core/Exception/Banner/BannerDeleteException");

/**
 * 배너 관리 
 * 
 */
const bannerDao = {
    _total : 0, // 전체 배너 수 
    _pagination : "", // 페이지 HTML,
    required : {
        gid : "잘못된 접근입니다.",
        idBannerGroups : "배너 그룹을 선택하세요.",
    },
    set total(total) {
        if (isNaN(total)) total = 0;
        this._total = total;
    },
    get total() {
        return this._total;
    },

    set pagination(pagination) {
        this._pagination = pagination;
    },
    get pagination() {
        return this._pagination;
    },
    /**
     * 배너 그룹 등록
     * 
     * @param {String} groupNm 
     * @return {Boolean}
     * @throws {BannerGroupAddException}
     */
    async addGroup(groupNm) {
        if (!groupNm) {
            throw new BannerGroupAddException("배너그룹명을 입력하세요.");
        }

        const cnt = await BannerGroup.count({where : { groupNm }});
        if (cnt > 0) {
            throw new BannerGroupAddException(`이미 등록된 배너 그룹명입니다. - ${groupNm}`);
        }
        try {
            const result = await BannerGroup.create({
                groupCd : Date.now(),
                groupNm,
             });
             if (!result) {
                 return false;
             }

             return result;
        } catch (err) {
            logger(err);
            return false;
        }
    },
    /**
     * 배너 그룹 목록 
     * 
     */
    async getGroups() {
        try {
            const where = {};
            const list = await BannerGroup.findAll({
                    where,
                    order : [[ 'id', 'DESC']], 
                    raw : true,
            });
            for await (li of list) {
                const cnt = await Banner.count({ where : { idBannerGroups : li.id }});
                li.imageCnt = cnt;
            }

            return list;
        } catch (err) {
            logger(err);
            return false;
        }
    },
    /**
     * 배너 그룹 이미지 
     * 
     * @param {String} groupCd 
     */
    async getGroup(groupCd) {
        if (!groupCd) {
            return false;       
        }

        try {
            const list = await Banner.findAll({
                include : {
                    model : BannerGroup,
                    attributes : ["groupCd", "groupNm"],
                    where : { groupCd },
                },
                order : [[ "id", "DESC"]],
                where : { isShow : true },
                raw : true,
            });
            for await (li of list) {
                const files = await fileDao.gets(li.gid, true);
                li.file = files?files[0]:{};
            }

            return list;
        } catch (err) { 
            logger(err);
            return false;
        }
    },
    /**
     * 배너 그룹 삭제
     * 
     * @param {int|Array} ids 
     * @returns {Boolean}
     * @throws {BannerGroupDeleteException}
     */
    async deleteGroups(ids) {
        if (!ids) {
            throw new BannerGroupDeleteException("삭제할 배너 그룹을 선택하세요.");
        }

        if (!(ids instanceof Array)) {
            ids = [ids];
        }

        try {
            for await (id of ids) {
                await BannerGroup.destroy({ where : { id }});
            }

            return true;
        } catch (err) {
            logger(err);
            return false;
        }
    },
    /**
     * 배너 등록 
     * 
     * @param {Object} req 
     * @return {Boolean}
     * @throws {BannerRegisterException}
     */
    async add(req) {
        const data = req.body;

        /** 유효성 검사 */
        await this.validate(data, BannerRegisterException);
        
        try {
            const banner = await Banner.create({
                gid : data.gid,
                idBannerGroups : data.idBannerGroups,
                bannerLink : data.bannerLink,
                bannerTarget : data.bannerTarget || "self",
                bannerAlt : data.bannerAlt,
                isShow : data.isShow?true:false,
            });
            if (!banner) {
                return false;
            }

            await fileDao.updateDone(data.gid);
            return true;
        } catch (err) {
            logger(err);
            return false;
        }
    },
    /**
     * 배너 수정 
     * 
     * @param {Object} req 
     * @return {Boolean}
     * @throws {BannerUpdateException}
     */
    async update(req) {
        const data = req.body;

        /** 유효성 검사 */
        await this.validate(data, BannerUpdateException);

        try {
            const result = await Banner.update({
                idBannerGroups : data.idBannerGroups,
                bannerLink : data.bannerLink,
                bannerTarget : data.bannerTarget || "self",
                bannerAlt : data.bannerAlt,
                isShow : data.isShow?true:false,
            }, { where : { id : data.id }});

            await fileDao.updateDone(data.gid);
            return result[0] > 0;
        } catch (err) {
            logger(err);
            return false;
        }
    },
    /**
     * 배너 목록 수정 
     * 
     * @param {Object} req 
     * @return {Boolean}
     * @throws {BannerUpdateException}
     */
    async updates(req) {
        const ids = req.body.id;
        if (!ids) {
            throw new BannerUpdateException("수정할 배너를 선택하세요.");
        }
        const data = req.body;
        try {
            for await (id of ids) {
                const isShow = (data[`isShow_${id}`] == 1)?true:false;
                await Banner.update({
                    isShow
                }, { where : { id } });
            }
        } catch (err) {
            logger(err);
            return false;
        }

        return true;
    }, 
    /**
     * 배너 삭제 
     * 
     * @param {Int|Array} ids 
     * @returns {Boolean}
     * @throws {BannerDeleteException}
     */
     async delete(ids) {
        if (!ids) {
            throw new BannerDeleteException("삭제할 배너를 선택하세요.");
        }

        if (!(ids instanceof Array)) {
            ids = [ids];
        }

        try {
            for await (id of ids) {
                const banner = await this.get(id);
                if (!banner) continue;
                if (banner.file && banner.file.id) {
                    await fileDao.delete(banner.file.id);
                }
                await Banner.destroy({ where : { id : banner.id }});
            }
        }  catch (err) {
            logger(err);
            return false;
        }

        return true;
    },
    /**
     * 배너 등록 유효성 검사
     * 
     * @param {Object} data 
     * @param {Exception} Exception
     */
    async validate(data, Exception) {
        if (!data) {
            throw new Exception("잘못된 접근입니다.");
        }

        /** 필수 입력 항목 체크 S */
        for (key in this.required) {
            if (!data[key] || data[key].trim() == "") {
                throw new Exception(this.required[key]);
            }
        }
        /** 필수 입력 항목 체크 E */

        /** 배너이미지 업로드 여부 체크 */
        const fileCnt = await FileInfo.count({
             where : { gid : data.gid }
        });
        if (!fileCnt) {
            throw new Exception("배너 이미지를 업로드 하세요.");
        }          
    },
    /**
     * 배너 정보 
     * 
     * @param {int} id 
     */
    async get(id) {
        if (!id) 
            return false;

        try {
            const banner = await Banner.findOne({
                include : {
                    model : BannerGroup,
                    attributes : ["groupCd", "groupNm"],
                },
                where : { id },
                raw : true,
            });
            if (banner) {
                const files = await fileDao.gets(banner.gid, true);
                banner.file = files?files[0]:{};
            }
            
            return banner;
        } catch (err) {
            logger(err);
            return false;
        }
    },
    /**
     * 배너 목록 
     * 
     * @param {int} page - 페이지 번호 
     * @param {int} limit - 1페이지당 레코드 수 
     * @param {Object} req 
     */
    async gets(page, limit, req) {
        try {
            page = page || 1;
            limit = limit || 20;
            const offset = (page - 1) * limit;

            /** 검색 처리 S */
            const where = {}, bWhere = {};
            let isBannerGroupRequired = false;
            const search = req.query;
            if (search.idBannerGroups) {
                where.idBannerGroups = search.idBannerGroups.trim();
            }
            
            if (search.isShow) {
                if (search.isShow instanceof Array) {
                    const isShows = [];
                    search.isShow.forEach(v => {
                        const isShow = (v == 1)?true:false;
                        isShows.push(isShow);
                    });
                    where.isShow = {
                        [Op.or] : isShows,
                    }
                } else {
                    where.isShow = (search.isShow == 1)?true:false;
                }
            }

            if (search.groupCd) {
                bWhere.groupCd = search.groupCd.trim();
                isBannerGroupRequired = true;
            }
            /** 검색 처리 E */
            console.log(bWhere);
            console.log(isBannerGroupRequired);
            const list = await Banner.findAll({
                include : [{
                    model : BannerGroup,
                    attributes : ["groupCd", "groupNm"],
                    where : bWhere,
                    required : isBannerGroupRequired,
                }],
                limit,
                offset,
                where,
                raw : true,
            });
            for await (li of list) {
                const files = await fileDao.gets(li.gid);
                li.file = files?files[0]:{};
            }  

            /** 총 배너 수 */
            this.total = await Banner.count({
                include: [{
                    model : BannerGroup,
                }],
                where,
            }); 
            
            /** 페이징 처리 */
            if (req) {
                this.pagination = new Pagination(req, page, this.total).getPages();
            }
            return list;
        } catch (err) {
            logger(err);
            return false;
        }
    },
};

module.exports = bannerDao;