const mongoose = require('mongoose');
const taxiTypeModel = require('../../models/taxiTypeModel');
const Admin = require('../../models/adminModel');
const { statusCode, resMessage } = require('../../config/default.json');

exports.taxiTypeList = async (req) => {
    try {
        const adminData = await Admin.findById(req.auth._id);
        let page = parseInt(req.query.page) || 1;
        let pagesize = parseInt(req.query.pagesize) || 10;
        let search_value = req.query.search || "";
        let status = req.query.status || "all"; // Optional status filter

        let matchConditions = {
            city_id: adminData.city_id
        };

        if (search_value) {
            matchConditions.title = { $regex: search_value, $options: "i" };
        }

        if (status !== "all") {
            matchConditions.is_active = status === "true";
        }

        // Aggregate query
        const conditions = [
            { $match: matchConditions },
            {
                $project: {
                    icon: 1,
                    title: 1,
                    currency: 1,
                    base_fare: 1,
                    time_fare: 1,
                    distance_fare: 1,
                    city: 1,
                    airportCharge: 1,
                    outstation_distance_fare: 1,
                    outstation_two_distance_fare: 1,
                    rental_distance_fare: 1,
                    is_active: 1,
                    outstation_status: 1
                }
            },
            { $sort: { title: 1 } },
            { $skip: (page - 1) * pagesize },
            { $limit: pagesize }
        ];

        const findTaxi = await taxiTypeModel.aggregate(conditions);

        const totalRecords = await taxiTypeModel.countDocuments(matchConditions);
        const totalPages = Math.ceil(totalRecords / pagesize);

        return {
            statusCode: statusCode.OK,
            success: true,
            message: resMessage.Data_Fetch_Successfully,
            data: findTaxi,
            pagination: {
                currentPage: page,
                pageSize: pagesize,
                totalRecords: totalRecords,
                totalPages: totalPages
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
            body.icon = `taxitype/${req.file.filename}`;
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

exports.addTaxiType = async (req) => {
    try {
        const body = req.body;
        if (req.file) {
            body.icon = `${req.body.typeName}/${req.file.filename}`;
        }
        const editData = await taxiTypeModel.create(body);
        return {
            status: statusCode.OK,
            success: true,
            message: resMessage.Data_Created_Successfully,
            data: editData
        };
    } catch (error) {
        return {
            success: false,
            message: resMessage.Internal_Server_Error,
            error: error.message || "Internal Server Error",
        };
    }
};

exports.updateTaxiStatus = async (req) => {
    try {
        const updateData = await taxiTypeModel.findById(req.body.id);
        if (!updateData) {
            return {
                status: statusCode.BAD_REQUEST,
                success: false,
                message: resMessage.Data_Not_Found
            };
        }
        const updateStatus = updateData.is_active === true ? false : true;
        updateData.is_active = updateStatus;
        await updateData.save();
        return {
            status: statusCode.OK,
            success: true,
            message: resMessage.Data_Updated_Successfully
        };
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
        if (!updateData) {
            return {
                status: statusCode.BAD_REQUEST,
                success: false,
                message: resMessage.Data_Not_Found
            };
        }
        const updateStatus = updateData.outstation_status === true ? false : true;
        updateData.outstation_status = updateStatus;
        await updateData.save();
        return {
            status: statusCode.OK,
            success: true,
            message: resMessage.Data_Updated_Successfully
        };
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
                    icon: 1,
                }
            }
        ]);
        if (!data) {
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