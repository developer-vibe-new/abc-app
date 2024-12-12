const mongoose = require('mongoose');
const { statusCode, resMessage } = require('../../config/default.json');
const ProviderTaxi = require('../../models/providerTaxi');
const Provider = require('../../models/providerModel');

exports.addProviderTaxi = async (req) => {
    try {
        const providerTaxi = req.body;
        if (req.auth && req.auth.role === "operator") {
            providerTaxi.operator_id = req.auth.id;
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
        const { id } = req.body;
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

exports.providerTaxiListAll = async (req) => {
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
                    localField: "provider_id",
                    foreignField: "_id",
                    as: "provider_info"
                }
            },
            {
                $addFields: {
                    provider_name: {
                        $cond: {
                            if: { $ne: ["$provider_id", null] },
                            then: { $arrayElemAt: ["$provider_info.name", 0] },
                            else: null
                        }
                    }
                }
            },
            {
                $unwind: {
                    path: "$provider_info",
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $addFields: {
                    providerFirstName: "$provider_info.first_name",
                    providerLastName: "$provider_info.last_name"
                }
            },
            {
                $project: {
                    provider_info: 0
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

exports.assignProvider = async (req) => {
    try {
        const { providerTaxiId, providerId } = req.body;
        const { id } = req.auth;
        const updateData = await ProviderTaxi.findOneAndUpdate(
            { _id: providerTaxiId, operator_id: id },
            { provider_id: providerId, status: true },
            { new: true }
        );
        await Provider.findByIdAndUpdate(providerId,
            { providerTaxi_id: providerTaxiId, vehicleStatus: 1 }
        );
        if (updateData === null) {
            return {
                status: statusCode.DATA_NOT_FOUND,
                success: false,
                message: resMessage.Data_Not_Found,
            };
        }
        return {
            status: statusCode.OK,
            success: true,
            message: resMessage.Provider_Assigned_Successfully,
            data: updateData,
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

exports.deassignProvider = async (req) => {
    try {
        const { providerId, providerTaxiId } = req.body;
        const updateData = await ProviderTaxi.findOneAndUpdate(
            { _id: providerTaxiId, operator_id: req.auth.id },
            { provider_id: null, status: false },
            { new: true }
        );
        await Provider.findOneAndUpdate(
            { _id: providerId, operator_id: req.auth.id },
            { providerTaxi_id: null, vehicleStatus: 0 }
        );
        return {
            status: statusCode.OK,
            success: true,
            message: resMessage.Provider_Deassigned_Successfully,
            data: updateData,
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
 
exports.updateDocuments = async (req) => {
    try {
        const { taxiProviderId, documentType, documentData } = req.body;
        const { id } = req.auth;

        const validDocumentTypes = ['rc', 'pollution_certificate', 'vehicle_image', 'vehicle_permit', 'insurance'];
        if (!validDocumentTypes.includes(documentType)) {
            return {
                status: statusCode.BAD_REQUEST,
                success: false,
                message: resMessage.Invalid_document_type
            };
        }

        const providerTaxi = await ProviderTaxi.findOne({ _id: taxiProviderId, operator_id: id });
        if (!providerTaxi) {
            return {
                status: statusCode.NOT_FOUND,
                success: false,
                message: resMessage.Provider_taxi_not_found,
            };
        }

        switch (documentType) {
            case 'rc':
                providerTaxi.documents.rc = {
                    ...providerTaxi.documents.rc,
                    ...documentData,
                    status: 0
                };
                break;
            case 'pollution_certificate':
                providerTaxi.documents.pollution_certificate = {
                    ...providerTaxi.documents.pollution_certificate,
                    ...documentData,
                    status: 0
                };
                break;
            case 'vehicle_image':
                providerTaxi.documents.vehicle_image = {
                    ...providerTaxi.documents.vehicle_image,
                    ...documentData,
                    status: 0
                };
                break;
            case 'vehicle_permit':
                providerTaxi.documents.vehicle_permit = {
                    ...providerTaxi.documents.vehicle_permit,
                    ...documentData,
                    status: 0
                };
                break;
            case 'insurance':
                providerTaxi.documents.insurance = {
                    ...providerTaxi.documents.insurance,
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

        await providerTaxi.save();

        return {
            status: statusCode.OK,
            success: true,
            message: resMessage.Documents_Uploaded_Successfully,
            data: providerTaxi,
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
