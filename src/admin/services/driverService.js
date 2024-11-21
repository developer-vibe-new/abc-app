const driverModel = require('../../models/providerModel');
const taxiTypeModel = require('../../models/taxiTypeModel');
const { statusCode, resMessage } = require('../../config/default.json');
const mongoose = require('mongoose');


exports.driverCreate = async (req) => {
    try {
        const { first_name, last_name, mobile, email, type, taxi_type } = req.body;
        const image = `${req.body.typeName}/${req.file.filename}`;
        if (!first_name || !last_name || !mobile || !email || !type || !image || !taxi_type) {
            return {
                statusCode: statusCode.BAD_REQUEST,
                success: false,
                message: resMessage.Required_Data
            };
        }
        const createdData = await driverModel.create({
            first_name: first_name, last_name: last_name, mobile: mobile, email: email, type: type, image: image, taxi_type: taxi_type
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
                    first_name: { $regex: search_value, $options: "i" }
                }
            });
        }
        if (req.query.kycStatus) {

            if (req.query.kycStatus == "Complete") {
                conditions.push({
                    $match: {
                        kycStatus: 1
                    }
                });
            }
            if (req.query.kycStatus == "Pending") {
                conditions.push({
                    $match: {
                        kycStatus: 0
                    }
                });
            }
            if (req.query.kycStatus == "Not Uploaded") {
                conditions.push({
                    $match: {
                        kycStatus: -1
                    }
                });
            }
        }
        if (req.query.vehicleStatus) {

            if (req.query.vehicleStatus == "Pending") {
                conditions.push({
                    $match: {
                        vehicleStatus: 0
                    }
                });
            }
            if (req.query.vehicleStatus == "Complete") {
                conditions.push({
                    $match: {
                        vehicleStatus: 1
                    }
                });
            }
        }

        conditions.push({
            $match: {
                status: "Unblock",
                is_delete: false
            }
        }, {
            $lookup: {
                from: "taxi_types",
                localField: "taxi_type",
                foreignField: "_id",
                as: "taxi_types"
            }
        },
            {
                $unwind: {
                    path: "$taxi_types",
                    preserveNullAndEmptyArrays: true
                }
            });

        conditions.push({
            $addFields:
            {
                image: {
                    $concat: [
                        "http://192.168.0.18:6161/driver/",
                        "$image"
                    ]
                },
                taxitype: "$taxi_types.title",
                status: "Block",

            }
        });
        if (req.query.taxitype) {

            conditions.push({
                $match: {
                    taxitype: { $regex: req.query.taxitype, $options: "i" }
                }
            });
        }
        conditions.push({
            $project: {
                first_name: 1,
                last_name: 1,

                image: 1,
                email: 1,
                mobile: 1,
                balance: 1,
                is_online: 1,
                kycStatus: 1,
                vehicleStatus: 1,
                status: 1,
                pending_amount: 1,
            }
        });

        conditions.push(
            { $sort: { first_name: 1 } },
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

exports.taxiTypeDropDown = async () => {
    try {
        const getData = await taxiTypeModel.aggregate([
            {
                $project: {
                    title: 1
                }
            }
        ]);
        return {
            statusCode: statusCode.OK,
            success: true,
            message: resMessage.Data_Fetch_Successfully,
            data: getData
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

exports.driverEdit = async (req) => {
    try {
        const getData = await driverModel.findOne({ _id: req.params.id }, { first_name: 1, email: 1, mobile: 1, image: 1, last_name: 1 });
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
        if (file) {
            body.image = file.filename;
        }
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

exports.blockedDriverList = async (req) => {
    try {
        let pipeline = [];
        let search_value = req.query.search || "";
        // console.log(req.query.search, "req.query.search");
        if (search_value) {
            pipeline.push({
                $match: {
                    $or: [
                        { "first_name": { $regex: search_value, $options: "i" } },
                        { "email": { $regex: search_value, $options: "i" } },
                        { "mobile": { $regex: search_value, $options: "i" } }
                    ]
                }
            });
        }

        if (req.query.kycStatus) {
            if (req.query.kycStatus == "Not uploaded") {
                pipeline.push({
                    $match: {
                        kycStatus: -1
                    }
                });
            }
            if (req.query.kycStatus == "Pending") {
                pipeline.push({
                    $match: {
                        kycStatus: 0
                    }
                });
            }
            if (req.query.kycStatus == "Complete") {
                pipeline.push({
                    $match: {
                        kycStatus: 1
                    }
                });
            }
        }

        pipeline.push(
            {
                $match: {
                    status: "blocked",
                    is_delete: false
                }
            },
            {
                $lookup: {
                    from: "taxi_types",
                    localField: "taxi_type",
                    foreignField: "_id",
                    as: "taxi_types"
                }
            },
            {
                $unwind: {
                    path: "$taxi_types",
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $addFields: {
                    image: {
                        $concat: [
                            "http://localhost:6161/",
                            "$image"
                        ]
                    },
                    taxitype: "$taxi_types.title"
                }
            });
        if (req.query.taxitype) {
            pipeline.push({
                $match: {
                    taxitype: { $regex: req.query.taxitype, $options: "i" }
                }
            });
        }
        pipeline.push(
            {
                $project: {
                    first_name: 1,
                    last_name: 1,

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
            }
        );

        const getData = await driverModel.aggregate(pipeline);
        return {
            statusCode: statusCode.OK,
            success: true,
            message: resMessage.Data_Fetch_Successfully,
            data: getData

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
exports.editBlockDriver = async (req) => {
    try {
        const getData = await driverModel.findOne({ _id: req.params.id }, { first_name: 1, email: 1, mobile: 1, image: 1, last_name: 1 });
        return {
            statusCode: statusCode.OK,
            success: true,
            message: resMessage.Data_Fetch_Successfully,
            data: getData
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

exports.blockedDriverUpdate = async ({ body, file, params }) => {
    try {
        if (file) {
            body.image = file.filename;
        }
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
exports.unblockDriver = async (req) => {
    try {

        await driverModel.findByIdAndUpdate({ _id: new mongoose.Types.ObjectId(req.body.id) }, { status: "Unblock" }, { new: true });

        return {
            statusCode: statusCode.OK,
            success: true,
            message: resMessage.Data_Updated_Successfully,


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

exports.onlineDriverList = async (req) => {
    try {
        var page = req.query.page || 1;
        let pagesize = req.query.pagesize || 10;

        let search_value = req.query.search || "";
        var conditions = [];

        if (search_value) {
            conditions.push({
                $match: {
                    $or: [
                        { "first_name": { $regex: search_value, $options: "i" } },
                        { "email": { $regex: search_value, $options: "i" } },
                        { "mobile": { $regex: search_value, $options: "i" } }
                    ]
                }
            });
        }

        if (req.query.kycStatus) {
            if (req.query.kycStatus == "Not uploaded") {
                conditions.push({
                    $match: {
                        kycStatus: -1
                    }
                });
            }
            if (req.query.kycStatus == "Pending") {
                conditions.push({
                    $match: {
                        kycStatus: 0
                    }
                });
            }
            if (req.query.kycStatus == "Complete") {
                conditions.push({
                    $match: {
                        kycStatus: 1
                    }
                });
            }
        }
        conditions.push({
            $match: {
                status: "Unblock",
                is_delete: false,
                is_online: true
            }
        },
            {
                $lookup: {
                    from: "taxi_types",
                    localField: "taxi_type",
                    foreignField: "_id",
                    as: "taxi_types"
                }
            },
            {
                $unwind: {
                    path: "$taxi_types",
                    preserveNullAndEmptyArrays: true
                }
            },);

        conditions.push({
            $addFields:
            {
                image: {
                    $concat: [
                        "http://192.168.0.18:6161/",
                        "$image"
                    ]
                },
                taxitype: "$taxi_types.title"

            }
        });
        if (req.query.taxitype) {

            conditions.push({
                $match: {
                    taxitype: { $regex: req.query.taxitype, $options: "i" }
                }
            });
        }
        conditions.push(
            {
                $project: {
                    first_name: 1,
                    last_name: 1,

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
            }
        );
        conditions.push(
            { $sort: { first_name: 1 } },
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

// exports.editDriver = async (req) => {
//     try {

//     } catch (error) {
//         console.log(error);
//         return {
//             statusCode: statusCode.BAD_REQUEST,
//             success: false,
//             message: resMessage.Internal_Server_Error,
//             error: error.message || "Internal Server Error",
//         };
//     }
// }