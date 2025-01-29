const { statusCode, resMessage } = require('../../config/default.json');
const Setting = require('../../models/settingModel');

exports.addSetting = async (req) => {
    try {
        const settingData = req.body;
        const newSetting = new Setting(settingData);
        await newSetting.save();
        return {
            status: statusCode.OK,
            success: true,
            message: resMessage.Data_Created_Successfully
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

exports.viewSetting = async (req) => {
    try {
        const data = await Setting.findOne({ _id: "6799c0ee81224f899e726828" });
        if(!data) {
            return {
                status: statusCode.DATA_NOT_FOUND,
                success: false,
                message: resMessage.Data_Not_Found,
            }
        }
        return {
            status: statusCode.OK,
            success: true,
            message: resMessage.Data_Retrieved_Successfully,
            data,
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

exports.updateSetting = async (req) => {
    try {
        const settingData = req.body;
        const data = await Setting.findOne({ _id: "6799c0ee81224f899e726828" });
        if(!data) {
            return {
                status: statusCode.DATA_NOT_FOUND,
                success: false,
                message: resMessage.Data_Not_Found,
            }
        }
        await Setting.findByIdAndUpdate("6799c0ee81224f899e726828", {
            settingData
        });
        return {
            status: statusCode.OK,
            success: true,
            message: resMessage.Data_Updated_Successfully,
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