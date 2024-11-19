const { statusCode } = require('../../config/default.json');
const service = require('../services/taxiTypeService');

exports.addTaxiTypeController = async (req) => {
    try {
        return await service.addTaxiType(req);
    } catch (error) {
        return {
            statusCode: statusCode.BAD_REQUEST,
            success: false,
            message: error.message
        };
    }
}

exports.updateTaxiStatusController = async (req) => {
    try {
        return await service.updateTaxiStatus(req);
    } catch (error) {
        return {
            statusCode: statusCode.INTERNAL_SERVER_ERROR,
            success: false,
            message: error.message
        }
    }
}

exports.updateTaxiTypeController = async (req) => {
    try {
        return await service.updateTaxiType(req);
    } catch (error) {
        return {
            statusCode: statusCode.INTERNAL_SERVER_ERROR,
            success: false,
            message: error.message
        }
    }
}