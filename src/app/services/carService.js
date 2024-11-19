const { statusCode, resMessage } = require('../../config/default.json');
const Car = require('../../models/cars');

exports.addCar = async (req) => {
    try {
        const car = req.body;
        if(!car.taxi_type || !car.title || !car.make || !car.model || !car.type) {
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
        }
    }
}