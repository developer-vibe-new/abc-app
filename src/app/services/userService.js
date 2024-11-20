const jwt = require('jsonwebtoken');
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
        const user = await User.findOne({ mobile });
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
        const { first_name, last_name, email } = req.body;
        const data = await User.findById(req.auth.id);
        const imagePath = req.file ? req.file.filename : "";
        if(!data) {
            return {
                status: statusCode.BAD_REQUEST,
                success: false,
                message: resMessage.User_Not_Found
            }
        }
        await User.findByIdAndUpdate(req.auth.id, {
            first_name,
            last_name,
            email,
            profile_image: imagePath
        })
        return {
            status: statusCode.OK,
            success: true,
            message: resMessage.Data_Updated_Successfully
        }
    } catch (error) {
        return {
            success: false,
            message: resMessage.Internal_Server_Error,
            error: error.message || "Internal Server Error"
        };
    }
}
