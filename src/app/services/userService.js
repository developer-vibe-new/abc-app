const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const { statusCode, resMessage } = require('../../config/default.json');
const User = require('../../models/users');

exports.sendOtp = async (req) => {
    try {
        const { mobile } = req.body;
        const register = await User.findOne({ mobile });
        if (!register) {
            await User.create({ mobile, otp: 1234 });
            return {
                status: statusCode.Ok,
                success: true,
                message: resMessage.Otp_Send_Success
            };
        }
        return {
            status: statusCode.BAD_REQUEST,
            success: false,
            message: resMessage.Unique_Mobile_Verify
        };
    } catch (error) {
        return {
            success: false,
            message: resMessage.Internal_Server_Error,
            error: error.message || "Internal Server Error"
        };
    }
};

exports.verifyOtp = async (req) => {
    try {
        const { mobile, otp } = req.body;
        const user = await User.findOne({ mobile, is_active: true });
        if (!user) {
            return {
                status: statusCode.BAD_REQUEST,
                success: false,
                message: resMessage.User_Not_Found
            };
        }
        if (user.otp !== otp) {
            return {
                status: statusCode.BAD_REQUEST,
                success: false,
                message: resMessage.Otp_Verify_Failed
            };
        }
        const token = jwt.sign({
            id: user._id
        },
            process.env.SECRET_KEY,
            {
                expiresIn: '1h'
            }
        );
        return {
            status: statusCode.OK,
            success: true,
            message: resMessage.Otp_Verify_Successfully,
            token
        };
    } catch (error) {
        return {
            success: false,
            message: resMessage.Internal_Server_Error,
            error: error.message || "Internal Server Error"
        };
    }
};

exports.updateUser = async (req) => {
    try {
        const { first_name, last_name, email, mobile } = req.body;
        const data = await User.findOne({ _id: req.auth.id });
        const imagePath = req.file ? req.file.filename : "";
        if (!data) {
            return {
                status: statusCode.BAD_REQUEST,
                success: false,
                message: resMessage.User_Not_Found
            };
        }
        await User.findByIdAndUpdate(req.auth.id, {
            first_name,
            last_name,
            email,
            mobile,
            profile_image: imagePath
        });
        return {
            status: statusCode.OK,
            success: true,
            message: resMessage.Data_Updated_Successfully
        };
    } catch (error) {
        return {
            success: false,
            message: resMessage.Internal_Server_Error,
            error: error.message || "Internal Server Error"
        };
    }
};

exports.userDetails = async (req) => {
    try {
        const user = await User.aggregate([
            {
              $match: {
                _id: new mongoose.Types.ObjectId(req.auth.id)
              }
            },
            {
              $project: {
                first_name: 1,
                last_name: 1,
                profile_image: 1, 
                email: 1
              }
            }
        ]);
        if(!user) {
            return {
                status: statusCode.BAD_REQUEST,
                success: false,
                message: resMessage.User_Not_Found
            };
        }
        return {
            status: statusCode.OK,
            success: true,
            message: resMessage.Data_Retrieved_Successfully,
            data: user[0]
        };
    } catch (error) {
        return {
            success: false,
            message: resMessage.Internal_Server_Error,
            error: error.message || "Internal Server Error"
        };
    }
}

exports.deleteUser = async (req) => {
    try {
        const user = await User.findById(req.auth.id);
        if (!user) {
            return {
                status: statusCode.BAD_REQUEST,
                success: false,
                message: resMessage.User_Not_Found
            }
        }
        await User.findByIdAndUpdate(req.auth.id, { is_active: false });
        return {
            status: statusCode.OK,
            success: true,
            message: resMessage.User_Deleted_Successfully
        }
    } catch (error) {
        return {
            success: false,
            message: resMessage.Internal_Server_Error,
            error: error.message || "Internal Server Error"
        };
    }
}