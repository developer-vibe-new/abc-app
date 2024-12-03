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

exports.viewNotification = async (req) => {
    try {
        let { search, page = 1, limit = 10 } = req.query;

        page = parseInt(page);
        limit = parseInt(limit);

        let pipeline = [];

        pipeline.push(
            {
                $match: {
                    is_active: true
                }
            }
        );

        if (search) {
            pipeline.push({
                $match: {
                    message: { $regex: new RegExp(search, 'i') },
                },
            });
        }

        pipeline.push(
            { $skip: (page - 1) * limit },
            { $limit: limit }
        );

        const data = await Notification.aggregate(pipeline);

        if (!data || data.length === 0) {
            return {
                status: statusCode.NOT_FOUND,
                success: false,
                message: resMessage.Data_Not_Found,
            };
        }

        const totalCount = await Notification.countDocuments(search ? { message: { $regex: new RegExp(search, 'i') } } : {});

        return {
            status: statusCode.OK,
            success: true,
            message: resMessage.Data_Fetch_Successfully,
            data,
            pagination: {
                page,
                limit,
                totalCount,
                totalPages: Math.ceil(totalCount / limit),
            },
        };
    } catch (error) {
        return {
            statusCode: statusCode.BAD_REQUEST,
            success: false,
            message: resMessage.Internal_Server_Error,
            error: error.message || "Internal Server Error",
        };
    }
};

exports.deleteNotification = async (req) => {
    try {
        const { id } = req.params;
        const data = await Notification.findById(id);
        if(!data) {
            return {
                status: statusCode.NOT_FOUND,
                success: false,
                message: resMessage.Data_Not_Found,
            }
        }
        await Notification.findByIdAndUpdate(id, { is_active: false });
        return {
            status: statusCode.OK,
            success: true,
            message: resMessage.Data_Deleted_Successfully,
        }
    } catch (error) {
        return {
            status: statusCode.INTERNAL_SERVER_ERROR,
            success: false,
            message: resMessage.Internal_Server_Error,
            error: error.message || "Internal Server Error",
        };
    }
}