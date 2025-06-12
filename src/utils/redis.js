

const { createClient } = require('@redis/client');
require('dotenv').config();
const client = createClient({ url: `redis://${process.env.REDIS_HOST || '127.0.0.1'}:${process.env.REDIS_PORT || 6379}` });
client.on('error', (err) => console.error('Redis Client Error', err));

const connectRedis = async () => {
    if (!client.isOpen) {
        await client.connect();
        console.log('Redis connected!');
    }
};
connectRedis();
module.exports = { connectRedis, client };