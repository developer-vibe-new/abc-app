const { statusCode, resMessage } = require('../../config/default.json');
const Opertor = require('../../models/operatorModel');

exports.registerOperator = async (req, res) => {
    try {
        const { fullName, phone, city } = req.body;
        if(!fullName || !phone || !city) {
            return { 
                statusCode: statusCode.BAD_REQUEST,
                success: false,
                message: resMessage.Required_Data
            };
        }
        const operatorData = await Opertor.create({fullName, phone, city,});
        return {
            success: true,
            message: 'Operator registered successfully.',
            data: operatorData
        }
    } catch (error) {
        console.log("Error in Service: ", error)
        return {
            success: false,
            message: 'Failed to register operator.',
            error: error.message || "Internal Server Error",
        }
    }
}