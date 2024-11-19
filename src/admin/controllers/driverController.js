const services = require('../services/driverService');
const { statusCode } = require('../../config/default.json');

exports.createDriver = async (req) => {
    try {
        return await services.driverCreate(req);
        // return res
        //     .status(200)
        //     .json(Object.assign({ status: data.success }, data));

    } catch (error) {
        console.log(error);
        return {
            statusCode: statusCode.BAD_REQUEST,
            success: false,
            message: error.message
        };
    }
};

exports.viewDriver = async (req) => {
    try {
        return await services.driverView(req);
        // return res
        //     .status(200)
        //     .json(Object.assign({ status: data.success }, data));

    } catch (error) {
        console.log(error);
        return {
            statusCode: statusCode.BAD_REQUEST,
            success: false,
            message: error.message
        };
    }
};

exports.updateDriver = async (req) => {
    try {
        return await services.driverUpdate(req);
        // if (getdata.success == true) {
        //     return res
        //         .status(200)
        //         .json(Object.assign({ status: getdata.success }, getdata));
        // } else {
        //     return res
        //         .status(400)
        //         .json(Object.assign({ status: getdata.success }, { message: getdata.message }));
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
exports.deleteDriver = async (req) => {
    try {
        return await services.driverDelete(req);
        // if (getdata.success == true) {
        //     return res
        //         .status(200)
        //         .json(Object.assign({ status: getdata.success }, getdata));
        // } else {
        //     return res
        //         .status(400)
        //         .json(Object.assign({ status: getdata.success }, { message: getdata.message }));
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


