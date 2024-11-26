const { statusCode, resMessage } = require('../../config/default.json');
const OfferCode = require('../../models/offerCodeModel');

exports.addOfferCode = async (req) => {
    try {
        const { ride_type, offercode, description, start_date, end_date, percentage, price, usedtimes } = req.body;
        if(!ride_type || !offercode || !description || !start_date || !end_date || !percentage || !price || !usedtimes) {
            return {
                status: statusCode.BAD_REQUEST,
                success: false,
                message: resMessage.Required_Data
            }
        }
        const data = await OfferCode.create({ offercode, description, start_date, end_date, ride_type, percentage, price, usedtimes });
        return {
            status: statusCode.OK,
            success: true,
            message: resMessage.Data_Created_Successfully,
            data
        }
    } catch (error) {
        return {
            success: false,
            message: resMessage.Internal_Server_Error,
            error: error.message || "Internal Server Error",
        };
    }
}