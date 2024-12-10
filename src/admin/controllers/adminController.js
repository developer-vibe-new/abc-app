
const services = require('../services/adminService');
const { statusCode } = require('../../config/default.json');

exports.registerAdmin = async (req, res) => {
    try {
        const data = await services.adminRegister(req);
        return res
            .status(200)
            .json(Object.assign({ status: data.success }, data));

    } catch (error) {
        console.log(error);
        return {
            statusCode: statusCode.BAD_REQUEST,
            success: false,
            message: error.message
        };
    }
};

exports.login = async (req) => {
    try {
        return await services.login(req);
    } catch (error) {
        console.log(error);
        return {
            statusCode: statusCode.BAD_REQUEST,
            success: false,
            message: error.message
        };
    }
};

exports.operatorListController = async (req) => {
    try {
        return await services.operatorsList(req);
    } catch (error) {
        console.log(error);
        return {
            status: statusCode.BAD_REQUEST,
            success: false,
            message: error.message
        };
    }
};
exports.operatorsUpdate = async (req) => {
    try {
        return await services.updateOperator(req);
    } catch (error) {
        console.log(error);
        return {
            statusCode: statusCode.BAD_REQUEST,
            success: false,
            message: error.message
        };
    }
};

exports.dashboardDataController = async (req, res) => {
    try {
        return await services.dashboardData(req);
    } catch (error) {
        console.log(error);
        return {
            statusCode: statusCode.BAD_REQUEST,
            success: false,
            message: error.message
        };
    }
}

exports.changePasswordController = async (req) => {
    try {
        return await services.changePassword(req);
    } catch (error) {
        console.log(error);
        return {
            status: statusCode.INTERNAL_SERVER_ERROR,
            success: false,
            message: error.message
        };
    }
}

exports.operatorsUpdateStatusController = async (req) => {
    try {
        return await services.updateOperatorStatus(req);
    } catch (error) {
        console.log(error);
        return {
            statusCode: statusCode.BAD_REQUEST,
            success: false,
            message: error.message
        };
    }
};