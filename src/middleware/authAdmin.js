const jwt = require("jsonwebtoken");
const SECRET_Key = process.env.SECRET_Key;
const { statusCode, resMessage } = require('../config/default.json');

exports.auth = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        // console.log(authHeader,"oooooooooooooo")
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.json({
                statusCode: statusCode.UNAUTHORIZED,
                success: false,
                message: resMessage.Token_Required
            });
        }

        const token = authHeader.split(" ")[1];
        const decoded = jwt.verify(token, SECRET_Key);

        if (!decoded) {
            return res.json({
                statusCode: statusCode.UNAUTHORIZED,
                success: false,
                message: resMessage.Invalid_Token,

            });

        }
        console.log(jwt.verify(token, SECRET_Key), "decoded");
        req.auth = decoded;
        
        // console.log(req._id, "req._id");
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

