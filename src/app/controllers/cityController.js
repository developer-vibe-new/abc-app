const service = require('../services/cityService');
const { statusCode } = require('../../config/default.json');

exports.getCityController = async () => {
    try {
        return await service.getCity();
    } catch (error) {
        return {
            status: statusCode.BAD_REQUEST,
            success: false,
            message: error.message
        };
    }
}