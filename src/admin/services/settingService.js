const { statusCode, resMessage } = require('../../config/default.json');
const Setting = require('../../models/settingModel');

exports.addSetting = async (req) => {
    try {
        const { online_payment, support_no, daily_instruction, outstation_instruction, rental_instruction } = req.body;
        const data = await Setting.create({ online_payment, support_no, daily_instruction, outstation_instruction, rental_instruction });
        return {
            status: statusCode.OK,
            success: true,
            message: resMessage.Data_Created_Successfully,
            data,
        }
    } catch (error) {
        return {
            statusCode: statusCode.BAD_REQUEST,
            success: false,
            message: resMessage.Internal_Server_Error,
            error: error.message || "Internal Server Error",
        };
    }
}