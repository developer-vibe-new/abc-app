const { statusCode, resMessage } = require('../../config/default.json');
const Provider = require('../../models/providerModel');
const Ride = require('../../models/ride');
const mongoose = require('mongoose');
const jwt = require("jsonwebtoken");
const moment = require('moment');
const FUNC = require('../../functions/function');
const rentalModel = require('../../models/rentalModel');
const locationModel = require('../../models/locationModel');
const providerTaxiModel = require('../../models/providerTaxi');
const notificationModel = require('../../models/notificationModel');
const { PushNotifications } = require('../../config/notification');
const appSettings = require('../../models/settingModel');
exports.addDriver = async (req) => {
    try {
        const driver = req.body;
        if (!driver.first_name || !driver.last_name || !driver.mobile) {
            return {
                statusCode: statusCode.BAD_REQUEST,
                success: false,
                message: resMessage.Required_Data
            };
        }
        if (req.auth && req.auth.role === "operator") {
            driver.operator_id = req.auth.id;
        }
        await Provider.create(driver);
        return {
            statusCode: statusCode.OK,
            success: true,
            message: resMessage.Data_Created_Successfully
        };
    } catch (error) {
        return {
            success: false,
            message: resMessage.Internal_Server_Error,
            error: error.message || "Internal Server Error",
        };
    }
};

exports.updateDriverStatus = async (req) => {
    try {
        const { id } = req.params;
        const provider = await Provider.findOne({ _id: id });
        if (!provider) {
            return {
                status: statusCode.BAD_REQUEST,
                success: false,
                message: resMessage.Provider_Not_Found
            };
        }
        const operatorId = new mongoose.Types.ObjectId(req.auth.id);
        if (provider.operator_id && provider.operator_id.equals(operatorId)) {
            const status = provider.status === "unblocked" ? "blocked" : "unblocked";
            provider.status = status;
            await provider.save();
            return {
                status: statusCode.OK,
                success: true,
                message: resMessage.Status_Updated_Successfully,
                data: provider
            };
        }
        return {
            status: statusCode.UNAUTHORIZED,
            success: false,
            message: resMessage.Unauthorized_Access
        };
    } catch (error) {
        return {
            success: false,
            message: resMessage.Internal_Server_Error,
            error: error.message || "Internal Server Error",
        };
    }
};

exports.driverBlockList = async (req) => {
    try {
        const blocked = await Provider.find({ operator_id: req.auth.id, status: "blocked" });
        if (!blocked) {
            return {
                status: statusCode.BAD_REQUEST,
                success: false,
                message: resMessage.Data_Not_Found
            };
        }
        return {
            status: statusCode.OK,
            success: true,
            message: resMessage.Data_Fetch_Successfully,
            data: blocked
        };
    } catch (error) {
        return {
            success: false,
            message: resMessage.Internal_Server_Error,
            error: error.message || "Internal Server Error",
        };
    }
};

