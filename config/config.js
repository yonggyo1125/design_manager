require('dotenv').config();

module.exports = {
  development : {
    username : process.env.DEV_DB_USERNAME,
    password : process.env.DEV_DB_PASSWORD,
    database : process.env.DEV_DB_DATABASE,
    host : "127.0.0.1",
    dialect : "mysql"
  },
  test : {
    username : process.env.TEST_DB_USERNAME,
    password : process.env.TEST_DB_PASSWORD,
    database : process.env.TEST_DB_DATABASE,
    host : "127.0.0.1",
    dialect : "mysql"
  },
  production : {
    username : process.env.PRO_DB_USERNAME,
    password : process.env.PRO_DB_PASSWORD,
    database : process.env.PRO_DB_DATABASE,
    host : "127.0.0.1",
    dialect : "mysql"
  }
};
