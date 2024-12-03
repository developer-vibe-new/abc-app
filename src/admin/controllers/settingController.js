const services = require('../services/settingService');
const { statusCode } = require('../../config/default.json');

exports.addSettingController = async (req) => {
    try {
        return await services.addSetting(req);
    } catch (error) {
        return {
            statusCode: statusCode.BAD_REQUEST,
            success: false,
            message: error.message
        };
    }
}

exports.viewSettingController = async (req) => {
    try {
        return await services.viewSetting(req);
    } catch (error) {
        return {
            statusCode: statusCode.BAD_REQUEST,
            success: false,
            message: error.message
        };
    }
}