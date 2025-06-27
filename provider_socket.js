const express = require('express');
const http = require('http');
const mongoose = require('mongoose');
const moment = require('moment');
const Polyline = require('polyline');
const axios = require('axios');
const { initializeSocket, getIO, remoteJoinUserToRoom, remoteLeaveUserFromRoom } = require('./socket');
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
require('./src/models/users');
require('./src/models/taxiTypeModel');

const ProviderTaxi = require('./src/models/providerTaxi');
const Ride = require('./src/models/ride');
// const providerSocket = 'ProviderSocket:';
const FUNC = require('./src/functions/function');
const appSettings = require('./src/models/settingModel');
// const notificationModel = require('./src/models/notificationModel');

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
                    localField: "providerTaxi_id",
                    foreignField: "_id",
                    as: "online_taxi"
                  }
                }, {
                  $unwind: {
                    path: "$online_taxi",
                    preserveNullAndEmptyArrays: true
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
          switch (event) {
            case "updateLocation": {
              console.log("=====Update Location =====");
              try {
                const now_date = moment().toDate();
                const locations = data.locations.map(loc => ({
                  ...loc,
                  coordinates: [loc.coordinates[1], loc.coordinates[0]]
                }));
                // console.log('locations', JSON.stringify(locations));
                const locationData = {
                  bearing: data.bearing,
                  speed: data.speed,
                  locations: locations,
                  lastupdatedlocation: now_date
                };
                await Location.findOneAndUpdate(
                  { provider_id: socket.providerDetail._id },
                  { $set: locationData },
                  { upsert: true }
                );

                const location_packet = {
                  _id: socket.providerDetail._id.toString(),
                  longitude: data.locations[0].coordinates[1],
                  latitude: data.locations[0].coordinates[0],
                  firstName: socket.providerDetail.first_name,
                  lastName: socket.providerDetail.last_name
                };

                socket.emit('location_update', location_packet);

                const track_room = 'trackprovider_' + socket.providerDetail._id.toString();

                if (socket.providerDetail.in_ride && socket.ride_details) {
                  let estimated_time = 5;
                  let distanceObj = {};

                  try {
                    const status = socket.ride_details.ride_status;
                    const isAccepted = status === "accepted";
                    const isRunning = status === "running";

                    const targetPoint = isAccepted
                      ? socket.ride_details.source
                      : socket.ride_details.destination;
                    if (isAccepted) {
                      distanceObj = await FUNC.time_estimate(location_packet, targetPoint);
                      estimated_time = distanceObj?.estimated_time || 5;

                      location_packet.time_estimate = estimated_time;
                      location_packet.pickup_distance = distanceObj?.pickup_distance || 0;
                      await Location.updateOne(
                        { provider_id: socket.providerDetail._id },
                        { $set: { time_estimate: estimated_time } }
                      );
                      socket.broadcast.to(track_room).emit("track_provider", location_packet);
                    }
                    if (isRunning) {
                      let redisKey = `ride:${socket.ride_details.ride_id}:path`;
                      let location = {
                        lat: data.latitude,
                        lng: data.longitude
                      };
                      await client.rPush(redisKey, JSON.stringify(location));
                    }
                    return ack({
                      status: 200,
                      message: "location updated"
                    });

                  } catch (err) {
                    console.error("Time estimate error:", err);
                  }

                  // If not accepted or running (fallback)
                  socket.broadcast.to(track_room).emit("track_provider", location_packet);
                  return ack({
                    status: 200,
                    message: "location updated"
                  });

                } else {
                  // Not in ride
                  socket.broadcast.to(track_room).emit("track_provider", location_packet);
                  return ack({
                    status: 200,
                    message: "location updated"
                  });
                }

              } catch (error) {
                console.error("Auth Error:", error);
                return ack({
                  status: 500,
                  success: false,
                  message: "Internal server error"
                });
              }
            }

            // Converted ES7+ async/await version of `accept_ride` socket handler
            case "accept_ride": {
              try {
                console.log('----------accept_ride-------', socket.providerDetail.online_taxi._id);
                const now_date = moment().toDate();
                let taxi_detail = await ProviderTaxi.aggregate([
                  {
                    $match: {
                      _id: new mongoose.Types.ObjectId(socket.providerDetail.online_taxi._id)
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
                if (taxi_detail.length <= 0) return ack({ status: 203, message: "Your taxi not found" });
                taxi_detail = taxi_detail[0];
                const provider_detail = await Provider.findOne({
                  _id: socket.providerDetail._id
                });

                if (!provider_detail) return ack({ status: 203, message: "Your driver not found" });

                // Create Stripe merchant if missing
                // let stripe_id = provider_detail.stripe_id;
                // if (!stripe_id) {
                //   const account = await stripe.createMerchant({
                //     email: provider_detail.email,
                //     first_name: provider_detail.first_name,
                //     last_name: provider_detail.last_name
                //   });

                //   stripe_id = account.id;
                //   await Provider.findByIdAndUpdate(socket.providerDetail._id, { stripe_id });
                // }
                let obj = {
                  _id: new mongoose.Types.ObjectId(data.ride_id),
                  "basic.ride_status": "requested",
                  "meta.search_providers": socket.providerDetail._id
                };
                const ride_update = await Ride.findOneAndUpdate(obj, {
                  $pull: {
                    "meta.search_providers": socket.providerDetail._id
                  },
                  $set: {
                    "basic.provider_id": socket.providerDetail._id,
                    "basic.ride_status": "accepted",
                    "basic.otp": Math.floor(1000 + Math.random() * 9000),
                    "basic.vehicle.title": `${taxi_detail.car_id.make} ${taxi_detail.car_id.title}`,
                    "basic.vehicle.plateno": taxi_detail.plateno,
                    "basic.vehicle.color": taxi_detail.color,
                    "time.accepted": now_date,
                    "meta.taxi_id": taxi_detail._id,
                    "meta.category_id": taxi_detail.type_ids[0],
                    "basic.providername": `${provider_detail.first_name} ${provider_detail.last_name}`,
                    "basic.pickup_distance": data.pickup_distance,
                    // ...(stripe_id && { "basic.merchantStripe_id": stripe_id })  // only set if available
                  }
                }, { new: true })
                  .populate("meta.category_id")
                  .populate("basic.user_id");
                if (!ride_update) return ack({ status: 203, message: "Something went wrong, please try again" });
                socket.ride_details = {
                  ride_id: ride_update._id.toString(),
                  ride_status: "accepted",
                  otp: ride_update.basic.otp,
                  providername: `${provider_detail.first_name} ${provider_detail.last_name}`,
                  driver_image: `https://driver.taxiride.com/drivers/${provider_detail.image}`,
                  source: ride_update.location.source,
                  destination: ride_update.location.destination,
                  stops: ride_update.location.stops,
                  outstation: ride_update.outstation
                };

                const driver_location = { latitude: data.latitude, longitude: data.longitude };
                const customer_location = ride_update.location.source;
                const distanceObj = await FUNC.time_estimate(driver_location, customer_location).catch(() => ({ estimated_time: 5, pickup_distance: null }));
                const estimated_time = distanceObj.estimated_time;
                const user_socket = await client.get("socket_user:" + ride_update.basic.user_id._id.toString());
                const track_room = 'trackprovider_' + socket.providerDetail._id.toString();
                await remoteJoinUserToRoom(user_socket, track_room);
                const request_data = await FUNC.buildRideRequestData(ride_update, provider_detail, socket, data, distanceObj, now_date, estimated_time);
                socket.to(user_socket).emit('ride_accepted', request_data);

                await Location.updateOne({ provider_id: new mongoose.Types.ObjectId(socket.providerDetail._id) }, { $set: { 'time_estimate': estimated_time } });

                await FUNC.updateInRide(ride_update._id, ride_update.basic.user_id._id, socket.providerDetail._id, true);

                await FUNC.insertPath(ride_update._id, "accepted", data.longitude, data.latitude);

                // await notification.PushNotificationsUserwise({
                //   receiverId: ride_update.basic.user_id._id.toString(),
                //   type: "BONUS",
                //   title: 'Ride accept Successfully',
                //   message: "Ride accept Successfully",
                //   entityId: ride_update.basic.user_id._id.toString(),
                // });

                const driver_object = JSON.parse(JSON.stringify(request_data));
                driver_object.user_name = ride_update.basic.user_id.full_name;
                driver_object.user_mobile = ride_update.basic.user_id.mobile;
                console.log('driver_object', driver_object);
                ack({ status: 200, message: "Ride Accepted Successfully", data: driver_object });

              } catch (error) {
                console.error("accept_ride error:", error);
                ack({ status: 500, message: "Internal server error" });
              }
              break;
            }

            case "decline_ride": {
              try {
                console.log('decline_ride--->>', data.ride_id);
                const rideId = data.ride_id;
                const providerId = new mongoose.Types.ObjectId(socket.providerDetail._id);
                console.log('providerId--->>', providerId);
                const updateResult = await Ride.updateOne(
                  {
                    _id: new mongoose.Types.ObjectId(rideId),
                    "basic.ride_status": "requested",
                    "meta.search_providers": providerId
                  },
                  {
                    $pull: { "meta.search_providers": providerId },
                    $addToSet: { "meta.declined_providers": providerId }
                  }
                );
                console.log('updateResult--->>', updateResult);
                // // If provider was in search_providers and now removed
                if (updateResult.modifiedCount === 1) {
                  const requestKey = `request_data:${rideId}`;
                  const requestDataRaw = await client.get(requestKey);
                  const requestData = JSON.parse(requestDataRaw || "{}");

                  requestData.start_on = moment().unix();
                  await client.set(requestKey, JSON.stringify(requestData));

                  await FUNC.unlockDriver(providerId.toString());


                  let getData = await FUNC.send_request(rideId, io, appSettings);
                  if (getData == 'ERROR') {
                    const ride = await Ride.findOneAndUpdate(
                      {
                        _id: new mongoose.Types.ObjectId(rideId),
                        "basic.ride_status": "requested"
                      },
                      {
                        $set: { "basic.ride_status": "declined" }
                      },
                      { new: true }
                    ).lean();
                    console.log('ride', ride);
                    if (ride) {
                      const userSocket = await client.get(`socket_user:${ride.basic.user_id.toString()}`);
                      socket.to(userSocket).emit("ride_declined", {
                        ride_id: rideId, status: 200,
                        success: true,
                        message: "Ride declined Successfully"
                      });
                    }
                  }
                  ack({
                    status: 200,
                    success: true,
                    message: "Ride declined Successfully"
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
                const providerId = socket.providerDetail._id;

                const ride_details = await Ride.findOneAndUpdate(
                  {
                    _id: new mongoose.Types.ObjectId(ride_id),
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
                    message: "Ride cancelled Successfully"
                  });
                }

                // If wallet payment, prepare refund logic (commented block shows original logic)
                if (ride_details.basic.payment_type === "wallet") {
                  try {
                    const user = await userModel.findById(new mongoose.Types.ObjectId(ride_details.basic.user_id._id));
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
                    return ack({ status: 500, success: true, message: "Error processing refund" });
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
                  await remoteLeaveUserFromRoom(userSocketId, trackRoom);
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
                  message: "Ride cancelled Successfully"
                });

              } catch (err) {
                console.error("cancel_ride error:", err);
                ack({
                  status: 500,
                  success: true,
                  message: "Something went wrong, please try again later"
                });
              }
              break;
            }
            case "arrived": {
              try {
                const now_date = moment().toDate();
                const { ride_id, longitude, latitude } = data;

                const ride_details = await Ride.findOneAndUpdate(
                  {
                    _id: new mongoose.Types.ObjectId(ride_id),
                    "basic.ride_status": "accepted",
                    "basic.provider_id": socket.providerDetail._id
                  },
                  {
                    $set: {
                      "basic.ride_status": "arrived",
                      "time.arrived": now_date
                    }
                  },
                  { new: true }
                );

                if (!ride_details) {
                  return ack({
                    status: 204,
                    message: "Ride not found 1"
                  });
                }

                socket.ride_details.ride_status = "arrived";
                socket.ride_details.arrived_time = now_date;

                const ride = ride_details.toObject();

                let user_socket = await client.get(`socket_user:${ride.basic.user_id.toString()}`);
                if (!user_socket) {
                  console.error("Socket not found for user:");
                  ack({
                    status: 500,
                    message: "Something went wrong",
                  });

                } else {
                  socket.to(user_socket).emit("ride_arrived", {
                    ride_id, status: 200,
                    success: true,
                    message: ride.basic.booked_by
                  });
                }
                ack({
                  status: 200,
                  message: ride.basic.booked_by,
                  data: { arrived: now_date },
                });

                FUNC.insertPath(ride_id, "arrived", longitude, latitude, () => { });
                // const notificationObject = {
                //   receiverId: ride.basic.user_id._id.toString(),
                //   type: "BONUS",
                //   title: "Ride arrived Successfully",
                //   message: "Ride arrived Successfully",
                //   entityId: ride.basic.user_id._id.toString(),
                // };

                // try {
                //   await notification.PushNotificationsUserwise(notificationObject);
                // } catch (notifyErr) {
                //   console.error("Notification send failed:", notifyErr);
                // }

              } catch (error) {
                console.error("Error in ride arrival flow:", error);
                ack({
                  status: 500,
                  message: "Something went wrong",
                });
              }

              break;

            }
            case "start_ride": {
              try {
                const now_date = moment().toDate();
                const { ride_id, longitude, latitude, destination } = data;
                const location_start = { longitude, latitude };

                const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${latitude},${longitude}&destination=${destination.latitude},${destination.longitude}&mode=driving&key=${process.env.GOOGLE_APP_KEY}`;

                let decodedPolyline = "";
                try {
                  const response = await axios.get(url);
                  if (response.data?.routes[0]?.overview_polyline) {
                    decodedPolyline = JSON.stringify(Polyline.decode(response.data.routes[0].overview_polyline.points));
                  }
                } catch (err) {
                  console.error("Google Maps API Error:", err.message);
                }

                const ride_details = await Ride.findOneAndUpdate(
                  {
                    _id: new mongoose.Types.ObjectId(ride_id),
                    "basic.ride_status": "arrived",
                    "basic.provider_id": socket.providerDetail._id
                  },
                  {
                    $set: {
                      "basic.ride_status": "running",
                      "time.started": now_date,
                      "location.started": location_start,
                      "location.destination": destination,
                      "location.googlePath": decodedPolyline
                    }
                  },
                  { new: true }
                );

                if (!ride_details) {
                  return ack({
                    status: 204,
                    message: "Ride not found 2"
                  });
                }

                socket.ride_details.ride_status = "running";
                const ride = ride_details.toObject();

                // 🟡 Convert client.get to await-style using Promise
                // const user_socket = await new Promise((resolve, reject) => {
                //   client.get("socket_user:" + ride.basic.user_id.toString(), (err, result) => {
                //     if (err) reject(err);
                //     else resolve(result);
                //   });
                // });
                const user_socket = await client.get("socket_user:" + ride.basic.user_id.toString());

                if (user_socket) {
                  socket.to(user_socket).emit("ride_started", {
                    ride_id, status: 200,
                    message: "Ride started successfully"
                  });
                }

                ack({
                  status: 200,
                  message: "User notified successfully"
                });

                FUNC.insertPath(ride_id, "start_ride", longitude, latitude, () => { });

                // const notificationObject = {
                //   receiverId: ride.basic.user_id._id.toString(),
                //   type: "BONUS",
                //   title: "Ride started Successfully",
                //   message: "Ride started Successfully",
                //   entityId: ride.basic.user_id._id.toString(),
                // };

                // try {
                //   await notification.PushNotificationsUserwise(notificationObject);
                // } catch (notifyErr) {
                //   console.error("Notification send failed:", notifyErr);
                // }

              } catch (error) {
                console.error("start_ride error:", error);
                ack({
                  status: 500,
                  message: "Something went wrong"
                });
              }
              break;

            }
            case "finish_ride": {
              try {
                const now_date = moment().toDate();
                const { ride_id, airportCharge = 0, longitude, latitude } = data;

                const rideDetails = await Ride.findOne({ _id: ride_id });
                if (!rideDetails) {
                  return ack({
                    status: 203,
                    message: "Ride not found 3"
                  });
                }

                const fare_charged = rideDetails.payment.fare_charged;
                const settings = await appSettings.findOne();
                const fareObj = FUNC.splitFare(fare_charged, airportCharge, settings);
                const location_finish = { longitude, latitude };

                // 🔁 Now using async version of ride_transaction_driver
                const { card_to_cash,
                  transaction_detail,
                  payment_type,
                  chargeObj
                } = await FUNC.ride_transaction_driver(ride_id, fareObj, settings);
                console.log('rideTransactionDriverAsync--->>', payment_type);
                const update_ride_data = {
                  "basic.ride_status": "finished",
                  "time.finished": now_date,
                  "location.finished": location_finish,
                  "payment.base_fare": fareObj.base_fare,
                  "payment.gst_per": fareObj.gst_per,
                  "payment.gst_value": fareObj.gst_value,
                  "payment.fare_charged": fareObj.fare_charged,
                  "payment.totalcharges": fareObj.fare_charged - fareObj.base_fare,
                  "payment.earnratiodata": fareObj.earnratiodata,
                  "payment.onlinepayment": transaction_detail.onlinepayment,
                  "payment.offlinepayment": transaction_detail.offlinepayment,
                  "payment.refund": transaction_detail.refund
                };
                if (card_to_cash) {
                  update_ride_data["basic.payment_type"] = "cash";
                }

                const ride_details = await Ride.findOneAndUpdate({
                  _id: ride_id,
                  "basic.ride_status": "running",
                  "basic.provider_id": socket.providerDetail._id
                },
                  { $set: update_ride_data },
                  { new: true }
                );
                if (!ride_details) {
                  return ack({
                    status: 203,
                    message: "Ride not found 3"
                  });
                }

                delete socket.ride_details;
                const ride = ride_details.toObject();
                const user_socket = await client.get("socket_user:" + ride.basic.user_id.toString());

                if (user_socket) {
                  socket.to(user_socket).emit('ride_finished', {
                    ride_id,
                    fare: Math.round(fare_charged),
                    refundamount: ride.payment.refund,
                    offlinepayment: ride.payment.offlinepayment,
                  });
                  console.log('user_socket', user_socket);

                  // const track_room = 'trackprovider_' + socket.providerDetail._id.toString();
                  // await remoteLeaveUserFromRoom(user_socket, track_room);
                  await FUNC.updateInRide(ride._id, ride.basic.user_id, socket.providerDetail._id, false);

                  await Provider.updateOne(
                    { _id: socket.providerDetail._id },
                    {
                      $inc: {
                        total_earnings: transaction_detail.p_earn,
                        total_rides: 1
                      }
                    }
                  );
                  console.log('user_socket', user_socket);

                  const messageText = card_to_cash || ride.basic.payment_type === "cash"
                    ? "Ride finished Successfully, Please collect money from passenger"
                    : "Ride finished Successfully, Payment has been done online";
                  console.log('messageText', messageText);
                  ack({
                    status: 200,
                    paymentObj: transaction_detail, payment_type, chargeObj,
                    message: messageText
                  });

                  FUNC.insertPath(ride_id, "finish_ride", longitude, latitude, () => { });

                  // const locations = await Path.find(
                  //   { ride_id: ride_id, ride_status: "running" },
                  //   { loc: 1 },
                  //   { sort: { _id: 1 } }
                  // );

                  // const path_array = locations.map(location => [location.loc[0], location.loc[1]]);
                  // const poly_encode = Polyline.encode(path_array); // optional use

                  // const notificationObject = {
                  //   receiverId: ride.basic.user_id._id.toString(),
                  //   type: "BONUS",
                  //   title: "Ride finished Successfully",
                  //   message: "Ride finished Successfully",
                  //   entityId: ride.basic.user_id._id.toString(),
                  // };

                  // await notification.PushNotificationsUserwise(notificationObject);
                }

              } catch (error) {
                console.error("finish_ride error:", error);
                ack({
                  status: 500,
                  message: "Something went wrong"
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