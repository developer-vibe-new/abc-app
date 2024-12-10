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
            };
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
            };
        }

        const operatorData = await Operator.findOne({ phone, is_active: true, status: "unblock"});           

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

        // Fetch existing data
        const currentDocument = await Operator.findById(req.auth.id).select('documents');

        if (!currentDocument) {
            return {
                status: statusCode.NOT_FOUND,
                success: false,
                message: 'User not found',
            };
        }

        const existingDocs = currentDocument.documents || {};

        // Dynamic Status Handling
        const getStatus = (name, number, existingStatus) => {
            if (name && number) {
                return 0; // Documents given
            } 
            return existingStatus ?? -1; // Retain existing status or default to -1
        };

        // Prepare document data, preserving existing values
        const documentData = {
            pancard: {
                name: pancardName || existingDocs.pancard?.name || '',
                number: pancardNumber || existingDocs.pancard?.number || null,
                status: getStatus(
                    pancardName || existingDocs.pancard?.name,
                    pancardNumber || existingDocs.pancard?.number,
                    existingDocs.pancard?.status
                ),
            },
            aadharcard: {
                name: aadharcardName || existingDocs.aadharcard?.name || '',
                number: aadharcardNumber || existingDocs.aadharcard?.number || null,
                status: getStatus(
                    aadharcardName || existingDocs.aadharcard?.name,
                    aadharcardNumber || existingDocs.aadharcard?.number,
                    existingDocs.aadharcard?.status
                ),
            },
            bank: {
                account_number: bankAccountNumber || existingDocs.bank?.account_number || null,
                ifsc_code: ifscCode || existingDocs.bank?.ifsc_code || '',
                bank_name: bankName || existingDocs.bank?.bank_name || '',
                account_holder_name: accountHolderName || existingDocs.bank?.account_holder_name || '',
                status: getStatus(
                    bankAccountNumber || existingDocs.bank?.account_number,
                    ifscCode || existingDocs.bank?.ifsc_code,
                    existingDocs.bank?.status
                ),
            },
        };

        // Update the document data and set the KYC status
        const updatedDocument = await Operator.findByIdAndUpdate(
            req.auth.id,
            {
                $set: {
                    documents: documentData,
                    kycStatus: 1, // Default to 'In Review' upon document upload
                }
            },
            { new: true }
        );

        // Handle successful response
        return {
            status: statusCode.OK,
            success: true,
            message: resMessage.Documents_Uploaded_Successfully,
            data: updatedDocument,
        };

    } catch (error) {
        // Handle error response
        return {
            status: statusCode.INTERNAL_SERVER_ERROR,
            success: false,
            message: resMessage.Internal_Server_Error,
            error: error.message || "Internal Server Error",
        };
    }
};

exports.getDocuments = async (req) => {
    try {
        const data = await Operator.findOne({ _id: req.auth.id });
        if (!data) {
            return {
                status: statusCode.BAD_REQUEST,
                success: false,
                message: resMessage.Data_Not_Found,
            };
        }
        return {
            status: statusCode.OK,
            success: true,
            message: resMessage.Documents_Retrieved_Successfully,
            data: data.documents,
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