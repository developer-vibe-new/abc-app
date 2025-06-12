const express = require('express');
const http = require('http');
const mongoose = require('mongoose');
const moment = require('moment');
const { initializeSocket, getIO } = require('./socket');
const { SOCKET_DELIVERY_PORT } = require('./src/config/dev.config');
const { getClient } = require('./src/config/redis');
const client = getClient();
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

    socket.on("*", async function (event, data, ack) {
      try {
        if (event === "test_socket") {
          io.to(data.socket_id).emit(data.event, data.message);
          return;
        }

        if (event === "authenticate") {
          try {
            let pipeline = [
              {
                $match: {
                  login_token: data.login_token,
                  is_active: true
                },
              },
              {
                $lookup: {
                  from: "provider_taxis",
                  localField: "online_taxi",
                  foreignField: "_id",
                  as: "result"
                }
              }
            ];

            const providers = await Provider.aggregate(pipeline);

            if (providers.length <= 0) {
              return ack({
                status: 440,
                success: false,
                message: "Wrong Login Token"
              });
            }
            let provider = providers[0];
            socket.user_data = provider;
            socket.join("provider_room");

            await client.set(`socket_provider:${provider._id}`, socket.id);

            if (provider.in_ride) {
              let ride_details = await Ride.aggregate([
                {
                  $match: {
                    _id: new mongoose.Types.ObjectId(provider.ride_id)
                  }
                },
                {
                  $lookup: {
                    from: 'users', // collection name of users
                    localField: 'basic.user_id',
                    foreignField: '_id',
                    as: 'user_info'
                  }
                },
                {
                  $unwind: {
                    path: '$user_info',
                    preserveNullAndEmptyArrays: true
                  }
                },
                {
                  $addFields: {
                    'basic.user_id': {
                      _id: '$user_info._id',
                      first_name: '$user_info.first_name',
                      last_name: '$user_info.last_name',
                      mobile: '$user_info.mobile',
                      full_name: '$user_info.full_name',
                      callingmobile: '$user_info.callingmobile'
                    }
                  }
                },
                {
                  $project: {
                    user_info: 0 // remove temporary user_info field
                  }
                }
              ]);


              if (ride_details.length <= 0) {
                return ack({
                  status: 200,
                  success: true,
                  message: "Authentication Successful",
                  in_ride: false,
                  data: {}
                });
              }
              ride_details = ride_details[0];
              socket.ride_details = {
                ride_id: provider.ride_id.toString(),
                ride_status: ride_details.basic.ride_status,
                ridestationtype: ride_details.basic.ridestationtype,
                source: ride_details.location.source,
                destination: ride_details.location.destination,
                outstation: ride_details.outstation
              };

              const request_data = {
                ride_id: ride_details._id.toString(),
                ride_type: ride_details.basic.ride_type,
                ride_status: ride_details.basic.ride_status,
                ridestationtype: ride_details.basic.ridestationtype,
                outstation: ride_details.outstation,
                start_on: ride_details.created,
                updated_at: ride_details.updated,
                arrived_time: ride_details?.time?.arrived,
                instructions: ride_details.basic.instructions || '',
                source: ride_details.location.source,
                destination: ride_details.location.destination,
                stops: ride_details.location.stops,
                otp: ride_details.basic.otp,
                payment_type: ride_details.basic.payment_type,
                load_sec: ride_details.basic.ridestationtype === "daily" ? 10 : 20
              };

              if (ride_details.basic.ridestationtype === "rentals") {
                // const RentalDetails = await rentalModel.findOne({ _id: ride_details.basic.planId }).lean();
                // if (RentalDetails) {
                //   request_data.planhour = RentalDetails.packages.hour;
                //   request_data.plankm = RentalDetails.packages.distance;
                // }
              }

              if (ride_details.basic.ride_type !== 'manual') {
                request_data.user_name = ride_details.basic.user_id.full_name;
                request_data.user_mobile = ride_details.basic.user_id.mobile;
                request_data.fare_estimate = ride_details.payment.fare_estimate;
              }

              if (request_data.payment_type === "Card") {
                request_data.card = ride_details.payment.card;
              }

              return ack({
                status: 200,
                success: true,
                message: "Authentication Successful",
                in_ride: true,
                data: request_data
              });

            } else {

              const redisKey = `ride_request:${provider._id}`;
              try {
                const redisData = await client.get(redisKey);

                ack({
                  status: 200,
                  success: true,
                  message: "Authentication Successful",
                  in_ride: false,
                  data: {}
                });
                if (redisData) {
                  const request_data = JSON.parse(redisData);
                  await client.del(redisKey);
                  socket.emit('new_request', request_data);
                }
              } catch (err) {
                console.error("Redis error:", err);
                ack({
                  status: 500,
                  success: false,
                  message: "Redis error"
                });
              }
            }
          } catch (error) {
            console.error("Auth Error:", error);
            ack({
              status: 500,
              success: false,
              message: "Internal server error"
            });
          }
        }


        // if (!socket.providerDetail) {
        //   ack({
        //     status: 500,
        //     success: false,
        //     message: 'Authentication required',
        //   });
        //   return;
        // }

        switch (event) {
          case "updateLocation": {
            console.log("=====Update Location =====");
            let now_date = moment().toDate();
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
            );

            const location_packet = {
              _id: socket.providerDetail._id.toString(),
              longitude: data.longitude,
              latitude: data.latitude,
              firstName: socket.providerDetail.first_name,
              lastName: socket.providerDetail.last_name
            };

            socket.emit('location_update', location_packet);
            break;
          }
          case 'accept_ride': {
            console.log("===== Accept Ride =====");
            let now_date = moment().toDate();
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
            ]);

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
              // const timeEstimateOBJ = await FUNC.time_estimate(customer_location, rideData[0].location.destination);
              // var timeEstimate = timeEstimateOBJ.estimated_time;

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
            break;
          };

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
      console.log("disconnectMessage");
      --totalProviders;
      console.log(`====================== Providers (${totalProviders}) Partner DISCONNECTED ======================`, socket?.id);
    });
  });

  server.listen(SOCKET_DELIVERY_PORT, () => {
    console.log(`Delivery listening on port ${SOCKET_DELIVERY_PORT}`);
  });
}

runServer().catch(console.error);