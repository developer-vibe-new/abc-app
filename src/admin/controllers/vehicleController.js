const service = require('../services/vehicleService');
const { statusCode } = require('../../config/default.json');

exports.viewVehicle = async (req) => {
    try {
        return await service.vehicleList(req);
    } catch (error) {
        return {
            statusCode: statusCode.BAD_REQUEST,
            success: false,
            message: error.message
        };
    }
};

exports.vehicleTypeList = async (req, res) => {
    try {
        return await service.showVehicleType(req);
        // return res.status(200).json(Object.assign({ success: data.success }, data));

    } catch (error) {
        console.error("Error in VehicleTypeList:", error);
        return res.status(500).json({
            success: false,
            message: "An internal server error occurred.",
        });
    }
};
exports.createVehicle = async (req, res) => {
    try {
        return await service.addVehicle(req);
    } catch (error) {
        console.error("Error in createVehicle:", error);
        return res.status(500).json({
            success: false,
            message: "An internal server error occurred.",
        });
    }
};

