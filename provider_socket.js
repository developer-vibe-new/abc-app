const express = require('express');
const http = require('http');
const mongoose = require('mongoose');
const { ObjectId } = require('mongoose').Types;
const moment = require('moment');
const { initializeSocket, getIO } = require('./socket');
const { SOCKET_DELIVERY_PORT } = require('./src/config/dev.config');
const { getClient } = require('./src/config/redis');
const client = getClient();
// const Delieverypartnerlocation = require('./src/models/delieverypartnerlocation');
// const Delieverypartner = require('./src/models/delieverypartner');
const Provider = require('./src/models/providerModel');
const userModel = require('./src/models/users');

const connectDB = require('./src/config/db.config');
// const User = require('./src/models/users');
const Location = require('./src/models/locationModel');
const rentalModel = require('./src/models/rentalModel');

const ProviderTaxi = require('./src/models/providerTaxi');
const Ride = require('./src/models/ride');
// const providerSocket = 'ProviderSocket:';
const FUNC = require('./src/functions/function');
const appSettings = require('./src/models/notificationModel');
const notificationModel = require('./src/models/notificationModel');

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
        if (typeof (ack) == "function") {

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
              socket.providerDetail = provider;
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
                  const RentalDetails = await rentalModel.findOne({ _id: ride_details.basic.planId }).lean();
                  if (RentalDetails) {
                    request_data.planhour = RentalDetails.packages.hour;
                    request_data.plankm = RentalDetails.packages.distance;
                  }
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
              console.log("=====Update Location =====", data);
              try {
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

              } catch (error) {
                console.error("Auth Error:", error);
                ack({
                  status: 500,
                  success: false,
                  message: "Internal server error"
                });
              }
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
            case "accept_ride": {
              try {
                const now = new Date();
                const { _id: providerId, online_taxi, callingmobile, avg_rating } = socket.user_data;

                const { ride_id, latitude, longitude, bearing, speed, pickup_distance } = data;

                const [taxi, provider] = await Promise.all([
                  ProviderTaxi.findOne({ _id: ObjectId(online_taxi._id) }).populate("car_id").lean(),
                  Provider.findById(ObjectId(providerId))
                ]);

                if (!taxi) return ack({ status: 203, message: "Your taxi not found" });
                if (!provider) return ack({ status: 203, message: "Your driver not found" });

                // Stripe ID ensure
                // let stripe_id = provider.stripe_id;
                // if (!stripe_id) {
                //   const { id: newStripeId } = await stripe.createMerchant({
                //     email: provider.email,
                //     first_name: provider.first_name,
                //     last_name: provider.last_name
                //   });
                //   stripe_id = newStripeId;
                //   await Provider.updateOne({ _id: providerId }, { $set: { stripe_id } });
                // }

                // Accept Ride
                const ride = await Ride.findOneAndUpdate(
                  {
                    _id: ObjectId(ride_id),
                    "basic.ride_status": "requested",
                    "meta.search_providers": ObjectId(providerId)
                  },
                  {
                    $pull: { "meta.search_providers": ObjectId(providerId) },
                    $set: {
                      "basic.provider_id": providerId,
                      "basic.ride_status": "accepted",
                      "basic.otp": Math.floor(1000 + Math.random() * 9000),
                      "basic.vehicle": {
                        title: `${taxi.car_id.make} ${taxi.car_id.title}`,
                        plateno: taxi.plateno,
                        color: taxi.color
                      },
                      "time.accepted": now,
                      "meta.taxi_id": taxi._id,
                      "meta.category_id": taxi.type_ids[0],
                      "basic.merchantStripe_id": '',
                      "basic.providername": `${provider.first_name} ${provider.last_name}`,
                      "basic.pickup_distance": pickup_distance
                    }
                  },
                  { new: true }
                ).populate("meta.category_id").populate("basic.user_id").lean();

                if (!ride) return ack({ status: 203, message: "Something went wrong, please try again" });

                const userIdStr = ride.basic.user_id._id.toString();
                const userSocket = await client.get(`socket_user:${userIdStr}`);

                const [pickupEstimate, dropEstimate] = await Promise.all([
                  FUNC.time_estimate({ latitude, longitude }, ride.location.source).catch(() => ({ estimated_time: 5, pickup_distance: 0 })),
                  FUNC.time_estimate(ride.location.source, ride.location.destination).catch(() => ({ estimated_time: 5 }))
                ]);

                // Join user to provider room
                const trackRoom = `trackprovider_${providerId}`;
                await io.of("/").adapter.remoteJoin(userSocket, trackRoom);

                // If rentals, load plan details
                let planhour = null, plankm = null;
                if (ride.basic.ridestationtype === "rentals" && ride.basic.planId) {
                  const rental = await rentalModel.findById(ObjectId(ride.basic.planId)).lean();
                  if (rental) {
                    planhour = rental.packages.hour;
                    plankm = rental.packages.distance;
                  }
                }
                const settingData = await appSettings.findOne();
                // Prepare response
                const request_data = {
                  ride_id: ride._id.toString(),
                  ride_status: ride.basic.ride_status,
                  otp: ride.basic.otp,
                  ride_type: ride.basic.ride_type,
                  ridestationtype: ride.basic.ridestationtype,
                  instruction: settingData[`${ride.basic.ridestationtype}_instruction`] || "",
                  start_on: ride.created,
                  updated_at: Math.floor(now.getTime() / 1000),
                  load_sec: ride.basic.ridestationtype === "daily" ? 10 : 20,
                  source: ride.location.source,
                  destination: ride.location.destination,
                  stops: ride.location.stops,
                  time_estimate: dropEstimate.estimated_time,
                  pickup_distance: pickupEstimate.pickup_distance,
                  payment_type: ride.basic.payment_type,
                  fare_estimate: ride.payment.fare_estimate,
                  card: ride.basic.payment_type === "Card" ? ride.payment.card : undefined,
                  planhour,
                  plankm,
                  car_title: ride.basic.vehicle.title,
                  plateno: ride.basic.vehicle.plateno,
                  color: ride.basic.vehicle.color,
                  driver_name: `${provider.first_name} ${provider.last_name}`,
                  driver_image: `https://customer.ktscab.com/drivers/${provider.image}`,
                  driver_mobile: callingmobile,
                  category_image: ride.meta.category_id.thumb_3x,
                  avg_rating,
                  created: ride.created,
                  provider_location: {
                    _id: providerId.toString(),
                    longitude,
                    latitude,
                    bearing,
                    speed,
                    time_estimate: pickupEstimate.estimated_time,
                    pickup_distance: pickupEstimate.pickup_distance
                  },
                  user_name: ride.basic.user_id.full_name,
                  user_mobile: ride.basic.user_id.mobile
                };

                // Emit to user socket
                socket.to(userSocket).emit("ride_accepted", request_data);

                // Update local socket data
                socket.ride_details = {
                  ride_id: ride._id.toString(),
                  ride_status: "accepted",
                  otp: ride.basic.otp,
                  providername: `${provider.first_name} ${provider.last_name}`,
                  driver_image: request_data.driver_image,
                  source: ride.location.source,
                  destination: ride.location.destination,
                  stops: ride.location.stops,
                  outstation: ride.outstation
                };

                // Update DB + emit notifications
                await Promise.all([
                  Location.updateOne({ provider_id: ObjectId(providerId) }, { $set: { time_estimate: pickupEstimate.estimated_time } }),
                  FUNC.updateInRide(ride._id, ride.basic.user_id._id, providerId, true),
                  FUNC.insertPath(ride._id, "accepted", longitude, latitude),
                  notificationModel.PushNotificationsUserwise({
                    receiverId: userIdStr,
                    type: "BONUS",
                    title: "Ride accept Successfully",
                    message: "Ride accept Successfully",
                    entityId: userIdStr
                  })
                ]);

                // Success
                ack({
                  status: 200,
                  message: "Ride Accepted Successfully",
                  data: request_data
                });

              } catch (err) {
                console.error("accept_ride error:", err);
                ack({ status: 500, message: "Internal server error, please try again later" });
              }

              break;
            }
            case "decline_ride": {
              try {
                const rideId = data.ride_id;
                const providerId = ObjectId(socket.user_data._id);

                const updateResult = await Ride.updateOne(
                  {
                    _id: ObjectId(rideId),
                    "basic.ride_status": "requested",
                    "meta.search_providers": providerId
                  },
                  {
                    $pull: { "meta.search_providers": providerId },
                    $addToSet: { "meta.declined_providers": providerId }
                  }
                );

                // If provider was in search_providers and now removed
                if (updateResult.modifiedCount === 1) {
                  const requestKey = `request_data:${rideId}`;
                  const requestDataRaw = await client.get(requestKey);
                  const requestData = JSON.parse(requestDataRaw || "{}");

                  requestData.start_on = moment().unix();
                  await client.set(requestKey, JSON.stringify(requestData));

                  await FUNC.unlockDriver(providerId.toString());

                  ack({
                    status: 200,
                    success: true,
                    message: "Ride declined Successfully"
                  });

                  FUNC.send_request(rideId, io, appSettings, async (err) => {
                    if (err) {
                      const ride = await Ride.findOneAndUpdate(
                        {
                          _id: ObjectId(rideId),
                          "basic.ride_status": "requested"
                        },
                        {
                          $set: { "basic.ride_status": "declined" }
                        },
                        { new: true }
                      ).lean();

                      if (ride) {
                        const userSocket = await client.get(`socket_user:${ride.basic.user_id.toString()}`);
                        socket.to(userSocket).emit("ride_declined", { ride_id: rideId });
                      }
                    }
                  });
                } else {
                  // Already removed or nothing to modify
                  ack({
                    status: 200,
                    success: true,
                    message: "Ride declined Successfully"
                  });
                }
              } catch (err) {
                console.error("decline_ride error:", err);
                ack({
                  status: 500,
                  message: "Something went wrong, please try again later."
                });
              }
              break;
            }
            case "cancel_ride": {
              try {
                const now_date = new Date();
                const ride_id = data.ride_id;
                const cancel_reason = data.cancel_reason;
                const providerId = socket.user_data._id;

                const ride_details = await Ride.findOneAndUpdate(
                  {
                    _id: ObjectId(ride_id),
                    "basic.ride_status": { $in: ["accepted", "arrived"] }
                  },
                  {
                    $set: {
                      "basic.ride_status": "cancelled",
                      "basic.cancelled_by": "driver",
                      "basic.cancel_reason": cancel_reason,
                      "time.cancelled": now_date
                    }
                  },
                  { new: true }
                ).populate("basic.user_id").lean();

                if (!ride_details) {
                  return ack({
                    status: 200,
                    success: true,
                    reply: "Ride cancelled Successfully"
                  });
                }

                // If wallet payment, prepare refund logic (commented block shows original logic)
                if (ride_details.basic.payment_type === "wallet") {
                  try {
                    const user = await userModel.findById(ObjectId(ride_details.basic.user_id._id));
                    if (user) {
                      const newBalance = parseFloat(user.userbalance) + parseFloat(ride_details.payment.onlinepayment || 0);

                      // Refund logic (uncomment if needed)
                      await userModel.updateOne({ _id: user._id }, { $set: { userbalance: newBalance } });
                      await Ride.updateOne({ _id: ride_id }, {
                        $set: {
                          'basic.razorpay_refundId': "TAXIREFUND" + Date.now() + FUNC.randomString(4, "123456789"),
                          'payment.refund': ride_details.payment.onlinepayment,
                          'payment.onlinepayment': 0
                        }
                      });
                    }
                  } catch (refundErr) {
                    console.error("Refund error:", refundErr);
                    return ack({ status: 500, success: true, reply: "Error processing refund" });
                  }
                }

                // Clear ride from driver's socket
                delete socket.ride_details;

                const userSocketId = await client.get(`socket_user:${ride_details.basic.user_id._id.toString()}`);

                if (userSocketId) {
                  // Notify user via socket
                  socket.to(userSocketId).emit("request_cancelled", { ride_id });

                  // Leave tracking room
                  const trackRoom = `trackprovider_${providerId}`;
                  await io.of("/").adapter.remoteLeave(userSocketId, trackRoom);
                }

                // Update ride state
                await FUNC.updateInRide(ride_details._id, ride_details.basic.user_id._id, providerId, false);

                // Push notification
                // await notification.PushNotificationsUserwise({
                //   receiverId: ride_details.basic.user_id._id.toString(),
                //   type: "BONUS",
                //   title: "Ride cancelled Successfully",
                //   message: "Ride cancelled Successfully",
                //   entityId: ride_details.basic.user_id._id.toString()
                // });

                ack({
                  status: 200,
                  success: true,
                  reply: "Ride cancelled Successfully"
                });

              } catch (err) {
                console.error("cancel_ride error:", err);
                ack({
                  status: 500,
                  success: true,
                  reply: "Something went wrong, please try again later"
                });
              }
              break;
            }


            default:
              socket.emit('unknown_event', {
                success: false,
                message: 'Unknown event fired',
              });
              break;
          }
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