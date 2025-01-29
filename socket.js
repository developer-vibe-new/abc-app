const socketIo = require('socket.io');
const { createAdapter } = require("@socket.io/redis-adapter");
const { createClient } = require("@redis/client");
const { REDIS_HOST, REDIS_PORT } = require('./src/config/dev.config');


let io;

async function initializeSocket(server) {
    io = socketIo(server, {
        cors: {
            // origin: process.env.FE_BASE_URL,
            origin: "*",
            methods: ["GET", "POST"],
            transports: ['websocket', 'polling'],
            credentials: true
        },
        allowEIO3: true
    });
    const pubClient = createClient({ url: `redis://${REDIS_HOST || '127.0.0.1'}:${REDIS_PORT || 6379}` });
    const subClient = pubClient.duplicate();

    await pubClient.connect();
    await subClient.connect();

    const redisAdapter = createAdapter(pubClient, subClient);
    io.adapter(redisAdapter);

    global.io = io;

    console.log('Socket.IO initialized with Redis');
}

// function getIO() {
//     if (!io) {
//         throw new Error("Socket.io not initialized yet. Please call initializeSocket first.");
//     }
//     return io;
// }

function getIO() {
    if (!global.io) {
        throw new Error("Socket.io not initialized yet. Please call initializeSocket first.");
    }
    return global.io;
}

module.exports = { initializeSocket, getIO };