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

exports.verifyOtpController = async (req) => {
    try {
        return await service.verifyOtp(req);
    } catch (error) {
        return {
            statusCode: statusCode.BAD_REQUEST,
            success: false,
            message: error.message
        };
    }
};
exports.updateUserController = async (req) => {
    try {
        return await service.updateUser(req);
    } catch (error) {
        return {
            statusCode: statusCode.INTERNAL_SERVER_ERROR,
            success: false,
            message: error.message
        };
    }
};

exports.userDetailsController = async (req) => {
    try {
        return await service.userDetails(req);
    } catch (error) {
        return {
            statusCode: statusCode.INTERNAL_SERVER_ERROR,
            success: false,
            message: error.message
        };
    }
}

exports.deleteUserController = async (req) => {
    try {
        return await service.deleteUser(req);
    } catch (error) {
        return {
            statusCode: statusCode.INTERNAL_SERVER_ERROR,
            success: false,
            message: error.message
        };
    }
}