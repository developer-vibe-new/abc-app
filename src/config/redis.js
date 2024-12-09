const { createClient } = require('@redis/client');
const { REDIS_HOST, REDIS_PORT } = require('./dev.config');

let client;

function getClient() {
  if (!client) {
    client = createClient({
      url: `redis://${REDIS_HOST || '127.0.0.1'}:${REDIS_PORT || 6379}`
    });

    client.on('error', (err) => {
      console.error('Redis client error:', err);
    });

    client.connect()
      .then(() => {
        console.log(`Redis is running on ${REDIS_PORT || 6379}`);
      })
      .catch((err) => {
        console.error('Error connecting to Redis:', err);
      });
  }
  return client;
}

module.exports = {
  getClient
};