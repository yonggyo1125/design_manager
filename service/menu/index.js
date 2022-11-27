const { getException } = require('../../library/common');
const { anyOneAccessURL, accessUrlByRoles } = require('../../core/urlControls');
const MenuRegisterException = getException("Menu/MenuRegisterException");
const MenuUpdateException = getException("Menu/MenuUpdateException");
const MenuDeleteException = getException("Menu/MenuDeleteException");
const MenuNotFoundException = getException("Menu/MenuNotFoundException");

const menuDao = require('../../models/menu/dao');
const levelDao = require('../../models/manager/levelDao');


/**
 * 메뉴 Service 
 * 
 */
const menuService = {
    /**
     * 메뉴 유형
     * 
     * @returns {Object}
     */
    getTypes() {
        return {
            'manager' : '관리자',
            'associate' : '제휴관리',
            'product' : '품목관리',
            'order' : '주문관리',
            'payment' : '결제관리',
            'work' : '작업관리',
            'customer' : '상담관리',
            'board' : '게시판 관리',
            'kakao_alimtalk' : '알림톡',
            'search_rank' : '검색순위',
        };
    },
    /**
     * 메뉴 등록 
     * 
     * @param {Object} req
     * @throws {MenuRegisterException}
     */
    async add(req) {
        const data = req.body;
        this.validator(data, MenuRegisterException);
        const result = await menuDao.add(data);
        if (!result) {
            throw new MenuRegisterException();
        }
    },
    /**
     * 유효성 검사
     * 
     * @param {Object} data
     * @param {Exception}
     */
    validator(data, Exception) {
        if (!data) {
            throw new Exception("잘못된 접근입니다.");
        }

        const required = {
            type : "메뉴 유형을 선택하세요.",
            title : "메뉴명을 입력하세요.",
            url : "메뉴 URL을 입력하세요.",
        };
    
        for(key in required) {
            if (!data[key] || data[key].trim() == "") {
                throw new Exception(required[key]);
            }
        }
    },
    /**
     * 메뉴 목록
     * 
     * @param {Object} search 
     */
    async gets(search) {
        const list = await menuDao.gets(search);
        if (list && list.length > 0) {
            for await (li of list) {
                await this.updateMenu(li);
            }
            
        }
        return list;
    },
    /**
     * 메뉴 조회
     * 
     * @param {int} id 메뉴 등록 번호
     * @throws {}
     */
    async get(id) {
        if (!id) {
            throw new MenuNotFoundException("잘못된 접근입니다.");
        }

        const data = await menuDao.get(id);
        if (!data) {
            throw new MenuNotFoundException();
        }

        await this.updateMenu(data);
        return data;
    },
    /**
     * 주메뉴 목록 조회 
     * 
     * @param {Boolean} isAll
     */
    async getParents(isAll, search) {
        isAll = isAll?true:false;
        search = search || {};
        search.parentId  = 0;
        if (!isAll) {
            search.isUse = true;
        }

        const list = await menuDao.gets(search);
        if (list && list.length > 0) {
            for await (li of list) {
                await this.updateMenu(li);
            }
        }

        return list;
    },
    /**
     * 서브 메뉴 목록 조회
     * 
     * @param {Boolean} isAll
     */
   async  getSub(parentId, isAll) {
        if (!parentId) {
            throw new MenuNotFoundException("잘못된 접근입니다.");
        }

        isAll = isAll?true:false;
        const search = {
            parentId,
        };
        if (!isAll) {
            search.isUse = true;
        }
        const list = await menuDao.gets(search);
        if (list && list.length > 0) {
            for await (li of list) {
                await this.updateMenu(li);
            }
        }

        return list;
    },
    /**
     * 메뉴 유형별
     * 
     * @param {String} type 메뉴유형
     * @param {Boolean} isAll 
     */
    async getsByType(type, isAll) {
        if (!type) {
            throw new MenuNotFoundException("잘못된 접근입니다.");
        }
        isAll = isAll?true:false;
        const search = { type, parentId : 0 };
        if (!isAll) {
            search.isUse = true;
        }

        const list = await menuDao.gets(search);
        if (list && list.length > 0) {
            for await (li of list) {
                await this.updateMenu(li);
            }
        }

        return list;
    },
    /**
     * 메뉴 목록  수정
     * 
     * @param {req} 
     * @throws {MenuUpdateException}
     */
    async updates(req) {
        const id = req.body.id;
        if (!id) {
            throw new MenuUpdateException("수정할 메뉴를 선택하세요.");
        }

        const data = req.body;
        const result = await menuDao.updates(data);
        if (!result) {
            throw new MenuUpdateException();
        }
    },
    /**
     * 메뉴 수정
     * 
     * @param {Object} req
     * @returns {MenuUpdateException}
     */ 
    async update(req) {
        const id = req.params.id || req.body.id;
        const data = req.body;

        if (!id || !data) {
            throw new MenuUpdateException("잘못된 접근입니다.");
        }
        data.id = id;
        
        this.validator(data, MenuUpdateException);
        const result = await menuDao.update(data);
    },
    /**
     * 메뉴 목록 삭제
     * 
     */
    async deletes(req) {
        const id = req.body.id;
        if (!id) {
            throw new MenuDeleteException("삭제할 메뉴를 선택하세요.");
        }

        const result = await menuDao.delete(id); 
        if (!result) {
            throw new MenuDeleteException();
        }
    },
    /**
     * 메뉴 추가 정보 업데이트 
     * 
     * @param {Object} data
     */
    async updateMenu(data) {
        if (!data) {
            return;
        }

        const types = this.getTypes();
        data.typeStr = types[data.type] || "";

        data.accessLevel = data.accessLevel || [];
        if (typeof data.accessLevel == 'string') {
            data.accessLevel = JSON.parse(data.accessLevel);
        }

        // 하위 메뉴 조회 
        const sub = await this.getSub(data.id);

        if (sub && sub.length > 0) data.subs = sub;

        /** 동일 매칭 URL */
        data._subUrls = data.subUrls?data.subUrls.split("\r\n"):[];
    }, 
    /**
     * 관리레벨별 접근 가능 메뉴 조회 
     * 
     * @param {int} level 관리레벨
     * @returns {boolean}
     */
    async getAvailableMenus(level) {
        if (!level) {
            return false;
        }

        const levelInfo = await levelDao.get(level);
        if (!levelInfo) {
            return false;
        }

        /** 전체 관리자는 모든 메뉴 허용  */
        if (levelInfo.roles.indexOf("all") != -1) {
            return "all";
        }

        const search = {
            isUse : true,
        };
        const list = await menuDao.gets(search);
    
        const data = {};
        const urls = [] // 접근 통제 하지 않는 URL 목록
        for await (li of list) {
            let accessLevel = li.accessLevel || [];
            if (typeof accessLevel == 'string') {
                accessLevel = JSON.parse(accessLevel);
            }

          if (accessLevel.length > 0 && accessLevel.indexOf("" + level) != -1) {
              data[li.type] = data[li.type] || [];
              data[li.type].push(li);
             
              if (li.subUrls) {
                for(url of li.subUrls.split("\r\n")) {
                    urls.push(url);
                    const newLi = {}
                    Object.assign(newLi, li);
                    newLi.url = url;
                    data[newLi.type].push(newLi);
                }
            }
          }          
          urls.push(li.url);
        }   
        
        /** 역할별 추가 접속 가능 페이지  S */
        data.roles = [];
        if (levelInfo && levelInfo.roles && levelInfo.roles.length > 0) {
            for (let role of levelInfo.roles) {
                const urls = accessUrlByRoles[role];
                if (!urls) continue;
                for (let url of urls) {
                    data.roles.push({url}); 
                } 
            }
        }
        /** 역할별 추가 접속 가능 페이지  E */

       return { menus : data, urls, anyAccessUrls : anyOneAccessURL(), levelInfo }
    }
};

module.exports = menuService;