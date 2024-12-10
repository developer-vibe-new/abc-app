const mongoose = require('mongoose');
const { statusCode, resMessage } = require('../../config/default.json');
const ProviderTaxi = require('../../models/providerTaxi');

exports.addProviderTaxi = async (req) => {
    try {
        const providerTaxi = req.body;
        // const { rc_photo, car_photo, carLeftImage, carRigthImage, carBackImage, carFrontImage } = req.files;
        if (req.auth && req.auth.role === "operator") {
            providerTaxi.operator_id = req.auth.id;
        }
        if (req.files) {
            if (req.files.rc_photo) {
                providerTaxi.rc_photo = req.files.rc_photo[0].filename;
            }
            if (req.files.car_photo) {
                providerTaxi.car_photo = req.files.car_photo[0].filename;
            }
            if (req.files.carLeftImage) {
                providerTaxi.carLeftImage = req.files.carLeftImage[0].filename;
            }
            if (req.files.carRigthImage) {
                providerTaxi.carRigthImage = req.files.carRigthImage[0].filename;
            }
            if (req.files.carBackImage) {
                providerTaxi.carBackImage = req.files.carBackImage[0].filename;
            }
            if (req.files.carFrontImage) {
                providerTaxi.carFrontImage = req.files.carFrontImage[0].filename;
            }
        }

        if (!providerTaxi.car_id || !providerTaxi.type_ids || !providerTaxi.plateno) {
            return {
                statusCode: statusCode.BAD_REQUEST,
                success: false,
                message: resMessage.Required_Data,
            };
        }
        await ProviderTaxi.create(providerTaxi);
        return {
            statusCode: statusCode.OK,
            success: true,
            message: resMessage.Data_Created_Successfully,
        };
    } catch (error) {
        return {
            success: false,
            message: resMessage.Internal_Server_Error,
            error: error.message || "Internal Server Error",
        };
    }
};

exports.deleteProviderTaxi = async (req) => {
    try {
        const { id } = req.params;
        const data = await ProviderTaxi.findById(id);
        if (!data) {
            return {
                statusCode: statusCode.DATA_NOT_FOUND,
                success: false,
                message: resMessage.Data_Not_Found
            };
        }
        const operatorId = new mongoose.Types.ObjectId(req.auth.id);
        if (data.operator_id && data.operator_id.equals(operatorId)) {
            await ProviderTaxi.findByIdAndUpdate(id, { is_active: false });
            return {
                statusCode: statusCode.OK,
                success: true,
                message: resMessage.Data_Deleted_Successfully,
            };
        }
        return {
            statusCode: statusCode.UNAUTHORIZED,
            success: false,
            message: resMessage.Unauthorized_Access,
        };
    } catch (error) {
        return {
            success: false,
            message: resMessage.Internal_Server_Error,
            error: error.message || "Internal Server Error",
        };
    }
};

exports.providerTaxiList = async (req) => {
    try {
        const data = await ProviderTaxi.aggregate([
            {
                $match: {
                    operator_id: new mongoose.Types.ObjectId(req.auth.id)
                }
            },
            {
                $lookup: {
                    from: "providers",
                    localField: "operator_id",
                    foreignField: "operator_id",
                    as: "operator_id"
                }
            },
            {
                $unwind: {
                    path: "$operator_id",
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $project: {
                    firstName: "$operator_id.first_name",
                    lastName: "$operator_id.last_name",
                    mobile: "$operator_id.mobile",
                    kycStatus: "$operator_id.kycStatus",
                    onlineStatus: "$operator_id.is_online",
                    vehicleStatus: "$status",
                    vehicleDetails: {
                        $cond: {
                            if: { $eq: ["$status", true] },
                            then: {
                                car_id: "$car_id",
                                plateno: "$plateno",
                                carType: "$type_ids",
                                isActive: "$is_active"
                            },
                            else: null
                        }
                    }
                }
            }
        ]);
        if (!data) {
            return {
                status: statusCode.DATA_NOT_FOUND,
                success: false,
                message: resMessage.Data_Not_Found,
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