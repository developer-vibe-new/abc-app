const service = require('../services/providerTaxiService');
const { statusCode } = require('../../config/default.json');

exports.addProviderTaxiController = async (req) => {
    try {
        return await service.addProviderTaxi(req);
    } catch (error) {
        return {
            statusCode: statusCode.INTERNAL_SERVER_ERROR,
            success: false,
            message: error.message
        };
    }
}

exports.deleteProviderTaxiController = async (req) => {
    try {
        return await service.deleteProviderTaxi(req);
    } catch (error) {
        return {
            statusCode: statusCode.INTERNAL_SERVER_ERROR,
            success: false,
            message: error.message
        };
    }
}