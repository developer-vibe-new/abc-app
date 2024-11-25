const mongoose = require('mongoose');
const vehicleModel = require('../../models/cars');
const taxiTypeModel = require('../../models/taxiTypeModel');
const { statusCode, resMessage } = require('../../config/default.json');

exports.vehicleList = async (req) => {
    try {
        let pipeline = [];
        let search = req.query.search;
        if(search) {
            pipeline.push({
                $match: { 
                    $or: [
                        { title: { $regex: search, $options: "i" } },
                        { make: { $regex: search, $options: "i" } },
                        { model: { $regex: search, $options: "i" } },
                        { type: { $regex: search, $options: "i" } }
                    ]
                }
            });
        }
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;
        pipeline.push({
            $addFields: {
              added_on: {
                $dateToString: {
                  format: "%d-%m-%Y",
                  date: "$created"
                }
              },
              vehicle_name: "$title"
            }
          },
          {
            $lookup: {
              from: "taxi_types",
              localField: "taxi_type",
              foreignField: "_id",
              as: "taxi_type"
            }
          },
          {
            $addFields: {
              type: {
                $arrayElemAt: ["$taxi_type.title", 0]
              }
            }
          },
          {
            $project: {
              added_on: 1,
              title: 1,
              make: 1,
              model: 1,
              type: 1,
              is_active: 1
            }
          },
          { $skip: skip },
          { $limit: limit }
        );
        const vehicalView = await vehicleModel.aggregate(pipeline);
        const totalVehicles = await vehicleModel.countDocuments();
        const totalPages = Math.ceil(totalVehicles / limit);
        if(!vehicalView) {
            return {
                statusCode: statusCode.NOT_FOUND,
                success: false,
                message: resMessage.No_Data_Found
            };
        }
        return {
            status: statusCode.OK,
            success: true,
            message: resMessage.Data_Retrieved_Successfully,
            data: vehicalView,
            pagination: {
                currentPage: page,
                totalPages: totalPages,
                totalItems: totalVehicles,
                pageSize: limit
            }
        };
    } catch (error) {
        console.log(error);
        return {
            statusCode: statusCode.INTERNAL_SERVER_ERROR,
            success: false,
            message: error.message
        };
    }
};

exports.showVehicleType = async () => {
    try {
        const vehicleTypeList = await taxiTypeModel.find({}, { title: 1, _id: 1 });
        return {
            success: true,
            typeList: vehicleTypeList
        };
    } catch (error) {
        console.log(error);
        return {
            success: false,
            message: "An error occurred while fetching vehicle type  Data."
        };
    }
};

exports.addVehicle = async (req) => {
    try {
        const createData = await vehicleModel.create({
            taxi_type: req.body.taxi_type,
            title: req.body.title,
            make: req.body.make,
            model: req.body.model
        });
        if (createData) {
            return {
                statusCode: statusCode.OK,
                success: true,
                message: resMessage.Data_Created_Successfully,
                data: createData,
            };
        }
        return {
            status: statusCode.BAD_REQUEST,
            success: false,
            message: resMessage.Vehicle_Not_Created
        };
    } catch (error) {
        return {
            status: statusCode.INTERNAL_SERVER_ERROR,
            success: false,
            message: error.message
        };
    }
};

exports.updateVehicleStatus = async (req) => {
    try {
        const { id } = req.body;
        const data = await vehicleModel.findById(id);
        if(!data) {
            return {
                statusCode: statusCode.DATA_NOT_FOUND,
                success: false,
                message: resMessage.Data_Not_Found
            };
        }

        const status = data.is_active === true ? false : true;
        data.is_active = status;
        await data.save();
        
        return {
            statusCode: statusCode.OK,
            success: true,
            message: resMessage.Data_Updated_Successfully,
            data
        }
    } catch (error) {
        return {
            status: statusCode.INTERNAL_SERVER_ERROR,
            success: false,
            message: error.message
        };
    }
}

exports.editVehicle = async (req) => {
    try {
        const { id } = req.params;
        const data = await vehicleModel.aggregate([
            {
              $match: {
                _id: new mongoose.Types.ObjectId(id)
              }
            },
            {
              $lookup: {
                from: "taxi_types",
                localField: "taxi_type",
                foreignField: "_id",
                as: "taxi_type"
              }
            },
            {
              $addFields: {
                taxi_type: {
                  $arrayElemAt: ["$taxi_type.title", 0]
                }
              }
            },
              {
                $project: {
                  taxi_type: 1,
                title: 1,
                make: 1,
                model: 1
                }
              }
        ]);
        if(!data) {
            return {
                statusCode: statusCode.DATA_NOT_FOUND,
                success: false,
                message: resMessage.Data_Not_Found
            };
        }
        return {
            statusCode: statusCode.OK,
            success: true,
            message: resMessage.Data_Retrieved_Successfully,
            data: data[0]
        }
    } catch (error) {
        return {
            status: statusCode.INTERNAL_SERVER_ERROR,
            success: false,
            message: error.message
        };
    }
}