const rentalModel = require("../../models/rentalModel");
const { statusCode, resMessage } = require('../../config/default.json');

exports.rentalList = async (req) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;
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
                  distance: "$packages.dis",
                  hour: "$packages.hr"
                }
            },
            {
                $skip: skip
            },
            {
                $limit: limit
            }
        ]);
        const totalCount = await rentalModel.countDocuments();
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
            data: rentalData,
            pagination: {
                currentPage: page,
                totalPages: Math.ceil(totalCount / limit),
                totalCount: totalCount,
                limit: limit
            }
        };
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