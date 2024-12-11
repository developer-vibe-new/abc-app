const { statusCode, resMessage } = require('../../config/default.json');
const Car = require('../../models/cars');
const mongoose = require('mongoose');

exports.addCar = async (req) => {
    try {
        const car = req.body;
        if (!car.taxi_type || !car.title || !car.make || !car.model) {
            return {
                statusCode: statusCode.BAD_REQUEST,
                success: false,
                message: resMessage.Required_Data
            };
        }
        if (req.auth && req.auth.role === "operator") {
            car.operator_id = req.auth.id;
        }
        await Car.create(car);
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

exports.carList = async (req) => {
    try {
        const { id } = req.query;
        const data = await Car.aggregate([
            {
                $match: {
                    taxi_type: new mongoose.Types.ObjectId(id)
                }
            }
        ]);
        if (!data) {
            return {
                statusCode: statusCode.BAD_REQUEST,
                success: false,
                message: resMessage.Data_Not_Found
            };
        }
        return {
            statusCode: statusCode.OK,
            success: true,
            message: resMessage.Data_Fetch_Successfully,
            data: data
        };
    } catch (error) {
        return {
            success: false,
            message: resMessage.Internal_Server_Error,
            error: error.message || "Internal Server Error",
        };
    }
};

exports.updateCarStatus = async (req) => {
    try {
        const { id } = req.params;
        const data = await Car.findOne({ _id: id });
        if (!data) {
            return {
                statusCode: statusCode.BAD_REQUEST,
                success: false,
                message: resMessage.Data_Not_Found
            };
        }
        const operatorId = new mongoose.Types.ObjectId(req.auth.id);
        if (data.operator_id && data.operator_id.equals(operatorId)) {
            const updateStatus = data.is_active === true ? false : true;
            data.is_active = updateStatus;
            await data.save();
            return {
                statusCode: statusCode.OK,
                success: true,
                message: resMessage.Status_Updated_Successfully
            };
        }
        return {
            status: statusCode.UNAUTHORIZED,
            success: false,
            message: resMessage.Unauthorized_Access
        };
    } catch (error) {
        return {
            success: false,
            message: resMessage.Internal_Server_Error,
            error: error.message || "Internal Server Error",
        };
    }
};

exports.updateCar = async (req) => {
    try {
        const { id } = req.params;
        const { title, make, model } = req.body;
        if (!title || !make || !model) {
            return {
                statusCode: statusCode.BAD_REQUEST,
                success: false,
                message: resMessage.Required_Data
            };
        }
        const data = await Car.findOne({ _id: id });
        if (!data) {
            return {
                statusCode: statusCode.BAD_REQUEST,
                success: false,
                message: resMessage.Data_Not_Found
            };
        }
        const operatorId = new mongoose.Types.ObjectId(req.auth.id);
        if (data.operator_id && data.operator_id.equals(operatorId)) {
            await Car.updateOne(
                {
                    _id: id
                },
                {
                    $set: {
                        title,
                        make,
                        model
                    }
                }
            );
            return {
                statusCode: statusCode.OK,
                success: true,
                message: resMessage.Data_Updated_Successfully
            };
        }
        return {
            status: statusCode.UNAUTHORIZED,
            success: false,
            message: resMessage.Unauthorized_Access
        };
    } catch (error) {
        return {
            success: false,
            message: resMessage.Internal_Server_Error,
            error: error.message || "Internal Server Error",
        };
    }
};

exports.allCarList = async (req) => {
    try {
        const data = await Car.find({ operator_id: req.auth.id });
        if (!data) {
            return {
                status: statusCode.DATA_NOT_FOUND,
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
    } catch (error) {
        return {
            status: statusCode.INTERNAL_SERVER_ERROR,
            success: false,
            message: resMessage.Internal_Server_Error,
            error: error.message || "Internal Server Error",
        };
    }
};