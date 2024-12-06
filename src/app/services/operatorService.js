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
        const data = await Operator.findOne({ phone });
        if(data !== null) {
            return {
                status: statusCode.BAD_REQUEST,
                success: false,
                message: resMessage.Phone_Already_Exist
            }
        }
        const operatorData = await Operator.create({ fullName, phone, city });
        return {
            statusCode: statusCode.OK,
            success: true,
            message: resMessage.Operator_Created_successfully,
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
                status: statusCode.BAD_REQUEST,
                success: false,
                message: resMessage.Required_Data,
            };
        }

        const operatorNo = await Operator.findOne({ phone });
        if(!operatorNo) {
            return {
                status: statusCode.NOT_FOUND,
                success: false,
                message: resMessage.Operator_Not_Exist,
            }
        }

        const operatorData = await Operator.findOne({ phone, is_active: true, status: "unblock" });

        if (operatorData) {
            operatorData.otp = 123456;
            await operatorData.save(); 

            return {
                status: statusCode.OK,
                success: true,
                message: resMessage.Otp_Send_Success,
            };
        }

        return {
            status: statusCode.UNAUTHORIZED,
            success: false,
            message: resMessage.Id_not_Active,
        };
        
    } catch (error) {
        return {
            status: statusCode.INTERNAL_SERVER_ERROR,
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
                status: statusCode.BAD_REQUEST,
                success: false,
                message: resMessage.Required_Data
            };
        }
        const operatorData = await Operator.findOne({ phone, is_active: true, status: "unblock" });
        if (!operatorData) {
            return {
                status: statusCode.NOT_FOUND,
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
            operatorData.token = token;
            await operatorData.save();
            return {
                status: statusCode.OK,
                success: true,
                message: resMessage.Otp_Verify_Successfully,
                kycStatus: operatorData.kycStatus,
                token
            };
        }
        return {
            status: statusCode.NOT_FOUND,
            success: false,
            message: resMessage.Otp_Verify_Failed
        };
    } catch (error) {
        return {
            status: statusCode.INTERNAL_SERVER_ERROR,
            success: false,
            message: resMessage.Internal_Server_Error,
            error: error.message || "Internal Server Error",
        };
    }
};

exports.uploadDocuments = async (req) => {
    try {
        const {
            pancardName, pancardNumber,
            aadharcardName, aadharcardNumber,
            bankAccountNumber, ifscCode,
            bankName, accountHolderName
        } = req.body;

        const documentData = {
            pancard: {
                name: pancardName || '',
                number: pancardNumber || null,
                status: 1,
            },
            aadharcard: {
                name: aadharcardName || '',
                number: aadharcardNumber || null,
                status: 1,
            },
            bank: {
                account_number: bankAccountNumber || null,
                ifsc_code: ifscCode || '',
                bank_name: bankName || '',
                account_holder_name: accountHolderName || '',
                status: 1,
            }
        };
        const updatedDocument = await Operator.findByIdAndUpdate(
            req.auth.id,
            { $set: { documents: documentData, kycStatus: 1 } },
            { new: true }
        );

        return {
            status: statusCode.OK,
            success: true,
            message: resMessage.Documents_Uploaded_Successfully,
            data: updatedDocument,
        };
    } catch (error) {
        return {
            status: statusCode.INTERNAL_SERVER_ERROR,
            success: false,
            message: resMessage.Internal_Server_Error,
            error: error.message || "Internal Server Error",
        };
    }
}

exports.getDocuments = async (req) => {
    try {
        const data = await Operator.findOne({ _id: req.auth.id });
        if (!data) {
            return {
                status: statusCode.BAD_REQUEST,
                success: false,
                message: resMessage.Data_Not_Found,
            }
        }
        return {
            status: statusCode.OK,
            success: true,
            message: resMessage.Documents_Retrieved_Successfully,
            data: data.documents,
        }
    } catch (error) {
        return {
            status: statusCode.INTERNAL_SERVER_ERROR,
            success: false,
            message: resMessage.Internal_Server_Error,
            error: error.message || "Internal Server Error",
        };
    }
}