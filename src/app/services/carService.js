const { statusCode, resMessage } = require('../../config/default.json');
const Car = require('../../models/cars');

exports.addCar = async (req) => {
    try {
        const car = req.body;
        if (!car.taxi_type || !car.title || !car.make || !car.model || !car.type) {
            return {
                statusCode: statusCode.BAD_REQUEST,
                success: false,
                message: resMessage.Required_Data
            };
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

exports.updateCarStatus = async (req) => {
    try {
        const { id } = req.params;
        const data = await Car.findOne({ _id: id, type: "operator" });
        if (!data) {
            return {
                statusCode: statusCode.BAD_REQUEST,
                success: false,
                message: resMessage.Data_Not_Found
            };
        }
        const updateStatus = data.is_active === true ? false : true;
        data.is_active = updateStatus;
        await data.save();
        return {
            statusCode: statusCode.OK,
            success: true,
            message: resMessage.Status_Updated_Successfully
        };
    } catch (error) {
        return {
            success: false,
            message: resMessage.Internal_Server_Error,
            error: error.message || "Internal Server Error",
        };
    }
};
