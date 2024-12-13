const { statusCode, resMessage } = require('../../config/default.json');
const Provider = require('../../models/providerModel');
const mongoose = require('mongoose');
const jwt = require("jsonwebtoken");

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
        const { id } = req.params;
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
            const onlineStatus = driverData.is_online === true ? false : true;
            driverData.is_online = onlineStatus;
            await driverData.save();
            return {
                status: statusCode.OK,
                success: true,
                message: resMessage.Status_Updated_Successfully,
                data: driverData
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
                message: resMessage.Data_Not_Found,
            }
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
        const { mobile, otp } = req.body;

        const driverData = await Provider.findOne({ mobile, otp });

        if (!driverData) {
            return {
                status: statusCode.OK,
                success: false,
                message: resMessage.Data_Not_Found,
            };
        }

        const token = jwt.sign(
            { _id: driverData._id, mobile: driverData.mobile },
            process.env.SECRET_KEY,
            { expiresIn: "1h" }
        );
        
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
        const validDocumentTypes = ['driving_license', 'aadhaar_card'];
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

        switch (documentType) {
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
            default:
                return {
                    status: statusCode.BAD_REQUEST,
                    success: false,
                    message: resMessage.Invalid_document_type,
                };
        }

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
        if(data !== null) {
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