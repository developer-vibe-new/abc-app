
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

exports.operators = async (req) => {
    try {
        return await services.operatorsList(req);

    } catch (error) {
        console.log(error);
        return {
            statusCode: statusCode.BAD_REQUEST,
            success: false,
            message: error.message
        };
    }
};
exports.operatorsUpdate = async (req) => {
    try {
        return await services.updateOperator(req);
        // if (data.success == true) {
        //     return res
        //         .status(200)
        //         .json(Object.assign({ status: data.success }, data));
        // }
    } catch (error) {
        console.log(error);
        return {
            statusCode: statusCode.BAD_REQUEST,
            success: false,
            message: error.message
        };
    }
};
