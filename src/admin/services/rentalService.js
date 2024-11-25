const rentalModel = require("../../models/rentalModel");
const { statusCode, resMessage } = require('../../config/default.json');

exports.rentalList = async () => {
    try {
        const rentalData = await rentalModel.aggregate([
            {
              $sort: {
                created: -1
              }
            },
            {
              $project: {
                added_on: {
                  $dateToString: {
                    format: "%d-%m-%Y",
                    date: "$created"
                  }
                },
                packages: 1
              }
            }
          ]);
        if(!rentalData) {
            return {
                status: statusCode.DATA_NOT_FOUND,
                success: false,
                message: resMessage.Data_Not_Found
            }
        }
        return {
            status: statusCode.OK,
            success: true,
            message: "Data Retrieved Successfully",
            data: rentalData
        }
    } catch (error) {
        return {
            success: false,
            message: resMessage.Internal_Server_Error,
            error: error.message || "Internal Server Error",
        };
    }
};

exports.editRental = async (req) => {
    try {
        const body = req.body;
        const editRentalData = await rentalModel.findByIdAndUpdate({ _id: req.params.id }, body, { new: true });
        return {
            success: true,
            data: editRentalData
        };
    } catch (error) {
        console.log(error);
    }
};

exports.addRental = async ({ body }) => {
    try {

        const createRental = await rentalModel.create({
            packages: body
        });

        if (!createRental) {
            return {
                success: false,
                message: "Data Not Created",
            };
        }
        return {
            statusCode: 200,
            success: true,
            message: "Data Created Successfully",
            data: createRental,
        };

    } catch (error) {

        return {
            statusCode: 400,
            success: false,
            message: error.message
        };
    }
};