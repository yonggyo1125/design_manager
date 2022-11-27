const redis = require('ioredis');
const dotenv = require('dotenv');
dotenv.config();
const redisClient = redis.createClient({
    host: process.env.REDIS_HOST,
    port : process.env.REDIS_PORT,
    password : process.env.REDIS_PASSWORD,  
});

redisClient.on('connect',() => {
    console.log('connected to redis successfully!');
});

redisClient.on('error',(error) => {
    console.log('Redis connection error :', error);
});

module.exports = redisClient;