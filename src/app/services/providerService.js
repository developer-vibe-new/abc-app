const { statusCode, resMessage } = require('../../config/default.json');
const Provider = require('../../models/providerModel');

exports.addDriver = async (req) => {
    try {
        const driver = req.body;
        if (!driver.name || !driver.mobile || !driver.email || !driver.type) {
            return {
                statusCode: statusCode.BAD_REQUEST,
                success: false,
                message: resMessage.Required_Data
            };
        }
        await Provider.create(driver);
        return {
            statusCode: statusCode.OK,
            success: true,
            message: resMessage.Data_Created_Successfully
        };
    } catch (error) {
        return {
            success: false,
            message: resMessage.Internal_Server_Error,
            error: error.message || "Internal Server Error",
        };
    }
};

exports.updateDriverStatus = async (req) => {
    try {
        const { id } = req.params;
        const provider = await Provider.findOne({ _id: id, type: "operator" });
        if (!provider) {
            return {
                status: statusCode.BAD_REQUEST,
                success: false,
                message: resMessage.Provider_Not_Found
            };
        }
        const status = provider.status === "unblocked" ? "blocked" : "unblocked";
        provider.status = status;
        await provider.save();
        return {
            status: statusCode.OK,
            success: true,
            message: resMessage.Status_Updated_Successfully,
            data: provider
        };
    } catch (error) {
        return {
            success: false,
            message: resMessage.Internal_Server_Error,
            error: error.message || "Internal Server Error",
        };
    }
};

exports.driverBlockList = async () => {
    try {
        const blocked = await Provider.find({ type: "operator", status: "blocked" });
        if (!blocked) {
            return {
                status: statusCode.BAD_REQUEST,
                success: false,
                message: resMessage.Data_Not_Found
            };
        }
        return {
            status: statusCode.OK,
            success: true,
            message: resMessage.Data_Fetch_Successfully,
            data: blocked
        };
    } catch (error) {
        return {
            success: false,
            message: resMessage.Internal_Server_Error,
            error: error.message || "Internal Server Error",
        };
    }
};

exports.driverList = async () => {
    try {
        const data = await Provider.find({ type: 'operator' });
        if (!data) {
            return {
                status: statusCode.BAD_REQUEST,
                success: false,
                message: resMessage.Data_Not_Found
            };
        }
        return {
            status: statusCode.OK,
            success: true,
            message: resMessage.Data_Fetch_Successfully,
            data
        };
    }
    catch (error) {
        return {
            status: statusCode.INTERNAL_SERVER_ERROR,
            success: false,
            message: resMessage.Internal_Server_Error,
            error: error.message || "Internal Server Error",
        };
    }
};

exports.driverOninerStatus = async (req) => {
    try {
        const { id } = req.params;
        const driverData = await Provider.findOne({ _id: id, type: "operator" });
        if (!driverData) {
            return {
                status: statusCode.BAD_REQUEST,
                success: false,
                message: resMessage.Data_Not_Found
            };
        }
        const onlineStatus = driverData.is_online === true ? false : true;
        driverData.is_online = onlineStatus;
        await driverData.save();
        return {
            status: statusCode.OK,
            success: true,
            message: resMessage.Status_Updated_Successfully,
            data: driverData
        };
    } catch (error) {
        return {
            status: statusCode.INTERNAL_SERVER_ERROR,
            success: false,
            message: resMessage.Internal_Server_Error,
            error: error.message || 'Internal Server Error'
        };
    }
};

exports.updateDriver = async (req) => {
    try {
        const { id } = req.params;
        const { name, email, mobile } = req.body;
        const imagePath = req.file ? req.file.filename : "";
        const driverData = await Provider.findOne({ _id: id, type: "operator" });
        if (!driverData) {
            return {
                status: statusCode.BAD_REQUEST,
                success: false,
                message: resMessage.Data_Not_Found
            };
        }
        // eslint-disable-next-line no-unused-vars
        const updatedDriver = await Provider.updateOne(
            { _id: id },
            {
                $set: {
                    name,
                    email,
                    mobile,
                    image: imagePath
                }
            }
        );

        return {
            status: statusCode.OK,
            success: true,
            message: resMessage.Data_Updated_Successfully
        };
    } catch (error) {
        return {
            status: statusCode.INTERNAL_SERVER_ERROR,
            success: false,
            message: resMessage.Internal_Server_Error,
            error: error.message || 'Internal Server Error'
        };
    }
};
