const mongoose = require('mongoose');
const Admin = require('../../models/adminModel');
const driverModel = require('../../models/providerModel');
const taxiTypeModel = require('../../models/taxiTypeModel');
const { statusCode, resMessage } = require('../../config/default.json');
const { url } = require('../../config/dev.config');

exports.driverDetailsService = async (req) => {
    try {
        const { id } = req.params;

        //  aggregation pipeline
        const aggregationPipeline = [
            [
                {
                    $match: {
                        _id: new mongoose.Types.ObjectId(id),
                    }
                },
                {
                    $lookup: {
                        from: "provider_taxis",
                        localField: "operator_id",
                        foreignField: "operator_id",
                        as: "taxis",
                    }
                },
                {
                    $lookup: {
                        from: "cars",
                        localField: "taxis.car_id",
                        foreignField: "_id",
                        as: "car_details",
                    }
                },
                {
                    $lookup: {
                        from: "taxi_types",
                        localField: "taxis.type_ids",
                        foreignField: "_id",
                        as: "taxi_type_details",
                    }
                },
                {
                    $addFields: {
                        "car_details": { $arrayElemAt: ["$car_details", 0] },
                        "taxi_type_details": { $arrayElemAt: ["$taxi_type_details", 0] },
                        "taxis": {
                            $arrayElemAt: ["$taxis", 0],

                        }
                    }
                },
                {
                    $project: {
                        _id: 1,
                        first_name: 1,
                        last_name: 1,
                        email: 1,
                        mobile: 1,
                        profile_image: 1,
                        is_active: 1,
                        is_online: 1,
                        documents: 1,
                        "taxis._id": 1,
                        "taxis.documents.rc": 1,
                        "taxis.documents.pollution_certificate": 1,
                        "taxis.documents.vehicle_permit": 1,
                        "taxis.documents.insurance": 1,
                        car_details: {
                            name: "$car_details.title",
                            make: "$car_details.make",
                            model: "$car_details.model",
                            plateno: "$taxis.plateno",
                        },
                        "taxi_type_details.title": 1,
                        providerTaxiDocuments: 1
                    }
                }
            ]

        ];

        console.log(JSON.stringify(aggregationPipeline));
        // Execute the aggregation pipeline
        const data = await driverModel.aggregate(aggregationPipeline);

        // Check if data is found
        if (!data || data.length === 0) {
            return {
                status: statusCode.BAD_REQUEST,
                success: false,
                message: resMessage.Data_Not_Found,
            };
        }

        // Return the response with the aggregated data
        return {
            status: statusCode.OK,
            success: true,
            message: resMessage.Data_Fetch_Successfully,
            data: data[0],  // Return the first (and only) result from the aggregation
        };
    } catch (error) {
        return {
            status: statusCode.INTERNAL_SERVER_ERROR,
            success: false,
            message: resMessage.Internal_Server_Error,
            error: error.message || "Internal Server Error",
        };
    }
};


