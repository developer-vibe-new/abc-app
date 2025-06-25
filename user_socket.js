const express = require('express');
require('dotenv').config();

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
const chatModel = require('./src/models/chatModel');
const cityModel = require('./src/models/city');
const { getClient } = require('./src/config/redis');
const client = getClient();
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

        if (event === "test_socket") {

          io.to(data.socket_id).emit(data.event, data.message);
          return data.socket_id;
        }
        if (typeof (ack) == "function") {
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
              try {
                await client.set("socket_user:" + user._id.toString(), socket.id);
              } catch (err) {
                console.log("Redis error:", err);
                ack({
                  status: 500,
                  message: 'Internal server error (Redis)'
                });
                return;
              }

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
                const settingData = await appSettings.findOne();
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
                    instruction: settingData[`${ride.basic.ridestationtype}_instruction`] || "",
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
                        coordinates: [Number(source.longitude), Number(source.latitude)]  // [lng, lat]
                      },
                      distanceField: "distance", // result will include this field in meters
                      maxDistance: 4000,         // in meters (4 km)
                      // minDistance: 0,            // optional, but included for clarity
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
                      longitude: location.locations[0],
                      latitude: location.locations[1],
                      bearing: location.bearing,
                      speed: 0
                    };
                    const room_id = 'provider_' + location.provider_id.toString();
                    socket.join(room_id);
                    socket.emit('provider_location', location_packet);
                    ack();
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

              const { source, ridestationtype, planId, way,
                destination,
                payment_type,
                razorpay_orderId,
                razorpay_paymentId,
                ride_on = moment().unix(),
                offercode,
                offer_id,
                taxi_data: { id: category_id, per_km, price: fare_estimate, base_fixed_fare, city_id, name, distance,
                  duration }
              } = data;
              const locationQuery = [
                {
                  $geoNear: {
                    near: {
                      type: "Point",
                      coordinates: [Number(source.longitude), Number(source.latitude)]
                    },
                    distanceField: "distance",
                    maxDistance: 4000,
                    spherical: true,
                    query: {
                      ...(Array.isArray(category_id) && category_id.length > 0 ? { type_ids: category_id } : {}),
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
                { $limit: 10 }
              ];
              console.log('locationQuery', JSON.stringify(locationQuery));
              const location_data = await Location.aggregate(locationQuery);
              if (!location_data) {
                ack({
                  status: 404,
                  message: "Provider not found."
                });
              }
              console.log('location_data', location_data.length);
              const allProviders = location_data.map(p => p.toObject ? p.toObject() : p);

              if (allProviders.length === 0) break;

              const provider_ids = allProviders.map(p => p.provider_id._id);

              const new_ride = {
                basic: {
                  ride_type: name,
                  ridestationtype,
                  planId,
                  way,
                  ride_status: "requested",
                  user_id: socket.user_data._id,
                  instructions: "",
                  bookdistance: distance
                },
                location: { source, destination },
                meta: {
                  category_id,
                  city_id,
                  zone_id: city_id,
                  search_providers: provider_ids
                },
                payment: {
                  fare_estimate,
                  base_fixed_fare,
                  per_km
                },
                time: { ride_on },
                offer: { offercode, offer_id }
              };

              const NewRide = new Ride(new_ride);
              await NewRide.save();

              const ride_id = NewRide._id.toString();
              const request_data = {
                ride_id,
                ride_status: NewRide.basic.ride_status,
                ride_edit_status: NewRide.basic.ride_edit_status,
                ride_type: NewRide.basic.ride_type,
                ridestationtype: NewRide.basic.ridestationtype,
                planId: NewRide.basic.planId,
                way: NewRide.basic.way,
                start_on: moment().unix(),
                user_name: socket.user_data.full_name,
                user_mobile: socket.user_data.mobile,
                source,
                distance,
                duration,
                destination,
                payment_type,
                razorpay_orderId,
                razorpay_paymentId,
                fare_estimate,
                base_fixed_fare,
                per_km,
                instructions: ""
              };

              const processProviders = async () => {
                try {
                  await Promise.all(allProviders.map(provider => {
                    return Promise.all([
                      client.rPush(`request_queue:${ride_id}`, provider.provider_id._id.toString()),
                      RequestRide.create({ ride_id, provider_id: provider.provider_id._id })
                    ]);
                  }));
                  const settingData = await appSettings.findOne();
                  await client.set(`request_data:${ride_id}`, JSON.stringify(request_data));
                  await client.set(`ride_attempt:${ride_id}`, settingData.ride_settings.ride_attempt);

                  await FUNC.send_request(ride_id, io, settingData);

                } catch (err) {
                  const rideDetails = await Ride.findOneAndUpdate(
                    { _id: ride_id, "basic.ride_status": "requested" },
                    { $set: { "basic.ride_status": "declined" } },
                    { new: true }
                  );

                  if (rideDetails) {
                    socket.emit('ride_declined', { ride_id });
                  }

                  console.error('Error in processProviders:', err);
                }
              };

              await processProviders();
              ack({
                status: 200,
                success: true,
                message: "Booking in progress",
                data: { ride_id: NewRide._id }
              });
              break;
            }

            // Assuming this is inside an async function or a Socket.IO event handler
            case "User_msg_sent": {
              // Use an immediately-invoked async function to handle the logic
              // This keeps the `break` statement at the top level of the case.

              try {
                // 1. Destructure data for cleaner access
                const { ride_id, msg, type } = data;

                // 2. Use await for the asynchronous database query. No more callbacks!
                const ride_details = await Ride.findOne({ _id: ride_id })
                  .populate("basic.provider_id")
                  .exec(); // .exec() ensures a true promise is returned

                // 3. Add a check for robustness, in case the ride doesn't exist
                if (!ride_details || !ride_details.basic.provider_id) {
                  // Use the acknowledgment callback to send an error back to the client
                  ack({
                    status: 404,
                    message: "Ride or Provider not found."
                  });
                }

                const providerId = ride_details.basic.provider_id._id.toString();

                // 4. Create and save the new message document with await
                const new_msg = {
                  ride_id,
                  msg,
                  type,
                };

                // The `new Chat()` and `.save()` can be chained
                const savedMessage = await new chatModel(new_msg).save();

                // 5. Await the Redis call (assuming your redis client supports promises)
                const provider_socket = await client.get(`socket_provider:${providerId}`);

                // 6. Emit the message if the provider is currently connected
                if (provider_socket) {
                  socket.to(provider_socket).emit('user_message_received', {
                    ride_id: ride_id,
                    msg: msg,
                    msg_id: savedMessage._id.toString()
                  });
                }

                // 7. Send the push notification concurrently (no need to wait for it)
                // We use a separate constant for clarity
                // const notificationPayload = {
                //   receiverId: providerId,
                //   type: "MESSAGE", // More specific type than "BONUS"
                //   title: 'New Message from Rider',
                //   message: msg,
                //   entityId: ride_id, // The ride ID is likely more useful here
                // };

                // This can run in the background without blocking the response to the user
                // notification.PushNotificationsDriver(notificationPayload);

                // 8. Send a success response back to the user via the callback
                ack({
                  status: 200,
                  message: "Message Sent"
                });

              } catch (err) {
                // 9. Centralized error handling for all awaited promises
                console.error("Error in User_msg_sent:", err);
                ack({
                  status: 500, // Internal Server Error
                  message: "An error occurred while sending the message."
                });
              }
              break; // The break for the switch case
            };
            case "allowed_city": {
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
                      coordinates: [Number(source.longitude), Number(source.latitude)]  // [lng, lat]
                    },
                    distanceField: "distance", // result will include this field in meters
                    maxDistance: 50000,         // in meters (4 km)
                    // minDistance: 0,            // optional, but included for clarity
                    spherical: true,
                    key: "locations.coordinates" // path to 2dsphere index field
                  }
                }
              ];
              const cities = await cityModel.aggregate(location_query);
              if (cities.length > 0) {
                ack({
                  status: 200,
                  message: '',
                  data: cities
                });
              } else {
                ack({
                  status: 203,
                  message: 'Taxi is not allowed in this cities'
                });
              }

              break; // The break for the switch case
            };
            case "nearbycars": {
              try {
                let location_query = [
                  {
                    $geoNear: {
                      near: {
                        type: "Point",
                        coordinates: [Number(data.longitude), Number(data.latitude)]  // [lng, lat]
                      },
                      distanceField: "distance", // result will include this field in meters
                      maxDistance: 4000,         // in meters (4 km)
                      // minDistance: 0,            // optional, but included for clarity
                      spherical: true,           // must be true when using GeoJSON
                      query: {
                        available: true,
                        blocked: false
                      },
                      key: "locations.coordinates" // path to 2dsphere index field
                    }
                  },
                  {
                    $lookup: {
                      from: "taxi_types",        // your car type collection
                      localField: "type_ids",  // array of ObjectIds
                      foreignField: "_id",
                      pipeline: [{
                        $match: { is_active: true }
                      }, {
                        $project: {
                          _id: 1,
                          title: 1, icon: 1
                        }
                      }],
                      as: "taxies",         // this will hold all matched types
                    }
                  },
                  {
                    $project: {
                      _id: 1,
                      provider_id: 1,
                      available: 1,
                      locations: 1,
                      taxies: 1
                    }
                  },
                  {
                    $limit: 30
                  }
                ];
                const providers = await Location.aggregate(location_query);

                ack({
                  status: 200,
                  message: 'Nearby Cars',
                  data: providers,
                });

              } catch (err) {
                console.log(err);
                ack({
                  status: 500,
                  message: 'An error occurred',
                  data: err,
                });
              }
              break;
            }
            case "cancel_ride": {
              try {
                const ride_id = data.ride_id;

                const ride_details = await Ride.findOneAndUpdate(
                  {
                    _id: new ObjectId(ride_id),
                    "basic.ride_status": { $in: ["accepted", "arrived", "requested"] }
                  },
                  {
                    $set: {
                      "basic.ride_status": "cancelled",
                      "basic.cancelled_by": "user"
                    }
                  },
                  { new: true }
                ).populate("basic.provider_id").lean();

                if (!ride_details) {
                  return ack({
                    status: 404,
                    message: "Ride not found or not in a cancellable status."
                  });
                }

                // Refund if payment type is wallet
                if (ride_details.basic?.payment_type === "wallet") {
                  const user = await User.findById(socket.user_data._id);
                  if (!user) {
                    return ack({ status: 404, message: "User not found" });
                  }

                  const newBalance = parseFloat(user.userbalance || 0) + parseFloat(ride_details.payment.fare_estimate || 0);

                  await User.updateOne(
                    { _id: user._id },
                    { $set: { userbalance: newBalance } }
                  );

                  await Ride.updateOne(
                    { _id: ride_details._id },
                    {
                      $set: {
                        "basic.razorpay_refundId": "REFUND" + Date.now() + FUNC.randomString(4, "123456789"),
                        "payment.refund": ride_details.payment.fare_estimate,
                        "payment.onlinepayment": ride_details.payment.fare_estimate
                      }
                    }
                  );
                }

                // Notify driver via socket if connected
                if (ride_details.basic?.provider_id?._id) {
                  const provider_socket = await client.get(`socket_provider:${ride_details.basic.provider_id._id.toString()}`);

                  if (provider_socket) {
                    socket.to(provider_socket).emit("request_cancelled", { ride_id });

                    const track_room = "trackprovider_" + ride_details.basic.provider_id._id.toString();
                    socket.leave(track_room);
                    console.log('provider_socket--->>>', provider_socket);
                    await FUNC.updateInRide(ride_details._id, socket.user_data._id, ride_details.basic.provider_id._id, false);

                    ack({
                      status: 200,
                      message: "Ride cancelled Successfully"
                    });


                    // Send notifications to user and driver
                    // await notification.PushNotifications({
                    //   receiverId: socket.user_data._id,
                    //   deviceTokens: socket.user_data.fcm_token,
                    //   type: "BONUS",
                    //   title: "Ride cancelled Successfully",
                    //   message: "Ride cancelled Successfully",
                    //   entityId: socket.user_data._id
                    // });

                    // await notification.PushNotificationsDriver({
                    //   receiverId: ride_details.basic.provider_id._id.toString(),
                    //   type: "BONUS",
                    //   title: "Ride cancelled by user",
                    //   message: "Ride cancelled by user",
                    //   entityId: ride_details.basic.provider_id._id.toString()
                    // });
                  }
                }
                ack({
                  status: 200,
                  message: "Ride cancelled Successfully"
                });

              } catch (err) {
                console.error("Error during ride cancel:", err);
                ack({
                  status: 500,
                  message: "Error occurred while canceling the ride."
                });
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

  server.listen(SOCKET_USER_PORT, async () => {
    console.log(`User listening on port ${SOCKET_USER_PORT}`);
  });
}

runServer().catch(console.error);