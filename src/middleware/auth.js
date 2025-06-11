const jwt = require('jsonwebtoken');
const { statusCode, resMessage } = require('../config/default.json');

exports.verifyToken = async (req, res, next) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        console.log('token', token);
        if (!token) {
            return res.status(401).json({
                statusCode: statusCode.UNAUTHORIZED,
                success: false,
                message: resMessage.Token_Required
            });
        }
        jwt.verify(token, process.env.SECRET_KEY, (err, decoded) => {
            if (err) {
                return res.status(401).json({
                    statusCode: statusCode.UNAUTHORIZED,
                    success: false,
                    message: resMessage.Invalid_Token
                });
            }
            console.log("Decoded data: ", decoded);
            req.auth = decoded;
            next();
        });
    } catch (error) {
        return res.json({
            statusCode: statusCode.INTERNAL_SERVER_ERROR,
            success: false,
            message: resMessage.Internal_Server_Error,
            error: error.message || 'An error occurred while verifying the token'
        });
    }
};