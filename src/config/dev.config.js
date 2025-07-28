require('dotenv').config();

module.exports = {
    APP_SHORT_NAME: process.env.APP_SHORT_NAME || 'PTP',
    JWT_KEY: process.env.JWT_KEY,
    EMAIL_CONFIG: {
        host: process.env.smshost,
        port: process.env.smsport,
        username: process.env.mail_username,
        password: process.env.password,
        from_name: process.env.from_name,
        from_address: process.env.from_address
    },
    HOST: process.env.HOST || 'http://159.89.164.11:5050/',
    PORT: process.env.PORT || 5000,
    ADMINPORT: process.env.ADMINPORT || 7272,
    DB_URL: process.env.DB_URL,
    FCM_SERVER_KEY: process.env.FCM_SERVER_KEY,
    apk: '----',
    rapidApiKey: process.env.api_key,
    url: process.env.url || 'http://159.89.164.11:5050/',
    PER_PAGE: process.env.PER_PAGE || 10,
    REDIS_HOST: process.env.REDIS_HOST,
    REDIS_PORT: process.env.REDIS_PORT,
    SOCKET_USER_PORT: process.env.SOCKET_USER_PORT,
    SOCKET_DELIVERY_PORT: process.env.SOCKET_DELIVERY_PORT,
    CRON_PORT: process.env.CRON_PORT || 5011
};
