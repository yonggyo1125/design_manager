const { md5, secureGet, secureSet, getConfig, getLocalDate, nl2br, isMobile, getException, alert } = require("../library/common");
const { anyOneAccessURL } = require('./urlControls');
const NotAuthorizedException = getException("NotAuthorizedException");
const managerDao = require("../models/manager/dao");
const boardDao = require('../models/board/boardDao');
const menuSvc = require('../service/menu');

// 게시판 진열 순서 설정
const getBoardOrderConfig = require("../service/boardAdmin/getBoardOrderConfig");

/**
 * 사이트 초기화
 * 
 */
module.exports = async (req, res, next) => {
    const skips = ["/js/", "/css/", "/images/"];
    let isSkip = false;
    skips.forEach((el) => {
        if (req.url.indexOf(el) != -1) {
            isSkip = true;
        }
    }); 

    if (isSkip) {
        return next();
    }

    /** 사이트 설정 */
    const siteConfig = await getConfig("siteConfig");
    req.siteConfig = res.siteConfig = res.locals.siteConfig = siteConfig;

    /** JS, CSS 버전  */
    res.locals.cssJsVersion = (process.env.NODE_ENV === 'production')?siteConfig.cssJsVer:Date.now();
    res.locals.cssJsVersion = res.locals.cssJsVersion || Date.now();

    /** 페이지 URI에 따른 body 클래스 처리  */
    res.locals.bodyClass = bodyClass(req);

    /** 로그인 유지 처리 S */
    // 개발 중에는 로그인이 풀리므로 로그인 고정 처리 
    if (process.env.NODE_ENV != 'production') {
        //req.session[md5("managerId")] = secureSet("yonggyo00");
    }

    res.isLogin = req.isLogin = res.locals.isLogin = false;
    let manager;
    if (req.session[md5("managerId")]) {
        const managerId = secureGet(req.session[md5("managerId")]);
        manager = await managerDao.get(managerId);
        if (manager) {
            setRoles(manager, req, res);
            res.isLogin = req.isLogin = res.locals.isLogin = true;
            res.manager = req.manager = res.locals.manager = manager;
           if (!req.body.idManager) req.body.idManager = manager.id;
            

            
            /** 회원별 접근 가능 메뉴  */
            try {
                await checkAccessAuth(req, res, next, manager.managerLv);
            } catch (err) {
                res.isLogin = req.isLogin = res.locals.isLogin = false;
                res.manager = req.manager = res.locals.manager = null;
                delete req.body.idManager;
                delete req.session[md5("managerId")];
                return alert(err.message, res, "/manager/login");
            }
        }
    }
    /** 로그인 유지 처리 E */

    /* 로그인 필수 페이지 체크 */
    try {
        await checkMemberOnly(req, res);
    } catch (err) {

        return res.redirect("/manager/login");
    }
    /** 페이지 기본 제목 처리 */
    res.locals.pageTitle = siteConfig.siteTitle || "마커스 디자인관리자";

    /** 템플릿 사용 공통 함수 S */
    // 날짜 변환 함수
    res.locals.getLocalDate = getLocalDate;

    // \r\n문자를 br태그로 변환
    res.locals.nl2br = nl2br;
    
    // 반올림
    res.locals.round = Math.round;
    res.locals.ceil = Math.ceil;
    res.locals.floor = Math.floor;

   /** 템플릿 사용 공통 함수 E */


    /** 현재 URI */
    req.requestURI = res.requestURI = res.locals.requestURI = getRequestURI(req);

    /** 현재 URL */
    req.requestURL = req.requestURL = res.locals.requestURL = req.url;
    
    /** 현재 HOST */
    res.locals.host = getProtocol(req) + "://" +  req.hostname;
    res.locals.openMarketManagerURL = getProtocol(req) + "://" +  req.hostname + ":30000";
    //res.locals.openMarketManagerURL = "https://dm.n-mk.kr/openmarket";
    const port = req.app.get("PORT");
    if (port != 80 && port != 443) {
        res.locals.host += ":" + port;
    }
    res.locals.host = "https://dm.n-mk.kr";

    /** 현재 Date */
    res.locals.nowDate = new Date();

    /** 모바일 여부 */
    res.locals.isMobile = req.isMobile = res.isMobile = isMobile(req);

    // User-agent
    req.userAgent = req.body.userAgent = res.locals.userAgent = req.headers['user-agent'];
    // IP ADDR
    req.body.ipAddr = res.locals.ipAddr = req.ip;


    /** 메뉴별, 레벨별 게시판 조회 함수 추가 */
    req.getBoards = async function(menu) {
        if (!menu) {
            return false;
        }

        const boards = [];
        const list = await boardDao.gets(1, "all");
        if (!list) {
            return false;
        }

        for (const li of list) {
            if (!li.isUse) {
                continue;
            }

            const showConfig = li.showConfig || {};
            if (showConfig.location && showConfig.location.indexOf(menu) == -1) {
                continue;
            }
           
            if (!req.isSuper) {
                if (showConfig.level && showConfig.level.length > 0 && !req.isLogin) {
                   
                    continue;
                }
            
                if (req.isLogin && showConfig.level && showConfig.level.indexOf("" + manager.managerLv) == -1) {
                    
                    continue;
                }
            }
            
            boards.push({ id : li.id, title : li.title });
        }


        if (boards.length > 0) {
            const configs = await getBoardOrderConfig(menu);
            if (configs && configs.length > 0) {
                boards.sort((a, b) => {
                    let listOrderA = 0;
                    let listOrderB = 0;
                    for (const config of configs) {
                        if (config.id == a.id) {
                            listOrderA = config.listOrder;
                        }

                        if (config.id == b.id) {
                            listOrderB = config.listOrder;
                        }
                    }

                    return listOrderA - listOrderB;
                });
            } // endif 
        } // endif 

        return boards;
    };

    next();
   
};

