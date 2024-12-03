const express = require('express');
const http = require('http');
const moment = require('moment');
const { initializeSocket, getIO } = require('./socket');
const { SOCKET_DELIVERY_PORT } = require('./src/config/dev.config');
const { setRedis, getRedis, removeOrderFromAllPartners, sendNotification, payDeliveryCharge, payVendorCharge, haversineDistance } = require('./src/utils/functions');
// const Delieverypartnerlocation = require('./src/models/delieverypartnerlocation');
// const Delieverypartner = require('./src/models/delieverypartner');
const Provider = require('./src/models/providerModel');
const connectDB = require('./src/config/db.config');
const User = require('./src/models/users');
const redisKeyPrefixVendorSocket = 'ProviderSocket:';
const redisKeyPrefixUserSocket = 'UserSocket:';
const redisKeyPrefixDelieverypartnerSocket = 'DelieverypartnerSocket:';
connectDB();

const app = express();
const server = http.createServer(app);
let totalDeliveryPartner = 0;

async function runServer() {
    await initializeSocket(server);
    const io = getIO();
  
    io.on('connection', (socket) => {
      console.log(`====================== Delivery (${++totalDeliveryPartner}) Partner CONNECTED ======================`, socket?.id);
  
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
              const userDetails = await Delieverypartner.aggregate([
                {
                  $match: {
                    loginToken: data.loginToken
                  }
                },
                {
                  $lookup: {
                    from: "delieverypartnerlocations",
                    localField: "_id",
                    foreignField: "userid",
                    as: "locationData"
                  }
                },
                {
                  $addFields: {
                    locationData: {
                      $arrayElemAt: ["$locationData", 0]
                    }
                  }
                }
              ]);
              const userData = userDetails[0];
              if (userData) {
                socket.userData = {
                  _id: userData?._id,
                  name: userData?.name,
                  isOnline: userData?.locationData?.isOnline,
                  bearing: userData?.locationData?.bearing,
                  speed: userData?.locationData?.speed,
                  locations: userData?.locationData?.locations,
                  isAvailable: userData?.locationData?.isAvailable,
                };
                await setRedis(redisKeyPrefixDelieverypartnerSocket + userData._id.toString(), socket.id);
                const orders = await Order.find({
                  deliveryPartner: socket.userData._id,
                  deliveryStatus: { $in: ["Accepted", "PickedUp", "Reached", "Returned"] }
                });
  
                socket.emit('authenticationSuccess', {
                  status: 200,
                  message: 'Authentication successful',
                  data: {
                    _id: userData?._id,
                    name: userData?.name,
                    isOnline: userData?.locationData?.isOnline,
                    bearing: userData?.locationData?.bearing,
                    speed: userData?.locationData?.speed,
                    locations: userData?.locationData?.locations,
                    isAvailable: userData?.locationData?.isAvailable,
                    orders: orders?.length ? orders : []
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
  
          if (!socket.userData) {
            socket.emit('error', {
              status: 401,
              message: 'Authentication required',
            });
            return;
          }
  
          switch (event) {
            case "updateLocation":
              console.log('=================================LOCATION UPDATE=================================');
              const now_date = moment().toDate();
  
              let locations = data.locations;
              // const locs = data.locations;
              const locs = JSON.parse(JSON.stringify(data.locations));
              locations.forEach(location => {
                location.coordinates = [location.coordinates[1], location.coordinates[0]];
              });
              const locationData = {
                bearing: data.bearing,
                speed: data.speed,
                locations: locations,
                lastupdatedlocation: now_date
              };
              await Delieverypartnerlocation.updateOne(
                { userid: socket.userData._id.toString() },
                { $set: locationData },
                { upsert: true }
              );
  
              const location_packet = {
                _id: socket.userData._id.toString(),
                longitude: data.longitude,
                latitude: data.latitude,
                bearing: data.bearing,
                speed: data.speed,
                name: socket.userData.name,
                locations: locs,
              };
              console.log("location_packet", locs);
              socket.emit('locationUpdate', location_packet);
              const orders = await Order.find({
                deliveryPartner: socket.userData._id,
                deliveryStatus: { $in: ["Accepted", "PickedUp", "Reached", "Returned"] }
              });
              if (orders.length > 0) {
                for (const order of orders) {
                  const userSocketSent = await getRedis(redisKeyPrefixUserSocket + order.userId.toString());
                  if (userSocketSent) {
                    io.to(userSocketSent).emit('locationUpdate', {
                      success: true,
                      data: location_packet,
                      message: 'Location Update',
                    });
                  }
                }
              }
  
              break;
  
            case "acceptOrder":
              const orderId = data.orderId;
              const orderData = data.orderData;
              const order = await Order.findById(orderId);
              const deliveryPartnerId = data.deliveryPartnerId;
              const userId = order.userId;
              const vendorId = order.vendorId;
              if (!order) {
                socket.emit('orderStatus', {
                  success: false,
                  message: 'Order does not exist',
                });
                break;
              }
              if (order.deliveryPartner) {
                socket.emit('error', {
                  success: false,
                  message: 'Order already assigned to another delivery partner',
                });
                break;
              }
              if (order.deliveryStatus != 'Pending') {
                socket.emit('error', {
                  success: false,
                  message: 'Order cannot be accepted as it is already completed or canceled',
                });
                break;
              }
              const deliveryPartner = await Delieverypartner.findById(deliveryPartnerId).select('name rating mobile');;
              if (!deliveryPartner) {
                socket.emit('error', {
                  success: false,
                  message: 'Invalid delivery partner',
                });
                break;
              }
              await Order.updateOne({ _id: orderId }, { deliveryPartner: deliveryPartnerId, deliveryStatus: 'Accepted', extraData: orderData });
              await removeOrderFromAllPartners(orderId);
  
              const userSocket = await getRedis(redisKeyPrefixUserSocket + userId.toString());
              const vendorSocket = await getRedis(redisKeyPrefixVendorSocket + vendorId.toString());
  
              io.to(userSocket).emit('orderAssigned', {
                success: true,
                data: deliveryPartner,
                message: 'Order accepted',
              });
  
              io.to(vendorSocket).emit('orderAssigned', {
                success: true,
                data: deliveryPartner,
                message: 'Order accepted',
              });
  
              socket.emit('orderAssigned', {
                success: true,
                data: orderData,
                message: 'Order accepted',
              });
              const UserDetails = await User.findById(userId);
              var message = {
                title: '🚚 Delivery Partner Assigned!',
                body: '📦 A delivery partner has been assigned to your order. Your package is on its way! 🛵'
              };
              var registrationToken = UserDetails.fcmToken;
              sendNotification(registrationToken, message, 'user');
              break;
            case "orderUpdate": {
              const orderId = data.orderId;
              const status = data.status;
              const order = await Order.findById(orderId);
              const userSocket = await getRedis(redisKeyPrefixUserSocket + order.userId.toString());
              const vendorSocket = await getRedis(redisKeyPrefixVendorSocket + order.vendorId.toString());
              const appType = 'user';
              const UserDetails = await User.findById(order.userId);
              if (!order) {
                socket.emit('error', {
                  success: false,
                  message: 'Order does not exist',
                });
                break;
              }
              const emitToUserAndVendor = (event, message) => {
                socket.emit(event, {
                  success: true,
                  data: orderId,
                  message: message,
                });
                if (userSocket) {
                  io.to(userSocket).emit(event, {
                    success: true,
                    data: orderId,
                    message: message,
                  });
                }
                console.log("vendorSocket", vendorSocket);
                if (vendorSocket) {
                  io.to(vendorSocket).emit(event, {
                    success: true,
                    data: orderId,
                    message: message,
                  });
                }
              };
              if (status === 'PickedUp') {
                await Order.updateOne({ _id: orderId }, { deliveryStatus: 'PickedUp', status: 'PickedUp' });
                await Delieverypartnerlocation.updateOne({ userid: order.deliveryPartner }, { isAvailable: false });
                emitToUserAndVendor('orderPickedUp', 'Our delivery partner is on the way');
                if (order.paymentType == 'cash') {
                  var message = {
                    title: '💵 Payment Reminder!',
                    body: `🛵 Please pay ₹${order.payableAmount} in cash at the time of delivery. Thank you for your order! 🙏`
                  };
                  var registrationToken = UserDetails.fcmToken;
                  sendNotification(registrationToken, message, appType);
                }
              } else if (status === 'Reached') {
                console.log('status');
                const deliveryPartnerLocation = {
                  latitude: data.latitude,
                  longitude: data.longitude
                };
  
                const deliveryAddressLocation = {
                  latitude: order.deliveryAddress.coordinates[0],
                  longitude: order.deliveryAddress.coordinates[1]
                };
  
                const distance = haversineDistance(deliveryPartnerLocation, deliveryAddressLocation);
                console.log("distance", distance);
                if (distance <= 100) {
                  await Order.updateOne({ _id: orderId }, { deliveryStatus: 'Reached' });
                  await Delieverypartnerlocation.updateOne({ userid: order.deliveryPartner }, { isAvailable: false });
                  emitToUserAndVendor('orderReached', 'Our delivery partner is reached at your location');
                  if (order.paymentType == 'cash') {
                    var message = {
                      title: '💵 Payment Reminder!',
                      body: `🛵 Please pay ₹${order.payableAmount} in cash at the time of delivery. Thank you for your order! 🙏`
                    };
                    var registrationToken = UserDetails.fcmToken;
                    sendNotification(registrationToken, message, appType);
                  }
                } else {
                  socket.emit('orderUpdate', {
                    success: false,
                    message: 'Delivery partner is not within 100 meters of the delivery address',
                  });
                }
              } else if (status === 'Returned') {
                let cancelReason = data.cancelReason;
                const order = await Order.findOne({ _id: orderId });
  
                if (order && order.deliveryStatus === 'Reached') {
                  await Order.updateOne({ _id: orderId }, { deliveryStatus: 'Returned', cancelReason: cancelReason });
                  emitToUserAndVendor('orderReturned', `Our delivery partner has returned your order:${cancelReason}`);
                } else {
                  socket.emit('orderUpdate', { success: false, message: 'Order must reach the location before being marked as returned. Please try again.' });
                }
              } else if (status === 'Delivered') {
                try {
                  const paymentSuccess = await payDeliveryCharge(orderId);
                  const paymentSuccess1 = await payVendorCharge(orderId);
                  if (paymentSuccess && paymentSuccess1) {
                    await Order.updateOne(
                      { _id: orderId },
                      { deliveryStatus: 'Delivered', status: 'Delivered', paymentStatus: "success" }
                    );
                    await Delieverypartnerlocation.updateOne(
                      { userid: order.deliveryPartner },
                      { isAvailable: true }
                    );
                    emitToUserAndVendor('orderDelivered', 'Order is successfully delivered');
                    const message = {
                      title: '📦 Order Delivered!',
                      body: '🎉 Your order has been successfully delivered. Thank you for choosing us! 🙏'
                    };
                    const registrationToken = UserDetails.fcmToken;
                    sendNotification(registrationToken, message, appType);
                  } else {
                    socket.emit('orderUpdate', { success: false, message: 'Processing... Please wait and try again shortly.' });
                  }
                } catch (error) {
                  socket.emit('orderUpdate', { success: false, message: 'Processing... Please wait and try again shortly.' });
                }
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
  
        } catch (err) {
          socket.emit('error', {
            success: false,
            message: 'An error occurred',
            error: err.message,
          });
        }
      });
  
      socket.on("disconnect", function () {
        --totalDeliveryPartner;
        console.log(`====================== Delivery (${totalDeliveryPartner}) Partner DISCONNECTED ======================`, socket?.id);
      });
    });
  
    server.listen(SOCKET_DELIVERY_PORT, () => {
      console.log(`Delivery listening on port ${SOCKET_DELIVERY_PORT}`);
    });
  }
  
  runServer().catch(console.error);