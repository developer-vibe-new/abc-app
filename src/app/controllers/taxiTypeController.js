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
};