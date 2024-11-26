const service = require('../services/subAdminService');
const { statusCode } = require('../../config/default.json');

exports.addSubAdminController = async (req) => {
    try {
        return await service.addSubAdmin(req);
    } catch (error) {
        return {
            statusCode: statusCode.BAD_REQUEST,
            success: false,
            message: error.message
        };
    }
}

exports.viewSubAdminController = async () => {
    try {
        return await service.viewSubAdmin();
    } catch (error) {
        return {
            statusCode: statusCode.INTERNAL_SERVER_ERROR,
            success: false,
            message: error.message
        };
    }
}