exports.driverList = async (req) => {
    try {
        const aggregationPipeline = [
            {
                $match: { operator_id: new mongoose.Types.ObjectId(req.auth.id) }
            },
            {
                $lookup: {
                    from: "provider_taxis",
                    localField: "providerTaxi_id",
                    foreignField: "_id",
                    as: "providerTaxi_id"
                }
            },
            {
                $unwind: {
                    path: "$providerTaxi_id",
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $addFields: {
                    vehicleDetails: {
                        car_id: "$providerTaxi_id.car_id",
                        plateno: "$providerTaxi_id.plateno",
                        car_type: "$providerTaxi_id.type_ids",
                        is_active: "$providerTaxi_id.is_active"
                    }
                }
            },
            {
                $project: {
                    providerTaxi_id: 0
                }
            }
        ];
        const data = await Provider.aggregate(aggregationPipeline);
        if (data.length === 0) {
            return {
                status: statusCode.BAD_REQUEST,
                success: false,
                message: resMessage.Data_Not_Found
            };
        }
        return {
            status: statusCode.OK,
            success: true,
            message: resMessage.Data_Fetch_Successfully,
            data
        };
    } catch (error) {
        return {
            status: statusCode.INTERNAL_SERVER_ERROR,
            success: false,
            message: resMessage.Internal_Server_Error,
            error: error.message || "Internal Server Error",
        };
    }
};


exports.driverOninerStatus = async (req) => {
    try {
        const { _id } = req.auth;
        const { is_online } = req.body;
        const driverData = await Provider.findByIdAndUpdate({ _id }, { is_online }, { new: true });
        if (!driverData) {
            return {
                status: statusCode.BAD_REQUEST,
                success: false,
                message: resMessage.Data_Not_Found
            };
        }
        return {
            status: statusCode.OK,
            success: true,
            message: resMessage.Status_Updated_Successfully,
            data: {
                is_online: driverData.is_online
            }
        };
    } catch (error) {
        console.log('error', error);
        return {
            status: statusCode.INTERNAL_SERVER_ERROR,
            success: false,
            message: resMessage.Internal_Server_Error,
            error: error.message || 'Internal Server Error'
        };
    }
};

exports.updateDriver = async (req) => {
    try {
        const { id } = req.params;
        const { first_name, last_name, email, mobile } = req.body;
        const imagePath = req.file ? req.file.filename : "";
        const driverData = await Provider.findOne({ _id: id });
        if (!driverData) {
            return {
                status: statusCode.BAD_REQUEST,
                success: false,
                message: resMessage.Data_Not_Found
            };
        }
        const operatorId = new mongoose.Types.ObjectId(req.auth.id);
        if (driverData.operator_id && driverData.operator_id.equals(operatorId)) {
            await Provider.updateOne(
                { _id: id },
                {
                    $set: {
                        first_name,
                        last_name,
                        email,
                        mobile,
                        profile_image: imagePath
                    }
                }
            );
            return {
                status: statusCode.OK,
                success: true,
                message: resMessage.Data_Updated_Successfully
            };
        }
        return {
            status: statusCode.UNAUTHORIZED,
            success: false,
            message: resMessage.Unauthorized_Access
        };
    } catch (error) {
        return {
            status: statusCode.INTERNAL_SERVER_ERROR,
            success: false,
            message: resMessage.Internal_Server_Error,
            error: error.message || 'Internal Server Error'
        };
    }
};

exports.providerlogin = async (req) => {
    try {
        const { mobile } = req.body;
        const otp = 123456;

        let driverData = await Provider.findOne({ mobile });

        if (!driverData) {
            return {
                status: statusCode.DATA_NOT_FOUND,
                success: false,
                message: resMessage.Not_Registered,
            };
        }

        if (driverData.status === "block") {
            return {
                statusCode: statusCode.OK,
                success: false,
                message: resMessage.Your_Account_is_Blocked,
            };
        }

        driverData.otp = otp;
        await driverData.save();
        return {
            status: statusCode.OK,
            success: true,
            message: resMessage.Otp_Send_Success
        };

    } catch (error) {
        return {
            status: statusCode.BAD_REQUEST,
            success: false,
            message: error.message,
        };
    }
};

exports.providerOtpVerification = async (req) => {
    try {
        const { mobile, otp, firebaseToken } = req.body;

        const driverData = await Provider.findOne({ mobile });

        if (!driverData) {
            return {
                status: statusCode.DATA_NOT_FOUND,
                success: false,
                message: resMessage.Data_Not_Found,
            };
        }

        if (otp !== driverData.otp) {
            return {
                status: statusCode.OK,
                success: false,
                message: resMessage.Otp_Verify_Failed
            };
        }

        const token = jwt.sign(
            { _id: driverData._id, mobile: driverData.mobile },
            process.env.SECRET_KEY,
            { expiresIn: "30d" }
        );

        driverData.otp = null;
        driverData.login_token = token;
        driverData.fcm_token = firebaseToken;
        console.log('driverData', driverData);
        await driverData.save();

        return {
            status: statusCode.OK,
            success: true,
            message: resMessage.Otp_Verify_Successfully,
            data: {
                _id: driverData._id,
                token,
                operator_id: driverData.operator_id,
                kycStatus: driverData.kycStatus
            },
        };
    } catch (error) {
        return {
            status: statusCode.INTERNAL_SERVER_ERROR,
            success: false,
            message: error.message,
        };
    }
};

exports.deleteDriver = async (req) => {
    try {

        const data = await Provider.findOneAndUpdate(
            { _id: req.body.id, operator_id: req.auth.id, is_delete: false },
            { is_delete: true },
            { new: true }
        );
        if (data === null) {
            return {
                status: statusCode.DATA_NOT_FOUND,
                success: false,
                message: resMessage.Data_Not_Found,
            };
        }
        return {
            status: statusCode.OK,
            success: true,
            message: resMessage.Data_Deleted_Successfully,
            data,
        };
    } catch (error) {
        return {
            status: statusCode.INTERNAL_SERVER_ERROR,
            success: false,
            message: error.message,
        };
    }
};

exports.updateDocuments = async (req) => {
    try {
        const { _id } = req.auth;
        const { documentType, documentData } = req.body;
        let validDocumentTypes = ['insurance', 'vehicle_permit', 'vehicle_image', 'driving_license', 'aadhaar_card', 'pan_card', 'bank_details', 'rc', 'pollution_certificate'];

        // Check if the document type is valid
        if (!validDocumentTypes.includes(documentType)) {
            return {
                status: statusCode.BAD_REQUEST,
                success: false,
                message: resMessage.Invalid_document_type
            };
        }
        const provider = await Provider.findById(_id);

        if (!provider) {
            return {
                status: statusCode.NOT_FOUND,
                success: false,
                message: resMessage.Provider_taxi_not_found,
            };
        }

        // Check if the provider has an operator_id and deny access if set
        // if (provider.operator_id !== null) {
        //     return {
        //         status: statusCode.UNAUTHORIZED,
        //         success: false,
        //         message: resMessage.Unauthorized_Access,
        //     };
        // }

        // Handling other documents
        switch (documentType) {
            case 'rc':
                provider.providerTaxiDocuments.rc = {
                    ...provider.providerTaxiDocuments.rc,
                    ...documentData,
                    status: 0
                };
                break;
            case 'pollution_certificate':
                provider.providerTaxiDocuments.pollution_certificate = {
                    ...provider.providerTaxiDocuments.pollution_certificate,
                    ...documentData,
                    status: 0
                };
                break;
            case 'vehicle_image':
                provider.providerTaxiDocuments.vehicle_image = {
                    ...provider.providerTaxiDocuments.vehicle_image,
                    ...documentData,
                    status: 0
                };
                break;
            case 'vehicle_permit':
                provider.providerTaxiDocuments.vehicle_permit = {
                    ...provider.providerTaxiDocuments.vehicle_permit,
                    ...documentData,
                    status: 0
                };
                break;
            case 'insurance':
                provider.providerTaxiDocuments.insurance = {
                    ...provider.providerTaxiDocuments.insurance,
                    ...documentData,
                    status: 0
                };
                break;
            case 'driving_license':
                provider.documents.driving_license = {
                    ...provider.documents.driving_license,
                    ...documentData,
                    status: 0
                };
                break;
            case 'aadhaar_card':
                provider.documents.aadhaar_card = {
                    ...provider.documents.aadhaar_card,
                    ...documentData,
                    status: 0
                };
                break;
            case 'pan_card':
                provider.documents.pan_card = {
                    ...provider.documents.pan_card,
                    ...documentData,
                    status: 0
                };
                break;
            case 'bank_details':
                provider.documents.bank_details = {
                    ...provider.documents.bank_details,
                    ...documentData,
                    status: 0
                };
                break;
            default:
                return {
                    status: statusCode.BAD_REQUEST,
                    success: false,
                    message: resMessage.Invalid_document_type,
                };
        }

        // Save the provider after modifying the documents
        await provider.save();

        return {
            status: statusCode.OK,
            success: true,
            message: resMessage.Documents_Uploaded_Successfully,
            data: provider,
        };

    } catch (error) {
        console.error(error);
        return {
            status: statusCode.INTERNAL_SERVER_ERROR,
            success: false,
            message: resMessage.Internal_Server_Error,
            error: error.message || 'Internal Server Error',
        };
    }
};

exports.register = async (req) => {
    try {
        const { first_name, last_name, mobile, city_id } = req.body;
        if (!first_name || !last_name || !mobile || !city_id) {
            return {
                statusCode: statusCode.BAD_REQUEST,
                success: false,
                message: resMessage.Required_Data
            };
        }
        const data = await Provider.findOne({ mobile });
        if (data !== null) {
            return {
                status: statusCode.BAD_REQUEST,
                success: false,
                message: resMessage.Phone_Already_Exist
            };
        }
        const providerData = await Provider.create({ first_name, last_name, mobile, city_id });
        return {
            statusCode: statusCode.OK,
            success: true,
            message: resMessage.Data_Created_Successfully,
            data: providerData
        };
    } catch (error) {
        return {
            success: false,
            message: resMessage.Internal_Server_Error,
            error: error.message || "Internal Server Error",
        };
    }
};

exports.getDocuments = async (req) => {
    try {
        const { _id } = req.auth;
        const data = await Provider.findById(_id);
        if (!data) {
            return {
                statusCode: statusCode.UNAUTHORIZED,
                status: statusCode.UNAUTHORIZED,
                success: false,
                message: resMessage.Unauthorized_Access
            };
        }
        if (data.providerTaxi_id === null) {
            return {
                status: statusCode.OK,
                success: true,
                message: resMessage.Documents_Retrieved_Successfully,
                data: {
                    documents: data.documents,
                    providerTaxiDocuments: data.providerTaxiDocuments
                }
            };
        }
        return {
            status: statusCode.OK,
            success: true,
            message: resMessage.Documents_Retrieved_Successfully,
            data: {
                documents: data.documents,
                providerTaxiDocuments: data.providerTaxiDocuments,
                providerTaxi_id: data.providerTaxi_id
            }
        };
    } catch (error) {
        return {
            status: statusCode.INTERNAL_SERVER_ERROR,
            success: false,
            message: resMessage.Internal_Server_Error,
            error: error.message || "Internal Server Error",
        };
    }
};
exports.timeFareEstimate = async function (req, res, next) {
    try {
        const reqdata = req.body;
        const ride_id = reqdata.ride_id;
        const distance = await FUNC.calculateDistance(ride_id);
        // const location_coordinates = reqdata.location_coordinates;
        if (distance == 0) return {
            status: statusCode.BAD_REQUEST,
            success: false,
            message: 'Distance issue'
        };
        const ride_details = await Ride.findOneAndUpdate(
            { _id: ride_id },
            {
                $set: {
                    "basic.distance": distance,
                    // "location.path": location_coordinates
                }
            },
            { new: true }
        );

        if (!ride_details) {
            return {
                status: statusCode.BAD_REQUEST,
                success: false,
                message: "Not able to find associated ride with ride_id",
                meta: req.phoneMeta
            };
        }

        const { time: { started }, meta: { category_id }, basic, payment, location, offer, outstation, _id: rideId } = ride_details;

        const duration = moment().unix() - started;
        const source = {
            longitude: location.source.longitude,
            latitude: location.source.latitude
        };
        const destination = {
            longitude: reqdata.destination_long,
            latitude: reqdata.destination_lat
        };

        let fareObj;

        switch (basic.ridestationtype) {
            case "rentals": {
                const RentalDetails = await rentalModel.findOne({ _id: basic.planId });
                if (!RentalDetails) throw new Error("Rental plan not found");

                fareObj = await FUNC.ride_fare_estimate_rental(
                    category_id.toString(),
                    source,
                    duration,
                    distance,
                    basic.planId,
                    RentalDetails.hour,
                    payment.onlinepayment,
                    rideId,
                    basic.rentalKm,
                    basic.rentalHour,
                    basic.rentalPrice
                );
                break;
            }

            case "outstation": {
                const TravelDistance = outstation.endkm - outstation.startkm;

                fareObj = await FUNC.ride_fare_estimate_outstation(
                    category_id.toString(),
                    source,
                    destination,
                    duration,
                    distance,
                    basic.way,
                    payment.fare_estimate,
                    TravelDistance,
                    payment.onlinepayment,
                    rideId,
                    payment.per_km
                );
                break;
            }

            default: {
                const discount = offer.beforefare - offer.afterfare;

                fareObj = await FUNC.ride_fare_estimate(
                    category_id.toString(),
                    source,
                    destination,
                    duration,
                    distance,
                    discount,
                    basic.bookdistance,
                    payment.fare_estimate,
                    payment.airportcharge,
                    payment.onlinepayment,
                    rideId
                );
                break;
            }
        }
        return {
            status: statusCode.OK,
            success: true,
            message: "Fare calculated",
            data: fareObj
        };

    } catch (err) {
        return next(err);
    }
};
exports.addProviderTaxi = async (req) => {
    try {
        const providerTaxi = req.body;

        if (!providerTaxi.car_id || !providerTaxi.type_ids || !providerTaxi.plateno) {
            return {
                statusCode: statusCode.BAD_REQUEST,
                status: statusCode.BAD_REQUEST,
                success: false,
                message: resMessage.Required_Data,
            };
        }
        providerTaxi.provider_id = req.auth._id;
        const providerData = await providerTaxiModel.findOneAndUpdate({ provider_id: req.auth._id }, providerTaxi, { new: true, upsert: true });

        await locationModel.create({
            provider_id: providerTaxi.provider_id,
            type_ids: providerTaxi.type_ids
        });
        await Provider.findByIdAndUpdate(providerTaxi.provider_id,
            { providerTaxi_id: providerData._id },
            { new: true }
        );
        return {
            statusCode: statusCode.OK,
            status: statusCode.OK,
            success: true,
            message: resMessage.Data_Created_Successfully,
            data: providerData
        };
    } catch (error) {
        return {
            success: false,
            message: resMessage.Internal_Server_Error,
            error: error.message || "Internal Server Error",
        };
    }
};
exports.pendingRides = async function (req) {
    try {
        const { skip, limit } = req.body;
        // console.log('req.auth', req.auth);
        const logindata = req.auth;
        const remove_ride_time = moment().subtract(15, "minutes").toDate();

        let providerData = await Provider.findOne({ _id: logindata._id });
        if (!providerData) {
            return {
                status: statusCode.BAD_REQUEST,
                success: false,
                message: resMessage.Provider_taxi_not_found
            };
        }
        const matchStage = {
            $match: {
                "meta.city_id": new mongoose.Types.ObjectId(providerData.city_id),
                "basic.schedule": true,
                "basic.ride_status": "scheduled",
                "basic.provider_id": { $exists: false },
                "meta.schedule_canclled_providers": { $nin: [logindata.id] },
                "time.ride_on": { $gte: remove_ride_time },
            }
        };

        const aggregation = [
            matchStage,
            { $sort: { created: -1 } },
            { $skip: skip },
            { $limit: limit || 10 },

            // Populate category
            {
                $lookup: {
                    from: 'taxi_types',
                    localField: 'meta.category_id',
                    foreignField: '_id',
                    as: 'category'
                }
            },
            { $unwind: { path: '$category', preserveNullAndEmptyArrays: true } },

            // Populate user
            {
                $lookup: {
                    from: 'users',
                    localField: 'basic.user_id',
                    foreignField: '_id',
                    as: 'user'
                }
            },
            { $unwind: { path: '$user', preserveNullAndEmptyArrays: true } }
        ];
        // console.log('aggregation', JSON.stringify(aggregation));
        const rides = await Ride.aggregate(aggregation);

        const rideArr = rides.map(ride => {
            const localObj = {
                ride_id: ride._id.toString(),
                ride_status: ride.basic?.ride_status,
                ride_type: ride.basic?.ride_type,
                source: ride.location?.source,
                destination: ride.location?.destination,
                start_on: ride.time?.ride_on,
                payment_type: ride.basic?.payment_type,
                fare_estimate: ride.payment?.fare_estimate,
                category_image: ride.category?.thumb_3x,
                category_name: ride.category?.title,
                user_name: ride.user ? `${ride.user.first_name} ${ride.user.last_name} ` : '',
                user_mobile: ride.user?.mobile
            };

            if (ride.basic?.payment_type === 'Card') {
                localObj.card = ride.payment?.card;
            }

            return localObj;
        });
        return {
            statusCode: statusCode.OK,
            status: statusCode.OK,
            success: true,
            message: resMessage.Ride_List,
            data: rideArr
        };
    } catch (error) {
        return {
            success: false,
            message: resMessage.Internal_Server_Error,
            error: error.message || "Internal Server Error",
        };
    }
};

exports.bookedRides = async function (req) {
    try {
        const { skip, limit } = req.body;
        const logindata = req.auth;

        // const remove_ride_time = moment().add(15, "minutes").toDate();
        const remove_ride_time = moment().subtract(15, "minutes").toDate();
        const aggregation = [
            {
                $match: {
                    "basic.schedule": true,
                    "basic.ride_status": "scheduled",
                    "basic.provider_id": new mongoose.Types.ObjectId(logindata._id),
                    "time.ride_on": { $gte: remove_ride_time }
                }
            },
            { $sort: { created: -1 } },
            { $skip: skip },
            { $limit: limit },
            {
                $lookup: {
                    from: "categories",
                    localField: "meta.category_id",
                    foreignField: "_id",
                    as: "category"
                }
            },
            { $unwind: { path: "$category", preserveNullAndEmptyArrays: true } },
            {
                $lookup: {
                    from: "users",
                    localField: "basic.user_id",
                    foreignField: "_id",
                    as: "user"
                }
            },
            { $unwind: { path: "$user", preserveNullAndEmptyArrays: true } },
            {
                $lookup: {
                    from: "providers",
                    localField: "basic.provider_id",
                    foreignField: "_id",
                    as: "provider"
                }
            },
            { $unwind: { path: "$provider", preserveNullAndEmptyArrays: true } },
        ];

        const rides = await Ride.aggregate(aggregation);
        const settingData = await appSettings.findOne();
        const rideArr = rides.map(ride => ({
            ride_id: ride._id.toString(),
            ride_status: ride.basic?.ride_status,
            otp: ride.basic?.otp,
            pickup_distance: ride.basic?.pickup_distance,
            ridestationtype: ride.basic?.ridestationtype,
            ride_type: ride.basic?.ride_type,
            source: ride.location?.source,
            destination: ride.location?.destination,
            start_on: ride.time?.ride_on,
            payment_type: ride.basic?.payment_type,
            card: ride.basic?.payment_type === "Card" ? ride.payment?.card : undefined,
            fare_estimate: ride.payment?.fare_estimate,
            category_image: ride.category?.thumb_3x,
            category_name: ride.category?.title,
            user_name: `${ride.user?.first_name || ''} ${ride.user?.last_name || ''} `.trim(),
            user_mobile: ride.user?.mobile,
            car_title: ride.basic?.vehicle.title || "",
            plateno: ride.basic?.vehicle.plateno || "",
            color: ride.basic?.vehicle.color || "",
            driver_name: ride.basic?.providername || "",
            driver_image: "https://customer.ktscab.com/drivers/" + ride.provider.image,
            bookStatus: "booked_ride",
            instruction: settingData[`${ride.basic.ridestationtype}_instruction`] || "",
            stops: ride.location.stops,
        }));
        return {
            statusCode: statusCode.OK,
            status: statusCode.OK,
            success: true,
            message: resMessage.Ride_List,
            data: rideArr
        };
    } catch (error) {
        return {
            success: false,
            message: resMessage.Internal_Server_Error,
            error: error.message || "Internal Server Error",
        };
    }
};

exports.bookRide = async function (req) {
    try {
        const { ride_id } = req.body;
        const logindata = req.auth;

        const now_date = moment().toDate();
        let taxi_detail = await Provider.aggregate([
            {
                $match: {
                    _id: new mongoose.Types.ObjectId(logindata._id)
                }
            },
            {
                $lookup: {
                    from: "provider_taxis",
                    localField: "providerTaxi_id",
                    foreignField: "_id",
                    pipeline: [
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
                        },
                        {
                            $project: {
                                make: "$car_id.make",
                                title: "$car_id.title",
                                plateno: 1,
                                color: 1
                            }
                        }
                    ],
                    as: "provider_taxis"
                }
            },
            {
                $unwind: "$provider_taxis"
            }, {
                $project: {
                    provider_taxis: 1,
                    first_name: 1,
                    last_name: 1
                }
            }
        ]);
        if (taxi_detail.length <= 0) {
            return {
                statusCode: statusCode.BAD_REQUEST,
                success: false,
                message: resMessage.Provider_taxi_not_found
            };
        }
        taxi_detail = taxi_detail[0];

        const ride_details = await Ride.findOneAndUpdate(
            {
                _id: ride_id,
                "basic.schedule": true,
                "basic.ride_status": "scheduled",
                "basic.provider_id": { $exists: false },
            },
            {
                $set: {
                    "basic.provider_id": logindata._id,
                    "time.booked": now_date,
                    "basic.vehicle.title": `${taxi_detail.provider_taxis.make} ${taxi_detail.provider_taxis.title}`,
                    "basic.vehicle.plateno": taxi_detail.provider_taxis.plateno,
                    "basic.vehicle.color": taxi_detail.provider_taxis.color,
                    "basic.providername": `${taxi_detail.first_name} ${taxi_detail.last_name}`,
                    "meta.taxi_id": taxi_detail._id,
                }
            },
            { new: true }
        ).populate("basic.user_id");

        if (!ride_details) {
            return {
                statusCode: statusCode.BAD_REQUEST,
                success: false,
                message: resMessage.ride_not_found
            };
        }

        // io.in('provider_room').emit('ride_booked', {
        //     ride_id: ride_details._id.toString()
        // });

        const user = ride_details.basic.user_id;
        const NotificationData = {
            activity: "booking_confirmed",
            ride_id: ride_details._id,
            user_type: "customer",
            user_id: user._id,
            message: "Your ride has been confirmed by the driver",
            provider_id: logindata._id
        };
        await notificationModel.create(NotificationData);
        console.log('logindata', logindata);
        PushNotifications({
            receiverId: logindata._id.toString(),
            type: "booking_confirmed",
            title: "Confirmed ride",
            message: "Your ride has been confirmed by the driver",
            deviceTokens: user.fcm_token,
        });
        return {
            statusCode: statusCode.OK,
            status: statusCode.OK,
            success: true,
            message: resMessage.ride_booked_successfully,
            data: {}
        };
    } catch (error) {
        console.log('err', error);
        return {
            success: false,
            message: resMessage.Internal_Server_Error,
            error: error.message || "Internal Server Error",
        };
    }
};