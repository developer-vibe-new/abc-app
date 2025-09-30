const services = require('../services/taxiTypeService');
const { statusCode } = require('../../config/default.json');
exports.viewTaxiType = async (req) => {
    try {
        const result = await services.taxiTypeList(req);
        return result;
    } catch (error) {
        console.log('error----->>>', error);
        return {
            statusCode: statusCode.INTERNAL_SERVER_ERROR,
            success: false,
            message: error.message
        };
    }
};
exports.updateTaxiType = async (req) => {
    try {
        return await services.updateTaxiTypeList(req);
        // if (data.success == true) {
        //     return res.status(200).json(Object.assign({ status: data.success }, data));
        // } else {
        //     return res.status(400).json(Object.assign({ status: data.success }));
        // }
    } catch (error) {
        console.log(error);
    }
};

exports.addTaxiTypeController = async (req) => {
    try {
        return await services.addTaxiType(req);
    } catch (error) {
        console.log(error);
        return {
            statusCode: statusCode.BAD_REQUEST,
            success: false,
            message: error.message
        };
    }
};

exports.updateTaxiStatus = async (req) => {
    try {
        return await services.updateTaxiStatus(req);
        // if (data.success == true) {
        //     return res.status(200).json(Object.assign({ status: data.success }, data));
        // } else {
        //     return res.status(400).json(Object.assign({ status: data.success }));
        // }
    } catch (error) {
        console.log(error);
    }
};

exports.updateTaxiTypeOutstationStatusController = async (req) => {
    try {
        return await services.updateTaxiOutstationStatus(req);
    } catch (error) {
        return {
            statusCode: statusCode.INTERNAL_SERVER_ERROR,
            success: false,
            message: error.message
        };
    }
};

exports.editTaxiTypeController = async (req) => {
    try {
        return await services.editTaxiType(req);
    } catch (error) {
        return {
            statusCode: statusCode.INTERNAL_SERVER_ERROR,
            success: false,
            message: error.message
        };
    }
};