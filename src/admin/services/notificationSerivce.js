const { statusCode, resMessage } = require('../../config/default.json');
const Notification = require('../../models/notificationModel');

exports.addNotification = async (req) => {
    try {
        const { type, message } = req.body;
        const data = await Notification.create({ type, message });
        return {
            statusCode: statusCode.OK,
            success: true,
            message: "Notification added successfully",
            data
        }
    } catch (error) {
        return {
            statusCode: statusCode.BAD_REQUEST,
            success: false,
            message: resMessage.Internal_Server_Error,
            error: error.message || "Internal Server Error",
        };
    }
}