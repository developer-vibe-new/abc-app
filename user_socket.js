const express = require('express');
const { SOCKET_USER_PORT } = require('./src/config/dev.config');
const moment = require('moment');
const http = require('http');
const { initializeSocket, getIO } = require('./socket');
const { setRedis, getRedis } = require('./src/utils/functions');
const User = require('./src/models/users');
const redisKeyPrefix = 'UserSocket:';
const connectDB = require('./src/config/db.config');
const { ObjectId } = require('mongoose').Types;
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
            console.log('event--------'+event, data)
          if (event === "test_socket") {
            
            io.to(data.socket_id).emit(data.event, data.message);
            return data.socket_id;
          }
          if (event === "authenticate") {
            try {
              const userData = await User.findOne({ loginToken: data.loginToken }).exec();
              if (userData) {
                console.log(userData);
                socket.user_data = userData;
                await setRedis(redisKeyPrefix + userData._id.toString(), socket.id);
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
            case "update_location":
              console.log('================================= LOCATION UPDATE =================================');
              const now_date = moment().toDate();
  
              let locations = [{
                coordinates: [data.latitude, data.longitude]
              }];
              const locationData = {
                locations,
                "lastupdatedlocation": now_date
              };
              await setRedis(redisKey, locationData);
              await User.updateOne(
                { _id: socket.user_data._id.toString() },
                { $set: locationData },
                { upsert: true }
              );
  
              const location_packet = {
                _id: socket.user_data._id.toString(),
                longitude: data.longitude,
                latitude: data.latitude,
                name: socket.user_data.name,
              };

              io.emit('location_update', location_packet);
  
              break;
  
            case "get_location":
              const redisLocation = await getRedis(fetchRedisKey);
  
              if (redisLocation && Object.keys(redisLocation).length > 0) {
                socket.emit('location_data', {
                  success: true,
                  data: redisLocation,
                  message: 'Location found in Redis',
                });
              } else {
                const dbLocation = await Delieverypartnerlocation.findOne({ userid: new ObjectId(data.user_id) });
                if (dbLocation) {
                  await setRedis(fetchRedisKey, dbLocation);
                  socket.emit('location_data', {
                    success: true,
                    data: dbLocation,
                    message: 'Location fetched from database',
                  });
                } else {
                  socket.emit('location_data', {
                    success: false,
                    message: 'Location not found',
                  });
                }
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