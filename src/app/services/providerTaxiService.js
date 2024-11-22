const { statusCode, resMessage } = require('../../config/default.json');
const ProviderTaxi = require('../../models/providerTaxi');

exports.addProviderTaxi = async (req) => {
    try {
        const providerTaxi = req.body;
        const { rc_photo, car_photo, carLeftImage, carRigthImage, carBackImage, carFrontImage } = req.files;
        if (req.auth && req.auth.role === "operator") {
            providerTaxi.operator_id = req.auth.id;
        }
        if (req.files) {
            if (req.files.rc_photo) {
                providerTaxi.rc_photo = req.files.rc_photo[0].filename;
            }
            if (req.files.car_photo) {
                providerTaxi.car_photo = req.files.car_photo[0].filename;
            }
            if (req.files.carLeftImage) {
                providerTaxi.carLeftImage = req.files.carLeftImage[0].filename;
            }
            if (req.files.carRigthImage) {
                providerTaxi.carRigthImage = req.files.carRigthImage[0].filename;
            }
            if (req.files.carBackImage) {
                providerTaxi.carBackImage = req.files.carBackImage[0].filename;
            }
            if (req.files.carFrontImage) {
                providerTaxi.carFrontImage = req.files.carFrontImage[0].filename;
            }
       }
       
        if(!providerTaxi.provider_id || !providerTaxi.car_id || !providerTaxi.type_ids) {
            return {
                statusCode: statusCode.BAD_REQUEST,
                success: false,
                message: resMessage.Required_Data,
            }
        }
        await ProviderTaxi.create(providerTaxi);
        return {
            statusCode: statusCode.OK,
            success: true,
            message: resMessage.Data_Created_Successfully,
        }
    } catch (error) {
        return {
            success: false,
            message: resMessage.Internal_Server_Error,
            error: error.message || "Internal Server Error",
        };
    }
}