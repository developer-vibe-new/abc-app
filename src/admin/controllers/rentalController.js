const services = require("../services/rentalService");
const { statusCode } = require('../../config/default.json');


exports.rentalListData = async (req) => {
    try {
        return await services.rentalList(req);
    } catch (error) {
        console.log(error);
        return {
            statusCode: statusCode.BAD_REQUEST,
            success: false,
            message: error.message
        };
    }
};
exports.rentalEditData = async (req) => {
    try {
        return await services.editRental(req);
        // return res.status(200).json(Object.assign({ status: data.success }, data));
    } catch (error) {
        console.log(error);
        return {
            statusCode: statusCode.BAD_REQUEST,
            success: false,
            message: error.message
        };
    }
};
exports.createRental = async (req) => {
    try {
        return await services.addRental(req);
        // if(data.success == true){
        //     return res.status(200).json(Object.assign({status:data.success},data))
        // } else {
        //     return res.status(400).json(Object.assign({status:data.success,message:data.message}))
        // }
    } catch (error) {
        console.log(error);
        return {
            statusCode: statusCode.BAD_REQUEST,
            success: false,
            message: error.message
        };
    }
};

exports.viewRentalDataController = async (req) => {
    try {
        return await services.viewRentalData(req);
    } catch (error) {
        return {
            statusCode: statusCode.BAD_REQUEST,
            success: false,
            message: error.message
        };
    }
}