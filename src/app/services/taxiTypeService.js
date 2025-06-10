const { statusCode, resMessage } = require('../../config/default.json');
const Taxitype = require('../../models/taxiTypeModel');
const mongoose = require('mongoose');

exports.addTaxiType = async (req) => {
    try {
        const taxi = req.body;
        if (!taxi.title) {
            return {
                statusCode: statusCode.BAD_REQUEST,
                success: false,
                message: resMessage.Required_Data
            };
        }
        if (req.auth && req.auth.role === "operator") {
            taxi.operator_id = req.auth.id;
        }
        await Taxitype.create(taxi);
        return {
            statusCode: statusCode.OK,
            success: true,
            message: resMessage.Data_Created_Successfully
        };
    } catch (error) {
        console.log("Error: ", error);
        return {
            success: false,
            message: resMessage.Internal_Server_Error,
            error: error.message || "Internal Server Error"
        };
    }
};

exports.updateTaxiStatus = async (req) => {
    try {
        const { id } = req.params;
        const data = await Taxitype.findOne({ _id: id });
        if (!data) {
            return {
                status: statusCode.DATA_NOT_FOUND,
                success: false,
                message: resMessage.Data_Not_Found
            };
        }
        const operatorId = new mongoose.Types.ObjectId(req.auth.id);
        if (data.operator_id && data.operator_id.equals(operatorId)) {
            const status = data.is_active === true ? false : true;
            data.is_active = status;
            await data.save();
            return {
                status: statusCode.OK,
                success: true,
                message: resMessage.Status_Updated_Successfully,
                data: data
            };
        }
        return {
            status: statusCode.UNAUTHORIZED,
            success: false,
            message: resMessage.Unauthorized_Access
        };
    } catch (error) {
        console.log('Error', error);
        return {
            status: statusCode.INTERNAL_SERVER_ERROR,
            success: false,
            message: resMessage.Internal_Server_Error,
            error: error.message || 'An error occurred while updating taxi status'
        };
    }
};

exports.updateTaxiType = async (req) => {
    try {
        const { id } = req.params;
        const { base_fare, airportCharge, fixed_fare, distance_fare, time_fare, currency } = req.body;
        let icon;
        if (req.file) {
            icon = req.file.filename;
        }
        const data = await Taxitype.findOne({ _id: id });
        if (!data) {
            return {
                status: statusCode.DATA_NOT_FOUND,
                success: false,
                message: resMessage.Data_Not_Found
            };
        }
        const operatorId = new mongoose.Types.ObjectId(req.auth.id);
        if (data.operator_id && data.operator_id.equals(operatorId)) {
            await Taxitype.updateOne(
                {
                    _id: id
                },
                {
                    $set: {
                        icon,
                        base_fare,
                        airportCharge,
                        fixed_fare,
                        distance_fare,
                        time_fare,
                        currency
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
        console.log('Error', error);
        return {
            status: statusCode.INTERNAL_SERVER_ERROR,
            success: false,
            message: resMessage.Internal_Server_Error,
            error: error.message || 'An error occurred while updating taxi status'
        };
    }
};

exports.taxiTypeList = async () => {
    try {
        // { operator_id: req.auth.id }
        const data = await Taxitype.find({ is_active: true });
        if (!data) {
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
    }
    catch (error) {
        return {
            status: statusCode.INTERNAL_SERVER_ERROR,
            success: false,
            message: resMessage.Internal_Server_Error,
            error: error.message || "Internal Server Error",
        };
    }
};