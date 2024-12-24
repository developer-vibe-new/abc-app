const express = require('express');
const http = require('http');
const mongoose = require('mongoose');
const moment = require('moment');
const { initializeSocket, getIO } = require('./socket');
const { SOCKET_DELIVERY_PORT } = require('./src/config/dev.config');
const { setRedis, getRedis, removeOrderFromAllPartners, sendNotification, payDeliveryCharge, payVendorCharge, haversineDistance } = require('./src/utils/functions');
// const Delieverypartnerlocation = require('./src/models/delieverypartnerlocation');
// const Delieverypartner = require('./src/models/delieverypartner');
const Provider = require('./src/models/providerModel');
const connectDB = require('./src/config/db.config');
const User = require('./src/models/users');
const Location = require('./src/models/locationModel')
// const redisKeyPrefixVendorSocket = 'ProviderSocket:';
// const redisKeyPrefixUserSocket = 'UserSocket:';
const providerSocket = 'ProviderSocket:';
connectDB();

const app = express();
const server = http.createServer(app);
let totalProviders = 0;

async function runServer() {
    await initializeSocket(server);
    const io = getIO();
  
    io.on('connection', (socket) => {
      console.log(`====================== Providers (${++totalProviders}) Partner CONNECTED ======================`, socket?.id);
  
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
            return;
          }
  
          if (event === "authenticate") {
            try {
              const providerDetails = await Provider.aggregate([
                {
                  $match: {
                    login_token: data.loginToken
                  }
                }
              ]);
              const providerDetail = providerDetails[0];
              if (providerDetail) {
                socket.providerDetail = {
                  _id: providerDetail._id,
                  is_active: providerDetail.is_active,
                  is_online: providerDetail.is_online,
                  first_name: providerDetail.first_name,
                  last_name: providerDetail.last_name
                }
                await setRedis(providerSocket + providerDetail._id.toString(), socket.id);
                socket.emit('authenticationSuccess', {
                  status: 200,
                  message: 'Authentication successful',
                  data: {
                    is_active: providerDetail?.is_active
                  }
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
  
          if (!socket.providerDetail) {
            socket.emit('error', {
              status: 401,
              message: 'Authentication required',
            });
            return;
          }
  
          switch (event) {
            case "updateLocation":
              console.log("=====Update Location =====");
              var now_date = moment().toDate();
              let locations = data.locations;
              locations.forEach(location => {
                location.coordinates = [location.coordinates[1], location.coordinates[0]];
              });
              const locationData = {
                bearing: data.bearing,
                speed: data.speed,
                locations: locations,
                lastupdatedlocation: now_date
              };
              await Location.findOneAndUpdate(
                { provider_id: socket.providerDetail._id },
                {
                  $set: locationData
                },
                { upsert: true }
              )

              const location_packet = {
                _id: socket.providerDetail._id.toString(),
                longitude: data.longitude,
                latitude: data.latitude,
                firstName: socket.providerDetail.first_name,
                lastName: socket.providerDetail.last_name
              };

              socket.emit('location_update', location_packet);
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
        console.log("disconnectMessage")
        --totalProviders;
        console.log(`====================== Providers (${totalProviders}) Partner DISCONNECTED ======================`, socket?.id);
      });
    });
  
    server.listen(SOCKET_DELIVERY_PORT, () => {
      console.log(`Delivery listening on port ${SOCKET_DELIVERY_PORT}`);
    });
  }
  
  runServer().catch(console.error);