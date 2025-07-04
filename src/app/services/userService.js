const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const { statusCode, resMessage } = require('../../config/default.json');
const razorpay = require('../../config/razorpay');
const User = require('../../models/users');
exports.sendOtp = async (req) => {
    try {
        const { mobile } = req.body;
        const register = await User.findOne({ mobile });
        if (!register) {
            await User.create({ mobile, otp: 1234 });
            return {
                statusCode: statusCode.OK,
                status: statusCode.OK,
                success: true,
                message: resMessage.Otp_Send_Success
            };
        }
        register.otp = 1234;
        await register.save();
        return {
            statusCode: statusCode.OK,
            status: statusCode.OK,
            success: true,
            message: resMessage.Otp_Send_Success
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
        const { mobile, otp, firebaseToken } = req.body;
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
                expiresIn: '30d'
            }
        );
        user.otp = null;
        user.login_token = token;
        user.fcm_token = firebaseToken;
        await user.save();
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
        if (!user) {
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
};

exports.deleteUser = async (req) => {
    try {
        const user = await User.findById(req.auth.id);
        if (!user) {
            return {
                status: statusCode.BAD_REQUEST,
                success: false,
                message: resMessage.User_Not_Found
            };
        }
        await User.findByIdAndUpdate(req.auth.id, { is_active: false });
        return {
            status: statusCode.OK,
            success: true,
            message: resMessage.User_Deleted_Successfully
        };
    } catch (error) {
        return {
            success: false,
            message: resMessage.Internal_Server_Error,
            error: error.message || "Internal Server Error"
        };
    }
};
exports.generateOrderId = async (req) => {
    const { amount } = req.body;
    if (amount <= 0 || amount == undefined) {
        return {
            success: false,
            message: "Amount should be greater than 0",
        };
    }
    const options = {
        amount: amount * 100, // amount in the smallest currency unit (e.g. 500 * 100 = 50000 paise = ₹500)
        currency: 'INR',
        receipt: `ride_order_${req.auth._id}_${Date.now()}`,
    };

    try {
        const order = await razorpay.orders.create(options);
        return {
            status: statusCode.OK,
            success: true,
            message: resMessage.User_Deleted_Successfully,
            data: order
        };
    } catch (error) {
        console.error('Razorpay Order Error:', error);
        return {
            success: false,
            message: resMessage.Internal_Server_Error,
            error: error.message || "Internal Server Error"
        };
    }
};