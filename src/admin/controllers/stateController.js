const services = require('../services/stateService');
const { statusCode } = require('../../config/default.json');

exports.createState = async (req, res) => {
    try {
        return await services.stateCreate(req);

    } catch (error) {
        console.error("Error in createState:", error);
        return res.status(500).json({
            success: false,
            message: "An internal server error occurred.",
        });
    }
};

exports.updateState = async (req, res) => {
    try {
        return await services.stateUpdate(req);
        // if (updatedData.success == true) {
        //     return res.status(200)
        //         .json(Object.assign({ status: updatedData.success }, updatedData));
        // } else {
        //     return res.status(400)
        //         .json(Object.assign({ status: updatedData.success }));
        // }
    } catch (error) {
        console.error("Error in updateState:", error);
        return res.status(500).json({
            success: false,
            message: "An internal server error occurred.",
        });
    }
};

exports.deleteState = async (req, res) => {
    try {
        return await services.stateDelete(req);

    } catch (error) {
        console.error("Error in deleteState:", error);
        return res.status(500).json({
            success: false,
            message: "An internal server error occurred.",
        });
    }
};

exports.viewState = async (req, res) => {
    try {
        return await services.stateView(req);

    } catch (error) {
        console.error("Error in viewState:", error);
        return res.status(500).json({
            success: false,
            message: "An internal server error occurred.",
        });
    }
};

exports.createCity = async (req, res) => {
    try {
        return await services.cityCreate(req);

    } catch (error) {
        console.error("Error in createCity:", error);
        return res.status(500).json({
            success: false,
            message: "An internal server error occurred.",
        });
    }
};

exports.updateCity = async (req, res) => {
    try {
        return await services.cityUpdate(req);
    } catch (error) {
        console.error("Error in updateCity:", error);
        return res.status(500).json({
            success: false,
            message: "An internal server error occurred.",
        });
    }
};

exports.deleteCity = async (req, res) => {
    try {
        return await services.cityDelete(req);

    } catch (error) {
        console.error("Error in deleteCity:", error);
        return res.status(500).json({
            success: false,
            message: "An internal server error occurred.",
        });
    }
};

exports.viewCity = async (req, res) => {
    try {
        console.log('rest');
        return await services.cityView(req);

    } catch (error) {
        console.error("Error in viewCity:", error);
        return res.status(500).json({
            success: false,
            message: "An internal server error occurred.",
        });
    }
};

exports.viewCityByIdController = async (req, res) => {
    try {
        return await services.viewCityById(req);
    } catch (error) {
        console.error("Error in viewCity:", error);
        return res.status(500).json({
            success: false,
            message: "An internal server error occurred.",
        });
    }
};

exports.updateCityStatusController = async (req) => {
    try {
        return await services.updateCityStatus(req);
    } catch (error) {
        return {
            statusCode: statusCode.INTERNAL_SERVER_ERROR,
            status: statusCode.INTERNAL_SERVER_ERROR,
            success: false,
            message: error.message
        }
    }
}