const app = require('./app');

app.listen(app.get('PORT'), () => {
    console.log("markers design Manager Listening : PORT : ", app.get('PORT'));
});