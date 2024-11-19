const { statusCode, resMessage } = require('../../config/default.json');
const Taxitype = require('../../models/taxiTypeModel');

exports.addTaxiType = async (req) => {
    try {
        const taxi = req.body;
        if (!taxi.title || !taxi.type) {
            return {
                statusCode: statusCode.BAD_REQUEST,
                success: false,
                message: resMessage.Required_Data
            };
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
        const data = await Taxitype.findOne({ _id: id, type: "operator" });
        if (!data) {
            return {
                status: statusCode.DATA_NOT_FOUND,
                success: false,
                message: resMessage.Data_Not_Found
            };
        }
        const status = data.is_active === true ? false : true;
        data.is_active = status;
        await data.save();
        return {
            status: statusCode.OK,
            success: true,
            message: resMessage.Status_Updated_Successfully,
            data: data
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
        const icon = req.file.filename;
        const data = await Taxitype.findOne({ _id: id, type: "operator" });
        if (!data) {
            return {
                status: statusCode.DATA_NOT_FOUND,
                success: false,
                message: resMessage.Data_Not_Found
            };
        }
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
