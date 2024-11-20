const { statusCode } = require('../../config/default.json');
const service = require('../services/userService');

exports.sendOtpController = async (req) => {
    try {
        return await service.sendOtp(req);
    } catch (error) {
        return {
            statusCode: statusCode.BAD_REQUEST,
            success: false,
            message: error.message
        };
    }
};