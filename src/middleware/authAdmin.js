const jwt = require("jsonwebtoken");
const SECRET_Key = process.env.SECRET_Key;
// const { statusCode, resMessage } = require('../config/default.json');

exports.auth = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        // console.log(authHeader,"oooooooooooooo")
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({
                success: false,
                message: "No token provided"
            });
        }

        const token = authHeader.split(" ")[1];
        const decoded = jwt.verify(token, SECRET_Key);

        if (!decoded) {
            return res.status(401).json({
                success: false,
                message: "Invalid token"
            });
        }
        console.log(authHeader, "authHeader");
        req._id = decoded._id;
        console.log(req._id, "req._id");
        next();

    } catch (error) {
        console.error(error);
        return res.status(401).json({
            success: false,
            message: "Authentication failed"
        });
    }
};

