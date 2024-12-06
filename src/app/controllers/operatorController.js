const service = require('../services/operatorService');
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
};

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

exports.updateDocumentController = async (req) => {
    try {
        return await service.uploadDocuments(req);
    } catch (error) {
        return {
            status: statusCode.BAD_REQUEST,
            success: false,
            message: error.message
        };
    }
}