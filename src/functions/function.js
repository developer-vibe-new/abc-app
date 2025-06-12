const google_distance = require('google-distance');
const Location = require('../models/locationModel');
const Provider = require('../models/providerModel');
const Ride = require('../models/ride');
const FUNC = require('./function');
const User = require('../models/users');
const { ObjectId } = require('mongoose').Types;
const RequestLog = require('../models/RequestLogModel');
google_distance.apiKey = process.env.GOOGLE_APP_KEY;
const moment = require('moment');
const { getClient } = require('../config/redis');
const client = getClient();
exports.send_request = async function (ride_id, io, appSettings) {
    try {
        const request_data_str = await client.get("request_data:" + ride_id);
        const request_data = JSON.parse(request_data_str);

        const remaining_attempt = await client.decrBy("ride_attempt:" + ride_id, 1);
        if (remaining_attempt < 0) {
            console.error("Max attempts reachd for ride ID: ", ride_id);
            return "ERROR";
        }

        const provider_id = await client.lIndex("request_queue:" + ride_id, 0);
        if (!provider_id) {
            console.error("No provider found for ride ID:", ride_id);
            return 'ERROR';
        }

        // await client.lRem("request_queue:" + ride_id, 1, provider_id);

        const location_data = await Location.findOne({
            provider_id: provider_id,
            available: true,
            blocked: false
        });

        if (location_data) {
            try {
                // await FUNC.lockDriver(provider_id, ride_id, request_data.load_sec);

                const provider_loc = {
                    longitude: location_data.locations[0].coordinates[0],
                    latitude: location_data.locations[0].coordinates[1]
                };
                const distanceObj = await FUNC.time_estimate(provider_loc, request_data.source);
                const estimated_time = distanceObj ? distanceObj.estimated_time : 5;
                request_data.time_estimate = parseInt(estimated_time);
                request_data.pickup_distance = distanceObj.pickup_distance;

                const provider_socket = await client.get("socket_provider:" + provider_id);

                const clients = await io.of('/').adapter.rooms;

                if (clients.has(provider_socket) === -1) {
                    console.error("Provider socket not found for provider ID");
                    await client.set("ride_request:" + provider_id, JSON.stringify(request_data));
                    await client.expire("ride_request:" + provider_id, request_data.load_sec);

                    await Provider.findOne({
                        _id: ObjectId(provider_id)
                    }, {
                        os: 1,
                        badge: 1,
                        arn_token: 1,
                        language: 1
                    });

                } else {
                    console.log("New Request Socket Emit");
                    io.to(provider_socket).emit('new_request', request_data);
                }

                setTimeout(async () => {
                    console.log("Coming in Set Timeout");
                    const results = await Ride.updateOne({
                        _id: ride_id,
                        "basic.ride_status": "requested",
                        "meta.search_providers": provider_id
                    }, {
                        $pull: {
                            "meta.search_providers": provider_id
                        },
                        $addToSet: {
                            "meta.skip_providers": provider_id
                        }
                    });

                    if (results.nModified === 1) {
                        console.log("Modified Data");
                        request_data.start_on = moment().unix();
                        await client.set("request_data:" + ride_id, JSON.stringify(request_data));
                        await FUNC.send_request(ride_id, io, appSettings);
                    }
                    console.log("No Modified Data");
                }, request_data.load_sec * 1000);
                console.log("Data has been loaded");

            } catch (err) {
                console.log("Error1", err);
                await FUNC.send_request(ride_id, io, appSettings);
            }
        } else {
            console.log("Error2");
            await FUNC.send_request(ride_id, io, appSettings);
        }

    } catch (err) {
        console.error("Error coming in catech: ", err);
    }
};

exports.lockDriver = async (provider_id, ride_id, ringTime) => {
    try {
        const result = await client.setNX("provider_available:" + provider_id.toString(), ride_id);
        console.log("==========result---------", result);
        if (result === false) {
            await client.expire("provider_available:" + provider_id.toString(), ringTime);
            throw new Error("Driver is not available");
        } else {
            await client.expire("provider_available:" + provider_id.toString(), ringTime);
        }
    } catch (err) {
        console.error("Error locking driver:", err);
        throw err;
    }
};

exports.time_estimate = async (origin, destination) => {

    const distanceData = await new Promise((resolve, reject) => {
        google_distance.get({
            index: 1,
            origin: origin.latitude + ',' + origin.longitude,
            destination: destination.latitude + ',' + destination.longitude
        }, (err, data) => {
            if (err) {
                console.log("Error in time estimate: ", err);
                return reject(err);
            }
            resolve(data);
        });
    });

    // Extracting the relevant data
    let estimated_time = Math.round(distanceData.durationValue / 60);
    const pickup_distance = distanceData.distance;
    const estimate_distance = distanceData.distanceValue;

    // Ensuring the estimated time isn't zero
    if (estimated_time === 0) {
        estimated_time = 1;
    }

    return {
        estimated_time,
        pickup_distance,
        estimate_distance
    };

};
exports.processRefund = async (ride_id, user_id, refund_amount, isRequestLog = false) => {
    const user = await User.findOne({ _id: ObjectId(user_id) });
    if (!user) {
        console.error("User not found for refund.");
        return;
    }

    const newBalance = parseFloat(user.userbalance) + parseFloat(refund_amount);

    await User.updateOne(
        { _id: ObjectId(user_id) },
        { $set: { userbalance: newBalance } }
    );

    const updateData = {
        'basic.razorpay_refundId': "KTSREFUND" + Date.now() + FUNC.randomString(4, "123456789"),
        'payment.refund': refund_amount,
        'payment.onlinepayment': refund_amount
    };

    if (isRequestLog) {
        await RequestLog.updateOne({ _id: ObjectId(ride_id) }, { $set: updateData });
    } else {
        await Ride.updateOne({ _id: ObjectId(ride_id) }, { $set: updateData });
    }

    console.log("Refund processed for ride:", ride_id);
};