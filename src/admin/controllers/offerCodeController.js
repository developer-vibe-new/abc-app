const service = require('../services/offerCodeService');
const { statusCode } = require('../../config/default.json');

exports.addOfferCodeController = async (req) => {
    try {
        return await service.addOfferCode(req);
    }
    catch (error) {
        return {
            statusCode: statusCode.BAD_REQUEST,
            success: false,
            message: error.message
        };
    }
}

exports.viewOfferCodeController = async (req) => {
    try {
        return await service.viewOfferCode(req);
    } catch (error) {
        return {
            statusCode: statusCode.BAD_REQUEST,
            success: false,
            message: error.message
        };
    }
}

exports.getEditOfferCodeController = async (req) => {
    try {
        return await service.getEditOfferCode(req);
    } catch (error) {
        return {
            statusCode: statusCode.BAD_REQUEST,
            success: false,
            message: error.message
        };
    }
}