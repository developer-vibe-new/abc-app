const driverModel = require('../../models/providerModel');
const { statusCode, resMessage } = require('../../config/default.json');
const mongoose = require('mongoose');


exports.driverCreate = async (req) => {
    try {
        const { name, mobile, email, type } = req.body;
        const image = `${req.body.typeName}/${req.file.filename}`;
        if (!name || !mobile || !email || !type || !image) {
            return {
                statusCode: statusCode.BAD_REQUEST,
                success: false,
                message: resMessage.Required_Data
            };
        }
        const createdData = await driverModel.create({
            name: name, mobile: mobile, email: email, type: type, image: image
        });
        return {
            statusCode: statusCode.OK,
            success: true,
            message: resMessage.Data_Created_Successfully,
            data: createdData
        };
    } catch (error) {
        console.log(error);
        return {
            statusCode: statusCode.BAD_REQUEST,
            success: false,
            message: resMessage.Internal_Server_Error,
            error: error.message || "Internal Server Error",
        };
    }
};

exports.driverView = async (req) => {
    try {
        var page = req.query.page || 1;
        let pagesize = req.query.pagesize || 10;

        let search_value = req.query.search || "";
        var conditions = [];

        if (search_value) {
            conditions.push({
                $match: {
                    name: { $regex: search_value, $options: "i" }
                }
            });
        }
        conditions.push({
            $match: {
                status: "Unblock"
            }
        });

        conditions.push({
            $addFields:
            {
                image: {
                    $concat: [
                        "http://192.168.0.18:6161/",
                        "$image"
                    ]
                }

            }
        },
            {
                $project: {
                    name: 1,
                    image: 1,
                    email: 1,
                    mobile: 1,
                    balance: 1,
                    is_online: 1,
                    kycStatus: 1,
                    vehicleStatus: 1,
                    status: 1,
                    pending_amount: 1
                }
            });
        conditions.push(
            { $sort: { name: 1 } },
            { $skip: (page - 1) * pagesize },
            { $limit: pagesize }
        );
        const viewAllData = await driverModel.aggregate(conditions);

        return {
            statusCode: statusCode.OK,
            success: true,
            message: resMessage.Data_Fetch_Successfully,
            data: viewAllData
        };
    } catch (error) {
        console.log(error);
        return {
            success: false,
            message: resMessage.Internal_Server_Error,
            error: error.message || "Internal Server Error",
        };
    }
};
exports.driverEdit = async (req) => {
    try {
        const getData = await driverModel.findOne({ _id: req.params.id }, { name: 1, email: 1, mobile: 1, image: 1 });
        return {
            statusCode: statusCode.OK,
            success: true,
            message: resMessage.Data_Fetch_Successfully,
            data: getData
        };
    } catch (error) {
        console.log(error);
        return {
            success: false,
            message: resMessage.Internal_Server_Error,
            error: error.message || "Internal Server Error",
        };
    }
};

exports.driverUpdate = async ({ body, file, params }) => {
    try {
        // console.log(req.params, "jjjjjjjjj");
        // const body = req.body;
        body.image = file.filename;
        const updateData = await driverModel.findByIdAndUpdate(params.id, body, { new: true });
        if (!updateData) {
            return {
                statusCode: statusCode.BAD_REQUEST,
                success: false,
                // message: resMessage.Data_Not_Found,
            };
        }

        return {
            statusCode: statusCode.OK,
            success: true,
            message: resMessage.Data_Updated_Successfully,
            data: updateData
        };
    } catch (error) {
        console.log(error);
        return {
            statusCode: statusCode.BAD_REQUEST,
            success: false,
            message: resMessage.Internal_Server_Error,
            error: error.message || "Internal Server Error",
        };
    }
};

exports.driverDelete = async (req) => {
    try {
        const deleteData = await driverModel.findByIdAndDelete({ _id: new mongoose.Types.ObjectId(req.params.id) });
        if (deleteData) {
            return {
                success: true,
                message: resMessage.Data_Deleted_Successfully,
                // data: deleteData
            };
        }
        // else {
        //     return {
        //         success: false,
        //         message: resMessage.Data_Deleted_Successfully,
        //     };
        // }
    } catch (error) {
        console.log(error);
        return {
            success: false,
            message: resMessage.Internal_Server_Error,
            error: error.message || "Internal Server Error",
        };
    }
};

exports.blockDriver = async (req) => {
    try {
        const updateData = await driverModel.findByIdAndUpdate({ _id: new mongoose.Types.ObjectId(req.body.id) }, { status: "blocked" }, { new: true },);
        return {
            statusCode: statusCode.OK,
            success: true,
            message: resMessage.Data_Updated_Successfully,
            data: updateData

        };
    } catch (error) {
        console.log(error);
        return {
            statusCode: statusCode.BAD_REQUEST,
            success: false,
            message: resMessage.Internal_Server_Error,
            error: error.message || "Internal Server Error",
        };
    }
};