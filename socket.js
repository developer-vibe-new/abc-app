const { Server } = require('socket.io');
const { createAdapter } = require("@socket.io/redis-adapter");
const { createClient } = require("@redis/client");
const { REDIS_HOST, REDIS_PORT } = require('./src/config/dev.config');


let io;

// async function initializeSocket(server) {
//     io = socketIo(server, {
//         cors: {
//             // origin: process.env.FE_BASE_URL,
//             origin: "*",
//             methods: ["GET", "POST"],
//             transports: ['websocket', 'polling'],
//             credentials: true
//         },
//         allowEIO3: true
//     });
//     const pubClient = createClient({ url: `redis://${REDIS_HOST || '127.0.0.1'}:${REDIS_PORT || 6379}` });
//     const subClient = pubClient.duplicate();

//     await pubClient.connect();
//     await subClient.connect();

//     const redisAdapter = createAdapter(pubClient, subClient);
//     io.adapter(redisAdapter);

//     global.io = io;

//     console.log('Socket.IO initialized with Redis');
// }
async function initializeSocket(server) {
    io = new Server(server, {
        cors: {
            origin: "*",
            methods: ["GET", "POST"],
            transports: ["websocket", "polling"],
            credentials: true
        },
        allowEIO3: true
    });

    const pubClient = createClient({ url: `redis://${REDIS_HOST}:${REDIS_PORT}` });
    const subClient = pubClient.duplicate();

    await pubClient.connect();
    await subClient.connect();

    const redisAdapter = createAdapter(pubClient, subClient);
    io.adapter(redisAdapter);

    global.io = io; // So you can use `global.io` elsewhere

    console.log("✅ Socket.IO initialized with Redis Adapter");
}

async function remoteJoinUserToRoom(user_socket_id, room_name) {
    try {
        // const namespace = io.of("/");
        await io.of("/").adapter.remoteJoin(user_socket_id, room_name);
        console.log(`🔗 Remote joined ${user_socket_id} to room ${room_name}`);

        // if (typeof namespace.adapter.remoteJoin === "function") {
        //     await new Promise((resolve, reject) => {
        //         namespace.adapter.remoteJoin(user_socket_id, room_name, (err) => {
        //             if (err) return reject(err);
        //             resolve();
        //         });
        //     });
        //     console.log(`🔗 Remote joined ${user_socket_id} to room ${room_name}`);
        // } else {
        //     console.warn("⚠️ remoteJoin is not available. Check adapter setup.");
        // }
    } catch (error) {
        console.log('error', error);
    }
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
async function remoteLeaveUserFromRoom(userSocketId, roomName) {
    const namespace = io.of("/");
    if (typeof namespace.adapter.remoteLeave === "function") {
        await new Promise((resolve, reject) => {
            namespace.adapter.remoteLeave(userSocketId, roomName, (err) => {
                if (err) return reject(err);
                resolve();
            });
        });
        console.log(`🚪 User ${userSocketId} removed from room ${roomName}`);
    } else {
        console.warn("⚠️ remoteLeave is not available. Check adapter setup.");
    }
}

module.exports = { initializeSocket, getIO, remoteJoinUserToRoom, remoteLeaveUserFromRoom };