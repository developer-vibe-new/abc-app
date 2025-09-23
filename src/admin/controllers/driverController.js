const services = require('../services/driverService');
const { statusCode } = require('../../config/default.json');


exports.getDriverDetails = async (req) => {
    try {
        return await services.driverDetailsService(req);
    } catch (error) {
        console.log(error);
        return {
            statusCode: statusCode.BAD_REQUEST,
            success: false,
            message: error.message
        };
    }
};

exports.createDriver = async (req) => {
    try {
        return await services.driverCreate(req);
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
    } catch (error) {
        console.log(error);
        return {
            statusCode: statusCode.BAD_REQUEST,
            success: false,
            message: error.message
        };
    }
};


exports.editDriver = async (req) => {
    try {
        return await services.driverEdit(req);

    } catch (error) {
        console.log(error);
        return {
            statusCode: statusCode.BAD_REQUEST,
            success: false,
            message: error.message
        };
    }
};
exports.blockDriver = async (req) => {
    try {
        return await services.blockDriver(req);

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

    } catch (error) {
        console.log(error);
        return {
            statusCode: statusCode.BAD_REQUEST,
            success: false,
            message: error.message
        };
    }
};
exports.blockedDriversList = async (req) => {
    try {
        return await services.blockedDriverList(req);
    } catch (error) {
        console.log(error);
        return {
            statusCode: statusCode.BAD_REQUEST,
            success: false,
            message: error.message
        };
    }
};

exports.editBlockDriver = async (req) => {
    try {
        return await services.editBlockDriver(req);
    } catch (error) {
        console.log(error);
        return {
            statusCode: statusCode.BAD_REQUEST,
            success: false,
            message: error.message
        };
    }
};
exports.blockedDriverUpdate = async (req) => {
    try {
        return await services.blockedDriverUpdate(req);
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

exports.unblockDriver = async (req) => {
    try {
        return await services.unblockDriver(req);

    } catch (error) {
        console.log(error);
        return {
            statusCode: statusCode.BAD_REQUEST,
            success: false,
            message: error.message
        };
    }
};
exports.onlineDriverList = async (req) => {
    try {
        return await services.onlineDriverList(req);
    } catch (error) {
        console.log(error);
        return {
            statusCode: statusCode.BAD_REQUEST,
            success: false,
            message: error.message
        };
    }
};
exports.taxiTypeDropDown = async (req) => {
    try {
        return await services.taxiTypeDropDown(req);
    } catch (error) {
        console.log(error);
        return {
            statusCode: statusCode.BAD_REQUEST,
            success: false,
            message: error.message
        };
    }
};

exports.updateDocumentStatusController = async (req) => {
    try {
        return await services.updateDocumentStatus(req);
    } catch (error) {
        return {
            statusCode: statusCode.INTERNAL_SERVER_ERROR,
            status: statusCode.INTERNAL_SERVER_ERROR,
            success: false,
            message: error.message
        };
    }
};
