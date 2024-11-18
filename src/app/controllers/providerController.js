const service = require('../services/providerService');
const { statusCode } = require('../../config/default.json');

exports.registerOperatorController = async (req) => {
    try {
        return await service.registerOperator(req);
    } catch (error) {
        return {
            statusCode: statusCode.BAD_REQUEST,
            success: false,
            message: error.message
        };
    }
}

exports.loginOperatorController = async (req) => {
    try {
        return await service.loginOperator(req);
    } catch (error) {
        return {
            statusCode: statusCode.BAD_REQUEST,
            success: false,
            message: error.message
        };
    }
}

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
}

exports.addDriverController = async (req) => {
    try {
        return await service.addDriver(req);
    } catch (error) {
        return {
            statusCode: statusCode.BAD_REQUEST,
            success: false,
            message: error.message
        };
    }
}

exports.updateDriverStatusController = async (req) => {
    try {
        return await service.updateDriverStatus(req);
    } catch (error) {
        return {
            statusCode: statusCode.BAD_REQUEST,
            success: false,
            message: error.message
        };
    }
}