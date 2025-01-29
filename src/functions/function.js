const { createClient } = require('@redis/client');
const google_distance = require('google-distance');
const Location = require('../models/locationModel');
const FUNC = require('./function');

const client = createClient({
  url: process.env.REDIS_URL,
});

exports.send_request = async function(ride_id, io, appSettings, callback) {
    try {
        // Get request data
        const request_data_str = await client.getAsync("request_data:" + ride_id);
        const request_data = JSON.parse(request_data_str);

        // Decrease ride attempts
        const remaining_attempt = await client.decrbyAsync("ride_attempt:" + ride_id, 1);
        if (remaining_attempt < 0) {
            callback("ERROR");
            return;
        }

        // Get the provider id from the request queue
        const provider_id = await client.lindexAsync("request_queue:" + ride_id, 0);
        if (!provider_id) {
            callback("ERROR");
            return;
        }

        // Remove provider from request queue
        await client.lremAsync("request_queue:" + ride_id, 1, provider_id);

        // Find the provider's location
        const location_data = await Location.findOne({
            provider_id: ObjectId(provider_id),
            available: true,
            blocked: false
        });

        if (location_data) {
            try {
                await FUNC.lockDriver(provider_id, ride_id, request_data.load_sec);

                const provider_loc = {
                    longitude: location_data.location[0],
                    latitude: location_data.location[1]
                };

                // Estimate the time
                const distanceObj = await FUNC.time_estimate(provider_loc, request_data.source);
                const estimated_time = distanceObj ? distanceObj.estimated_time : 5;
                request_data.time_estimate = parseInt(estimated_time);
                request_data.pickup_distance = distanceObj.pickup_distance;

                const provider_socket = await client.getAsync("socket_provider:" + provider_id);
                const clients = await io.of('/').adapter.clientsAsync();

                if (clients.indexOf(provider_socket) === -1) {
                    await client.setAsync("ride_request:" + provider_id, JSON.stringify(request_data));
                    await client.expireAsync("ride_request:" + provider_id, request_data.load_sec);

                    const provider_details = await Provider.findOne({
                        _id: ObjectId(provider_id)
                    }, {
                        os: 1,
                        badge: 1,
                        arn_token: 1,
                        language: 1
                    });

                    // You can add the notification logic here if necessary.
                } else {
                    io.to(provider_socket).emit('new_request', request_data);
                }

                // Wait for the timeout before updating the ride
                setTimeout(async () => {
                    const results = await Ride.update({
                        _id: ObjectId(ride_id),
                        "basic.ride_status": "requested",
                        "meta.search_providers": ObjectId(provider_id)
                    }, {
                        $pull: {
                            "meta.search_providers": ObjectId(provider_id)
                        },
                        $addToSet: {
                            "meta.skip_providers": ObjectId(provider_id)
                        }
                    });

                    if (results.nModified === 1) {
                        request_data.start_on = moment().unix();
                        await client.setAsync("request_data:" + ride_id, JSON.stringify(request_data));
                        await FUNC.send_request(ride_id, io, appSettings, callback);
                    }
                }, request_data.load_sec * 1000);

            } catch (err) {
                await FUNC.send_request(ride_id, io, appSettings, callback);
            }
        } else {
            await FUNC.send_request(ride_id, io, appSettings, callback);
        }

    } catch (err) {
        callback("ERROR");
    }
};

exports.lockDriver = async (provider_id, ride_id, ringTime) => {
    try {
        const result = await new Promise((resolve, reject) => {
            client.setNX("provider_available:" + provider_id, ride_id, (err, result) => {
                if (err) return reject(err);
                resolve(result);
            });
        });

        if (result === 0) {
            await new Promise((resolve, reject) => {
                client.expire("provider_available:" + provider_id, ringTime, (err, result) => {
                    if (err) return reject(err);
                    resolve(result);
                });
            });
            throw new Error("Driver is not available");
        } else {
            await new Promise((resolve, reject) => {
                client.expire("provider_available:" + provider_id, ringTime, (err, result) => {
                    if (err) return reject(err);
                    resolve(result);
                });
            });
        }
    } catch (err) {
        throw err; // or handle the error as needed
    }
};

exports.time_estimate = async (origin, destination) => {
    try {
        const distanceData = await new Promise((resolve, reject) => {
            google_distance.get({
                index: 1,
                origin: origin.latitude + ',' + origin.longitude,
                destination: destination.latitude + ',' + destination.longitude
            }, (err, data) => {
                if (err) return reject(err);
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
    } catch (err) {
        throw err;
    }
}
