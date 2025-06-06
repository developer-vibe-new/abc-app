const { createClient } = require('@redis/client');
const client = createClient({
  url: process.env.REDIS_URL,
});
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
// const User = require('./src/models/users');
const Location = require('./src/models/locationModel');
const ProviderTaxi = require('./src/models/providerTaxi');
const Ride = require('./src/models/ride');
// const providerSocket = 'ProviderSocket:';
const FUNC = require('./src/functions/function');
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
            if (!client.isOpen) {
              try {
                await client.connect();
                console.log('Redis client connected');
              } catch (err) {
                return socket.emit('error', {
                  status: 500,
                  message: 'Error connecting to Redis',
                  error: err.message,
                });
              }
            }
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
                online_taxi: providerDetail.online_taxi,
                last_name: providerDetail.last_name
              };
              await setRedis("socket_provider:" + providerDetail._id.toString(), socket.id);
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

          case 'accept_ride':
            console.log("===== Accept Ride =====");
            var now_date = moment().toDate();
            const providerTaxiData = await ProviderTaxi.aggregate([
              {
                $match: {
                  _id: new mongoose.Types.ObjectId(socket.providerDetail.online_taxi)
                }
              },
              {
                $lookup: {
                  from: "cars",
                  localField: "car_id",
                  foreignField: "_id",
                  as: "car_id"
                }
              },
              {
                $unwind: "$car_id"
              }
            ])

            if (providerTaxiData.length === 0) {
              socket.emit('error', {
                status: 400,
                message: 'Taxi not found',
              });
              return;
            }

            const providerData = await Provider.findOne({ _id: socket.providerDetail._id });
            if (!providerData) {
              socket.emit('error', {
                status: 400,
                message: 'Driver not found',
              });
              return;
            }

            const rideData = await Ride.aggregate([
              {
                $match: {
                  _id: new mongoose.Types.ObjectId(data.ride_id),
                  "basic.ride_status": "requested",
                  "meta.search_providers": new mongoose.Types.ObjectId(socket.providerDetail._id)
                },
              },
              {
                $lookup: {
                  from: "taxi_types",
                  localField: "meta.category_id",
                  foreignField: "_id",
                  as: "meta.category_id"
                }
              },
              {
                $unwind: "$meta.category_id"
              },
              {
                $lookup: {
                  from: "users",
                  localField: "basic.user_id",
                  foreignField: "_id",
                  as: "basic.user_id"
                }
              },
              {
                $unwind: "$basic.user_id"
              },
              {
                $set: {
                  "basic.provider_id": new mongoose.Types.ObjectId(socket.providerDetail._id),
                  "basic.ride_status": "accepted",
                  "basic.otp": Math.floor(1000 + Math.random() * 9000),
                  "basic.vehicle.title": providerTaxiData[0].car_id.make + ' ' + providerTaxiData[0].car_id.title,
                  "basic.vehicle.plateno": providerTaxiData[0].plateno,
                  "time.accepted": now_date,
                  "meta.taxi_id": new mongoose.Types.ObjectId(providerTaxiData[0]._id),
                  "meta.category_id": providerTaxiData[0].type_ids[0],
                  "basic.providername": providerData.first_name + ' ' + providerData.last_name,
                  "basic.pickup_distance": data.pickup_distance
                }
              },
              {
                $set: {
                  "meta.search_providers": {
                    $filter: {
                      input: "$meta.search_providers",
                      as: "provider",
                      cond: { $ne: ["$$provider", new mongoose.Types.ObjectId(socket.providerDetail._id)] }
                    }
                  }
                }
              }
            ]);

            let location = data.locations;
            location.forEach(locations => {
              locations.coordinates = [locations.coordinates[1], locations.coordinates[0]];
            });

            var driver_location = {
              "latitude": location[0].coordinates[1],
              "longitude": location[0].coordinates[0]
            };

            if (rideData && rideData.length > 0) {
              const rideId = rideData[0]._id;
              await Ride.updateOne(
                { _id: rideId },
                { $set: rideData[0] }
              );
              let customer_location = rideData[0].location.source;
              const distanceObj = await FUNC.time_estimate(driver_location, customer_location);
              var estimate_time = distanceObj.estimated_time;
              const timeEstimateOBJ = await FUNC.time_estimate(customer_location, rideData[0].location.destination);
              var timeEstimate = timeEstimateOBJ.estimated_time;

              const user_socket = await client.get('socket_user:' + rideData[0].basic.user_id._id.toString());
              var track_room = 'trackProvider_' + socket.providerDetail._id.toString();

              socket.join(track_room);
              io.to(track_room).emit('room_joined', user_socket);
              if (socket.rooms.has(track_room)) {
                console.log(`Socket ${socket.id} is in room: ${track_room}`);
              } else {
                console.log(`Socket ${socket.id} is NOT in room: ${track_room}`);
              }
              await Location.findOneAndUpdate(
                { provider_id: socket.providerDetail._id },
                { time_estimate: estimate_time }
              );

              socket.to(user_socket).emit('ride_accepted', "Ride Accepted");

            } else {
              console.log("No matching ride found or ride data is empty.");
            }

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