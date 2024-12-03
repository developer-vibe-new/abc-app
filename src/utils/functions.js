const { getClient } = require('../config/redis');

module.exports = {
    async setRedis(redisKey, data) {
        try {
            const client = getClient();
            const jsonData = JSON.stringify(data);
            const result = await client.set(redisKey, jsonData);
            return result;
        } catch (error) {
            console.error('Error setting Redis key:', error);
            throw error;
        }
    },

    async deleteRedis(redisKey) {
        try {
            const client = getClient();
            const result = await client.del(redisKey);
            return result;
        } catch (error) {
            console.error('Error deleting Redis key:', error);
            throw error;
        }
    },
    async getRedis(redisKey) {
        try {
            const client = getClient();
            const result = await client.get(redisKey);
            if (result) {
                const data = JSON.parse(result);
                return data;
            } else {
                return null;
            }
        } catch (error) {
            console.error('Error getting or parsing Redis key:', error);
            throw error;
        }
    },
}