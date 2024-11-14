const jwt = require('jsonwebtoken');
const { statusCode, resMessage } = require('../../config/default.json');
const Opertor = require('../../models/operatorModel');
const Provider = require('../../models/providerModel');

exports.registerOperator = async (req) => {
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
            statusCode: statusCode.OK,
            success: true,
            message: resMessage.Data_Created_Successfully,
            data: operatorData
        }
    } catch (error) {
        return {
            success: false,
            message: resMessage.Internal_Server_Error,
            error: error.message || "Internal Server Error",
        }
    }
}

        exports.loginOperator = async (req) => {
            try {
                const { phone } = req.body;
                if(!phone) {
                    return { 
                        statusCode: statusCode.BAD_REQUEST,
                    success: false,
                    message: resMessage.Required_Data
                };    
            }
            const operatorData = await Opertor.findOne({phone, status: true});
            if(operatorData) {
                const token = jwt.sign({
                    id: operatorData._id
                },
                process.env.SECRET_KEY,
                {
                    expiresIn: '1h'
                }
            );
                return {
                    statusCode: statusCode.OK,
                    success: true,
                    message: resMessage.Operator_Login_Success,
                    token
                }
            }
            return {
                statusCode: statusCode.NOT_FOUND,
                success: false,
                message: resMessage.Operator_Not_Exist
            }
        } catch (error) {
            return {
                success: false,
                message: resMessage.Internal_Server_Error,
                error: error.message || "Internal Server Error",
            }
        }
    }

    exports.addDriver = async (req) => {
        try {
            const { name, mobile, email, type } = req.body;
            if(!name || !mobile || !email || !type) {
                return { 
                    statusCode: statusCode.BAD_REQUEST,
                    success: false,
                    message: resMessage.Required_Data
                };
            }
            await Provider.create({ name, mobile, email, type });
            return {
                statusCode: statusCode.OK,
                success: true,
                message: resMessage.Data_Created_Successfully
            }
        } catch (error) {
            return {
                success: false,
                message: resMessage.Internal_Server_Error,
                error: error.message || "Internal Server Error",
            }
        }
    }