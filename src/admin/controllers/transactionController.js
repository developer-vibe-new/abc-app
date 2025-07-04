const services = require('../services/transactionService');
const { statusCode } = require('../../config/default.json');

// Transaction Controller
exports.viewTransactionController = async (req) => {
  try {
    return await services.transactionData(req);
  } catch (error) {
    console.error("Error in viewTransactionController:", error);
    return {
      status: statusCode.BAD_REQUEST, 
      success: false,
      message: error.message
    };
  }
};
