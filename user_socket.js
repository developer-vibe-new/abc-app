const express = require('express');
const { SOCKET_USER_PORT } = require('./src/config/dev.config');
const moment = require('moment');
const http = require('http');
const { initializeSocket, getIO } = require('./socket');
const { setRedis, getRedis } = require('./src/utils/functions');
const User = require('./src/models/users');
const Ride = require('./src/models/ride');
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
            let location_query = [
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

            if (locationData.length > 0) {
              socket.emit('provider_location', {
                status: 200,
                message: 'Taxi found',
                data: locationData
              });
            }
            break;

          case 'book_ride':
            var source = {
              "longitude": data.longitude,
              "latitude": data.latitude
            };
            let locationQuery = [
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
              },
              {
                $lookup: {
                  from: "providers",
                  localField: "provider_id",
                  foreignField: "_id",
                  as: "provider_id"
                }
              },
              {
                $unwind: {
                  path: "$provider_id",
                  preserveNullAndEmptyArrays: true
                }
              },
              {
                $limit: 10
              }
            ];

            var category_id = data.category_id;
            var ride_type = data.ride_type;
            var ridestationtype = data.ridestationtype;
            var planId = data.planId;
            var way = data.way;
            var city_id = data.city_id;
            var source = data.source;
            var stops = data.stops;
            var destination = data.destination;
            var payment_type = data.payment_type;
            var razorpay_orderId = data.razorpay_orderId;
            var distance = data?.distance?.split(" ")[0];
            var duration = data.duration;
            var razorpay_paymentId = data.razorpay_paymentId;
            var schedule = data.schedule;
            var ride_on = (data.ride_on) ? data.ride_on : moment().unix();
            var offercode = data.offercode;
            var offer_id = data.offer_id;
            var beforefare = data.beforefare;
            var afterfare = data.afterfare;
            var airportstatus = data.airportstatus;
            var airportcharge = data.airportcharge;
            var base_fixed_fare = data.base_fixed_fare;
            var per_km = data.per_km;
            var fare_estimate = data.fare_estimate;

            const location_data = await Location.aggregate(locationQuery);
            var allProviders = location_data;
            if (allProviders.length > 0) {
              var provider_ids = [];
              var provider_addrs = [];
              for (let provider of allProviders) {
                provider = provider.toObject ? provider.toObject() : provider;
                provider_ids.push(provider.provider_id._id);
                provider_addrs.push({
                  longitude: provider.locations[0],
                  latitude: provider.locations[1],
                });
                var new_ride = {
                  basic: {
                    ride_type: ride_type,
                    ridestationtype: ridestationtype,
                    planId: planId,
                    way: way,
                    ride_status: "requested",
                    // payment_type: payment_type,
                    // razorpay_orderId: razorpay_orderId,
                    // razorpay_paymentId: razorpay_paymentId,
                    user_id: socket.user_data._id,
                    instructions: "",
                    // stripe_id: user.stripe_id,
                    bookdistance: distance,
                  },
                  location: {
                    source: source,
                    destination: destination,
                    stops: stops,
                  },
                  meta: {
                    category_id: category_id,
                    city_id: city_id,
                    zone_id: city_id,
                    search_providers: provider_ids
                  },
                  payment: {
                    fare_estimate: fare_estimate,
                    airportcharge: airportcharge,
                    airportstatus: airportstatus,
                    base_fixed_fare: base_fixed_fare,
                    per_km: per_km,
                    // onlinepayment: onlinepayment,
                    // offlinepayment: offlinepayment,
                  },
                  time: {
                    ride_on: ride_on
                  },
                  offer: {
                    offercode: offercode,
                    offer_id: offer_id,
                    beforefare: beforefare,
                    afterfare: afterfare,
                  }
                };
                var NewRide = new Ride(new_ride);
                await NewRide.save();
                socket.emit('booking_in_progress', {
                  success: true,
                  message: 'Booking in progress',
                  data: {
                    ride_id: NewRide._id
                  }
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