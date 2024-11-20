const { statusCode, resMessage } = require('../../config/default.json');
const User = require('../../models/users');

exports.sendOtp = async (req) => {
    try {
        const { mobile } = req.body;
        const register = await User.findOne({ mobile });
        if (!register) {
            await User.create({ mobile, otp: 1234 });
            return {
                status: statusCode.Ok,
                success: true,
                message: resMessage.Otp_Send_Success
            };
        }
        return {
            status: statusCode.BAD_REQUEST,
            success: false,
            message: resMessage.Unique_Mobile_Verify
        };
    } catch (error) {
        return {
            success: false,
            message: resMessage.Internal_Server_Error,
            error: error.message || "Internal Server Error"
        };
    }
};