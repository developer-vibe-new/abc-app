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

exports.carListcontroller = async () => {
    try {
        return await service.carList();
    } catch (error) {
        return {
            statusCode: statusCode.BAD_REQUEST,
            success: false,
            message: error.message
        };
    }
};

exports.updateCarStatusController = async (req) => {
    try {
        return await service.updateCarStatus(req);
    } catch (error) {
        return {
            statusCode: statusCode.INTERNAL_SERVER_ERROR,
            success: false,
            message: error.message
        };
    }
};

exports.updateCarController = async (req) => {
    try {
        return await service.updateCar(req);
    } catch (error) {
        return {
            statusCode: statusCode.INTERNAL_SERVER_ERROR,
            success: false,
            message: error.message
        };
    }
};