const { Level } = require('../../models');
const { getException } = require('../../library/common');
const levelDao = require('../../models/manager/levelDao');

/** 예외 S */
const LevelRegisterException = getException("Manager/LevelRegisterException");
const LevelUpdateException = getException("Manager/LevelUpdateException");
const LevelDeleteException = getException("Manager/LevelDeleteException");
/** 예외 E */


/**
 * 관리레벨 Service
 * 
 */
const levelService = {
    /** 관리 역할 */
    getRoles() {
        return {
            designer : "디자이너",
            worker : "작업자",
            accountant : "회계 담당자",
            cs : "상담사",
            board : "게시판관리자",
            all : "전체관리자",
        };
    },
    /**
     * 관리레벨 등록 
     * 
     * @param {Object} req
     * @throws {LevelRegisterException}
     */
    async add(req) {
        const data = req.body;
        await this.validator(data, LevelRegisterException);

        const result = await levelDao.add(data);
        if (!result) {
            throw new LevelRegisterException();
        }
    },
    /**
     * 유효성 검사
     * 
     * @param {Object}
     */
    async validator(data, Exception) {
        if (!data) {
            throw new Exception("잘못된 접근입니다.");
        }
        if (!data.levelNm || data.levelNm.trim() == "") {
            throw new Exception("관리명을 입력하세요.");
        }

        if (!data.roles) {
            throw new Exception("1개 이상의 역할을 선택하세요.");
        }

        /** 이미 등록된 레벨인지 체크 */
        const level = data.level || 0;
        const cnt = await Level.count({ where : { level }});
        if (cnt > 0) {
            throw new Exception("이미 등록된 레벨입니다.");
        }
    },
    /**
     * 관리레벨 수정 
     * 
     * @param {Object} req
     * @throws {LevelUpdateException}
     */
    async updates(req) {
        const data = req.body;
        if (!data.level)  {
            throw new LevelUpdateException("수정할 관리레벨을 선택하세요.");    
        }

        const result = await levelDao.updates(data);
        if (!result) {
            throw new LevelUpdateException();
        }

        return result;
    },
    /**
     * 관리레벨 삭제
     * 
     * @param {Object} req
     * @throws {LevelDeleteException}
     */
    async deletes(req) {
        const data = req.body;
        if (!data.level) {
            throw new LevelDeleteException("삭제할 관리목록을 선택하세요.");
        }

        const result = await levelDao.delete(data.level);
        if (!result) {
            throw new LevelDeleteException();
        }

        return result;
    },
    /**
     * 관리레벨 목록 
     * 
     */
    async gets(isSuperNotIncluded) {
        isSuperNotIncluded = isSuperNotIncluded?true:false;
        const list = await levelDao.gets();
        if (isSuperNotIncluded) {
            const newList = [];
            for await (li of list) {
                if (li.roles.indexOf("all") == -1) {
                    newList.push(li);
                }
            }
            return newList;
        }
        return list;
    }
};

module.exports = levelService;