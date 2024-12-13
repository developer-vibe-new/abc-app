const service = require('../services/providerService');
const { statusCode } = require('../../config/default.json');

exports.registerOperatorController = async (req) => {
    try {
        return await service.registerOperator(req);
    } catch (error) {
        return {
            statusCode: statusCode.BAD_REQUEST,
            success: false,
            message: error.message
        };
    }
};

exports.loginOperatorController = async (req) => {
    try {
        return await service.loginOperator(req);
    } catch (error) {
        return {
            statusCode: statusCode.BAD_REQUEST,
            success: false,
            message: error.message
        };
    }
};

exports.verifyOtpController = async (req) => {
    try {
        return await service.verifyOtp(req);
    } catch (error) {
        return {
            statusCode: statusCode.BAD_REQUEST,
            success: false,
            message: error.message
        };
    }
};

exports.addDriverController = async (req) => {
    try {
        return await service.addDriver(req);
    } catch (error) {
        return {
            statusCode: statusCode.BAD_REQUEST,
            success: false,
            message: error.message
        };
    }
};

exports.updateDriverStatusController = async (req) => {
    try {
        return await service.updateDriverStatus(req);
    } catch (error) {
        return {
            statusCode: statusCode.BAD_REQUEST,
            success: false,
            message: error.message
        };
    }
};

exports.driverBlockListController = async (req) => {
    try {
        return await service.driverBlockList(req);
    } catch (error) {
        return {
            statusCode: statusCode.INTERNAL_SERVER_ERROR,
            success: false,
            message: error.message
        };
    }
};

exports.driverListController = async (req) => {
    try {
        return await service.driverList(req);
    } catch (error) {
        return {
            statusCode: statusCode.INTERNAL_SERVER_ERROR,
            success: false,
            message: error.message
        };
    }
};

exports.driverOnlineStatusController = async (req) => {
    try {
        return await service.driverOninerStatus(req);
    } catch (error) {
        return {
            statusCode: statusCode.INTERNAL_SERVER_ERROR,
            success: false,
            message: error.message
        };
    }
};

exports.updateDriverController = async (req) => {
    try {
        return await service.updateDriver(req);
    } catch (error) {
        return {
            statusCode: statusCode.INTERNAL_SERVER_ERROR,
            success: false,
            message: error.message
        };
    }
};

exports.providerLoginController = async (req) => {
    try {
        return await service.providerlogin(req);
    } catch (error) {
        return {
            status: statusCode.INTERNAL_SERVER_ERROR,
            success: false,
            message: error.message
        };
    }
};


exports.providerOtpVerification = async (req) => {
    try {
        return await service.providerOtpVerification(req);
    } catch (error) {
        return {
            status: statusCode.INTERNAL_SERVER_ERROR,
            success: false,
            message: error.message
        };
    }
};

exports.deleteDriverController = async (req) => {
    try {
        return await service.deleteDriver(req);
    } catch (error) {
        return {
            statusCode: statusCode.INTERNAL_SERVER_ERROR,
            success: false,
            message: error.message
        };
    }
};

exports.updateDocumentsController = async (req) => {
    try {
        return await service.updateDocuments(req);
    } catch (error) {
        return {
            status: statusCode.INTERNAL_SERVER_ERROR,
            success: false,
            message: error.message
        };
    }
}

exports.registerController = async (req) => {
    try {
        return await service.register(req);
    } catch (error) {
        return {
            status: statusCode.INTERNAL_SERVER_ERROR,
            success: false,
            message: error.message
        };
    }
}

exports.getDocumentsController = async (req) => {
    try {
        return await service.getDocuments(req);
    } catch (error) {
        return {
            status: statusCode.INTERNAL_SERVER_ERROR,
            success: false,
            message: error.message
        };
    }
}