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

exports.viewSubAdminController = async (req) => {
    try {
        return await service.viewSubAdmin(req);
    } catch (error) {
        return {
            statusCode: statusCode.INTERNAL_SERVER_ERROR,
            success: false,
            message: error.message
        };
    }
}

exports.editSubAdminController = async (req) => {
    try {
        return await service.editSubAdmin(req);
    } catch (error) {
        return {
            statusCode: statusCode.INTERNAL_SERVER_ERROR,
            success: false,
            message: error.message
        };
    }
}

exports.updateSubAdminController = async (req) => {
    try {
        return await service.updateSubAdmin(req);
    } catch (error) {
        return {
            statusCode: statusCode.INTERNAL_SERVER_ERROR,
            success: false,
            message: error.message
        };
    }
}

exports.deleteSubAdminController = async (req) => {
    try {
        return await service.deleteSubAdmin(req);
    } catch (error) {
        return {
            statusCode: statusCode.INTERNAL_SERVER_ERROR,
            success: false,
            message: error.message
        };
    }
}