/**
 * 페이지 URI에 따른 클래스 처리 
 * 
 */
function bodyClass(req) {
    let url = getRequestURI(req);
    url = url.split("/").filter(v => v?true:false);
    if (url.length > 2) url = url.slice(0, 2);
    url = url.reverse();
    let className = "";
    url  
     if (url.length == 1) {
        className = `body-${url[0]}`;
    }  else if (url.length > 0) {
        className = `body-${url[1]} body-${url[1]}-${url[0]}`;
    } else {
        className = "body-main";
    }
 
    return className;
}

/** 현재 URI */
function getRequestURI(req) {
    let url = req.url;
    if (url.indexOf("?") != -1) {
        url = url.substring(0, url.lastIndexOf("?"));
    }
    return url;
}

function getProtocol (req) {
    var proto = req.connection.encrypted ? 'https' : 'http';
    // only do this if you trust the proxy
    proto = req.headers['x-forwarded-proto'] || proto;
    return proto.split(/\s*,\s*/)[0];
}


/**
 * 회원 레벨별 접속 권한 체크
 * 
 */
async function checkAccessAuth(req, res, next, level) {
    const data = await menuSvc.getAvailableMenus(level);
    if (!data) { // 승인받지 않은 관리레벨(0) 인 경우 // 로그아웃으로 이동
        throw new NotAuthorizedException("서비스 사용을 위해서는 관리자의 승인이 필요합니다.");
    }

    if (data == 'all') { // 전체 관리자인 경우 
        req.isSuper = res.isSuper = res.locals.isSuper = true;
        return true;
    }

    const URI = getRequestURI(req);

    const menus = data.menus;
    const keys = Object.keys(menus);
    const values = Object.values(menus);    

    const menuIds = [];
    let isMatched = false;
    values.forEach(list => {
        list.forEach(li => {
            if (URI.indexOf(li.url) != -1) {
                isMatched = true;
            }
            menuIds.push(li.id);
        });
    });

    if (URI == '/') { // 메인페이지 접속한 경우 
        isMatched = true;    
    }

    req.availableMainMenus = res.availableMainMenus = res.locals.availableMainMenus = keys;
    req.availableMenus = res.availableMenus = res.locals.availableMenus = menuIds;
    
     // 접근 통제하지 않는 URL 접근 체크 
     for (url of data.anyAccessUrls) {
        if (URI.indexOf(url) != -1) {
            isMatched = true;
            break;
        }
     }

    if (!isMatched) {
        const error =  new NotAuthorizedException();
        error.status = 401;
        return next(error);
    }
}

/** 로그인 필수 페이지 체크  */
async function checkMemberOnly(req, res) {
    if (req.isLogin) {
        return;
    }

    const URI = getRequestURI(req);
    const urls = anyOneAccessURL();
     let isMatched = false;
     for (url of urls) {
         if (URI.indexOf(url) != -1) {
            isMatched = true;
             break;
        }
    }

    if (!isMatched) {
        throw new NotAuthorizedException("로그인이 필요합니다.");
    }
}

/** 
 * 관리자 역할 설정 
 * 
 */
function setRoles(manager, req, res) {
    if (!manager) {
        return;
    }
 
    const roles = manager['Level.roles']?JSON.parse(manager['Level.roles']):[];

    // 최고 관리자
    if (roles.indexOf("all") != -1) {
        req.isSuper = res.isSuper = res.locals.isSuper = true;
    }

    // 디자이너
    if (roles.indexOf("designer") != -1) {
        req.isDesigner = res.isDesigner = res.locals.isDesigner = true;
    }

    // 작업자
    if (roles.indexOf("worker") != -1) {
        req.isWorker = res.isWroker = res.locals.isWorker = true;
    }

    // 회계 담당자
    if (roles.indexOf("accountant") != -1) {
        req.isAccountant = res.isAccountant = res.locals.isAccountant = true;
    }

    // 상담사
    if (roles.indexOf("cs") != -1) {
        req.isCs = res.isCs = res.locals.isCs = true;
    }

    // 게시판 담당자
    if (roles.indexOf("board") != -1) {
        req.isBoarder = res.isBoarder = res.locals.isBoarder = true;
    }
}
