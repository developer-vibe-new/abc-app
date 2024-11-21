const jwt = require('jsonwebtoken');
const { statusCode, resMessage } = require('../../config/default.json');
const Operator = require('../../models/operatorModel');

exports.registerOperator = async (req) => {
    try {
        const { fullName, phone, city } = req.body;
        if (!fullName || !phone || !city) {
            return {
                statusCode: statusCode.BAD_REQUEST,
                success: false,
                message: resMessage.Required_Data
            };
        }
        const operatorData = await Operator.create({ fullName, phone, city });
        return {
            statusCode: statusCode.OK,
            success: true,
            message: resMessage.Data_Created_Successfully,
            data: operatorData
        };
    } catch (error) {
        return {
            success: false,
            message: resMessage.Internal_Server_Error,
            error: error.message || "Internal Server Error",
        };
    }
};

exports.loginOperator = async (req) => {
    try {
        const { phone } = req.body;
        if (!phone) {
            return {
                statusCode: statusCode.BAD_REQUEST,
                success: false,
                message: resMessage.Required_Data
            };
        }
        const operatorData = await Operator.findOne({ phone, status: true });
        if (operatorData) {
            operatorData.otp = 1234;
            await operatorData.save();
            return {
                statusCode: statusCode.OK,
                success: true,
                message: resMessage.Otp_Send_Success
            };
        }
        return {
            statusCode: statusCode.NOT_FOUND,
            success: false,
            message: resMessage.Operator_Not_Exist
        };
    } catch (error) {
        return {
            success: false,
            message: resMessage.Internal_Server_Error,
            error: error.message || "Internal Server Error",
        };
    }
};

exports.verifyOtp = async (req) => {
    try {
        const { phone, otp } = req.body;
        if (!phone) {
            return {
                statusCode: statusCode.BAD_REQUEST,
                success: false,
                message: resMessage.Required_Data
            };
        }
        const operatorData = await Operator.findOne({ phone });
        if (!operatorData) {
            return {
                statusCode: statusCode.NOT_FOUND,
                success: false,
                message: resMessage.Operator_Not_Exist
            };
        }
        const token = jwt.sign({
            id: operatorData._id,
            role: operatorData.type
        },
            process.env.SECRET_KEY,
            {
                expiresIn: '1h'
            }
        );
        if (operatorData.otp === otp) {
            operatorData.otp = null;
            await operatorData.save();
            return {
                statusCode: statusCode.OK,
                success: true,
                message: resMessage.Otp_Verify_Successfully,
                token
            };
        }
        return {
            statusCode: statusCode.NOT_FOUND,
            success: false,
            message: resMessage.Otp_Verify_Failed
        };
    } catch (error) {
        return {
            success: false,
            message: resMessage.Internal_Server_Error,
            error: error.message || "Internal Server Error",
        };
    }
};