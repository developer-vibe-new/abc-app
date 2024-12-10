const taxiTypeModel = require('../../models/taxiTypeModel');
const mongoose = require('mongoose');
const { statusCode, resMessage } = require('../../config/default.json');

exports.taxiTypeList = async (req) => {
    try {
        let page = parseInt(req.query.page) || 1;
        let pagesize = parseInt(req.query.pagesize) || 10;
        let search_value = req.query.search || "";
        var conditions = [];

        if (search_value) {
            conditions.push({
                $match: {
                    title: { $regex: search_value, $options: "i" }
                }
            });
        }

        conditions.push({
            $project: {
                icon: {
                    $concat: [
                        "http://192.168.0.18:6161/taxiType/",
                        "$icon"
                    ]
                },
                title: 1,
                currency: 1,
                base_fare: 1,
                time_fare: 1,
                distance_fare: 1,
                airportCharge: 1,
                outstation_distance_fare: 1,
                outstation_two_distance_fare: 1,
                rental_distance_fare: 1,
                is_active: 1,
                outstation_status: 1
            }
        });

        conditions.push({ $sort: { title: 1 } });

        conditions.push({
            $skip: (page - 1) * pagesize
        });

        conditions.push({ $limit: pagesize });

        const findTaxi = await taxiTypeModel.aggregate(conditions);

        const totalCount = await taxiTypeModel.countDocuments({
            title: { $regex: search_value, $options: "i" }
        });

        const totalPages = Math.ceil(totalCount / pagesize);

        return {
            statusCode: statusCode.OK,
            success: true,
            message: resMessage.Data_Fetch_Successfully,
            data: findTaxi,
            pagination: {
                totalCount: totalCount,
                totalPages: totalPages,
                currentPage: page,
                pageSize: pagesize
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

exports.updateTaxiTypeList = async (req) => {
    try {
        const body = req.body;
        if (req.file) {

            body.icon = req.file.filename;
        }
        const editData = await taxiTypeModel.findByIdAndUpdate({ _id: req.params.id }, body, { new: true });

        if (editData) {
            return {
                success: true,
                message: "Data Updated Successfully",
                data: editData
            };
        } else {
            return {
                success: false,
                message: "Data Not Updated"
            };
        }
    } catch (error) {
        return {
            success: false,
            message: resMessage.Internal_Server_Error,
            error: error.message || "Internal Server Error",
        };
    }
};

exports.addTaxiType = async (req, res) => {
    try {
        const body = req.body;
        if (req.file) {
            body.icon = req.file.filename;
        }
        const editData = await taxiTypeModel.create(body);
        return {
            status: statusCode.OK,
            success: true,
            message: resMessage.Data_Created_Successfully,
            data: editData
        }
    } catch (error) {
        return {
            success: false,
            message: resMessage.Internal_Server_Error,
            error: error.message || "Internal Server Error",
        };
    }
}

exports.updateTaxiStatus = async (req) => {
    try {
        const updateData = await taxiTypeModel.findById(req.body.id);
        if(!updateData) {
            return {
                status: statusCode.BAD_REQUEST,
                success: false,
                message: resMessage.Data_Not_Found
            }
        }
        const updateStatus = updateData.is_active === true ? false : true;
        updateData.is_active = updateStatus;
        await updateData.save();
        return {
            status: statusCode.OK,
            success: true,
            message: resMessage.Data_Updated_Successfully
        }
    } catch (error) {
        return {
            success: false,
            message: resMessage.Internal_Server_Error,
            error: error.message || "Internal Server Error",
        };
    }
};
exports.updateTaxiOutstationStatus = async (req) => {
    try {
        const updateData = await taxiTypeModel.findById(req.body.id);
        if(!updateData) {
            return {
                status: statusCode.BAD_REQUEST,
                success: false,
                message: resMessage.Data_Not_Found
            }
        }
        const updateStatus = updateData.outstation_status === true ? false : true;
        updateData.outstation_status = updateStatus;
        await updateData.save();
        return {
            status: statusCode.OK,
            success: true,
            message: resMessage.Data_Updated_Successfully
        }
    } catch (error) {
        return {
            success: false,
            message: resMessage.Internal_Server_Error,
            error: error.message || "Internal Server Error",
        };
    }
};

exports.editTaxiType = async (req) => {
    try {
        const { id } = req.params;
        const data = await taxiTypeModel.aggregate([
            {
              $match: {
                _id: new mongoose.Types.ObjectId(id)
              }
            },
            {
              $project: {
                title: 1,
                time_fare: 1,
                currency: 1,
                distance_fare: 1,
                airportCharge: 1,
                outstation_distance_fare: 1,
                outstation_two_distance_fare: 1,
                rental_distance_fare: 1,
                base_fare: 1,
                icon: {
                    $concat: [
                        "http://192.168.0.18:6161/taxiType/",
                        "$icon"
                    ]
                },
              }
            }
        ]);
        if(!data) {
            return {
                status: statusCode.BAD_REQUEST,
                success: false,
                message: resMessage.Data_Not_Found
            }
        }
        return {
            status: statusCode.OK,
            success: true,
            message: resMessage.Data_Fetch_Successfully,
            data: data[0]
        };
    } catch (error) {
        return {
            success: false,
            message: resMessage.Internal_Server_Error,
            error: error.message || "Internal Server Error",
        };
    }
}