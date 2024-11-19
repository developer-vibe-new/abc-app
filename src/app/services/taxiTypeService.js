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