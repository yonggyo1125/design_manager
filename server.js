const https = require('https');
const fs = require('fs');
const path = require('path');
const app = require('./app');
const env = process.env.NODE_ENV || "development";
if (env == 'production') {
    const options = {
        key: fs.readFileSync(path.join(__dirname, 'keys/private.key')),
        cert: fs.readFileSync(path.join(__dirname, 'keys/certificate.crt')),
        ca: fs.readFileSync(path.join(__dirname, 'keys/ca_bundle.crt')),
    };
    const server = https.createServer(options, app);
    server.listen(app.get('PORT'), () => {
        console.log("markers design Manager Listening : PORT : ", app.get('PORT'));
    });
} else {
    app.listen(app.get('PORT'), () => {
        console.log("markers design Manager Listening : PORT : ", app.get('PORT'));
    });
}