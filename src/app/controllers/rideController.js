const ride = require('../services/rideService');
const { statusCode } = require('../../config/default.json');

exports.categoriesPrice = async (req) => {
    try {
        return await ride.CategoriesPrice(req);
    } catch (error) {
        return {
            status: statusCode.BAD_REQUEST,
            success: false,
            message: error.message
        };
    }
};
exports.list = async (req) => {
    try {
        return await ride.list(req);
    } catch (error) {
        return {
            status: statusCode.BAD_REQUEST,
            success: false,
            message: error.message
        };
    }
};