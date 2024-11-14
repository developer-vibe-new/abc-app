const service = require('../services/providerService');
const { statusCode } = require('../../config/default.json');

exports.registerOperatorController = async (req, res) => {
    try {
        return await service.registerOperator(req, res);
    } catch (error) {
        return {
            statusCode: statusCode.BAD_REQUEST,
            success: false,
            message: error.message
        };
    }
}