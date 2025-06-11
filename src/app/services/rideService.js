const { statusCode, resMessage } = require('../../config/default.json');
const taxiType = require('../../models/taxiTypeModel');
const cityModel = require('../../models/city');
// const rideModel = require('../../models/ride');
const userModel = require('../../models/users');
const settingModel = require('../../models/settingModel');
// const mongoose = require('mongoose');
const google_distance = require('google-distance');
google_distance.apiKey = process.env.GOOGLE_APP_KEY;
const NodeGeocoder = require('node-geocoder');

var options = {
    provider: 'google',
    // Optional depending on the providers 	
    httpAdapter: 'https', // Default 
    apiKey: process.env.GOOGLE_APP_KEY, // for Mapquest, OpenCage, Google Premier 
    formatter: null // 'gpx', 'string', ... 
};
console.log('options', options);
var geocoder = NodeGeocoder(options);
exports.CategoriesPrice = async (req) => {
    try {
        const reqdata = req.body;
        const logindata = req.auth;
        // const offercode = reqdata.offercode;
        const airportstatus = reqdata.airportstatus === true || reqdata.airportstatus === "true";

        const latitude = parseFloat(reqdata.srclatitude);
        const longitude = parseFloat(reqdata.srclongitude);
        const destlatitude = parseFloat(reqdata.destlatitude);
        const destlongitude = parseFloat(reqdata.destlongitude);
        // const stops = JSON.parse(reqdata.stops);

        const locations = [
            { latitude, longitude },
            // ...stops,
            { latitude: destlatitude, longitude: destlongitude },
        ];

        let distanceValue = 0;
        let durationValue = 0;
        const origind = [];
        const cities = [];

        const calculateDistance = (origin, destination) => {
            return new Promise((resolve, reject) => {
                google_distance.get({
                    origin: `${origin.latitude},${origin.longitude}`,
                    destination: `${destination.latitude},${destination.longitude}`,
                }, (err, distanceData) => {
                    if (err) return reject(err);
                    resolve(distanceData);
                });
            });
        };

        const getCityName = (coordinates) => {
            return new Promise((resolve, reject) => {
                geocoder.reverse({ lat: coordinates.latitude, lon: coordinates.longitude }, (err, geoResult) => {
                    if (err || !geoResult.length) return reject(err || 'City not found');
                    resolve(geoResult[0].administrativeLevels['level3long']);
                });
            });
        };
        for (let i = 0; i < locations.length; i++) {
            try {
                const cityName = await getCityName(locations[i]);
                cities[i] = cityName;

                if (i > 0 && cities[i] !== cities[i - 1]) {
                    return {
                        status: statusCode.BAD_REQUEST,
                        success: false,
                        message: 'Service Not Available'
                    };
                }

                if (i > 0) {
                    const distanceData = await calculateDistance(locations[i - 1], locations[i]);
                    distanceValue += distanceData.distanceValue;
                    durationValue += distanceData.durationValue;
                    origind[i] = distanceData;
                }
            } catch (err) {
                console.log('err', err);
                return {
                    status: statusCode.BAD_REQUEST,
                    success: false,
                    message: 'Service Not Available'
                };
            }
        }

        const taxiTypes = await taxiType.find({ is_active: true }).sort({ order: 1 });
        if (!taxiTypes.length) {
            return {
                status: statusCode.DATA_NOT_FOUND,
                success: false,
                message: 'No Taxi found'
            };
        }

        const city = await cityModel.findOne({ city: cities[0] });
        const settingData = await settingModel.findOne({});
        const user = await userModel.findById(logindata.id);
        // const todayISO = new Date().toISOString().split('T')[0];

        const TaxiCateData = [];

        for (const taxiType of taxiTypes) {
            let airportCharge = airportstatus ? taxiType.airportCharge : 0;
            let fareMultiplier = distanceValue < 3000
                ? taxiType.base_fare
                : taxiType.base_fare + taxiType.distance_fare * ((distanceValue - 3000) / 1000);

            fareMultiplier = Math.round((fareMultiplier * 1.13) * 1.05) + airportCharge;

            // const offerData = await OfferCode.findOne({
            //     offercode,
            //     start_date: { $lte: todayISO },
            //     end_date: { $gte: todayISO },
            //     ride_type: `${taxiType._id}`,
            // });

            let EffectiveDiscount = 0;

            // if (offerData) {
            //     const totalUsed = await rideModel.find({
            //         "basic.user_id": logindata.id,
            //         "offer.offercode": offercode,
            //         "basic.ride_status": "finished",
            //     });

            //     if (totalUsed.length < offerData.usedtimes) {
            //         const Discount = fareMultiplier * (offerData.percentage / 100);
            //         EffectiveDiscount = Math.min(Discount, offerData.price);
            //         fareMultiplier = Math.max(0, Math.floor(fareMultiplier - EffectiveDiscount));
            //     }
            // }

            TaxiCateData.push({
                id: taxiType._id,
                cityiId: city._id,
                price: fareMultiplier,
                airportCharge,
                airportstatus,
                base_fixed_fare: taxiType.base_fare,
                per_km: taxiType.distance_fare,
                originalprice: fareMultiplier + EffectiveDiscount,
                name: taxiType.title,
                bookany: taxiType.bookany,
                duration: durationValue,
                distance: distanceValue / 1000,
                // stops,
                origin: origind[1]?.origin || "",
                destination: origind[locations.length - 1]?.destination || "",
                image: taxiType.icon,
            });
        }
        return {
            statusCode: statusCode.OK,
            success: true,
            message: 'Taxi',
            data: { TaxiCateData, online_payment: settingData.online_payment, balance: user.userbalance }
        };
    } catch (error) {
        console.error("CategoriesPrice Error:", error);
        return {
            status: statusCode.BAD_REQUEST,
            success: false,
            message: resMessage.Internal_Server_Error,
            error: error.message || "Internal Server Error",
        };
    }
};
