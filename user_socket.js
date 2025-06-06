const express = require('express');
const { createClient } = require('@redis/client');
// const client = createClient({
//   url: process.env.REDIS_URL,
// });
const client = createClient({ url: `redis://${process.env.REDIS_HOST || '127.0.0.1'}:${process.env.REDIS_PORT || 6379}` });
const appSettings = require('./src/models/settingModel');
const RequestRide = require('./src/models/RequestRide');
const FUNC = require('./src/functions/function');
const { SOCKET_USER_PORT } = require('./src/config/dev.config');
const moment = require('moment');
const http = require('http');
const { initializeSocket, getIO } = require('./socket');
// const { setRedis, getRedis } = require('./src/utils/functions');
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

    socket.on("*", async function (event, data, ack) {

      try {
        await client.connect();
        if (event === "test_socket") {

          io.to(data.socket_id).emit(data.event, data.message);
          return data.socket_id;
        }
        if (event === "authenticate") {
          try {
            const user = await User.findOne({
              login_token: data.login_token,
              is_active: 1
            }, {
              _id: 1,
              first_name: 1,
              last_name: 1,
              full_name: 1,
              mobile: 1,
              in_ride: 1,
              stripe_card_data: 1,
              fcm_token: 1
            }).lean();

            if (!user) {
              ack({
                status: 401,
                message: 'Authentication failed: Invalid login token'
              });
              return;
            }

            // Save socket ID in Redis
            await new Promise((resolve, reject) => {
              client.set("socket_user:" + user._id.toString(), socket.id, (err, result) => {
                if (err) {
                  console.log("Redis error:", err);
                  ack({
                    status: 500,
                    message: 'Internal server error (Redis)'
                  });
                  return reject(err);
                }
                resolve(result);
              });
            });

            socket.user_data = user;

            if (user.in_ride) {
              const rides = await Ride.aggregate([
                { $match: { "basic.user_id": user._id, "basic.ride_status": { $in: ["accepted", "arrived", "running"] } } },
                {
                  $lookup: {
                    from: 'users',
                    localField: 'basic.provider_id',
                    foreignField: '_id',
                    as: 'provider'
                  }
                },
                { $unwind: "$provider" },
                {
                  $lookup: {
                    from: 'categories',
                    localField: 'meta.category_id',
                    foreignField: '_id',
                    as: 'category'
                  }
                },
                { $unwind: "$category" },
                {
                  $project: {
                    _id: 1,
                    basic: 1,
                    location: 1,
                    payment: 1,
                    created: 1,
                    'provider.first_name': 1,
                    'provider.last_name': 1,
                    'provider.full_name': 1,
                    'provider.mobile': 1,
                    'provider.callingmobile': 1,
                    'provider.photo': 1,
                    'provider.total_rating': 1,
                    'provider.rated': 1,
                    'provider.avg_rating': 1,
                    'provider.image': 1,
                    'category.thumb_3x': 1
                  }
                }
              ]);

              if (!rides || rides.length === 0) {
                ack({
                  status: 200,
                  message: 'Authentication Successful',
                  in_ride: false,
                  data: []
                });
                return;
              }

              // Load provider locations
              const providerIds = rides.map(ride => ride.basic.provider_id._id);
              const locations = await Location.find({
                provider_id: { $in: providerIds }
              }).lean();

              const locationMap = new Map();
              locations.forEach(loc => {
                locationMap.set(loc.provider_id.toString(), loc);
              });

              // Prepare ride data
              const rideResults = rides.map(ride => {
                const ride_data = {
                  ride_id: ride._id.toString(),
                  ride_type: ride.basic.ride_type,
                  ride_status: ride.basic.ride_status,
                  start_on: ride.created,
                  load_sec: ride.basic.ridestationtype === "daily" ? 10 : 20,
                  instruction: appSettings[`${ride.basic.ridestationtype}_instruction`] || "",
                  source: ride.location.source,
                  ride_edit_status: ride.basic.ride_edit_status,
                  destination: ride.location.destination,
                  stops: ride.location.stops,
                  otp: ride.basic.otp,
                  time_estimate: 5,
                  payment_type: ride.basic.payment_type,
                  fare_estimate: ride.payment.fare_estimate,
                  airportcharge: ride.payment.airportcharge,
                  airportstatus: ride.payment.airportstatus,
                  base_fixed_fare: ride.payment.base_fixed_fare,
                  per_km: ride.payment.per_km,
                  car_title: ride.basic.vehicle.title,
                  plateno: ride.basic.vehicle.plateno,
                  color: ride.basic.vehicle.color,
                  driver_name: ride.basic.provider_id.first_name + ' ' + ride.basic.provider_id.last_name,
                  driver_image: "https://customer.ktscab.com/drivers/" + ride.basic.provider_id.image,
                  avg_rating: ride.basic.provider_id.avg_rating,
                  driver_mobile: ride.basic.provider_id.callingmobile,
                  category_image: ride.meta.category_id.thumb_3x,
                  created: ride.created
                };

                if (ride_data.payment_type === "Card") {
                  ride_data.card = ride.payment.card;
                }

                const location_packet = locationMap.get(ride.basic.provider_id._id.toString());
                if (location_packet) {
                  ride_data.provider_location = {
                    _id: location_packet.provider_id.toString(),
                    longitude: location_packet.location[0],
                    latitude: location_packet.location[1],
                    bearing: location_packet.bearing,
                    time_estimate: location_packet.time_estimate,
                    speed: 0
                  };

                  // Join room
                  const track_room = 'trackprovider_' + ride_data.provider_location._id;
                  socket.join(track_room);
                }

                return ride_data;
              });

              // Return success
              ack({
                status: 200,
                message: 'Authentication Successful',
                in_ride: true,
                data: rideResults
              });

            } else {
              // Not in ride
              ack({
                status: 200,
                message: 'Authentication Successful',
                in_ride: false,
                data: []
              });
            }

          } catch (err) {
            console.error("Error in authenticate:", err);
            ack({
              status: 500,
              message: 'Internal server error'
            });
          }
        }


        switch (event) {
          case "search_taxi": {
            try {
              const source = {
                longitude: data.longitude,
                latitude: data.latitude
              };

              // Perform $geoNear query — FASTER
              let location_query = [
                {
                  $geoNear: {
                    near: {
                      type: "Point",
                      coordinates: [source.longitude, source.latitude]  // [lng, lat]
                    },
                    distanceField: "distance", // result will include this field in meters
                    maxDistance: 4000,         // in meters (4 km)
                    minDistance: 0,            // optional, but included for clarity
                    spherical: true,           // must be true when using GeoJSON
                    query: {
                      ...(Array.isArray(data.category_id) && data.category_id.length > 0
                        ? { type_ids: { $in: data.category_id } } // Ensure it's a proper $in array filter
                        : {}),
                      available: true,
                      blocked: false
                    },
                    key: "locations.coordinates" // path to 2dsphere index field
                  }
                }
              ];

              const locations = await Location.aggregate(location_query);

              // Leave existing provider rooms
              const rooms = io.sockets.adapter.sids[socket.id];
              for (const room in rooms) {
                if (room.indexOf("provider_") === 0) {
                  socket.leave(room);
                }
              }

              if (locations.length > 0) {
                for (const location of locations) {
                  const location_packet = {
                    _id: location.provider_id.toString(),
                    longitude: location.location[0],
                    latitude: location.location[1],
                    bearing: location.bearing,
                    speed: 0
                  };
                  const room_id = 'provider_' + location.provider_id.toString();
                  socket.join(room_id);

                  socket.emit('provider_location', location_packet);
                }
                // If wallet → refund logic
                if (data.payment_type === "wallet") {
                  const ride_details = await Ride.findOne({ _id: ObjectId(data.ride_id) }).lean();
                  if (!ride_details) {
                    console.error("Ride not found for refund.");
                    return;
                  }
                  await FUNC.processRefund(data.ride_id, socket.user_data._id, ride_details.payment.fare_estimate);
                }
                ack({
                  status: 203,
                  message: 'Please Try Again !!',
                });
                return;
              } else {
                // No taxi found — wallet refund if needed
                if (data.payment_type === "wallet") {
                  const ride_details = await Ride.findOne({ _id: ObjectId(data.ride_id) }).lean();
                  if (!ride_details) {
                    console.error("Ride not found for refund.");
                    return;
                  }
                  await FUNC.processRefund(data.ride_id, socket.user_data._id, ride_details.payment.fare_estimate);
                }

                ack({
                  status: 203,
                  message: 'Please Try Again !!',
                });
                return;
              }

            } catch (err) {
              console.error("Error in search_taxi:", err);
              ack({
                status: 500,
                message: 'Internal server error'
              });
            }

            break;
          }


          case 'book_ride': {
            console.log("==========book_ride============");
            let source = data.source;
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
            var stops = data.stops;
            var destination = data.destination;
            var payment_type = data.payment_type;
            var razorpay_orderId = data.razorpay_orderId;
            var distance = data?.distance?.split(" ")[0];
            var duration = data.duration;
            var razorpay_paymentId = data.razorpay_paymentId;
            // var schedule = data.schedule;
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
                console.log("========provider_ids--------", provider_ids);
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

                var request_data = {};
                var ride_id = NewRide._id.toString();
                request_data.ride_id = ride_id;
                request_data.ride_status = NewRide.basic.ride_status;
                request_data.ride_edit_status = NewRide.basic.ride_edit_status;
                request_data.ride_type = NewRide.basic.ride_type;
                request_data.load_sec = 60;
                request_data.ridestationtype = NewRide.basic.ridestationtype;
                request_data.planId = NewRide.basic.planId;
                request_data.way = NewRide.basic.way;
                request_data.start_on = moment().unix();
                request_data.user_name = socket.user_data.full_name;
                request_data.user_mobile = socket.user_data.mobile;
                request_data.source = source;
                request_data.distance = distance;
                request_data.duration = duration;
                request_data.destination = destination;
                request_data.stops = stops;
                request_data.payment_type = payment_type;
                request_data.razorpay_orderId = razorpay_orderId;
                request_data.razorpay_paymentId = razorpay_paymentId;
                request_data.fare_estimate = fare_estimate;
                request_data.airportcharge = airportcharge;
                request_data.airportstatus = airportstatus;
                request_data.base_fixed_fare = base_fixed_fare;
                request_data.per_km = per_km;
                request_data.instructions = "";
              }

              const processProviders = async () => {
                try {
                  for (let provider of allProviders) {

                    await client.rPush(`request_queue:${ride_id}`, provider.provider_id._id.toString());

                    await RequestRide.create({ ride_id: ride_id, provider_id: provider.provider_id._id });
                  }

                  await client.set(`request_data:${ride_id}`, JSON.stringify(request_data));

                  const settingData = await appSettings.findOne();
                  await client.set(`ride_attempt:${ride_id}`, settingData.ride_settings.ride_attempt);

                  await FUNC.send_request(ride_id, io, appSettings);

                } catch (err) {
                  const rideDetails = await Ride.findOneAndUpdate(
                    { _id: ride_id, "basic.ride_status": "requested" },
                    { $set: { "basic.ride_status": "declined" } },
                    { new: true }
                  );

                  if (rideDetails) {
                    socket.emit('ride_declined', { ride_id: ride_id });
                  }
                  console.error('Error in processProviders:', err);
                }
              };

              processProviders();

            }
            break;
          }
          default:
            ack({
              status: 500,
              message: 'Unknown event fired'
            });
            break;
        }

      } catch (err) {
        console.log('err', err);
        ack({
          status: 500,
          message: 'Internal server error'
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