exports.driverCreate = async (req) => {
    try {
        const { first_name, last_name, mobile, email, city_id } = req.body;
        let profile_image;
        if (req.file) {
            profile_image = `${req.body.typeName}/${req.file.filename}`;
        }
        if (!first_name || !last_name || !mobile || !email) {
            return {
                statusCode: statusCode.BAD_REQUEST,
                success: false,
                message: resMessage.Required_Data
            };
        }
        const createdData = await driverModel.create({
            first_name: first_name, last_name: last_name, full_name: first_name + " " + last_name, mobile: mobile, email: email, profile_image: profile_image, city_id: city_id
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
        const adminData = await Admin.findById(req.auth._id);
        var page = req.query.page || 1;
        let pagesize = parseInt(req.query.pagesize) || 10;

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
                is_delete: false,
                city_id: adminData.city_id
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
                profile_image: {
                    $concat: [
                        url,
                        "$profile_image"
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
                profile_image: 1,
                email: 1,
                mobile: 1,
                balance: 1,
                is_online: 1,
                kycStatus: 1,
                vehicleStatus: 1,
                status: 1,
                pending_amount: 1,
                full_name: 1,
                is_active: 1
            }
        });

        let sortConditions = {};

        if (req.query.sortByName) {
            let sortOrder = req.query.sortByName === 'desc' ? -1 : 1;
            sortConditions.first_name = sortOrder;
        }

        if (req.query.sortByEmail) {
            let sortByEmail = req.query.sortByEmail === 'desc' ? -1 : 1;
            sortConditions.email = sortByEmail;
        }

        if (req.query.sortByNo) {
            let sortByNo = req.query.sortByNo === 'desc' ? -1 : 1;
            sortConditions.mobile = sortByNo;
        }

        if (req.query.sortByBalance) {
            let sortByBalance = req.query.sortByBalance === 'desc' ? -1 : 1;
            sortConditions.balance = sortByBalance;
        }

        if (req.query.sortByPendingAmount) {
            let sortByPendingAmount = req.query.sortByPendingAmount === 'desc' ? -1 : 1;
            sortConditions.pending_balance = sortByPendingAmount;
        }

        if (req.query.sortBycurrentStatus) {
            let sortBycurrentStatus = req.query.sortBycurrentStatus === 'desc' ? -1 : 1;
            sortConditions.is_active = sortBycurrentStatus;
        }

        if (req.query.sortByKycStatus) {
            let sortByKycStatus = req.query.sortByKycStatus === 'desc' ? -1 : 1;
            sortConditions.kycStatus = sortByKycStatus;
        }

        if (req.query.sortByVehicleStatus) {
            let sortByVehicleStatus = req.query.sortByVehicleStatus === 'desc' ? -1 : 1;
            sortConditions.vehicleStatus = sortByVehicleStatus;
        }

        if (Object.keys(sortConditions).length > 0) {
            conditions.push({
                $sort: sortConditions
            });
        }

        conditions.push(
            { $skip: (page - 1) * pagesize },
            { $limit: pagesize }
        );

        const totalCount = await driverModel.aggregate([
            ...conditions.slice(0, -2),
            { $count: "total" }
        ]); const totalRecords = totalCount.length > 0 ? totalCount[0].total : 0;
        const totalPages = Math.ceil(totalRecords / pagesize);



        const viewAllData = await driverModel.aggregate(conditions);

        return {
            statusCode: statusCode.OK,
            success: true,
            message: resMessage.Data_Fetch_Successfully,
            data: viewAllData,
            pagination: {
                currentPage: parseInt(page),
                totalPages: totalPages,
                totalRecords: totalRecords,
            }
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
        const getData = await driverModel.aggregate([
            {
                $match: {
                    _id: new mongoose.Types.ObjectId(req.params.id)
                }
            },
            {
                $addFields: {
                }
            },
            {
                $project: {
                    first_name: 1,
                    last_name: 1,
                    email: 1,
                    mobile: 1,
                    profile_image: 1,
                    status: 1
                }
            }
        ]);
        return {
            statusCode: statusCode.OK,
            success: true,
            message: resMessage.Data_Fetch_Successfully,
            data: getData[0]
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
            body.profile_image = `driver/${file.filename}`;
        }
        if (body.first_name && body.last_name) {
            body.full_name = body.first_name + " " + body.last_name;
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
        const updateData = await driverModel.findByIdAndUpdate(
            { _id: new mongoose.Types.ObjectId(req.body.id) },
            { status: "blocked", comment: req.body.comment },
            { new: true }
        );
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
        const adminData = await Admin.findById(req.auth._id);
        let pipeline = [];
        let search_value = req.query.search || "";

        let page = parseInt(req.query.page) || 1;
        let perPage = parseInt(req.query.perPage) || 10;
        let skip = (page - 1) * perPage;

        if (search_value) {
            pipeline.push({
                $match: { "full_name": { $regex: search_value, $options: "i" } }
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
                    is_delete: false,
                    city_id: adminData.city_id
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
        pipeline.push({
            $addFields:
            {
                profile_image: {
                    $concat: [
                        url,
                        "$profile_image"
                    ]
                }
            }
        });
        let sortConditions = {};

        if (req.query.sortByName) {
            let sortOrder = req.query.sortByName === 'desc' ? -1 : 1;
            sortConditions.first_name = sortOrder;
        }

        if (req.query.sortByEmail) {
            let sortByEmail = req.query.sortByEmail === 'desc' ? -1 : 1;
            sortConditions.email = sortByEmail;
        }

        if (req.query.sortByNo) {
            let sortByNo = req.query.sortByNo === 'desc' ? -1 : 1;
            sortConditions.mobile = sortByNo;
        }

        if (Object.keys(sortConditions).length > 0) {
            pipeline.push({
                $sort: sortConditions
            });
        }

        let countPipeline = [...pipeline];
        countPipeline.push({ $count: "totalCount" });

        const countData = await driverModel.aggregate(countPipeline);
        const totalCount = countData.length > 0 ? countData[0].totalCount : 0;

        pipeline.push(
            { $skip: skip },
            { $limit: perPage }
        );

        pipeline.push(
            {
                $project: {
                    first_name: 1,
                    last_name: 1,
                    profile_image: 1,
                    email: 1,
                    mobile: 1,
                    balance: 1,
                    is_online: 1,
                    kycStatus: 1,
                    vehicleStatus: 1,
                    status: 1,
                    pending_amount: 1,
                    new_status: "Unblock",
                    full_name: 1
                }
            }
        );

        const getData = await driverModel.aggregate(pipeline);
        return {
            statusCode: statusCode.OK,
            success: true,
            message: resMessage.Data_Fetch_Successfully,
            data: getData,
            pagination: {
                page: page,
                perPage: perPage,
                totalItems: totalCount,
                totalPages: Math.ceil(totalCount / perPage)
            }
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
        const getData = await driverModel.findOne({ _id: req.params.id }, { first_name: 1, email: 1, mobile: 1, profile_image: 1, last_name: 1 });
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
            body.profile_image = file.filename;
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
        const adminData = await Admin.findById(req.auth._id);
        var conditions = [];
        const totalCount = await driverModel.aggregate([
            ...conditions.slice(0, -2),
            { $count: "total" }
        ]);
        var page = req.query.page || 1;
        let pagesize = req.query.pagesize || 10;

        const totalRecords = totalCount.length > 0 ? totalCount[0].total : 0;
        const totalPages = Math.ceil(totalRecords / pagesize);
        let search_value = req.query.search || "";

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
                is_online: true,
                city_id: adminData.city_id
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

                    profile_image: 1,
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

        let sortConditions = {};

        if (req.query.sortByName) {
            let sortOrder = req.query.sortByName === 'desc' ? -1 : 1;
            sortConditions.first_name = sortOrder;
        }

        if (req.query.sortByEmail) {
            let sortByEmail = req.query.sortByEmail === 'desc' ? -1 : 1;
            sortConditions.email = sortByEmail;
        }

        if (req.query.sortByNo) {
            let sortByNo = req.query.sortByNo === 'desc' ? -1 : 1;
            sortConditions.mobile = sortByNo;
        }

        if (Object.keys(sortConditions).length > 0) {
            conditions.push({
                $sort: sortConditions
            });
        }

        conditions.push(
            { $skip: (page - 1) * pagesize },
            { $limit: pagesize }
        );
        const viewAllData = await driverModel.aggregate(conditions);


        return {
            statusCode: statusCode.OK,
            success: true,
            message: resMessage.Data_Fetch_Successfully,
            data: viewAllData,
            pagination: {
                currentPage: parseInt(page),
                totalPages: totalPages,
                totalRecords: totalRecords,
            }

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

exports.updateDocumentStatus = async (req) => {
    try {
        const { id } = req.params;
        const { document_type, status } = req.body;

        const data = await driverModel.findById(id);

        if (!data) {
            return {
                statusCode: statusCode.NOT_FOUND,
                status: statusCode.NOT_FOUND,
                success: false,
                message: resMessage.Data_Not_Found,
            };
        }

        if (
            (!data.documents || !data.documents[document_type]) &&
            (!data.providerTaxiDocuments || !data.providerTaxiDocuments[document_type])
        ) {
            return {
                statusCode: statusCode.BAD_REQUEST,
                status: statusCode.BAD_REQUEST,
                success: false,
                message: resMessage.Invalid_document_type,
            };
        }

        if (data.documents && data.documents[document_type]) {
            data.documents[document_type].status = status;
        }

        if (data.providerTaxiDocuments && data.providerTaxiDocuments[document_type]) {
            data.providerTaxiDocuments[document_type].status = status;
        }

        await data.save();

        return {
            statusCode: statusCode.OK,
            status: statusCode.OK,
            success: true,
            message: resMessage.Document_status_updated,
            data: data,
        };
    } catch (error) {
        return {
            statusCode: statusCode.INTERNAL_SERVER_ERROR,
            status: statusCode.INTERNAL_SERVER_ERROR,
            success: false,
            message: resMessage.Internal_Server_Error,
            error: error.message || "Internal Server Error",
        };
    }
};
