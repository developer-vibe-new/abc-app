const { statusCode, resMessage } = require('../../config/default.json');
const City = require('../../models/city');

exports.getCity = async (req) => {
    try {
        const data = await City.find();
        if(!data) {
            return {
                status: statusCode.NOT_FOUND,
                success: false,
                message: resMessage.Data_Not_Found,
            };
        }
        return {
            status: statusCode.OK,
            success: true,
            message: resMessage.Data_Fetch_Successfully,
            data,
        }
    } catch (error) {
        return {
            status: statusCode.INTERNAL_SERVER_ERROR,
            success: false,
            message: resMessage.Internal_Server_Error,
            error: error.message,
        };
    }
}