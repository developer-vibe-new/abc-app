const jwt = require("jsonwebtoken");
const Admin = require('../models/adminModel');
const SECRET_KEY = process.env.SECRET_KEY;
const { statusCode, resMessage } = require('../config/default.json');

exports.auth = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.json({
                statusCode: statusCode.UNAUTHORIZED,
                success: false,
                message: resMessage.Token_Required
            });
        }

        const token = authHeader.split(" ")[1];
        const decoded = jwt.verify(token, SECRET_KEY);
        const adminData = await Admin.findById(decoded._id);
        if (!decoded) {
            return res.json({
                statusCode: statusCode.UNAUTHORIZED,
                success: false,
                message: resMessage.Invalid_Token,

            });
        }
        console.log('adminData', adminData);
        req.auth = adminData;
        next();

    } catch (error) {


        if (error instanceof jwt.TokenExpiredError) {
            return res.json({
                statusCode: statusCode.UNAUTHORIZED,
                success: false,
                message: "Token Expired",
                error: error.message || "Token has expired"
            });
        }

        return res.json({
            statusCode: statusCode.INTERNAL_SERVER_ERROR,
            success: false,
            message: resMessage.Internal_Server_Error,
            error: error.message || 'An error occurred while verifying the token'
        });
    }
};

exports.authorize = (category, action) => (req, res, next) => {
    if (req.auth.role_type === 'admin') return next();
    const hasPermission = req.auth.permissions?.[category]?.includes(action);
    if (!hasPermission) {
        return res.json({
            statusCode: statusCode.ACCESS_DENIED,
            success: false,
            message: resMessage.Access_Denied
        });
    }
    next();
};