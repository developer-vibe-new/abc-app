const express = require('express');
const { SOCKET_USER_PORT } = require('./src/config/dev.config');
const moment = require('moment');
const http = require('http');
const { initializeSocket, getIO } = require('./socket');
const { setRedis, getRedis } = require('./src/utils/functions');
const User = require('./src/models/users');
// const redisKeyPrefix = 'UserSocket:';
const connectDB = require('./src/config/db.config');
const { ObjectId } = require('mongoose').Types;
const Location = require('./src/models/locationModel');
connectDB();
const app = express();
const server = http.createServer(app);
let totalUser = 0;

async function runServer() {
    await initializeSocket(server);
    const io = getIO();
  
    io.on('connection', (socket) => {
      console.log(`====================== User (${++totalUser}) CONNECTED ======================`, socket?.id);
   
      const onevent = socket.onevent;
      socket.onevent = function (packet) {
        const args = packet.data || [];
        onevent.call(this, packet);
        packet.data = ["*"].concat(args);
        onevent.call(this, packet);
      };
  
      socket.on("*", async function (event, data) {
         
        try {
          if (event === "test_socket") {
            
            io.to(data.socket_id).emit(data.event, data.message);
            return data.socket_id;
          }
          if (event === "authenticate") {
            try {
              const userData = await User.findOne({ login_token: data.loginToken, is_active: true });
              if (userData) {
                socket.user_data = userData;
                // await setRedis(redisKeyPrefix + userData._id.toString(), socket.id);
                socket.emit('authenticationSuccess', {
                  status: 200,
                  message: 'Authentication successful',
                  data: userData
                });
              } else {
                socket.emit('error', {
                  status: 400,
                  message: 'Authentication failed: Invalid login token',
                });
              }
            } catch (err) {
              socket.emit('error', {
                status: 400,
                message: 'An error occurred during authentication',
                error: err.message,
              });
            }
            return;
          }
          if (!socket.user_data) {
            socket.emit('error', {
              status: 401,
              message: 'Authentication required',
            });
            return;
          }
  
          switch (event) {

            case "search_taxi": 

            var source = {
              "longitude": data.longitude,
              "latitude": data.latitude
            };

            const location_query = [
              {
                $geoNear: {
                  near: { type: "Point", coordinates: [source.longitude, source.latitude] },
                  distanceField: "distance",
                  maxDistance: 4000,
                  minDistance: 0,
                  spherical: true,
                  query: {
                    ...(Array.isArray(data.category_id) && data.category_id.length > 0 ? { type_ids: data.category_id } : {}),
                    available: true,
                    blocked: false
                  },
                  key: 'locations.coordinates'
                }
              }
            ];
            
            const locationData = await Location.aggregate(location_query);

            if(locationData.length > 0) {
              socket.emit('provider_location', {
                status: 200,
                message: 'Taxi found',
                data: locationData
              });
            }

            break;
            
            default:
              socket.emit('unknown_event', {
                success: false,
                message: 'Unknown event fired',
              });
              break;
          }
        } catch (err) {
          socket.emit('error', {
            success: false,
            message: 'An error occurred',
            error: err.message,
          });
        }
      });
  
      socket.on("disconnect", function () {
        --totalUser;
        console.log(`====================== User (${totalUser}) DISCONNECTED ======================`, socket?.id);
      });
    });
  
    server.listen(SOCKET_USER_PORT, () => {
      console.log(`User listening on port ${SOCKET_USER_PORT}`);
    });
  }
  
  runServer().catch(console.error);