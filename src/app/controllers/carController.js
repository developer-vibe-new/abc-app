const service = require('../services/carService');
const { statusCode } = require('../../config/default.json');

exports.addCarController = async (req) => {
    try {
        return await service.addCar(req);
    } catch (error) {
        return {
            statusCode: statusCode.BAD_REQUEST,
            success: false,
            message: error.message
        };
    }
};