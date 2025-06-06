const service = require('../services/providerTaxiService');
const { statusCode } = require('../../config/default.json');

exports.addProviderTaxiController = async (req) => {
    try {
        return await service.addProviderTaxi(req);
    } catch (error) {
        return {
            statusCode: statusCode.INTERNAL_SERVER_ERROR,
            success: false,
            message: error.message
        };
    }
};

exports.deleteProviderTaxiController = async (req) => {
    try {
        return await service.deleteProviderTaxi(req);
    } catch (error) {
        return {
            statusCode: statusCode.INTERNAL_SERVER_ERROR,
            success: false,
            message: error.message
        };
    }
};

exports.providerTaxiListController = async (req) => {
    try {
        return await service.providerTaxiList(req);
    } catch (error) {
        return {
            status: statusCode.INTERNAL_SERVER_ERROR,
            success: false,
            message: error.message
        };
    }
};

exports.providerTaxiListAllController = async (req) => {
    try {
        return await service.providerTaxiListAll(req);
    } catch (error) {
        return {
            status: statusCode.INTERNAL_SERVER_ERROR,
            success: false,
            message: error.message
        };
    }
};

exports.assignProviderController = async (req) => {
    try {
        return await service.assignProvider(req);
    } catch (error) {
        return {
            status: statusCode.INTERNAL_SERVER_ERROR,
            success: false,
            message: error.message
        };
    }
};

exports.deassignProviderController = async (req) => {
    try {
        return await service.deassignProvider(req);
    } catch (error) {
        return {
            status: statusCode.INTERNAL_SERVER_ERROR,
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
};