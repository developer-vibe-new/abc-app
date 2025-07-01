const google_distance = require('google-distance');
const Location = require('../models/locationModel');
const Provider = require('../models/providerModel');
const rentalModel = require('../models/rentalModel');
const appSettingsModel = require('../models/settingModel');
const Transaction = require('../models/transactionsModel').Transaction;
const Ride = require('../models/ride');
const FUNC = require('./function');
const User = require('../models/users');
const mongoose = require('mongoose');
const RequestLog = require('../models/RequestLogModel');
google_distance.apiKey = process.env.GOOGLE_APP_KEY;
const moment = require('moment');
const { getClient } = require('../config/redis');
const client = getClient();
const pathModel = require('../models/pathModel');
const Taxitype = require('../models/taxiTypeModel');
exports.send_request = async function (ride_id, io, appSettings) {
    try {
        const request_data_str = await client.get("request_data:" + ride_id);
        const request_data = JSON.parse(request_data_str);

        const remaining_attempt = await client.decrBy(`ride_attempt:${ride_id}`, 1);
        if (remaining_attempt < 0) {
            console.error("Max attempts reachd for ride ID: ", ride_id);
            return "ERROR";
        }

        const provider_id = await client.lIndex(`request_queue:${ride_id}`, 0);
        if (!provider_id) {
            console.error("No provider found for ride ID:", ride_id);
            return 'ERROR';
        }

        await client.lRem(`request_queue:${ride_id}`, 1, provider_id);
        const location_data = await Location.findOne({
            provider_id: provider_id,
            available: true,
            blocked: false
        });

        if (location_data) {
            try {
                //i have to uncomment this line
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
                } else {
                    console.log("New Request Socket Emit");
                    request_data.timer = appSettings.ride_settings.load_sec;
                    io.to(provider_socket).emit('new_request', request_data);
                    return true;
                }

                setTimeout(async () => {
                    console.log("Coming in Set Timeout");
                    let obj = {
                        _id: ride_id,
                        "basic.ride_status": "requested",
                        "meta.search_providers": provider_id
                    };
                    const results = await Ride.updateOne(obj, {
                        $pull: {
                            "meta.search_providers": provider_id
                        },
                        $addToSet: {
                            "meta.skip_providers": provider_id
                        }
                    });

                    if (results.nModified === 1) {
                        request_data.start_on = moment().unix();
                        await client.set("request_data:" + ride_id, JSON.stringify(request_data));
                        await FUNC.send_request(ride_id, io, appSettings);
                    }
                }, appSettings.ride_settings.load_sec * 1000);

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
        console.log("==========lockDriver---------");
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
    const user = await User.findOne({ _id: new mongoose.Types.ObjectId(user_id) });
    if (!user) {
        console.error("User not found for refund.");
        return;
    }

    const newBalance = parseFloat(user.userbalance) + parseFloat(refund_amount);

    await User.updateOne(
        { _id: new mongoose.Types.ObjectId(user_id) },
        { $set: { userbalance: newBalance } }
    );

    const updateData = {
        'basic.razorpay_refundId': "TAXIREFUND" + Date.now() + FUNC.randomString(4, "123456789"),
        'payment.refund': refund_amount,
        'payment.onlinepayment': refund_amount
    };

    if (isRequestLog) {
        await RequestLog.updateOne({ _id: new mongoose.Types.ObjectId(ride_id) }, { $set: updateData });
    } else {
        await Ride.updateOne({ _id: new mongoose.Types.ObjectId(ride_id) }, { $set: updateData });
    }

    console.log("Refund processed for ride:", ride_id);
};
exports.unlockDriver = async (provider_id) => {
    try {
        await client.del(`provider_available:${provider_id}`);
    } catch (err) {
        console.error(`unlockDriver error for ${provider_id}:`, err);
    }
};

exports.checkDriver = async (provider_id) => {
    try {
        const ride_id = await client.get(`provider_available:${provider_id}`);
        return ride_id !== null;
    } catch (err) {
        console.error(`checkDriver error for ${provider_id}:`, err);
        return false;
    }
};

exports.insertPath = async (ride_id, ride_status, longitude, latitude) => {
    try {
        await pathModel.create({
            ride_id,
            ride_status,
            loc: [latitude, longitude]
        });
    } catch (err) {
        console.error(`insertPath error for ride ${ride_id}:`, err);
    }
};

// Helper to construct ride request data
exports.buildRideRequestData = async (ride, provider, socket, data, distanceObj, now_date, estimated_time) => {
    const settingData = await appSettingsModel.findOne();
    const request_data = {
        status: 200,
        message: "Ride Accepted Successfully",
        ride_id: ride._id.toString(),
        ride_status: ride.basic.ride_status,
        otp: ride.basic.otp,
        ride_type: ride.basic.ride_type,
        ridestationtype: ride.basic.ridestationtype,
        start_on: ride.created,
        updated_at: Math.floor(now_date.valueOf() / 1000),
        load_sec: ride.basic.ridestationtype === "daily" ? 10 : 20,
        instruction: settingData[`${ride.basic.ridestationtype}_instruction`],
        source: ride.location.source,
        destination: ride.location.destination,
        stops: ride.location.stops,
        time_estimate: estimated_time,
        pickup_distance: distanceObj.pickup_distance,
        payment_type: ride.basic.payment_type,
        fare_estimate: ride.payment.fare_estimate,
        car_title: ride.basic.vehicle.title,
        plateno: ride.basic.vehicle.plateno,
        color: ride.basic.vehicle.color,
        driver_name: `${provider.first_name} ${provider.last_name}`,
        driver_image: `https://driver.taxiride.com/drivers/${provider.image}`,
        category_image: ride.meta.category_id.thumb_3x,
        driver_mobile: socket.providerDetail.mobile,
        avg_rating: socket.providerDetail.avg_rating,
        created: ride.created,
        provider_location: {
            _id: socket.providerDetail._id.toString(),
            longitude: data.longitude,
            latitude: data.latitude,
            bearing: data.bearing,
            speed: data.speed,
            time_estimate: estimated_time,
            pickup_distance: distanceObj.pickup_distance
        }
    };

    if (ride.basic.payment_type === "Card") {
        request_data.card = ride.payment.card;
    }

    if (ride.basic.ridestationtype === "rentals") {
        const rental = await rentalModel.findById(ride.basic.planId);
        if (rental) {
            request_data.planhour = rental.packages.hour;
            request_data.plankm = rental.packages.distance;
        }
    }

    return request_data;
};

exports.updateInRide = async (ride_id, user_id, provider_id, in_ride) => {
    try {
        const inverse_in_ride = !in_ride;
        console.log('inverse_in_ride', inverse_in_ride);
        const rides = await Ride.find({
            "basic.user_id": new mongoose.Types.ObjectId(user_id),
            "basic.ride_status": { $in: ["accepted", "arrived", "running"] }
        })
            .populate('basic.provider_id', 'first_name last_name full_name mobile callingmobile photo total_rating rated avg_rating image')
            .populate("meta.category_id");

        const hasActiveRide = rides && rides.length > 0;
        const finalInRideStatus = hasActiveRide;
        await User.updateOne(
            { _id: new mongoose.Types.ObjectId(user_id) },
            {
                $set: {
                    in_ride: finalInRideStatus,
                    ride_id: hasActiveRide ? new mongoose.Types.ObjectId(ride_id) : null
                }
            }
        );

        await Provider.updateOne(
            { _id: new mongoose.Types.ObjectId(provider_id) },
            {
                $set: {
                    in_ride: in_ride,
                    ride_id: new mongoose.Types.ObjectId(ride_id)
                }
            }
        );

        await Location.updateOne(
            { provider_id: new mongoose.Types.ObjectId(provider_id) },
            {
                $set: {
                    available: inverse_in_ride
                }
            }
        );

        if (inverse_in_ride) {
            await FUNC.unlockDriver(provider_id.toString());
            // await new Promise((resolve) => {
            //     FUNC.unlockDriver(provider_id.toString(), () => resolve());
            // });
        }

        return true; // final callback after all updates
    } catch (error) {
        console.error("Error in updateInRide:", error);
        return true;
    }
};
exports.splitFare = function (fare, airportCharge = 0) {
    console.log('fare', fare);
    fare = parseFloat(parseFloat(fare - airportCharge).toFixed(2));

    const gst_value = parseFloat(fare - (fare / (1 + 5 / 100))).toFixed(2);
    const fare_after_tax_but_before_gst = fare - gst_value;

    const base_fare_before_tax = parseFloat(fare_after_tax_but_before_gst / 1.13).toFixed(2);
    const earnratiodata = parseFloat((fare_after_tax_but_before_gst - base_fare_before_tax)).toFixed(2);
    const base_fare = parseFloat((fare - gst_value - earnratiodata).toFixed(2));
    let obj = {
        base_fare: base_fare,
        gst_per: 5,
        gst_value: gst_value,
        earnratiodata: earnratiodata,
        fare_charged: fare + airportCharge
    };
    console.log('obj', obj);
    return obj;
};

exports.ride_transaction_driver = async function (ride_id, fareObj) {
    let onlinepayment = 0;
    let offlinepayment = 0;
    let refund = 0;

    try {
        const transaction_detail = await Transaction.findOne({ ride_id: ride_id });

        if (transaction_detail) {
            if (!transaction_detail.charge_id) {
                return {
                    card_to_cash: true,
                    transaction_detail,
                    payment_type: "cash",
                    chargeObj: null
                };
            } else {
                return {
                    card_to_cash: false,
                    transaction_detail,
                    payment_type: "wallet",
                    chargeObj: null
                };
            }
        }

        const ride_details = await Ride.findOne({ _id: ride_id })
            .populate({ path: "basic.user_id" })
            .lean();

        const { payment_type, chargeObj } = await FUNC.ride_payment(ride_details, fareObj);
        if (payment_type === "wallet") {
            onlinepayment = ride_details.payment.onlinepayment;

            if (fareObj.fare_charged < onlinepayment) {
                refund = onlinepayment - fareObj.fare_charged;

                const user = await User.findOne({ _id: ride_details.basic.user_id });
                if (!user) throw new Error("User not found");

                const newBalance = parseFloat(user.userbalance) + parseFloat(refund);
                await User.updateOne(
                    { _id: user._id },
                    { $set: { userbalance: newBalance } }
                );

                await Ride.updateOne(
                    { _id: ride_id },
                    {
                        $set: {
                            'basic.razorpay_refundId': "TAXIREFUND" + Date.now() + FUNC.randomString(4, "123456789"),
                            'payment.refund': refund,
                        }
                    }
                );
            } else {
                offlinepayment = fareObj.fare_charged - onlinepayment;
            }
        } else {
            offlinepayment = Number(fareObj.fare_charged);
        }

        const lastTransaction = await Transaction.find({
            provider_id: ride_details.basic.provider_id
        }).sort({ _id: -1 }).limit(1);

        const precede_by = lastTransaction.length > 0 ? lastTransaction[0].transaction_no : "000000";

        const p_earn = fareObj.base_fare;
        const total = fareObj.fare_charged;

        const transaction_data = {
            ride_id: ride_id,
            provider_id: ride_details.basic.provider_id,
            total,
            onlinepayment,
            offlinepayment,
            refund,
            p_earn,
            precede_by,
            type: payment_type
        };

        if (payment_type === "wallet") {
            transaction_data.charge_id = chargeObj.id;
        }

        const new_transaction = new Transaction(transaction_data);
        const transaction = await new_transaction.save();
        const card_to_cash = ride_details.basic.payment_type !== payment_type;

        const providerdetail = await Provider.findOne({ _id: ride_details.basic.provider_id });

        if (payment_type === "cash") {
            const newBalance = providerdetail.balance - fareObj.gst_value - fareObj.earnratiodata;
            await Provider.updateOne({ _id: providerdetail._id }, {
                $set: { balance: newBalance }
            });
        } else {
            const amt = p_earn - offlinepayment;
            await Provider.updateOne({ _id: providerdetail._id }, {
                $set: { balance: providerdetail.balance + amt }
            });
        }

        return {
            card_to_cash,
            transaction_detail: transaction,
            payment_type,
            chargeObj
        };

    } catch (error) {
        console.error("ride_transaction_driver error:", error);
        throw error;
    }
};


exports.ride_payment = async function (ride_details) {
    let chargeObj = {
        id: ride_details.basic.user_id?.stripe_id || ''
    };

    if (ride_details.basic.payment_type === "cash") {
        return { type: "cash", chargeObj };
    } else if (ride_details.basic.payment_type === "wallet") {
        return { type: "wallet", chargeObj };
    }

    // optional: handle unknown payment type
    throw new Error("Unsupported payment type");
};
exports.ride_fare_estimate_rental = async function (category_id,
    origin,
    duration,
    distance,
    planId,
    hour,
    onlinepayment,
    ride_id,
    rentalKm,
    rentalHour,
    rentalPrice
) {
    try {
        // const rentalPlans = await rentalModel.find({ _id: planId });
        const categoryData = await Taxitype.findOne({ _id: category_id });
        if (!categoryData) throw new Error("Price Not Found");;
        let totalDistance = parseFloat(distance) / 1000; // convert meters to km
        let extraDistance = 0;
        let extraDistanceAmount = 0;
        let total_fare = 0;

        if (parseFloat(rentalKm) >= totalDistance) {
            total_fare = parseFloat(rentalPrice);
        } else {
            extraDistance = totalDistance - parseFloat(rentalKm);
            extraDistanceAmount = extraDistance * parseFloat(categoryData.rental_distance_fare);
            total_fare = parseFloat(rentalPrice) + extraDistanceAmount;
        }

        // Extra time calculation (duration is in seconds)
        let allowedMinutes = parseFloat(rentalHour) * 60;
        let rideMinutes = parseFloat(duration) / 60;
        let extraTime = Math.max(0, rideMinutes - allowedMinutes);
        let extraTimeAmount = extraTime * parseFloat(categoryData.time_fare);

        total_fare += extraTimeAmount;

        // Make note for extra charges
        let note = 'No extra charges';
        if (extraDistance > 0 && extraTime > 0) {
            note = `Extra distance: ${extraDistance.toFixed(2)} km, Extra time: ${extraTime.toFixed(2)} min. Extra for distance: ${extraDistanceAmount.toFixed(2)}, Extra for time: ${extraTimeAmount.toFixed(2)}`;
        } else if (extraDistance > 0) {
            note = `Extra distance: ${extraDistance.toFixed(2)} km. Extra amount: ${extraDistanceAmount.toFixed(2)}`;
        } else if (extraTime > 0) {
            note = `Extra time: ${extraTime.toFixed(2)} min. Extra amount: ${extraTimeAmount.toFixed(2)}`;
        }

        // Update ride fare in DB
        await Ride.updateOne(
            { _id: ride_id },
            {
                $set: {
                    'payment.fare_charged': Math.round(total_fare),
                    'payment.extrapaynote': note
                }
            }
        );

        return {
            currency: categoryData.currency,
            bookdistance: totalDistance,
            type: "rentals",
            total_fare: Math.round(total_fare),
            onlinepayment: Math.round(onlinepayment),
            offlinepayment: Math.round(total_fare) - Math.round(onlinepayment)
        };

    } catch (error) {
        console.log('errror', error);
        throw error;
    }
};

exports.ride_fare_estimate = async function (
    category_id,
    origin,
    destination,
    duration,
    distance,
    discount,
    bookdistance,
    start_fare,
    airportCharge,
    onlinepayment,
    ride_id
) {
    try {
        // 1. Get distance and duration from Google
        // const distanceData = await google_distance.get({
        //     index: 1,
        //     origin: `${origin.latitude},${origin.longitude}`,
        //     destination: `${destination.latitude},${destination.longitude}`,
        // });

        // 2. Fetch vehicle category details
        const categoryData = await Taxitype.findOne({ _id: category_id });
        if (!categoryData) return { status: 404, message: "category is not available" };

        let totalDistance = parseFloat(bookdistance);
        let total_fare = 0;

        // 3. Base fare calculation
        if (totalDistance <= 3) {
            total_fare = Math.round((categoryData.base_fare * 1.13) * 1.05);
        } else {
            const extraDistanceFare = (totalDistance - 3) * categoryData.distance_fare;
            total_fare = Math.round((categoryData.base_fare + extraDistanceFare) * 1.13 * 1.05);
        }

        // (Optional: add time fare or other logic using distanceData.durationValue if needed)

        // 4. Apply discount logic (if fare after discount < 0, set to 0)
        const finalFare = total_fare - discount < 0 ? 0 : start_fare;

        // 5. Update fare in DB
        await Ride.updateOne(
            { _id: ride_id },
            {
                $set: {
                    'payment.fare_charged': Math.round(finalFare),
                },
            }
        );

        // 6. Return estimated fare details
        return {
            currency: categoryData.currency,
            bookdistance: totalDistance,
            type: "daily",
            total_fare: Math.round(finalFare),
            onlinepayment: Math.round(onlinepayment),
            offlinepayment: Math.round(finalFare) - Math.round(onlinepayment),
            airportCharge: airportCharge
        };

    } catch (err) {
        console.log('err', err);
        throw err;
    }
};

exports.ride_fare_estimate_outstation = async function (
    category_id,
    origin,
    destination,
    duration,
    distance,
    way,
    fare_estimate,
    TravelDistance,
    onlinepayment,
    ride_id,
    per_km
) {
    try {
        // 1. Get distance from Google (optional use)
        // const distanceData = await google_distance.get({
        //     index: 1,
        //     origin: `${origin.latitude},${origin.longitude}`,
        //     destination: `${destination.latitude},${destination.longitude}`
        // });

        // 2. Get vehicle category info
        const categoryData = await Taxitype.findOne({ _id: category_id });
        if (!categoryData) throw new Error("Price Not Found");

        // 3. Fare calculation
        let totalDistance = parseFloat(TravelDistance);
        let baseFare = totalDistance * parseFloat(per_km);
        let total_fare = Math.round((baseFare * 1.13) * 1.05); // tax + service fee

        // 4. Update fare in DB
        await Ride.updateOne(
            { _id: ride_id },
            {
                $set: {
                    'payment.fare_charged': total_fare,
                }
            }
        );

        // 5. Calculate offline payment
        const roundedOnline = Math.round(onlinepayment);
        let offlinepayment = total_fare - roundedOnline;
        if (offlinepayment < 0) offlinepayment = 0;

        // 6. Return final result
        return {
            currency: categoryData.currency,
            bookdistance: totalDistance,
            type: "outstation",
            total_fare: total_fare,
            onlinepayment: roundedOnline,
            offlinepayment: offlinepayment
        };

    } catch (err) {
        console.log('err', err);
        throw err;
    }
};
function haversineDistance(coord1, coord2) {
    const R = 6371; // Earth's radius in km
    const toRad = (deg) => deg * (Math.PI / 180);

    const dLat = toRad(coord2.lat - coord1.lat);
    const dLon = toRad(coord2.lng - coord1.lng);
    const lat1 = toRad(coord1.lat);
    const lat2 = toRad(coord2.lat);

    const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(lat1) * Math.cos(lat2) *
        Math.sin(dLon / 2) ** 2;

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

exports.calculateDistance = async (ride_id) => {
    let redisKey = `ride:${ride_id}:path`;
    let allData = await client.lRange(redisKey, 0, -1); // all points
    if (!allData) return 0;
    let coordsArray = allData.map(loc => JSON.parse(loc));
    // const coordsArray = [
    //     { lat: 28.7041, lng: 77.1025 },
    //     { lat: 28.7048, lng: 77.1050 },
    //     { lat: 28.7072, lng: 77.1100 },
    //     { lat: 28.7101, lng: 77.1200 }
    // ];

    let totalDistanceKm = 0;

    for (let i = 0; i < coordsArray.length - 1; i++) {
        totalDistanceKm += haversineDistance(coordsArray[i], coordsArray[i + 1]);
    }

    console.log(`Total Distance traveled: ${totalDistanceKm.toFixed(2)} km`);
};
