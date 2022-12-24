const express = require('express');
require('express-async-errors');
const dotenv = require('dotenv');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const nunjucks = require('nunjucks');
const methodOverride = require('method-override');
const path = require('path');
const router = require('./routes'); // 라우터
const logger = require('./core/logger'); // 로거 
const bootStrap = require('./core/boot'); // 초기화 
const scheduleJob = require('./core/schedule'); // 스케줄링
const { sequelize } = require('./models'); 
const redisClient = require('./core/redisClient');
const RedisStore = require('connect-redis')(session);
const NotFoundException = require("./core/Exception/NotFoundException"); // 없는 페이지 예외
const shareSessionCookie = require('./service/manager/shareSessionCookie');

const app = express();

dotenv.config();

process.env.TZ = "Asia/Seoul";

app.set('PORT', process.env.PORT || 3000);

/** 템플릿 설정  */
app.set("view engine", "html");
nunjucks.configure(path.join(__dirname, "views"), {
    express : app,
    watch : true,
});

/** 데이터 베이스 연결 */
sequelize.sync({ force : false })
    .then(() => {
        console.log("Database connected");
    })
    .catch((err) => {
        console.error(err);
    });


app.use((req, res, next) => {
    if (process.env.NODE_ENV === 'production') {
        morgan('combined')(req, res, next);
    } else {
        morgan('dev')(req, res, next);
    }
});

app.use(logger);
app.use(methodOverride('_method'));
app.use(cookieParser(process.env.COOKIE_SECRET));

// 세션 설정 
const sessionConfig = {
    resave: false,
    saveUninitialized : true,
    cookie : {
        httpOnly : true,
        secure : false,
    },
    name : "MKSESSID",
    resave: true,
    store : new RedisStore({ client : redisClient }),
};

if (process.env.NODE_ENV === 'production') {
    app.set('trust proxy', 1);
    
    //sessionConfig.cookie.secure = true;
    sessionConfig.cookie.domain = '.n-mk.kr';
    sessionConfig.cookie.path = '/';
    sessionConfig.cookie.sameSite = 'lax';
    sessionConfig.proxy = true;
}

const sessionOption = session(sessionConfig);

/** 정적 경로 */
app.use(express.static(path.join(__dirname, "public")));

/** body-parser */
app.use(express.json({ limit : '50mb', parameterLimit: 1000000}));
app.use(express.urlencoded({ extended : false, limit : '1024mb', parameterLimit: 1000000 }));

/** 세션 설정 */
app.use(sessionOption);

app.use(scheduleJob); // 스케줄링
app.use(bootStrap); // 사이트 초기화

/** 라우터 */
app.use(router);

/** 없는 페이지 처리 라우터 */
app.use((req, res, next) => {
    const err = new NotFoundException(`${req.method} ${req.url}는(은) 없는 페이지 입니다.`);
    err.status = 404;
    next(err);
});

/** 에러 처리 라우터  */
app.use(async (err, req, res, next) => {
    err.status = err.status || 500;
    req.logger(err); // 로그
    if (process.env.NODE_ENV === 'production') {
        delete err.stack;
    }
    res.locals.error = err;
    res.status(err.status).render("error");
});

module.exports = app;