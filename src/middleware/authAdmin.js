const jwt = require("jsonwebtoken");
const SECRET_Key = process.env.SECRET_Key;

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

        req._id = decoded._id; // Store user ID in request for access in subsequent middleware/routes
        next(); // Proceed to the next middleware or route handler

    } catch (error) {
        console.error(error);
        return res.status(401).json({
            success: false,
            message: "Authentication failed"
        });
    }
};

