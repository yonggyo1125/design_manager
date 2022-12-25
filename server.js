const app = require('./app');

app.listen(app.get('PORT'), () => {
    console.log("markers design Manager Listening : PORT : ", app.get('PORT'));
});

process.on('uncaughtException', (err) => {
    console.error("처리하지 못한 오류 - 확인 요망 : ", err.message);
    console.error(err);
     process.exit(0);
});


process.on('SIGINT', () => {
    console.log('server closed');
    process.exit(0);
});
