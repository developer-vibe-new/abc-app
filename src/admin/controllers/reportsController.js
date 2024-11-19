const service = require('../services/reportService');
const { statusCode } = require('../../config/default.json');


exports.viewRideReport = async (req) => {
    try {
        return await service.allData(req);
        // return res.status(200).json(Object.assign({ success: data.success }, data));
    } catch (error) {
        console.error("Error in viewRideReport:", error);
        return {
            statusCode: statusCode.BAD_REQUEST,
            success: false,
            message: error.message
        };
    }
};