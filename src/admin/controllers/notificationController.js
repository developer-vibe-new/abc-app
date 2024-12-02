const { statusCode } = require('../../config/default.json');
const services = require('../services/notificationSerivce');

exports.addNotificationController = async (req) => {
    try {
        return await services.addNotification(req);
    } catch (error) {
        return {
            statusCode: statusCode.BAD_REQUEST,
            success: false,
            message: error.message
        };
    }
}